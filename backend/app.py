from flask import Flask, jsonify, request
import sqlite3
import json
from flask_cors import CORS # Flask-CORSをインポート
from flask_socketio import SocketIO, emit
import google.generativeai as genai
import os
from dotenv import load_dotenv
import threading
from datetime import datetime
import time

from components.init import init_db
from components.signup import signup_o
from components.login import login_o
from components.message import message_o
from components.colorset import colorset_o
from components.student import student_o
from components.themes import themes_o
from components.init import get_db_connection
from components.topicset import topicset_o
from components.reward import reward_o
from components.ai_help import ai_help_bp
from components.ai_advice import ai_advice_o

# Load environment variables safely
try:
    load_dotenv()
except Exception as e:
    print(f"Warning: Could not load .env file: {e}")
    # Continue without .env file

app = Flask(__name__)
CORS(app) # CORSをアプリケーション全体に適用

socketio = SocketIO(app,cors_allowed_origins= "*")

@app.route('/')
def health():
    return jsonify({'status': 'ok'})


init_db()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: GEMINI_API_KEY not found in environment variables")

def check_and_clear_expired_camps():
    """定期的にチェックし、終了した議論のcamp_idを削除"""
    while True:
        try:
            conn = sqlite3.connect('database.db')
            c = conn.cursor()
            
            # 現在の時刻を取得する
            now = datetime.now()
            
            # 終了した討論テーマを検索する
            c.execute('''
                SELECT DISTINCT school_id FROM debate_settings 
                WHERE end_date <= ?
            ''', (now.strftime('%Y-%m-%d %H:%M:%S'),))
            
            schools = c.fetchall()
            
            for school in schools:
                school_id = school[0]
                c.execute('''
                    UPDATE students 
                    SET camp_id = NULL 
                    WHERE school_id = ?
                ''', (school_id,))
                
                if c.rowcount > 0:
                    print(f"Cleared camp_id for {c.rowcount} students in school {school_id}")
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"Error in check_and_clear_expired_camps: {e}")
        
        time.sleep(300)

camp_clear_thread = threading.Thread(target=check_and_clear_expired_camps, daemon=True)
camp_clear_thread.start()

app.register_blueprint(colorset_o)
app.register_blueprint(signup_o)
app.register_blueprint(login_o)
app.register_blueprint(student_o)
app.register_blueprint(topicset_o)
app.register_blueprint(reward_o)
app.register_blueprint(ai_help_bp)
app.register_blueprint(ai_advice_o)

# Sticky Notes API endpoints
@app.route('/api/sticky', methods=['POST'])
def create_sticky():
    
    if not request.json:
        return jsonify({'error': 'リクエストボディが必要です'}), 400
    
    # デバッグ情報：受信データのチェック
    print(f"DEBUG: Received request data: {request.json}")
    
    required_fields = ['student_id', 'sticky_content', 'sticky_color']
    for field in required_fields:
        if field not in request.json:
            print(f"DEBUG: Missing field: {field}")
            return jsonify({'error': f'{field}が必要です'}), 400
    
    # theme_idを取得（任意項目として扱う場合はgetでOK）
    theme_id = request.json.get('theme_id')

    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        # この接続を外部キーを有効にする
        c.execute('PRAGMA foreign_keys = ON')
        
        # 生徒が存在しているかどうかを確認する
        student_id = request.json['student_id']
        print(f"DEBUG: Looking for student_id: {student_id} (type: {type(student_id)})")
        
        c.execute('SELECT student_id FROM students WHERE student_id = ?', (student_id,))
        student = c.fetchone()
        print(f"DEBUG: Student found: {student}")
        
        # 生徒全員を同時にチェックする
        c.execute('SELECT student_id, name, number FROM students')
        all_students = c.fetchall()
        print(f"DEBUG: All students in database: {all_students}")
        
        if not student:
            conn.close()
            print(f"DEBUG: Student {student_id} not found in database")
            return jsonify({'error': '指定された学生が見つかりません'}), 400
        
        # 新しい付箋のdisplay_indexを取得（同じ学校の最大index + 1）
        c.execute('''SELECT MAX(s.display_index) FROM sticky s 
                     JOIN students st ON s.student_id = st.student_id 
                     WHERE st.school_id = (SELECT school_id FROM students WHERE student_id = ?)''', 
                  (student_id,))
        max_index_result = c.fetchone()
        new_display_index = (max_index_result[0] or 0) + 1
        
        # gemini要約
        sticky_content = request.json['sticky_content']
        ai_summary_content = ""
        try:
            if GEMINI_API_KEY:
                print(f"DEBUG: Attempting Gemini API call with key: {GEMINI_API_KEY[:10]}...")
                gemini = genai.GenerativeModel("gemini-2.5-flash")
                response = gemini.generate_content(f'以下の内容を基に30字以内で要約###内容###{sticky_content}')
                # レスポンスから要約文を抽出（仮に response.text だとします。実際はAPI仕様に合わせてください）
                ai_summary_content = response.text if hasattr(response, "text") else str(response)
                print(f"DEBUG: Gemini API response: {ai_summary_content}")
            else:
                print("DEBUG: No GEMINI_API_KEY found, using fallback")
                ai_summary_content = sticky_content[:30]
        except Exception as e:
            print(f"DEBUG: Gemini API call failed: {e}")
            ai_summary_content = sticky_content[:30]
        
        # 作成者の陣営IDを取得
        c.execute('SELECT camp_id FROM students WHERE student_id = ?', (request.json['student_id'],))
        author_camp_result = c.fetchone()
        if not author_camp_result or author_camp_result[0] is None:
            conn.close()
            return jsonify({'error': '付箋作成者の陣営が設定されていません'}), 400
        author_camp_id = author_camp_result[0]
        print(f"\n=== Creating Sticky ===")
        print(f"Author ID: {request.json['student_id']}")
        print(f"Author Camp ID: {author_camp_id}")
        
        # 付箋插入（作成時の陣営IDを保存）
        c.execute('''INSERT INTO sticky (
        student_id, sticky_content, sticky_color, x_axis, y_axis, display_index, 
        feedback_A, feedback_B, feedback_C, ai_summary_content, 
        ai_teammate_avg_prediction, ai_enemy_avg_prediction, ai_overall_avg_prediction, 
        teammate_avg_score, enemy_avg_score, overall_avg_score, theme_id, author_camp_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                 (request.json['student_id'], 
                  request.json['sticky_content'],
                  request.json['sticky_color'],
                  request.json.get('x_axis', 0),
                  request.json.get('y_axis', 0),
                  new_display_index,
                  request.json.get('feedback_A', 0),
                  request.json.get('feedback_B', 0),
                  request.json.get('feedback_C', 0),
                  ai_summary_content,
                  request.json.get('ai_teammate_avg_prediction', 0),
                  request.json.get('ai_enemy_avg_prediction', 0),
                  request.json.get('ai_overall_avg_prediction', 0),
                  request.json.get('teammate_avg_score', 0),
                  request.json.get('enemy_avg_score', 0),
                  request.json.get('overall_avg_score', 0),
                  theme_id,
                  author_camp_id
                 ))
        
        sticky_id = c.lastrowid
        
        # 作成された付箋の完全な情報を取得してSocketで送信
        c.execute('''SELECT s.sticky_id, s.student_id, s.sticky_content, s.sticky_color, s.x_axis, s.y_axis, s.display_index,
                            s.feedback_A, s.feedback_B, s.feedback_C, s.ai_summary_content, s.ai_teammate_avg_prediction,
                            s.ai_enemy_avg_prediction, s.ai_overall_avg_prediction, s.teammate_avg_score, s.enemy_avg_score,
                            s.overall_avg_score, s.created_at, st.name, st.school_id, st.camp_id
                     FROM sticky s
                     JOIN students st ON s.student_id = st.student_id
                     WHERE s.sticky_id = ?''', (sticky_id,))
        
        sticky_data = c.fetchone()
        conn.commit()
        conn.close()
        
        if sticky_data:
            # 新しい付箋のデータを全クライアントに送信
            sticky_info = {
                'sticky_id': sticky_data[0],
                'student_id': sticky_data[1],
                'sticky_content': sticky_data[2],
                'sticky_color': sticky_data[3],
                'x_axis': sticky_data[4],
                'y_axis': sticky_data[5],
                'display_index': sticky_data[6],
                'feedback_A': sticky_data[7],
                'feedback_B': sticky_data[8],
                'feedback_C': sticky_data[9],
                'ai_summary_content': sticky_data[10],
                'ai_teammate_avg_prediction': sticky_data[11],
                'ai_enemy_avg_prediction': sticky_data[12],
                'ai_overall_avg_prediction': sticky_data[13],
                'teammate_avg_score': sticky_data[14],
                'enemy_avg_score': sticky_data[15],
                'overall_avg_score': sticky_data[16],
                'created_at': sticky_data[17],
                'student_name': sticky_data[18],
                'school_id': sticky_data[19],
                'author_camp_id': sticky_data[20]
            }
            
            # 同校の全ユーザーに新しい付箋を送信
            room_name = f"school_{sticky_data[19]}"
            print(f"DEBUG: Sending sticky_created event to room: {room_name}")
            print(f"DEBUG: Sticky data: {sticky_info}")
            socketio.emit('sticky_created', sticky_info, to=room_name)
            print(f"DEBUG: sticky_created event sent successfully")
        
        return jsonify({
            'status': 'success',
            'message': '付箋が作成されました',
            'sticky_id': sticky_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sticky', methods=['GET'])
def get_sticky_notes():
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        student_id = request.args.get('student_id')
        school_id = request.args.get('school_id')
        theme_id = request.args.get('theme_id')
        
        # 付箋取得（camp_idも含める）
        if school_id and theme_id:
            # school_id と theme_id の両方で絞り込む
            c.execute('''SELECT s.sticky_id, s.student_id, s.sticky_content, s.sticky_color, s.x_axis, s.y_axis, s.display_index,
                                s.feedback_A, s.feedback_B, s.feedback_C, s.ai_summary_content, s.ai_teammate_avg_prediction,
                                s.ai_enemy_avg_prediction, s.ai_overall_avg_prediction, s.teammate_avg_score, s.enemy_avg_score,
                                s.overall_avg_score, s.created_at, st.name, st.camp_id
                         FROM sticky s
                         JOIN students st ON s.student_id = st.student_id
                         WHERE st.school_id = ? AND s.theme_id = ? ORDER BY s.display_index, s.created_at DESC''', (school_id, theme_id))
        elif  school_id:
            # 同校の全学生の付箋を取得
            c.execute('''SELECT s.sticky_id, s.student_id, s.sticky_content, s.sticky_color, s.x_axis, s.y_axis, s.display_index,
                                s.feedback_A, s.feedback_B, s.feedback_C, s.ai_summary_content, s.ai_teammate_avg_prediction,
                                s.ai_enemy_avg_prediction, s.ai_overall_avg_prediction, s.teammate_avg_score, s.enemy_avg_score,
                                s.overall_avg_score, s.created_at, st.name, st.camp_id
                         FROM sticky s
                         JOIN students st ON s.student_id = st.student_id
                         WHERE st.school_id = ? ORDER BY s.display_index, s.created_at DESC''', (school_id,))
        elif student_id:
            c.execute('''SELECT s.sticky_id, s.student_id, s.sticky_content, s.sticky_color, s.x_axis, s.y_axis, s.display_index,
                                s.feedback_A, s.feedback_B, s.feedback_C, s.ai_summary_content, s.ai_teammate_avg_prediction,
                                s.ai_enemy_avg_prediction, s.ai_overall_avg_prediction, s.teammate_avg_score, s.enemy_avg_score,
                                s.overall_avg_score, s.created_at, st.name, st.camp_id
                         FROM sticky s
                         JOIN students st ON s.student_id = st.student_id
                         WHERE s.student_id = ?
                         ORDER BY s.display_index, s.created_at DESC''', (student_id,))
        else:
            c.execute('''SELECT s.sticky_id, s.student_id, s.sticky_content, s.sticky_color, s.x_axis, s.y_axis, s.display_index,
                                s.feedback_A, s.feedback_B, s.feedback_C, s.ai_summary_content, s.ai_teammate_avg_prediction,
                                s.ai_enemy_avg_prediction, s.ai_overall_avg_prediction, s.teammate_avg_score, s.enemy_avg_score,
                                s.overall_avg_score, s.created_at, st.name, st.camp_id
                         FROM sticky s
                         JOIN students st ON s.student_id = st.student_id
                         ORDER BY s.display_index, s.created_at DESC''')
        
        sticky_notes = []
        for row in c.fetchall():
            sticky_notes.append({
                'sticky_id': row[0],
                'student_id': row[1],
                'sticky_content': row[2],
                'sticky_color': row[3],
                'x_axis': row[4],
                'y_axis': row[5],
                'display_index': row[6],
                'feedback_A': row[7],
                'feedback_B': row[8],
                'feedback_C': row[9],
                'ai_summary_content': row[10],
                'ai_teammate_avg_prediction': row[11],
                'ai_enemy_avg_prediction': row[12],
                'ai_overall_avg_prediction': row[13],
                'teammate_avg_score': row[14],
                'enemy_avg_score': row[15],
                'overall_avg_score': row[16],
                'created_at': row[17],
                'student_name': row[18],
                'author_camp_id': row[19]
            })
        
        conn.close()
        return jsonify(sticky_notes)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sticky/<int:sticky_id>', methods=['PATCH'])
def update_sticky(sticky_id):
    if not request.json:
        return jsonify({'error': 'リクエストボディが必要です'}), 400
    
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        update_fields = []
        values = []
        
        allowed_fields = ['sticky_content', 'sticky_color', 'x_axis', 'y_axis', 'display_index', 'feedback_A', 'feedback_B', 'feedback_C',
                         'ai_summary_content', 'ai_teammate_avg_prediction', 'ai_enemy_avg_prediction', 'ai_overall_avg_prediction',
                         'teammate_avg_score', 'enemy_avg_score', 'overall_avg_score']
        for field in allowed_fields:
            if field in request.json:
                update_fields.append(f'{field} = ?')
                values.append(request.json[field])
        
        if not update_fields:
            return jsonify({'error': '更新するフィールドがありません'}), 400
        
        values.append(sticky_id)
        query = f"UPDATE sticky SET {', '.join(update_fields)} WHERE sticky_id = ?"
        
        c.execute(query, values)
        conn.commit()
        
        if c.rowcount == 0:
            conn.close()
            return jsonify({'error': '付箋が見つかりません'}), 404
        
        # 更新後の付箋情報を取得してSocketで送信
        c.execute('''SELECT s.sticky_id, s.student_id, s.sticky_content, s.sticky_color, s.x_axis, s.y_axis, s.display_index,
                            s.feedback_A, s.feedback_B, s.feedback_C, s.ai_summary_content, s.ai_teammate_avg_prediction,
                            s.ai_enemy_avg_prediction, s.ai_overall_avg_prediction, s.teammate_avg_score, s.enemy_avg_score,
                            s.overall_avg_score, s.created_at, st.name, st.school_id, st.camp_id
                     FROM sticky s
                     JOIN students st ON s.student_id = st.student_id
                     WHERE s.sticky_id = ?''', (sticky_id,))
        
        sticky_data = c.fetchone()
        conn.close()
        
        if sticky_data:
            # 更新された付箋のデータを全クライアントに送信
            sticky_info = {
                'sticky_id': sticky_data[0],
                'student_id': sticky_data[1],
                'sticky_content': sticky_data[2],
                'sticky_color': sticky_data[3],
                'x_axis': sticky_data[4],
                'y_axis': sticky_data[5],
                'display_index': sticky_data[6],
                'feedback_A': sticky_data[7],
                'feedback_B': sticky_data[8],
                'feedback_C': sticky_data[9],
                'ai_summary_content': sticky_data[10],
                'ai_teammate_avg_prediction': sticky_data[11],
                'ai_enemy_avg_prediction': sticky_data[12],
                'ai_overall_avg_prediction': sticky_data[13],
                'teammate_avg_score': sticky_data[14],
                'enemy_avg_score': sticky_data[15],
                'overall_avg_score': sticky_data[16],
                'created_at': sticky_data[17],
                'student_name': sticky_data[18],
                'school_id': sticky_data[19],
                'author_camp_id': sticky_data[20]
            }
            
            # 同校の全ユーザーに更新された付箋を送信
            socketio.emit('sticky_updated', sticky_info, to=f"school_{sticky_data[19]}")
        
        return jsonify({'status': 'success', 'message': '付箋が更新されました'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sticky/<int:sticky_id>', methods=['DELETE'])
def delete_sticky(sticky_id):
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        # 削除前に付箋情報を取得
        c.execute('''SELECT s.sticky_id, s.student_id, st.school_id
                     FROM sticky s
                     JOIN students st ON s.student_id = st.student_id
                     WHERE s.sticky_id = ?''', (sticky_id,))
        
        sticky_data = c.fetchone()
        
        if not sticky_data:
            conn.close()
            return jsonify({'error': '付箋が見つかりません'}), 404
        
        c.execute('DELETE FROM sticky WHERE sticky_id = ?', (sticky_id,))
        conn.commit()
        
        if c.rowcount == 0:
            conn.close()
            return jsonify({'error': '付箋が見つかりません'}), 404
        
        # 削除された付箋のIDを全クライアントに送信
        delete_info = {
            'sticky_id': sticky_data[0],
            'student_id': sticky_data[1],
            'school_id': sticky_data[2]
        }
        
        # 同校の全ユーザーに削除された付箋を送信
        socketio.emit('sticky_deleted', delete_info, to=f"school_{sticky_data[2]}")
        
        conn.close()
        return jsonify({'status': 'success', 'message': '付箋が削除されました'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 陣営別得点計算API
@app.route('/api/camps/scores/<school_id>/<int:theme_id>', methods=['GET'])
def get_camp_scores(school_id, theme_id):
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        # 各陣営の得点を計算
        # 同陣営の投票: A(+2), B(+1), C(-1)
        # 敵陣営の投票: A(+6), B(+3), C(-1)
        
        print(f"\n=== Calculating scores for school_id: {school_id}, theme_id: {theme_id} ===")
        
        # デバッグ: 基本的な投票データを確認
        c.execute('''
            SELECT 
                COUNT(*) as total_votes,
                sv.vote_type,
                COUNT(DISTINCT sv.sticky_id) as unique_stickies,
                COUNT(DISTINCT sv.student_id) as unique_voters
            FROM sticky_votes sv
            JOIN sticky s ON sv.sticky_id = s.sticky_id
            JOIN students st ON s.student_id = st.student_id
            WHERE st.school_id = ? AND s.theme_id = ?
            GROUP BY sv.vote_type
        ''', (school_id, theme_id))
        
        basic_vote_data = c.fetchall()
        print("\n=== Basic Vote Summary ===")
        for row in basic_vote_data:
            print(f"Vote Type {row[1] if row[1] is not None else 'None'}: {row[0] if row[0] is not None else 'None'} votes on {row[2] if row[2] is not None else 'None'} stickies by {row[3] if row[3] is not None else 'None'} voters")
        
        # デバッグ: 陣営情報を確認
        c.execute('''
            SELECT 
                s.sticky_id,
                s.author_camp_id,
                sv.vote_type,
                sv.voter_camp_id,
                st_target.name as target_student,
                st_voter.name as voter_student
            FROM sticky s
            JOIN sticky_votes sv ON s.sticky_id = sv.sticky_id
            JOIN students st_target ON s.student_id = st_target.student_id
            JOIN students st_voter ON sv.student_id = st_voter.student_id
            WHERE st_target.school_id = ? AND s.theme_id = ?
            ORDER BY s.sticky_id, sv.vote_type
        ''', (school_id, theme_id))
        
        detailed_vote_data = c.fetchall()
        print("\n=== Detailed Vote Data ===")
        print("Sticky ID | Target Camp | Vote Type | Voter Camp | Target Student | Voter Student")
        print("-" * 90)
        for row in detailed_vote_data:
            print(f"{row[0] if row[0] is not None else 'None':^9}|{row[1] if row[1] is not None else 'None':^12}|{row[2] if row[2] is not None else 'None':^10}|{row[3] if row[3] is not None else 'None':^11}|{row[4] if row[4] is not None else 'None':^15}|{row[5] if row[5] is not None else 'None':^14}")
        
        if not detailed_vote_data:
            print("Warning: No detailed vote data found!")
            return jsonify({'error': '投票データが見つかりません'}), 404
        
        # まず、投票データを取得（投票者と被投票者の詳細情報を含む）
        c.execute('''
            WITH vote_summary AS (
                SELECT 
                    sticky_target.theme_id,
                    sticky_target.author_camp_id as target_camp_id,
                    sv.vote_type,
                    sv.voter_camp_id,
                    COUNT(*) as vote_count,
                    GROUP_CONCAT(DISTINCT s.name) as target_students,
                    GROUP_CONCAT(DISTINCT st_voter.name) as voter_students
                FROM sticky sticky_target
                JOIN students s ON sticky_target.student_id = s.student_id
                JOIN sticky_votes sv ON sticky_target.sticky_id = sv.sticky_id
                JOIN students st_voter ON sv.student_id = st_voter.student_id
                WHERE s.school_id = ? AND sticky_target.theme_id = ?
                  AND sticky_target.author_camp_id IS NOT NULL
                  AND sv.voter_camp_id IS NOT NULL
                GROUP BY sticky_target.author_camp_id, 
                         sv.vote_type, 
                         sv.voter_camp_id
            )
            SELECT 
                target_camp_id,
                vote_type,
                voter_camp_id,
                vote_count,
                target_students,
                voter_students,
                c1.camp_name as target_camp_name,
                c2.camp_name as voter_camp_name
            FROM vote_summary
            LEFT JOIN camps c1 ON vote_summary.target_camp_id = c1.camp_id AND vote_summary.theme_id = c1.theme_id
            LEFT JOIN camps c2 ON vote_summary.voter_camp_id = c2.camp_id AND vote_summary.theme_id = c2.theme_id
        ''', (school_id, theme_id))
        
        print("\n=== Raw Vote Data ===")
        print("Target Camp | Vote Type | Voter Camp | Count | Target Camp Name | Voter Camp Name | Target Students | Voter Students")
        
        vote_data = c.fetchall()
        for row in vote_data:
            # Columns: 0 target_camp_id | 1 vote_type | 2 voter_camp_id | 3 count | 4 target_students | 5 voter_students | 6 target_camp_name | 7 voter_camp_name
            target_camp_str   = row[0] if row[0] is not None else 'None'
            vote_type_str     = row[1] if row[1] is not None else 'None'
            voter_camp_str    = row[2] if row[2] is not None else 'None'
            count_str         = row[3] if row[3] is not None else 'None'
            target_camp_name  = row[6] if len(row) > 6 and row[6] is not None else 'None'
            voter_camp_name   = row[7] if len(row) > 7 and row[7] is not None else 'None'
            target_students   = row[4] if row[4] is not None else 'None'
            voter_students    = row[5] if row[5] is not None else 'None'

            print(f"{str(target_camp_str):^11}|{str(vote_type_str):^11}|{str(voter_camp_str):^11}|{str(count_str):^7}|{str(target_camp_name):^15}|{str(voter_camp_name):^15}|{str(target_students):^20}|{str(voter_students):^20}")
        
        # 陣営別得点計算
        camp_scores = {}

        # すべての陣営の得点を0に初期化
        c.execute('SELECT camp_id FROM camps WHERE theme_id = ? ORDER BY camp_id', (theme_id,))
        camp_rows = c.fetchall()
        if not camp_rows:
            print(f"Warning: No camps found for theme_id {theme_id}")
            return jsonify({'error': 'テーマに対する陣営が見つかりません'}), 404

        theme_camp_ids = [row[0] for row in camp_rows if row[0] is not None]
        for camp_id in theme_camp_ids:
            camp_scores[camp_id] = 0

        # 学生や付箋に保存されている 1/2 の論理IDを、このテーマの実際の camp_id にマッピング
        camp_id_map = {}
        if len(theme_camp_ids) >= 2:
            camp_id_map = {1: theme_camp_ids[0], 2: theme_camp_ids[1]}
        print("\nInitialized camp scores:", camp_scores)
        print("Camp ID map (logical -> actual):", camp_id_map)
        
        for row in vote_data:
            try:
                target_camp_id = int(row[0]) if row[0] is not None else None
                vote_type = row[1]
                voter_camp_id = int(row[2]) if row[2] is not None else None
                vote_count = int(row[3]) if row[3] is not None else 0
                
                print(f"\nProcessing vote row:")
                print(f"- Raw data: {row}")
                print(f"- Converted target_camp_id: {target_camp_id} ({type(target_camp_id)})")
                print(f"- Converted voter_camp_id: {voter_camp_id} ({type(voter_camp_id)})")
                print(f"- Converted vote_count: {vote_count} ({type(vote_count)})")
                
                if target_camp_id in camp_id_map:
                    original_target = target_camp_id
                    target_camp_id = camp_id_map[target_camp_id]
                    print(f"- Mapped target_camp_id: {original_target} -> {target_camp_id}")
                if voter_camp_id in camp_id_map:
                    original_voter = voter_camp_id
                    voter_camp_id = camp_id_map[voter_camp_id]
                    print(f"- Mapped voter_camp_id: {original_voter} -> {voter_camp_id}")
                
                if target_camp_id is None or voter_camp_id is None:
                    print("Warning: Skipping vote due to missing camp IDs")
                    continue
                
                if target_camp_id not in camp_scores:
                    print(f"Warning: Initializing score for unknown camp_id {target_camp_id}")
                    camp_scores[target_camp_id] = 0
            except (TypeError, ValueError) as e:
                print(f"Error processing vote row: {e}")
                continue
            
            print(f"\n=== Processing Vote ===")
            print(f"Target Camp ID: {target_camp_id}")
            print(f"Voter Camp ID: {voter_camp_id}")
            print(f"Vote Type: {vote_type}")
            print(f"Vote Count: {vote_count}")
            
            # 同陣営判定はNULLを同陣営とみなさない
            is_same_camp = False
            try:
                if target_camp_id is not None and voter_camp_id is not None:
                    is_same_camp = (str(target_camp_id) == str(voter_camp_id))
                    print(f"Comparing camp IDs: {target_camp_id} ({type(target_camp_id)}) == {voter_camp_id} ({type(voter_camp_id)})")
            except (TypeError, ValueError) as e:
                print(f"Error in camp comparison: {e}")
                print(f"target_camp_id type: {type(target_camp_id)}")
                print(f"voter_camp_id type: {type(voter_camp_id)}")
                is_same_camp = False
            
            print(f"\n=== Processing Vote ===")
            print(f"Target Camp ID: {target_camp_id}")
            print(f"Voter Camp ID: {voter_camp_id}")
            print(f"Vote Type: {vote_type}")
            print(f"Vote Count: {vote_count}")
            
            # 得点の変化を計算する
            score_change = 0
            
            # 同陣営判定の詳細をログ出力
            print(f"\n=== Vote Processing ===")
            print(f"Target Camp: {target_camp_id} ({row[6] if row[6] is not None else 'None'})")  # camp_name from query
            print(f"Voter Camp: {voter_camp_id} ({row[7] if row[7] is not None else 'None'})")    # camp_name from query
            print(f"Vote Type: {vote_type}")
            print(f"Vote Count: {vote_count}")
            print(f"Target Students: {row[4] if row[4] is not None else 'None'}")
            print(f"Voter Students: {row[5] if row[5] is not None else 'None'}")
            
            print(f"\nSame Camp Check:")
            print(f"- Target Camp ID exists: {target_camp_id is not None}")
            print(f"- Voter Camp ID exists: {voter_camp_id is not None}")
            print(f"- Camp IDs match: {target_camp_id == voter_camp_id}")
            print(f"- Final is_same_camp: {is_same_camp}")
            
            # 得点計算のルール表示
            print("\nScoring Rules:")
            if is_same_camp:
                print("Same Camp Rules:")
                print("- A vote: +2 points")
                print("- B vote: +1 point")
                print("- C vote: -1 point")
            else:
                print("Enemy Camp Rules:")
                print("- A vote: +6 points")
                print("- B vote: +3 points")
                print("- C vote: -1 point")
            
            # 実際の得点計算
            try:
                if target_camp_id is None or voter_camp_id is None:
                    print(f"Warning: Skipping vote due to missing camp IDs - target: {target_camp_id}, voter: {voter_camp_id}")
                    continue

                if is_same_camp:
                    if vote_type == 'A':
                        score_change = int(vote_count) * 2
                    elif vote_type == 'B':
                        score_change = int(vote_count) * 1
                    elif vote_type == 'C':
                        score_change = int(vote_count) * (-1)
                else:
                    if vote_type == 'A':
                        score_change = int(vote_count) * 6
                    elif vote_type == 'B':
                        score_change = int(vote_count) * 3
                    elif vote_type == 'C':
                        score_change = int(vote_count) * (-1)
            except (TypeError, ValueError) as e:
                print(f"Error in score calculation: {e}")
                print(f"vote_count type: {type(vote_count)}")
                print(f"vote_count value: {vote_count}")
                continue
            
            print(f"\nScore Calculation:")
            print(f"- Vote type: {vote_type}")
            print(f"- Vote count: {vote_count}")
            print(f"- Multiplier: {score_change / vote_count if vote_count else 0}")
            print(f"- Score change: {score_change}")
            
            # 得点を更新し、ログを出力する
            old_score = camp_scores[target_camp_id]
            camp_scores[target_camp_id] += score_change
            print(f"\nScore Update:")
            print(f"- Old score: {old_score}")
            print(f"- Score change: {score_change}")
            print(f"- New score: {camp_scores[target_camp_id]}")
            print(f"\nVote calculation:")
            print(f"- Target Camp: {target_camp_id}")
            print(f"- Voter Camp: {voter_camp_id}")
            print(f"- Vote Type: {vote_type}")
            print(f"- Count: {vote_count}")
            print(f"- Is Same Camp: {is_same_camp}")
            print(f"- Score Change: {score_change}")
            print(f"- Old Score: {old_score}")
            print(f"- New Score: {camp_scores[target_camp_id]}")
            
            # デバッグ用ログ出力
            print(f"Vote calculation - Target Camp: {target_camp_id}, Voter Camp: {voter_camp_id}, Vote Type: {vote_type}, Count: {vote_count}, Is Same Camp: {is_same_camp}, Current Score: {camp_scores[target_camp_id]}")
        
        # 陣営一覧を取得（投票が無い陣営も0点で返す）
        c.execute('''
            SELECT camp_id, camp_name
              FROM camps
             WHERE theme_id = ?
             ORDER BY camp_id
        ''', (theme_id,))

        camp_rows = c.fetchall()

        # 結果をフォーマット（全陣営を必ず返却）
        result = []
        print("\n=== Final Scores ===")
        print("Camp ID | Camp Name | Raw Score | Percentage")
        print("-" * 60)
        
        # 総得点（絶対値の合計）を計算
        total_abs_score = sum(abs(score) for score in camp_scores.values())
        
        for row in camp_rows:
            camp_id = row[0]
            camp_name = row[1]
            score = camp_scores.get(camp_id, 0)
            
            # パーセンテージ計算（総得点が0の場合は50%）
            percentage = 50
            if total_abs_score > 0:
                percentage = (abs(score) / total_abs_score) * 100
            
            print(f"{camp_id if camp_id is not None else 'None':^7}|{camp_name if camp_name is not None else 'None':^10}|{score if score is not None else 'None':^10}|{percentage:^10.1f}%")
            
            result.append({
                'camp_id': camp_id,
                'camp_name': camp_name or f'陣営{camp_id if camp_id is not None else "Unknown"}',
                'score': score
            })

        # debate_settings に合計点と勝者を保存
        if len(camp_rows) >= 2:
            camp1_id, camp1_name = camp_rows[0][0], camp_rows[0][1]
            camp2_id, camp2_name = camp_rows[1][0], camp_rows[1][1]
            team1_score = float(camp_scores.get(camp1_id, 0))
            team2_score = float(camp_scores.get(camp2_id, 0))

            if team1_score > team2_score:
                winner_name = camp1_name
            elif team2_score > team1_score:
                winner_name = camp2_name
            else:
                winner_name = 'draw'

            c.execute('''
                UPDATE debate_settings
                   SET winner = ?, team1_score = ?, team2_score = ?
                 WHERE theme_id = ?
            ''', (winner_name, team1_score, team2_score, theme_id))
            conn.commit()
        
        conn.close()
        return jsonify({
            'status': 'success',
            'scores': result
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

app.register_blueprint(message_o)


# 基本的なヘルスチェック用エンドポイント
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'サーバーは正常に動作しています'}), 200



@app.route('/api/check_theme_status', methods=['GET'])
def check_theme_status():
    """学校単位で直近テーマが終了していれば student.camp_id をクリアする"""
    school_id = request.args.get('school_id')
    if not school_id:
        return jsonify({'error': 'school_id が必要です'}), 400

    try:
        conn = get_db_connection()
        c = conn.cursor()

        # 直近(終了日時が最新)テーマについて、終了済みか(= end_date <= now) をDB側で判定
        c.execute('''
            SELECT CASE WHEN end_date <= datetime('now') THEN 1 ELSE 0 END AS ended
              FROM debate_settings
             WHERE school_id = ?
             ORDER BY end_date DESC
             LIMIT 1
        ''', (school_id,))
        row = c.fetchone()

        if not row:
            conn.close()
            return jsonify({'message': 'テーマが見つかりません'}), 404

        ended = bool(row[0])
        if ended:
            c.execute('''
                UPDATE students
                   SET camp_id = NULL
                 WHERE school_id = ?
            ''', (school_id,))
            conn.commit()
            conn.close()
            return jsonify({'message': '討論が終了し、陣営選択がクリアされました'})

        conn.close()
        return jsonify({'message': '討論が継続中です'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@socketio.on('join_sticky_chat')
def handle_join_sticky_chat(data):
    """付箋チャットに参加"""
    sticky_id = data.get('sticky_id')
    if sticky_id:
        from flask_socketio import join_room
        room_name = f"sticky_{sticky_id}"
        join_room(room_name)
        print(f"DEBUG: Client joined sticky chat room: {room_name}")
    else:
        print(f"DEBUG: join_sticky_chat called without sticky_id: {data}")

@socketio.on('leave_sticky_chat')
def handle_leave_sticky_chat(data):
    """付箋チャットから退出"""
    sticky_id = data.get('sticky_id')
    if sticky_id:
        from flask_socketio import leave_room
        room_name = f"sticky_{sticky_id}"
        leave_room(room_name)
        print(f"DEBUG: Client left sticky chat room: {room_name}")
    else:
        print(f"DEBUG: leave_sticky_chat called without sticky_id: {data}")

@socketio.on('send_message')
def handle_send_message(data):
    """メッセージ送信を処理"""
    required_fields = ['student_id', 'message_content', 'camp_id', 'sticky_id']
    for field in required_fields:
        if field not in data:
            print(f"DEBUG: send_message missing field: {field}")
            return
    
    
# --- debate_settings エンドポイント ------------------------

app.register_blueprint(themes_o)

# --- camps エンドポイント ----------------------------------

# 5) あるテーマの陣営一覧を取得
@app.route('/api/themes/<int:theme_id>/camps', methods=['GET'])
def list_camps(theme_id):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
      SELECT camp_id, theme_id, camp_name, is_winner
        FROM camps
       WHERE theme_id = ?
       ORDER BY camp_id
    ''', (theme_id,))
    camps = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(camps)


# 6) 新しい陣営を追加
@app.route('/api/themes/<int:theme_id>/camps', methods=['POST'])
def create_camp(theme_id):
    data = request.get_json() or {}
    if 'camp_name' not in data:
        return jsonify({'error': 'camp_name が必要です'}), 400

    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
      INSERT INTO camps (theme_id, camp_name)
      VALUES (?, ?)
    ''', (theme_id, data['camp_name']))
    camp_id = c.lastrowid
    conn.commit()
    conn.close()
    return jsonify({'camp_id': camp_id}), 201


# 7) 陣営の勝敗フラグを更新
@app.route('/api/camps/<int:camp_id>', methods=['PATCH'])
def update_camp(camp_id):
    data = request.get_json() or {}
    if 'is_winner' not in data:
        return jsonify({'error': 'is_winner が必要です'}), 400

    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
      UPDATE camps
         SET is_winner = ?
       WHERE camp_id = ?
    ''', (1 if data['is_winner'] else 0, camp_id))
    
    # 勝ち負けが付く(当該テーマが終わる)と陣営idからテーマを引っ張り逆引きしてstudentの合計ポイントを履歴として保存する
    # 2) この camp の theme_id を取得
    c.execute('SELECT theme_id FROM camps WHERE camp_id = ?', (camp_id,))
    row = c.fetchone()
    if row:
        theme_id = row[0]

        # 3) そのテーマに属する全 camp_id を取得
        c.execute('SELECT camp_id FROM camps WHERE theme_id = ?', (theme_id,))
        camp_rows = c.fetchall()
        camp_ids = [r[0] for r in camp_rows]

        if camp_ids:
            # 4) その camp_id に属する全 student_id と sum_point を取得
            placeholders = ','.join('?' for _ in camp_ids)
            c.execute(f'''
                SELECT student_id, sum_point
                  FROM students
                 WHERE camp_id IN ({placeholders})
            ''', camp_ids)
            students = c.fetchall()

            # 5) rank_history にレコードを追加
            for student_id, sum_point in students:
                c.execute('''
                  INSERT INTO rank_history (student_id, theme_id, sum_point)
                  VALUES (?, ?, ?)
                ''', (student_id, theme_id, sum_point))

    conn.commit()
    conn.close()
    return jsonify({'status': 'updated'})
# 当該陣営について返すやつ
@app.route('/api/camps/<int:camp_id>', methods=['GET'])
def get_camp(camp_id):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT camp_id, camp_name, theme_id, is_winner FROM camps WHERE camp_id = ?', (camp_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return jsonify({'error': '陣営が見つかりません'}), 404
    return jsonify({
        'camp_id': row[0],
        'camp_name': row[1],
        'theme_id': row[2],
        'is_winner': bool(row[3])
    })


# Socket.IO イベント処理
@socketio.on('connect')
def handle_connect():
    print('DEBUG: Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('DEBUG: Client disconnected')

@socketio.on('join_school')
def handle_join_school(data):
    """学校のルームに参加"""
    school_id = data.get('school_id')
    if school_id:
        from flask_socketio import join_room
        room_name = f"school_{school_id}"
        join_room(room_name)
        print(f"DEBUG: Client joined school room: {room_name}")
    else:
        print(f"DEBUG: join_school called without school_id: {data}")

@socketio.on('leave_school')
def handle_leave_school(data):
    """学校のルームから退出"""
    school_id = data.get('school_id')
    if school_id:
        from flask_socketio import leave_room
        room_name = f"school_{school_id}"
        leave_room(room_name)
        print(f"DEBUG: Client left school room: {room_name}")
    else:
        print(f"DEBUG: leave_school called without school_id: {data}")

# 投票状態API
@app.route('/api/sticky/<int:sticky_id>/vote-status/<int:student_id>', methods=['GET'])
def get_vote_status(sticky_id, student_id):
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        # ユーザーが投票したかどうかを確認
        c.execute('''SELECT vote_type FROM sticky_votes 
                     WHERE student_id = ? AND sticky_id = ?''', 
                  (student_id, sticky_id))
        
        vote_record = c.fetchone()
        
        # 投票できるかどうかを確認（自分のstickyではない）
        c.execute('''SELECT student_id FROM sticky WHERE sticky_id = ?''', (sticky_id,))
        sticky_author = c.fetchone()
        
        conn.close()
        
        if not sticky_author:
            return jsonify({'error': 'Sticky not found'}), 404
        
        can_vote = sticky_author[0] != student_id
        
        return jsonify({
            'voted': vote_record is not None,
            'vote_type': vote_record[0] if vote_record else None,
            'can_vote': can_vote
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 投票API
@app.route('/api/sticky/<int:sticky_id>/feedback', methods=['POST'])
def submit_feedback(sticky_id):
    if not request.json:
        return jsonify({'error': 'リクエストボディが必要です'}), 400
    
    try:
        student_id = request.json.get('student_id')
        feedback_type = request.json.get('feedback_type')
        
        if not student_id or not feedback_type:
            return jsonify({'error': 'student_id と feedback_type が必要です'}), 400
        
        if feedback_type not in ['A', 'B', 'C']:
            return jsonify({'error': '無効な feedback_type です'}), 400
        
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        # 自分のstickyには投票できない
        c.execute('''SELECT student_id FROM sticky WHERE sticky_id = ?''', (sticky_id,))
        sticky_author = c.fetchone()
        
        if not sticky_author:
            conn.close()
            return jsonify({'error': 'Sticky not found'}), 404
        
        if sticky_author[0] == student_id:
            conn.close()
            return jsonify({'error': '自分の付箋には投票できません'}), 400
        
        # 既存の投票を確認
        c.execute('''SELECT vote_type FROM sticky_votes 
                     WHERE student_id = ? AND sticky_id = ?''', 
                  (student_id, sticky_id))
        
        existing_vote = c.fetchone()
        
        if existing_vote:
            # 既存の投票を更新
            old_vote_type = existing_vote[0]
            
            # 古い投票のカウントを減らす
            c.execute(f'''UPDATE sticky SET feedback_{old_vote_type} = feedback_{old_vote_type} - 1 
                         WHERE sticky_id = ?''', (sticky_id,))
            
            # 新しい投票のカウントを増やす
            c.execute(f'''UPDATE sticky SET feedback_{feedback_type} = feedback_{feedback_type} + 1 
                         WHERE sticky_id = ?''', (sticky_id,))
            
            # 投票者と付箋作成者の陣営IDを取得
            c.execute('''
                SELECT 
                    s.camp_id as voter_camp_id,
                    sticky.author_camp_id as target_camp_id
                FROM students s
                JOIN sticky ON sticky.sticky_id = ?
                WHERE s.student_id = ?
            ''', (sticky_id, student_id))
            
            camp_info = c.fetchone()
            if not camp_info or camp_info[0] is None:
                conn.close()
                return jsonify({'error': '投票者の陣営が設定されていません'}), 400
            
            voter_camp_id = camp_info[0]
            target_camp_id = camp_info[1]
            
            print(f"\n=== Vote Update Info ===")
            print(f"Voter Camp ID: {voter_camp_id}")
            print(f"Target Camp ID: {target_camp_id}")
            print(f"Vote Type: {feedback_type}")
            
            # 投票記録を更新（投票時の陣営IDも更新）
            c.execute('''UPDATE sticky_votes 
                        SET vote_type = ?, 
                            voter_camp_id = ?,
                            created_at = datetime('now', '+9 hours')
                        WHERE student_id = ? AND sticky_id = ?''', 
                      (feedback_type, voter_camp_id, student_id, sticky_id))
        else:
            # 投票者と付箋作成者の陣営IDを取得
            c.execute('''
                SELECT 
                    s.camp_id as voter_camp_id,
                    sticky.author_camp_id as target_camp_id
                FROM students s
                JOIN sticky ON sticky.sticky_id = ?
                WHERE s.student_id = ?
            ''', (sticky_id, student_id))
            
            camp_info = c.fetchone()
            if not camp_info or camp_info[0] is None:
                conn.close()
                return jsonify({'error': '投票者の陣営が設定されていません'}), 400
            
            voter_camp_id = camp_info[0]
            target_camp_id = camp_info[1]
            
            print(f"\n=== Vote Info ===")
            print(f"Voter Camp ID: {voter_camp_id}")
            print(f"Target Camp ID: {target_camp_id}")
            print(f"Vote Type: {feedback_type}")
            
            # 新しい投票を追加
            c.execute(f'''UPDATE sticky SET feedback_{feedback_type} = feedback_{feedback_type} + 1 
                         WHERE sticky_id = ?''', (sticky_id,))
            
            # 投票記録を追加（投票時の陣営IDを保存）
            c.execute('''INSERT INTO sticky_votes (student_id, sticky_id, vote_type, voter_camp_id) 
                         VALUES (?, ?, ?, ?)''', (student_id, sticky_id, feedback_type, voter_camp_id))
        
        # 更新後のフィードバック数を取得
        c.execute('''SELECT feedback_A, feedback_B, feedback_C FROM sticky 
                     WHERE sticky_id = ?''', (sticky_id,))
        
        feedback_counts = c.fetchone()
        
        # 同校の全ユーザーに更新情報を送信
        c.execute('''SELECT st.school_id FROM sticky s
                     JOIN students st ON s.student_id = st.student_id
                     WHERE s.sticky_id = ?''', (sticky_id,))
        school_result = c.fetchone()
        
        conn.commit()
        conn.close()
        
        # Socket.IOでフィードバック更新を通知
        if school_result:
            socketio.emit('feedback_updated', {
                'sticky_id': sticky_id,
                'feedback_A': feedback_counts[0],
                'feedback_B': feedback_counts[1],
                'feedback_C': feedback_counts[2]
            }, to=f"school_{school_result[0]}")
        
        return jsonify({
            'status': 'success',
            'message': '投票が完了しました',
            'feedback_counts': {
                'feedback_A': feedback_counts[0],
                'feedback_B': feedback_counts[1],
                'feedback_C': feedback_counts[2]
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/rank_history', methods=['GET'])
def get_rank_history():
    student_id = request.args.get('student_id', type=int)
    if student_id is None:
        return jsonify({'error':'student_id が必要です'}), 400

    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
      SELECT history_id, theme_id, sum_point, created_at
        FROM rank_history
       WHERE student_id = ?
    ''', (student_id,))
    rows = c.fetchall()
    conn.close()

    result = []
    for h in rows:
        result.append({
            'history_id': h[0],
            'theme_id':   h[1],
            'sum_point':  h[2],
            'created_at': h[3],
        })
    return jsonify(result)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True, use_reloader=False)

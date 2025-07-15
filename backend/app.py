from flask import Flask, jsonify, request
import sqlite3
import json
from flask_cors import CORS # Flask-CORSをインポート
import os
from flask_socketio import SocketIO, emit

from components.init import init_db
from components.signup import signup_o
from components.login import login_o
from components.message import message_o
from components.colorset import colorset_o
from components.student import student_o
from components.themes import themes_o

app = Flask(__name__)
CORS(app) # CORSをアプリケーション全体に適用

# SocketIOを初期化
socketio = SocketIO(app, cors_allowed_origins="*")

init_db()

@app.route('/')
def health():
    return jsonify({'status': 'ok'})

app.register_blueprint(colorset_o)
app.register_blueprint(signup_o)
app.register_blueprint(login_o)
app.register_blueprint(student_o)

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
        
        # 付箋插入
        c.execute('''INSERT INTO sticky (student_id, sticky_content, sticky_color, x_axis, y_axis, display_index, feedback_A, feedback_B, feedback_C,
                                         ai_summary_content, ai_teammate_avg_prediction, ai_enemy_avg_prediction, ai_overall_avg_prediction,
                                         teammate_avg_score, enemy_avg_score, overall_avg_score) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                 (request.json['student_id'], 
                  request.json['sticky_content'],
                  request.json['sticky_color'],
                  request.json.get('x_axis', 0),
                  request.json.get('y_axis', 0),
                  new_display_index,
                  request.json.get('feedback_A', 0),
                  request.json.get('feedback_B', 0),
                  request.json.get('feedback_C', 0),
                  request.json.get('ai_summary_content'),
                  request.json.get('ai_teammate_avg_prediction', 0),
                  request.json.get('ai_enemy_avg_prediction', 0),
                  request.json.get('ai_overall_avg_prediction', 0),
                  request.json.get('teammate_avg_score', 0),
                  request.json.get('enemy_avg_score', 0),
                  request.json.get('overall_avg_score', 0)))
        
        sticky_id = c.lastrowid
        
        # 作成された付箋の完全な情報を取得してSocketで送信
        c.execute('''SELECT s.sticky_id, s.student_id, s.sticky_content, s.sticky_color, s.x_axis, s.y_axis, s.display_index,
                            s.feedback_A, s.feedback_B, s.feedback_C, s.ai_summary_content, s.ai_teammate_avg_prediction,
                            s.ai_enemy_avg_prediction, s.ai_overall_avg_prediction, s.teammate_avg_score, s.enemy_avg_score,
                            s.overall_avg_score, s.created_at, st.name, st.school_id
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
                'school_id': sticky_data[19]
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
        
        # 付箋取得
        if student_id:
            c.execute('''SELECT s.sticky_id, s.student_id, s.sticky_content, s.sticky_color, s.x_axis, s.y_axis, s.display_index,
                                s.feedback_A, s.feedback_B, s.feedback_C, s.ai_summary_content, s.ai_teammate_avg_prediction,
                                s.ai_enemy_avg_prediction, s.ai_overall_avg_prediction, s.teammate_avg_score, s.enemy_avg_score,
                                s.overall_avg_score, s.created_at, st.name
                         FROM sticky s
                         JOIN students st ON s.student_id = st.student_id
                         WHERE s.student_id = ? ORDER BY s.display_index, s.created_at DESC''', (student_id,))
        elif school_id:
            # 同校の全学生の付箋を取得
            c.execute('''SELECT s.sticky_id, s.student_id, s.sticky_content, s.sticky_color, s.x_axis, s.y_axis, s.display_index,
                                s.feedback_A, s.feedback_B, s.feedback_C, s.ai_summary_content, s.ai_teammate_avg_prediction,
                                s.ai_enemy_avg_prediction, s.ai_overall_avg_prediction, s.teammate_avg_score, s.enemy_avg_score,
                                s.overall_avg_score, s.created_at, st.name
                         FROM sticky s
                         JOIN students st ON s.student_id = st.student_id
                         WHERE st.school_id = ? ORDER BY s.display_index, s.created_at DESC''', (school_id,))
        else:
            c.execute('''SELECT s.sticky_id, s.student_id, s.sticky_content, s.sticky_color, s.x_axis, s.y_axis, s.display_index,
                                s.feedback_A, s.feedback_B, s.feedback_C, s.ai_summary_content, s.ai_teammate_avg_prediction,
                                s.ai_enemy_avg_prediction, s.ai_overall_avg_prediction, s.teammate_avg_score, s.enemy_avg_score,
                                s.overall_avg_score, s.created_at, st.name
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
                'student_name': row[18]
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
                            s.overall_avg_score, s.created_at, st.name, st.school_id
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
                'school_id': sticky_data[19]
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

app.register_blueprint(message_o)

#データベース接続関数を追加
def get_db_connection():
    # データベースファイルのパスを設定
    db_path = 'database.db'  # 実際のデータベースファイル名に変更してください
    
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"データベースファイルが見つかりません: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        return conn
    except sqlite3.Error as e:
        raise

# 基本的なヘルスチェック用エンドポイント
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'サーバーは正常に動作しています'}), 200

# 報酬を追加するAPI
@app.route('/api/rewards', methods=['POST', 'OPTIONS'])
def add_reward():
    # OPTIONSリクエストへの対応
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 200
    
    try:
        # リクエストからJSONデータを取得        
        # Content-Typeが設定されていない場合でもJSONとして扱う
        if request.content_type == 'application/json':
            data = request.get_json()
        else:
            # Content-Typeがない場合、手動でJSONパース
            try:
                import json
                data = json.loads(request.data.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                return jsonify({'error': 'JSONデータの解析に失敗しました'}), 400
        
        # 必要なフィールドが存在するかチェック
        if not data:
            return jsonify({'error': 'データが送信されませんでした'}), 400
        
        required_fields = ['reward_content', 'need_point', 'need_rank', 'creater']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field}が不足しています'}), 400
        
        # データの型チェック
        if not isinstance(data['need_point'], int) or data['need_point'] <= 0:
            return jsonify({'error': '必要ポイントは正の整数である必要があります'}), 400
        
        if not isinstance(data['need_rank'], int) or data['need_rank'] < 0:
            return jsonify({'error': '必要ランクは0以上の整数である必要があります'}), 400
        
        if not data['reward_content'].strip():
            return jsonify({'error': '報酬の内容を入力してください'}), 400
        
        # データベースに挿入
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO reward (reward_content, need_point, need_rank, creater)
                VALUES (?, ?, ?, ?)
            ''', (
                data['reward_content'].strip(),
                data['need_point'],
                data['need_rank'],
                data['creater']
            ))
            
            conn.commit()
            reward_id = cursor.lastrowid
            
            # 成功レスポンス
            response_data = {
                'message': '報酬が正常に追加されました',
                'reward_id': reward_id,
                'data': {
                    'reward_content': data['reward_content'].strip(),
                    'need_point': data['need_point'],
                    'need_rank': data['need_rank'],
                    'creater': data['creater']
                }
            }
            return jsonify(response_data), 201
            
        except sqlite3.IntegrityError as e:
            # 重複エラー（UNIQUE制約違反）
            if 'UNIQUE constraint failed' in str(e):
                return jsonify({'error': 'この報酬は既に存在します'}), 409
            else:
                return jsonify({'error': 'データベースエラーが発生しました'}), 500
        
        finally:
            conn.close()
    
    except Exception as e:
        import traceback
        return jsonify({'error': 'サーバーエラーが発生しました'}), 500
    
    
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
    conn.commit()
    conn.close()
    return jsonify({'status': 'updated'})

# --- holdReward エンドポイント ----------------------

# 1) すべての保持報酬（または student_id で絞り込み）を取得
@app.route('/api/holdRewards', methods=['GET'])
def list_hold_rewards():
    try:
        student_id = request.args.get('student_id', type=int)
        conn = get_db_connection()
        c = conn.cursor()
        if student_id is not None:
            c.execute('''
              SELECT hold_id, student_id, reward_id, is_holding, used_at
                FROM holdReward
               WHERE student_id = ?
            ''', (student_id,))
        else:
            c.execute('''
              SELECT hold_id, student_id, reward_id, is_holding, used_at
                FROM holdReward
            ''')
        rows = c.fetchall()
        conn.close()

        result = []
        for r in rows:
            result.append({
                'hold_id':    r[0],
                'student_id': r[1],
                'reward_id':  r[2],
                'is_holding': bool(r[3]),
                'used_at':    r[4]
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 2) 新しい保持報酬を作成
@app.route('/api/holdRewards', methods=['POST'])
def create_hold_reward():
    data = request.get_json() or {}
    if 'student_id' not in data or 'reward_id' not in data:
        return jsonify({'error': 'student_id と reward_id が必要です'}), 400

    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('''
          INSERT INTO holdReward (student_id, reward_id, is_holding, used_at)
          VALUES (?, ?, ?, ?)
        ''', (
          data['student_id'],
          data['reward_id'],
          data.get('is_holding', True),
          data.get('used_at')  # null なら自動で NULL
        ))
        hold_id = c.lastrowid
        conn.commit()
        conn.close()
        return jsonify({'hold_id': hold_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 3) 保持報酬の更新（is_holding / used_at など）
@app.route('/api/holdRewards/<int:hold_id>', methods=['PATCH'])
def update_hold_reward(hold_id):
    data = request.get_json() or {}
    allowed = []
    vals = []
    if 'is_holding' in data:
        allowed.append('is_holding = ?')
        vals.append(1 if data['is_holding'] else 0)
    if 'used_at' in data:
        allowed.append('used_at = ?')
        vals.append(data['used_at'])
    if not allowed:
        return jsonify({'error': '更新できるフィールドがありません'}), 400

    vals.append(hold_id)
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute(f'''
          UPDATE holdReward
             SET {', '.join(allowed)}
           WHERE hold_id = ?
        ''', vals)
        conn.commit()
        if c.rowcount == 0:
            conn.close()
            return jsonify({'error': 'hold_id が見つかりません'}), 404
        conn.close()
        return jsonify({'status': 'updated'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 4) 保持報酬の削除
@app.route('/api/holdRewards/<int:hold_id>', methods=['DELETE'])
def delete_hold_reward(hold_id):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('DELETE FROM holdReward WHERE hold_id = ?', (hold_id,))
        conn.commit()
        if c.rowcount == 0:
            conn.close()
            return jsonify({'error': 'hold_id が見つかりません'}), 404
        conn.close()
        return jsonify({'status': 'deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
            
            # 投票記録を更新
            c.execute('''UPDATE sticky_votes SET vote_type = ?, created_at = datetime('now', '+9 hours')
                         WHERE student_id = ? AND sticky_id = ?''', 
                      (feedback_type, student_id, sticky_id))
        else:
            # 新しい投票を追加
            c.execute(f'''UPDATE sticky SET feedback_{feedback_type} = feedback_{feedback_type} + 1 
                         WHERE sticky_id = ?''', (sticky_id,))
            
            # 投票記録を追加
            c.execute('''INSERT INTO sticky_votes (student_id, sticky_id, vote_type) 
                         VALUES (?, ?, ?)''', (student_id, sticky_id, feedback_type))
        
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

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)

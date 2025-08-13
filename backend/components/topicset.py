from flask import Blueprint, request, jsonify
import sqlite3
import random
from datetime import datetime
from flask_cors import CORS

topicset_o = Blueprint('topicset_o', __name__, url_prefix='/api')
CORS(topicset_o, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

@topicset_o.route('/topics', methods=['POST'])
def add_topic():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    # ランダム選擇colorset_id (1-10)
    colorset_id = random.randint(1, 10)
    start_date = data.get('startDate')
    end_date = data.get('endDate')
    team1 = data.get('team1')
    team2 = data.get('team2')
    school_id = data.get('school_id')
    
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        # debate_settings記録を挿入する
        c.execute(
            '''
            INSERT INTO debate_settings (title, description, colorset_id, start_date, end_date, team1, team2, school_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (title, description, colorset_id, start_date, end_date, team1, team2, school_id)
        )
        
        # 新規に挿入された記録のIDを取得する
        theme_id = c.lastrowid
        
        # camps記録を作成する
        c.execute(
            '''
            INSERT INTO camps (theme_id, camp_name, is_winner)
            VALUES (?, ?, 0), (?, ?, 0)
            ''',
            (theme_id, team1, theme_id, team2)
        )
        
        # 新しいテーマ開始時、当該学校の学生の陣営選択をリセット
        c.execute('''
            UPDATE students
               SET camp_id = NULL
             WHERE school_id = ?
        ''', (school_id,))
        
        conn.commit()
        return jsonify({'message': 'テーマが追加されました', 'theme_id': theme_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@topicset_o.route('/newest_theme', methods=['GET'])
def get_newest_theme():
    school_id = request.args.get('school_id')
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        c.execute('''
            SELECT * FROM debate_settings WHERE school_id = ? ORDER BY theme_id DESC LIMIT 1
        ''', (school_id,))
        row = c.fetchone()
        if row:
            col_names = [description[0] for description in c.description]
            theme = dict(zip(col_names, row))
            return jsonify(theme), 200
        else:
            return jsonify({'error': 'テーマが見つかりません'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@topicset_o.route('/all_debate', methods=['GET'])
def get_all_debates():
    school_id = request.args.get('school_id')
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        c.execute('''
            SELECT 
                d.theme_id,
                d.title,
                d.description,
                d.start_date,
                d.end_date,
                d.team1,
                d.team2
            FROM debate_settings d
            WHERE d.school_id = ? 
            ORDER BY d.theme_id DESC
        ''', (school_id,))
        rows = c.fetchall()
        if rows:
            themes = [{
                'theme_id': row[0],
                'title': row[1],
                'description': row[2],
                'start_date': row[3],
                'end_date': row[4],
                'team1': row[5],
                'team2': row[6]
            } for row in rows]
            return jsonify(themes), 200
        else:
            return jsonify([]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@topicset_o.route('/delete_debate/<int:theme_id>', methods=['DELETE'])
def delete_debate(theme_id):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        # 先に関連する camps 記録を削除する
        c.execute('DELETE FROM camps WHERE theme_id = ?', (theme_id,))
        
        # sticky 記録を削除する
        c.execute('DELETE FROM sticky WHERE theme_id = ?', (theme_id,))
        
        # 最後に debate_settings 記録を削除する
        c.execute('DELETE FROM debate_settings WHERE theme_id = ?', (theme_id,))
        
        conn.commit()
        return jsonify({'message': 'テーマが削除されました'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@topicset_o.route('/clear_camp_selections', methods=['POST'])
def clear_camp_selections():
    """討論時間が終了したらすべての学生のcamp_idをクリアする"""
    data = request.get_json()
    school_id = data.get('school_id')
    
    if not school_id:
        return jsonify({'error': 'school_idが必要です'}), 400
    
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        # 現在の時間を取得する
        now = datetime.now()
        
        # 終了した討論テーマを検索する
        c.execute('''
            SELECT theme_id FROM debate_settings 
            WHERE school_id = ? AND end_date <= ?
        ''', (school_id, now.strftime('%Y-%m-%d %H:%M:%S')))
        
        ended_themes = c.fetchall()
        
        if not ended_themes:
            return jsonify({'message': '終了した討論テーマがありません'}), 200
        
        # すべての学生のcamp_idをクリアする
        c.execute('''
            UPDATE students 
            SET camp_id = NULL 
            WHERE school_id = ?
        ''', (school_id,))
        
        conn.commit()
        
        return jsonify({
            'message': '陣営選択がクリアされました',
            'cleared_students': c.rowcount
        }), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@topicset_o.route('/force_clear_camps', methods=['POST'])
def force_clear_camps():
    """管理用: 討論期間に関係なく、指定学校の学生 camp_id を全てクリアする"""
    data = request.get_json() or {}
    school_id = data.get('school_id')
    if not school_id:
        return jsonify({'error': 'school_idが必要です'}), 400

    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        c.execute('''
            UPDATE students
               SET camp_id = NULL
             WHERE school_id = ?
        ''', (school_id,))
        conn.commit()
        return jsonify({'message': 'camp_id をクリアしました', 'cleared_students': c.rowcount}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@topicset_o.route('/check_theme_status', methods=['GET'])
def check_theme_status():
    """討論テーマの状態を確認し、終了した場合は自動的にcamp_idをクリアする"""
    school_id = request.args.get('school_id')
    
    if not school_id:
        return jsonify({'error': 'school_idが必要です'}), 400
    
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        # 現在の時間を取得する
        now = datetime.now()
        
        # 終了した討論テーマを検索する
        c.execute('''
            SELECT theme_id, title, end_date FROM debate_settings 
            WHERE school_id = ? AND end_date <= ?
        ''', (school_id, now.strftime('%Y-%m-%d %H:%M:%S')))
        
        ended_themes = c.fetchall()
        
        if ended_themes:
            # すべての学生のcamp_idをクリアする
            c.execute('''
                UPDATE students 
                SET camp_id = NULL 
                WHERE school_id = ?
            ''', (school_id,))
            
            conn.commit()
            
            return jsonify({
                'message': '討論が終了し、陣営選択がクリアされました',
                'ended_themes': [{'theme_id': t[0], 'title': t[1], 'end_date': t[2]} for t in ended_themes],
                'cleared_students': c.rowcount
            }), 200
        else:
            return jsonify({'message': '進行中の討論があります'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
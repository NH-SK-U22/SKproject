from flask import Flask, jsonify, request
import sqlite3
import json
from flask_cors import CORS # Flask-CORSをインポート
import os
from flask_socketio import SocketIO, emit

from component.init import init_db
from component.signup import signup_o
from component.login import login_o
from component.sticky import sticky_o

app = Flask(__name__)
CORS(app) # CORSをアプリケーション全体に適用

# SocketIOを初期化
socketio = SocketIO(app, cors_allowed_origins="*")

init_db()

@app.route('/')
def health():
    return jsonify({'status': 'ok'})

# colorset
@app.route('/api/colorsets/<camp>', methods=['GET'])
def get_colorsets(camp):
    try:
        # camp1 = camp_type 1, camp2 = camp_type 2
        camp_type = 1 if camp == 'camp1' else 2
        
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute('SELECT group_number, colors FROM colorsets WHERE camp_type = ? ORDER BY group_number', (camp_type,))
        rows = c.fetchall()
        conn.close()
        
        colorsets = []
        for row in rows:
            colors = json.loads(row[1])
            colorsets.append({
                'group_number': row[0],
                'colors': colors
            })
        
        return jsonify(colorsets)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

app.register_blueprint(signup_o)
app.register_blueprint(login_o)

@app.route('/api/students', methods=['GET'])
def get_students():
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute('''SELECT student_id, school_id, class_id, number, name, user_type, sum_point, have_point,
                            camp_id, theme_color, user_color, blacklist_point, created_at 
                     FROM students ORDER BY created_at DESC''')
        students = []
        for row in c.fetchall():
            students.append({
                'id': row[0],
                'school_id': row[1],
                'class_id': row[2],
                'number': row[3],
                'name': row[4],
                'user_type': row[5],
                'sum_point': row[6],
                'have_point': row[7],
                'camp_id': row[8],
                'theme_color': row[9],
                'user_color': row[10],
                'blacklist_point': row[11],
                'created_at': row[12]
            })
        conn.close()
        
        return jsonify(students)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/<int:student_id>/points', methods=['PATCH'])
def update_student_points(student_id):
    if not request.json:
        return jsonify({'error': 'リクエストボディが必要です'}), 400
    
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        update_fields = []
        values = []
        
        if 'sum_point' in request.json:
            update_fields.append('sum_point = ?')
            values.append(request.json['sum_point'])
        
        if 'have_point' in request.json:
            update_fields.append('have_point = ?')
            values.append(request.json['have_point'])
            
        if 'blacklist_point' in request.json:
            update_fields.append('blacklist_point = ?')
            values.append(request.json['blacklist_point'])
        
        if not update_fields:
            return jsonify({'error': '更新するフィールドがありません'}), 400
        
        values.append(student_id)
        query = f"UPDATE students SET {', '.join(update_fields)} WHERE student_id = ?"
        
        c.execute(query, values)
        conn.commit()
        
        if c.rowcount == 0:
            conn.close()
            return jsonify({'error': 'ユーザーが見つかりません'}), 404
            
        conn.close()
        return jsonify({'status': 'success', 'message': 'ポイントが更新されました'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/<int:student_id>/camp', methods=['PATCH'])
def update_student_camp(student_id):
    if not request.json:
        return jsonify({'error': 'リクエストボディが必要です'}), 400
    
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        update_fields = []
        values = []
        
        if 'camp_id' in request.json:
            update_fields.append('camp_id = ?')
            values.append(request.json['camp_id'])
        
        if 'theme_color' in request.json:
            update_fields.append('theme_color = ?')
            values.append(request.json['theme_color'])
            
        if 'user_color' in request.json:
            update_fields.append('user_color = ?')
            values.append(request.json['user_color'])
        
        if not update_fields:
            return jsonify({'error': '更新するフィールドがありません'}), 400
        
        values.append(student_id)
        query = f"UPDATE students SET {', '.join(update_fields)} WHERE student_id = ?"
        
        c.execute(query, values)
        conn.commit()
        
        if c.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Student not found'}), 404
            
        conn.close()
        return jsonify({'status': 'success', 'message': '陣営設定が更新されました'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/class/<class_id>', methods=['GET'])
def get_students_by_class(class_id):
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute('''SELECT student_id, school_id, class_id, number, name, user_type, sum_point, have_point,
                            camp_id, theme_color, user_color, blacklist_point, created_at 
                     FROM students WHERE class_id = ? ORDER BY number''', (class_id,))
        students = []
        for row in c.fetchall():
            students.append({
                'id': row[0],
                'school_id': row[1],
                'class_id': row[2],
                'number': row[3],
                'name': row[4],
                'user_type': row[5],
                'sum_point': row[6],
                'have_point': row[7],
                'camp_id': row[8],
                'theme_color': row[9],
                'user_color': row[10],
                'blacklist_point': row[11],
                'created_at': row[12]
            })
        conn.close()
        
        return jsonify(students)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

app.register_blueprint(sticky_o)

# Message API endpoints
@app.route('/api/message', methods=['POST'])
def create_message():
    if not request.json:
        return jsonify({'error': 'リクエストボディが必要です'}), 400
    
    required_fields = ['student_id', 'message_content', 'camp_id', 'sticky_id']
    for field in required_fields:
        if field not in request.json:
            return jsonify({'error': f'{field}が必要です'}), 400
    
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        c.execute('''INSERT INTO message (student_id, message_content, camp_id, sticky_id, feedback_A, feedback_B, feedback_C) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)''',
                 (request.json['student_id'], 
                  request.json['message_content'],
                  request.json['camp_id'],
                  request.json['sticky_id'],
                  request.json.get('feedback_A', 0),
                  request.json.get('feedback_B', 0),
                  request.json.get('feedback_C', 0)))
        
        message_id = c.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'メッセージが作成されました',
            'message_id': message_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/message/sticky/<int:sticky_id>', methods=['GET'])
def get_messages_by_sticky(sticky_id):
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        c.execute('''SELECT m.message_id, m.student_id, m.message_content, m.camp_id, m.sticky_id, 
                            m.feedback_A, m.feedback_B, m.feedback_C, m.created_at, s.name
                     FROM message m
                     JOIN students s ON m.student_id = s.student_id
                     WHERE m.sticky_id = ? ORDER BY m.created_at ASC''', (sticky_id,))
        
        messages = []
        for row in c.fetchall():
            messages.append({
                'message_id': row[0],
                'student_id': row[1],
                'message_content': row[2],
                'camp_id': row[3],
                'sticky_id': row[4],
                'feedback_A': row[5],
                'feedback_B': row[6],
                'feedback_C': row[7],
                'created_at': row[8],
                'student_name': row[9]
            })
        
        conn.close()
        return jsonify(messages)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)

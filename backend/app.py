from flask import Flask, jsonify, request
import sqlite3
import json
from flask_cors import CORS # Flask-CORSをインポート
import os
from flask_socketio import SocketIO, emit # SocketIOをインポート

app = Flask(__name__)
CORS(app) # CORSをアプリケーション全体に適用

# SocketIOを初期化
socketio = SocketIO(app, cors_allowed_origins="*")

def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    
    # 外部キー制約を有効にする
    c.execute('PRAGMA foreign_keys = ON')
    
    # students tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS students(
        student_id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id TEXT NOT NULL,
        name TEXT,
        number TEXT NOT NULL,
        class_id TEXT NOT NULL,
        password TEXT NOT NULL,
        user_type TEXT NOT NULL CHECK(user_type IN ('student', 'teacher')),
        sum_point INTEGER DEFAULT 0,
        have_point INTEGER DEFAULT 0,
        camp_id INTEGER,
        theme_color TEXT,
        user_color TEXT,
        blacklist_point INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT (datetime('now', '+9 hours')),
        UNIQUE(school_id, class_id, number, user_type)
    )''')
    
    # sticky tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS sticky(
        sticky_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        sticky_content TEXT NOT NULL,
        sticky_color TEXT NOT NULL,
        x_axis INTEGER DEFAULT 0,
        y_axis INTEGER DEFAULT 0,
        display_index INTEGER DEFAULT 0,
        feedback_A INTEGER DEFAULT 0,
        feedback_B INTEGER DEFAULT 0,
        feedback_C INTEGER DEFAULT 0,
        ai_summary_content TEXT,
        ai_teammate_avg_prediction REAL DEFAULT 0,
        ai_enemy_avg_prediction REAL DEFAULT 0,
        ai_overall_avg_prediction REAL DEFAULT 0,
        teammate_avg_score REAL DEFAULT 0,
        enemy_avg_score REAL DEFAULT 0,
        overall_avg_score REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT (datetime('now', '+9 hours')),
        FOREIGN KEY (student_id) REFERENCES students(student_id)
        )''')
    
    # display_indexのマイグレーション
    try:
        c.execute('ALTER TABLE sticky ADD COLUMN display_index INTEGER DEFAULT 0')
        print("Added display_index column to sticky table")
    except sqlite3.OperationalError:
        # カラムが既に存在する場合はスキップする
        pass
    
    # message tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS message(
        message_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        message_content TEXT NOT NULL,
        camp_id INTEGER NOT NULL,
        sticky_id INTEGER NOT NULL,
        feedback_A INTEGER DEFAULT 0,
        feedback_B INTEGER DEFAULT 0,
        feedback_C INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT (datetime('now', '+9 hours')),
        FOREIGN KEY (student_id) REFERENCES students(student_id),
        FOREIGN KEY (sticky_id) REFERENCES sticky(sticky_id)
        )''')
    
    
    # colorsets tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS colorsets(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_number INTEGER NOT NULL,
        camp_type INTEGER NOT NULL,
        colors TEXT NOT NULL,
        UNIQUE(group_number, camp_type)
    )''')
    
    # teachers tableを作成
    # numberは教員番号
    c.execute('''CREATE TABLE IF NOT EXISTS teachers(
        teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        password TEXT NOT NULL,
        number TEXT NOT NULL,
        user_type TEXT NOT NULL CHECK(user_type IN ('student', 'teacher')),
        UNIQUE(school_id,class_id,number,user_type)
    )''')
    
    # reward tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS reward(
        reward_id INTEGER PRIMARY KEY AUTOINCREMENT,
        reward_content TEXT NOT NULL UNIQUE,
        need_point INTEGER NOT NULL,
        need_rank INTEGER NOT NULL,
        creater INTEGER NOT NULL,
        FOREIGN KEY(creater) REFERENCES teachers(teacher_id)
    )''')
    
    # holdReward tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS holdReward(
        hold_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        reward_id INTEGER NOT NULL,
        is_holding BOOLEAN NOT NULL,
        used_at TIMESTAMP NULL,
        FOREIGN KEY(student_id) REFERENCES students(id),
        FOREIGN KEY(reward_id) REFERENCES reward(reward_id)
    )''')
    
    # vote_history tableを作成 - 投票履歴を記録
    c.execute('''CREATE TABLE IF NOT EXISTS vote_history(
        vote_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        sticky_id INTEGER NOT NULL,
        feedback_type TEXT NOT NULL CHECK(feedback_type IN ('A', 'B', 'C')),
        created_at TIMESTAMP DEFAULT (datetime('now', '+9 hours')),
        updated_at TIMESTAMP DEFAULT (datetime('now', '+9 hours')),
        FOREIGN KEY (student_id) REFERENCES students(student_id),
        FOREIGN KEY (sticky_id) REFERENCES sticky(sticky_id),
        UNIQUE(student_id, sticky_id)
    )''')
    
    # colorsetsデータの挿入
    colorsets_data = [
        (1, 1, '["#8097f9", "#6273f2", "#343be4", "#373acb", "#2f33a4"]'),  # 1 陣営1
        (1, 2, '["#faeada", "#f5d2b3", "#eeb483", "#e68c51", "#df6624"]'),  # 1 陣営2
        (2, 1, '["#6c84ff", "#4959ff", "#2929ff", "#211ee4", "#1a1aaf"]'),  # 2 陣営1
        (2, 2, '["#faeccb", "#f4d893", "#eec05b", "#eaa935", "#e38d24"]'),  # 2 陣営2
        (3, 1, '["#8b7bff", "#6646ff", "#5321ff", "#450ff2", "#3a0ccd"]'),  # 3 陣営1
        (3, 2, '["#effc8c", "#ecfa4a", "#eef619", "#e6e50c", "#d0bf08"]'),  # 3 陣営2
        (4, 1, '["#c3b5fd", "#a58bfa", "#885df5", "#783bec", "#6325cd"]'),  # 4 陣営1
        (4, 2, '["#fbfbea", "#f4f6d1", "#e8eda9", "#d7e076", "#bfcd41"]'),  # 4 陣営2
        (5, 1, '["#c76bff", "#b333ff", "#a10cff", "#8d00f3", "#6e04b6"]'),  # 5 陣営1
        (5, 2, '["#ffc472", "#fea039", "#fc8313", "#ed6809", "#cd510a"]'),  # 5 陣営2
        (6, 1, '["#ead5ff", "#dab5fd", "#c485fb", "#ad57f5", "#9025e6"]'),  # 6 陣営1
        (6, 2, '["#fdf9e9", "#fbf2c6", "#f8e290", "#f4ca50", "#efb121"]'),  # 6 陣営2
        (7, 1, '["#fad3fb", "#f6b1f3", "#ef83e9", "#e253da", "#ba30b0"]'),  # 7 陣営1
        (7, 2, '["#f8fbea", "#eef6d1", "#dceda9", "#c3df77", "#a0c937"]'),  # 7 陣営2
        (8, 1, '["#f8d2e9", "#f4add7", "#ec7aba", "#e1539e", "#c12d74"]'),  # 8 陣営1
        (8, 2, '["#dffcdc", "#c0f7bb", "#8fee87", "#56dd4b", "#2cb721"]'),  # 8 陣営2
        (9, 1, '["#f6d4e5", "#efb2cf", "#e482ae", "#d85c91", "#c43a6e"]'),  # 9 陣営1
        (9, 2, '["#cef9ef", "#9cf3e1", "#62e6cf", "#32cfb9", "#1bbfab"]'),  # 9 陣営2
        (10, 1, '["#fcd4cc", "#f9b5a8", "#f48975", "#e9634a", "#d74b31"]'), # 10 陣営1
        (10, 2, '["#cef9f0", "#9df2e0", "#64e4cf", "#35ccb8", "#1ec0ad"]'), # 10 陣営2
    ]
    
    # データが存在しない場合は挿入
    for group_num, camp_type, colors in colorsets_data:
        c.execute('INSERT OR IGNORE INTO colorsets (group_number, camp_type, colors) VALUES (?, ?, ?)',
                 (group_num, camp_type, colors))
    
    conn.commit()
    conn.close()
    

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

@app.route('/api/signup', methods=['POST'])
def signup():
    if not request.json:
        return jsonify({'error': 'リクエストボディが必要です'}), 400
    
    if request.json['userType'] == "student":
        #生徒の登録
        required_fields = ['schoolID', 'classID', 'userId', 'password', 'userType']
        for field in required_fields:
            if field not in request.json:
                return jsonify({'error': f'{field}が必要です'}), 400
        
        school_id = request.json['schoolID']
        class_id = request.json['classID']
        number = request.json['userId']  # フロントエンドの userId は番号に対応する (出席番号)
        password = request.json['password']
        user_type = request.json['userType']
        name = request.json.get('name', '')  # オプションの名前フィールド
        
        if user_type not in ['student', 'teacher']:
            return jsonify({'error': '無効なユーザータイプです'}), 400
        
        try:
            conn = sqlite3.connect('database.db')
            c = conn.cursor()
            
            # ユーザーがすでに存在するか確認
            c.execute('SELECT student_id FROM students WHERE school_id = ? AND class_id = ? AND number = ? AND user_type = ?',
                     (school_id, class_id, number, user_type))
            existing_user = c.fetchone()
            
            if existing_user:
                conn.close()
                return jsonify({'error': 'ユーザーがすでに存在します'}), 409
            
            # 新しいユーザーを挿入
            c.execute('''INSERT INTO students (school_id, class_id, number, password, user_type, name) 
                         VALUES (?, ?, ?, ?, ?, ?)''',
                     (school_id, class_id, number, password, user_type, name))
            
            user_id_db = c.lastrowid
            conn.commit()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'message': 'ユーザーが作成されました',
                'user_id': user_id_db
            }), 201
            
        except sqlite3.IntegrityError as e:
            return jsonify({'error': 'ユーザーがすでに存在します'}), 409
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        #教師の登録
        required_fields = ['schoolID', 'classID', 'userId', 'password', 'userType']
        for field in required_fields:
            if field not in request.json:
                return jsonify({'error': f'{field}が必要です'}), 400
        
        school_id = request.json['schoolID']
        class_id = request.json['classID']
        number = request.json['userId']  # フロントエンドの userId は番号に対応する (出席番号)
        password = request.json['password']
        user_type = request.json['userType']
        
        if user_type not in ['student', 'teacher']:
            return jsonify({'error': '無効なユーザータイプです'}), 400
        
        try:
            conn = sqlite3.connect('database.db')
            c = conn.cursor()
            
            # ユーザーがすでに存在するか確認
            c.execute('SELECT teacher_id FROM teachers WHERE school_id = ? AND class_id = ? AND number = ? AND user_type = ?',
                     (school_id, class_id, number, user_type))
            existing_user = c.fetchone()
            
            if existing_user:
                conn.close()
                return jsonify({'error': 'ユーザーがすでに存在します'}), 409
            
            # 新しいユーザーを挿入
            c.execute('''INSERT INTO teachers (school_id, class_id, number, password, user_type) 
                         VALUES (?, ?, ?, ?, ?)''',
                     (school_id, class_id, number, password, user_type))
            
            user_id_db = c.lastrowid
            conn.commit()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'message': 'ユーザーが作成されました',
                'user_id': user_id_db
            }), 201
            
        except sqlite3.IntegrityError as e:
            return jsonify({'error': 'ユーザーがすでに存在します'}), 409
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    if not request.json:
        return jsonify({'error': 'リクエストボディが必要です'}), 400
        
    if request.json['userType'] == "student":
        required_fields = ['schoolID', 'classID', 'userId', 'password', 'userType']
        for field in required_fields:
            if field not in request.json:
                return jsonify({'error': f'{field}が必要です'}), 400

        school_id = request.json['schoolID']
        class_id = request.json['classID']
        number = request.json['userId']  # フロントエンドの userId は番号に対応する (出席番号)
        password = request.json['password']
        user_type = request.json['userType']

        try:
            conn = sqlite3.connect('database.db')
            c = conn.cursor()

            # ユーザーを調べる
            c.execute('''SELECT student_id, school_id, class_id, number, name, user_type, sum_point, have_point, 
                                camp_id, theme_color, user_color, blacklist_point, created_at 
                         FROM students 
                         WHERE school_id = ? AND class_id = ? AND number = ? AND password = ? AND user_type = ?''',
                     (school_id, class_id, number, password, user_type))
            user = c.fetchone()
            conn.close()

            if user:
                return jsonify({
                    'status': 'success',
                    'message': 'Login successful',
                    'user': {
                        'id': user[0],
                        'school_id': user[1],
                        'class_id': user[2],
                        'number': user[3],
                        'name': user[4],
                        'user_type': user[5],
                        'sum_point': user[6],
                        'have_point': user[7],
                        'camp_id': user[8],
                        'theme_color': user[9],
                        'user_color': user[10],
                        'blacklist_point': user[11],
                        'created_at': user[12]
                    }
                }), 200
            else:
                return jsonify({'error': '無効な認証情報'}), 401

        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        required_fields = ['schoolID', 'classID', 'userId', 'password', 'userType']
        for field in required_fields:
            if field not in request.json:
                return jsonify({'error': f'{field}が必要です'}), 400

        school_id = request.json['schoolID']
        class_id = request.json['classID']
        number = request.json['userId']  # フロントエンドの userId は番号に対応する (出席番号)
        password = request.json['password']
        user_type = request.json['userType']

        try:
            conn = sqlite3.connect('database.db')
            c = conn.cursor()

            # ユーザーを調べる
            c.execute('''SELECT teacher_id, school_id, class_id, number, user_type 
                         FROM teachers 
                         WHERE school_id = ? AND class_id = ? AND number = ? AND password = ? AND user_type = ?''',
                     (school_id, class_id, number, password, user_type))
            user = c.fetchone()
            conn.close()

            if user:
                return jsonify({
                    'status': 'success',
                    'message': 'Login successful',
                    'user': {
                        'id': user[0],
                        'school_id': user[1],
                        'class_id': user[2],
                        'number': user[3],
                        'user_type': user[4],
                    }
                }), 200
            else:
                return jsonify({'error': '無効な認証情報'}), 401

        except Exception as e:
            return jsonify({'error': str(e)}), 500
        

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
                                s.overall_avg_score, s.created_at, st.name, st.camp_id
                         FROM sticky s
                         JOIN students st ON s.student_id = st.student_id
                         WHERE s.student_id = ? ORDER BY s.display_index, s.created_at DESC''', (student_id,))
        elif school_id:
            # 同校の全学生の付箋を取得
            c.execute('''SELECT s.sticky_id, s.student_id, s.sticky_content, s.sticky_color, s.x_axis, s.y_axis, s.display_index,
                                s.feedback_A, s.feedback_B, s.feedback_C, s.ai_summary_content, s.ai_teammate_avg_prediction,
                                s.ai_enemy_avg_prediction, s.ai_overall_avg_prediction, s.teammate_avg_score, s.enemy_avg_score,
                                s.overall_avg_score, s.created_at, st.name, st.camp_id
                         FROM sticky s
                         JOIN students st ON s.student_id = st.student_id
                         WHERE st.school_id = ? ORDER BY s.display_index, s.created_at DESC''', (school_id,))
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

@app.route('/api/sticky/<int:sticky_id>/feedback', methods=['POST'])
def vote_feedback(sticky_id):
    """付箋にフィードバック投票を追加または変更"""
    if not request.json:
        return jsonify({'error': 'リクエストボディが必要です'}), 400
    
    required_fields = ['student_id', 'feedback_type']
    for field in required_fields:
        if field not in request.json:
            return jsonify({'error': f'{field}が必要です'}), 400
    
    feedback_type = request.json['feedback_type']
    student_id = request.json['student_id']
    
    if feedback_type not in ['A', 'B', 'C']:
        return jsonify({'error': '無効なフィードバックタイプです'}), 400
    
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        # 付箋の存在確認と所有者チェック
        c.execute('''SELECT student_id, feedback_A, feedback_B, feedback_C FROM sticky WHERE sticky_id = ?''', (sticky_id,))
        sticky_data = c.fetchone()
        
        if not sticky_data:
            conn.close()
            return jsonify({'error': '付箋が見つかりません'}), 404
        
        # 自分の付箋には投票できない
        if sticky_data[0] == student_id:
            conn.close()
            return jsonify({'error': '自分の付箋には投票できません'}), 403
        
        # 既存の投票履歴をチェック
        c.execute('''SELECT feedback_type FROM vote_history WHERE student_id = ? AND sticky_id = ?''', (student_id, sticky_id))
        existing_vote = c.fetchone()
        
        # 現在のフィードバック数を取得
        current_feedback_A = sticky_data[1]
        current_feedback_B = sticky_data[2]
        current_feedback_C = sticky_data[3]
        
        if existing_vote:
            # 既存の投票がある場合、古い投票を削除して新しい投票を追加
            old_feedback_type = existing_vote[0]
            
            # 同じ投票タイプの場合は何もしない
            if old_feedback_type == feedback_type:
                conn.close()
                return jsonify({
                    'status': 'success',
                    'message': '既に同じフィードバックに投票済みです',
                    'feedback_counts': {
                        'feedback_A': current_feedback_A,
                        'feedback_B': current_feedback_B,
                        'feedback_C': current_feedback_C
                    }
                })
            
            # 古い投票の数を減らす
            if old_feedback_type == 'A':
                current_feedback_A = max(0, current_feedback_A - 1)
            elif old_feedback_type == 'B':
                current_feedback_B = max(0, current_feedback_B - 1)
            elif old_feedback_type == 'C':
                current_feedback_C = max(0, current_feedback_C - 1)
            
            # 投票履歴を更新
            c.execute('''UPDATE vote_history SET feedback_type = ?, updated_at = datetime('now', '+9 hours') 
                         WHERE student_id = ? AND sticky_id = ?''', (feedback_type, student_id, sticky_id))
            
            action_message = 'フィードバックが変更されました'
        else:
            # 新しい投票を記録
            c.execute('''INSERT INTO vote_history (student_id, sticky_id, feedback_type) 
                         VALUES (?, ?, ?)''', (student_id, sticky_id, feedback_type))
            
            action_message = 'フィードバックが投票されました'
        
        # 新しい投票の数を増やす
        if feedback_type == 'A':
            current_feedback_A += 1
        elif feedback_type == 'B':
            current_feedback_B += 1
        elif feedback_type == 'C':
            current_feedback_C += 1
        
        # 付箋のフィードバック数を更新
        c.execute('''UPDATE sticky SET feedback_A = ?, feedback_B = ?, feedback_C = ? WHERE sticky_id = ?''', 
                  (current_feedback_A, current_feedback_B, current_feedback_C, sticky_id))
        
        conn.commit()
        
        # 更新後の付箋情報を取得してSocketで送信
        c.execute('''SELECT s.sticky_id, s.student_id, s.sticky_content, s.sticky_color, s.x_axis, s.y_axis, s.display_index,
                            s.feedback_A, s.feedback_B, s.feedback_C, s.ai_summary_content, s.ai_teammate_avg_prediction,
                            s.ai_enemy_avg_prediction, s.ai_overall_avg_prediction, s.teammate_avg_score, s.enemy_avg_score,
                            s.overall_avg_score, s.created_at, st.name, st.school_id
                     FROM sticky s
                     JOIN students st ON s.student_id = st.student_id
                     WHERE s.sticky_id = ?''', (sticky_id,))
        
        updated_sticky_data = c.fetchone()
        conn.close()
        
        if updated_sticky_data:
            # 更新された付箋のデータを全クライアントに送信
            sticky_info = {
                'sticky_id': updated_sticky_data[0],
                'student_id': updated_sticky_data[1],
                'sticky_content': updated_sticky_data[2],
                'sticky_color': updated_sticky_data[3],
                'x_axis': updated_sticky_data[4],
                'y_axis': updated_sticky_data[5],
                'display_index': updated_sticky_data[6],
                'feedback_A': updated_sticky_data[7],
                'feedback_B': updated_sticky_data[8],
                'feedback_C': updated_sticky_data[9],
                'ai_summary_content': updated_sticky_data[10],
                'ai_teammate_avg_prediction': updated_sticky_data[11],
                'ai_enemy_avg_prediction': updated_sticky_data[12],
                'ai_overall_avg_prediction': updated_sticky_data[13],
                'teammate_avg_score': updated_sticky_data[14],
                'enemy_avg_score': updated_sticky_data[15],
                'overall_avg_score': updated_sticky_data[16],
                'created_at': updated_sticky_data[17],
                'student_name': updated_sticky_data[18],
                'school_id': updated_sticky_data[19]
            }
            
            # 同校の全ユーザーに更新された付箋を送信
            socketio.emit('sticky_updated', sticky_info, to=f"school_{updated_sticky_data[19]}")
            
            # 特別にfeedback更新通知も送信
            socketio.emit('feedback_updated', {
                'sticky_id': sticky_id,
                'feedback_A': updated_sticky_data[7],
                'feedback_B': updated_sticky_data[8],
                'feedback_C': updated_sticky_data[9]
            }, to=f"school_{updated_sticky_data[19]}")
        
        return jsonify({
            'status': 'success',
            'message': action_message,
            'feedback_counts': {
                'feedback_A': current_feedback_A,
                'feedback_B': current_feedback_B,
                'feedback_C': current_feedback_C
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sticky/<int:sticky_id>/vote-status/<int:student_id>', methods=['GET'])
def get_vote_status(sticky_id, student_id):
    """特定生徒に対して付箋に書かれた生徒の投票状況を取得する"""
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        # 付箋が存在するか確認
        c.execute('''SELECT student_id FROM sticky WHERE sticky_id = ?''', (sticky_id,))
        sticky_data = c.fetchone()
        
        if not sticky_data:
            conn.close()
            return jsonify({'error': '付箋が見つかりません'}), 404
        
        # 投票状況を取得
        c.execute('''SELECT feedback_type FROM vote_history WHERE student_id = ? AND sticky_id = ?''', (student_id, sticky_id))
        vote_data = c.fetchone()
        
        conn.close()
        
        if vote_data:
            return jsonify({
                'status': 'success',
                'voted': True,
                'vote_type': vote_data[0],
                'can_vote': sticky_data[0] != student_id  # 自分の付箋には投票できない
            })
        else:
            return jsonify({
                'status': 'success',
                'voted': False,
                'vote_type': None,
                'can_vote': sticky_data[0] != student_id  # 自分の付箋には投票できない
            })
        
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
        
        # 作成されたメッセージの完全な情報を取得
        c.execute('''SELECT m.message_id, m.student_id, m.message_content, m.camp_id, m.sticky_id, 
                            m.feedback_A, m.feedback_B, m.feedback_C, m.created_at, s.name, s.number
                     FROM message m
                     JOIN students s ON m.student_id = s.student_id
                     WHERE m.message_id = ?''', (message_id,))
        
        message_data = c.fetchone()
        conn.commit()
        conn.close()
        
        if message_data:
            # 新しいメッセージのデータを同じ付箋チャットの全クライアントに送信
            message_info = {
                'message_id': message_data[0],
                'student_id': message_data[1],
                'message_content': message_data[2],
                'camp_id': message_data[3],
                'sticky_id': message_data[4],
                'feedback_A': message_data[5],
                'feedback_B': message_data[6],
                'feedback_C': message_data[7],
                'created_at': message_data[8],
                'student_name': message_data[9],
                'student_number': message_data[10]
            }
            
            # 同じ付箋チャットの全ユーザーに新しいメッセージを送信
            sticky_room = f"sticky_{request.json['sticky_id']}"
            print(f"DEBUG: Sending message_sent event to room: {sticky_room}")
            socketio.emit('message_sent', message_info, to=sticky_room)
        
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

# Socket.IO イベントハンドラー
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
    
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        # メッセージをデータベースに保存
        c.execute('''INSERT INTO message (student_id, message_content, camp_id, sticky_id, feedback_A, feedback_B, feedback_C) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)''',
                 (data['student_id'], 
                  data['message_content'],
                  data['camp_id'],
                  data['sticky_id'],
                  data.get('feedback_A', 0),
                  data.get('feedback_B', 0),
                  data.get('feedback_C', 0)))
        
        message_id = c.lastrowid
        
        # 作成されたメッセージの完全な情報を取得
        c.execute('''SELECT m.message_id, m.student_id, m.message_content, m.camp_id, m.sticky_id, 
                            m.feedback_A, m.feedback_B, m.feedback_C, m.created_at, s.name, s.number
                     FROM message m
                     JOIN students s ON m.student_id = s.student_id
                     WHERE m.message_id = ?''', (message_id,))
        
        message_data = c.fetchone()
        conn.commit()
        conn.close()
        
        if message_data:
            # メッセージデータの構築
            message_info = {
                'message_id': message_data[0],
                'student_id': message_data[1],
                'message_content': message_data[2],
                'camp_id': message_data[3],
                'sticky_id': message_data[4],
                'feedback_A': message_data[5],
                'feedback_B': message_data[6],
                'feedback_C': message_data[7],
                'created_at': message_data[8],
                'student_name': message_data[9],
                'student_number': message_data[10]
            }
            
            # 同じ付箋チャットの全ユーザーに新しいメッセージを送信
            sticky_room = f"sticky_{data['sticky_id']}"
            print(f"DEBUG: Broadcasting message to room: {sticky_room}")
            socketio.emit('message_sent', message_info, to=sticky_room)
            
    except Exception as e:
        print(f"DEBUG: Error sending message: {str(e)}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)


# # データベース接続関数を追加
# def get_db_connection():
#     """データベース接続を取得"""
#     print("🗄️ データベース接続関数呼び出し")
    
#     # データベースファイルのパスを設定
#     db_path = 'database.db'  # 実際のデータベースファイル名に変更してください
    
#     if not os.path.exists(db_path):
#         print(f"❌ データベースファイルが見つかりません: {db_path}")
#         raise FileNotFoundError(f"データベースファイルが見つかりません: {db_path}")
    
#     try:
#         conn = sqlite3.connect(db_path)
#         print("✅ データベース接続成功")
#         return conn
#     except sqlite3.Error as e:
#         print(f"❌ データベース接続エラー: {e}")
#         raise

# # 基本的なヘルスチェック用エンドポイント
# @app.route('/health', methods=['GET'])
# def health_check():
#     print("💗 ヘルスチェック呼び出し")
#     return jsonify({'status': 'ok', 'message': 'サーバーは正常に動作しています'}), 200

# # 報酬を追加するAPI
# @app.route('/api/rewards', methods=['POST', 'OPTIONS'])
# def add_reward():
#     print(f"📨 リクエスト受信 - メソッド: {request.method}")
#     print(f"📨 リクエスト元IP: {request.remote_addr}")
#     print(f"📨 リクエストヘッダー: {dict(request.headers)}")
    
#     # OPTIONSリクエストへの対応
#     if request.method == 'OPTIONS':
#         print("🔄 OPTIONSリクエスト処理中...")
#         response = jsonify({'status': 'ok'})
#         response.headers.add('Access-Control-Allow-Origin', '*')
#         response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
#         response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
#         print("✅ OPTIONSレスポンス送信完了")
#         return response, 200
    
#     print("📦 POSTリクエスト処理開始")
    
#     try:
#         # リクエストからJSONデータを取得
#         print("📋 JSONデータ取得試行...")
#         print(f"📋 Content-Type: {request.content_type}")
#         print(f"📋 Raw data: {request.data}")
        
#         # Content-Typeが設定されていない場合でもJSONとして扱う
#         if request.content_type == 'application/json':
#             data = request.get_json()
#         else:
#             # Content-Typeがない場合、手動でJSONパース
#             try:
#                 import json
#                 data = json.loads(request.data.decode('utf-8'))
#             except (json.JSONDecodeError, UnicodeDecodeError) as e:
#                 print(f"❌ JSONパースエラー: {e}")
#                 return jsonify({'error': 'JSONデータの解析に失敗しました'}), 400
        
#         print(f"📋 受信データ: {data}")
        
#         # 必要なフィールドが存在するかチェック
#         if not data:
#             print("❌ データが送信されませんでした")
#             return jsonify({'error': 'データが送信されませんでした'}), 400
        
#         print("✅ データ存在確認完了")
        
#         required_fields = ['reward_content', 'need_point', 'need_rank', 'creater']
#         for field in required_fields:
#             if field not in data:
#                 print(f"❌ 必須フィールド不足: {field}")
#                 return jsonify({'error': f'{field}が不足しています'}), 400
        
#         print("✅ 必須フィールドチェック完了")
        
#         # データの型チェック
#         if not isinstance(data['need_point'], int) or data['need_point'] <= 0:
#             print(f"❌ need_pointの型エラー: {data['need_point']} (type: {type(data['need_point'])})")
#             return jsonify({'error': '必要ポイントは正の整数である必要があります'}), 400
        
#         if not isinstance(data['need_rank'], int) or data['need_rank'] < 0:
#             print(f"❌ need_rankの型エラー: {data['need_rank']} (type: {type(data['need_rank'])})")
#             return jsonify({'error': '必要ランクは0以上の整数である必要があります'}), 400
        
#         if not data['reward_content'].strip():
#             print("❌ reward_contentが空")
#             return jsonify({'error': '報酬の内容を入力してください'}), 400
        
#         print("✅ データ型チェック完了")
        
#         # データベースに挿入
#         print("🗄️ データベース接続試行...")
#         conn = get_db_connection()
#         cursor = conn.cursor()
#         print("✅ データベース接続成功")
        
#         try:
#             print("💾 データベースINSERT実行...")
#             cursor.execute('''
#                 INSERT INTO reward (reward_content, need_point, need_rank, creater)
#                 VALUES (?, ?, ?, ?)
#             ''', (
#                 data['reward_content'].strip(),
#                 data['need_point'],
#                 data['need_rank'],
#                 data['creater']
#             ))
            
#             conn.commit()
#             reward_id = cursor.lastrowid
#             print(f"✅ データベースINSERT成功 - ID: {reward_id}")
            
#             # 成功レスポンス
#             response_data = {
#                 'message': '報酬が正常に追加されました',
#                 'reward_id': reward_id,
#                 'data': {
#                     'reward_content': data['reward_content'].strip(),
#                     'need_point': data['need_point'],
#                     'need_rank': data['need_rank'],
#                     'creater': data['creater']
#                 }
#             }
#             print(f"📤 成功レスポンス送信: {response_data}")
#             return jsonify(response_data), 201
            
#         except sqlite3.IntegrityError as e:
#             print(f"❌ データベース整合性エラー: {str(e)}")
#             # 重複エラー（UNIQUE制約違反）
#             if 'UNIQUE constraint failed' in str(e):
#                 return jsonify({'error': 'この報酬は既に存在します'}), 409
#             else:
#                 return jsonify({'error': 'データベースエラーが発生しました'}), 500
        
#         finally:
#             conn.close()
#             print("🗄️ データベース接続終了")
    
#     except Exception as e:
#         print(f"🚨 予期しないエラー発生: {str(e)}")
#         print(f"🚨 エラータイプ: {type(e)}")
#         import traceback
#         print(f"🚨 スタックトレース: {traceback.format_exc()}")
#         return jsonify({'error': 'サーバーエラーが発生しました'}), 500
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)

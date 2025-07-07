from flask import Flask, jsonify, request
import sqlite3
import json
from flask_cors import CORS # Flask-CORSをインポート

app = Flask(__name__)
CORS(app) # CORSをアプリケーション全体に適用

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(school_id, class_id, number, user_type)
    )''')
    
    # teachers tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS teachers(
        teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name CHAR(50) NOT NULL,
        class_number CHAR(5) NOT NULL,
        UNIQUE(name,class_number)
    )''')
    
    # sticky tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS sticky(
        sticky_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        sticky_content TEXT NOT NULL,
        sticky_color TEXT NOT NULL,
        x_axis INTEGER DEFAULT 0,
        y_axis INTEGER DEFAULT 0,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id)
        )''')
    
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    c.execute('''CREATE TABLE IF NOT EXISTS teachers(
        teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id TEXT NOT NULL,
        name CHAR(50) NOT NULL,
        class_number CHAR(5) NOT NULL,
        password TEXT NOT NULL,
        UNIQUE(school_id,name,class_number)
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
    
    # post tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS post(
        post_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        ai_summary TEXT NOT NULL,
        sum_evaluation_a INTEGER,
        sum_evaluation_b INTEGER,
        sum_evaluation_c INTEGER,
        stickynote_color TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        x_coordinate INTEGER,
        y_coordinate INTEGER,
        ally_ai_evaluation INTEGER,
        enemy_ai_evaluation INTEGER,
        whole_ai_evaluation INTEGER,
        ally_evaluation INTEGER,
        enemy_evaluation INTEGER,
        whole_evaluation INTEGER,
        FOREIGN KEY(student_id) REFERENCES students(id),
        UNIQUE(student_id,text)
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

@app.route('/api/login', methods=['POST'])
def login():
    if not request.json:
        return jsonify({'error': 'リクエストボディが必要です'}), 400
    
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
    
    # 調試信息：檢查接收到的數據
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
        
        # 付箋插入
        c.execute('''INSERT INTO sticky (student_id, sticky_content, sticky_color, x_axis, y_axis, feedback_A, feedback_B, feedback_C,
                                         ai_summary_content, ai_teammate_avg_prediction, ai_enemy_avg_prediction, ai_overall_avg_prediction,
                                         teammate_avg_score, enemy_avg_score, overall_avg_score) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                 (request.json['student_id'], 
                  request.json['sticky_content'],
                  request.json['sticky_color'],
                  request.json.get('x_axis', 0),
                  request.json.get('y_axis', 0),
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
        conn.commit()
        conn.close()
        
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
        
        # 付箋取得
        if student_id:
            c.execute('''SELECT sticky_id, student_id, sticky_content, sticky_color, x_axis, y_axis, 
                                feedback_A, feedback_B, feedback_C, ai_summary_content, ai_teammate_avg_prediction,
                                ai_enemy_avg_prediction, ai_overall_avg_prediction, teammate_avg_score, enemy_avg_score,
                                overall_avg_score, created_at 
                         FROM sticky WHERE student_id = ? ORDER BY created_at DESC''', (student_id,))
        else:
            c.execute('''SELECT sticky_id, student_id, sticky_content, sticky_color, x_axis, y_axis, 
                                feedback_A, feedback_B, feedback_C, ai_summary_content, ai_teammate_avg_prediction,
                                ai_enemy_avg_prediction, ai_overall_avg_prediction, teammate_avg_score, enemy_avg_score,
                                overall_avg_score, created_at 
                         FROM sticky ORDER BY created_at DESC''')
        
        sticky_notes = []
        for row in c.fetchall():
            sticky_notes.append({
                'sticky_id': row[0],
                'student_id': row[1],
                'sticky_content': row[2],
                'sticky_color': row[3],
                'x_axis': row[4],
                'y_axis': row[5],
                'feedback_A': row[6],
                'feedback_B': row[7],
                'feedback_C': row[8],
                'ai_summary_content': row[9],
                'ai_teammate_avg_prediction': row[10],
                'ai_enemy_avg_prediction': row[11],
                'ai_overall_avg_prediction': row[12],
                'teammate_avg_score': row[13],
                'enemy_avg_score': row[14],
                'overall_avg_score': row[15],
                'created_at': row[16]
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
        
        allowed_fields = ['sticky_content', 'sticky_color', 'x_axis', 'y_axis', 'feedback_A', 'feedback_B', 'feedback_C',
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
            
        conn.close()
        return jsonify({'status': 'success', 'message': '付箋が更新されました'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sticky/<int:sticky_id>', methods=['DELETE'])
def delete_sticky(sticky_id):
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        c.execute('DELETE FROM sticky WHERE sticky_id = ?', (sticky_id,))
        conn.commit()
        
        if c.rowcount == 0:
            conn.close()
            return jsonify({'error': '付箋が見つかりません'}), 404
            
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

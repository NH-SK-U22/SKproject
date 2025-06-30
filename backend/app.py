from flask import Flask, jsonify, request
import sqlite3
import json
from flask_cors import CORS # Flask-CORSをインポート

app = Flask(__name__)
CORS(app) # CORSをアプリケーション全体に適用

def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    
    # students tableを作成（図片の内容に基づく）
    c.execute('''CREATE TABLE IF NOT EXISTS students(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    
    # colorsets tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS colorsets(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_number INTEGER NOT NULL,
        camp_type INTEGER NOT NULL,
        colors TEXT NOT NULL,
        UNIQUE(group_number, camp_type)
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
        return jsonify({'error': 'Request body is required'}), 400
    
    required_fields = ['schoolID', 'classID', 'userId', 'password', 'userType']
    for field in required_fields:
        if field not in request.json:
            return jsonify({'error': f'{field} is required'}), 400
    
    school_id = request.json['schoolID']
    class_id = request.json['classID']
    number = request.json['userId']  # userId in frontend corresponds to number (出席番号)
    password = request.json['password']
    user_type = request.json['userType']
    name = request.json.get('name', '')  # Optional name field
    
    if user_type not in ['student', 'teacher']:
        return jsonify({'error': 'Invalid user type'}), 400
    
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        # ユーザーがすでに存在するか確認
        c.execute('SELECT id FROM students WHERE school_id = ? AND class_id = ? AND number = ? AND user_type = ?',
                 (school_id, class_id, number, user_type))
        existing_user = c.fetchone()
        
        if existing_user:
            conn.close()
            return jsonify({'error': 'User already exists'}), 409
        
        # 新しいユーザーを挿入
        c.execute('''INSERT INTO students (school_id, class_id, number, password, user_type, name) 
                     VALUES (?, ?, ?, ?, ?, ?)''',
                 (school_id, class_id, number, password, user_type, name))
        
        user_id_db = c.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'User created successfully',
            'user_id': user_id_db
        }), 201
        
    except sqlite3.IntegrityError as e:
        return jsonify({'error': 'User already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    if not request.json:
        return jsonify({'error': 'Request body is required'}), 400
    
    required_fields = ['schoolID', 'classID', 'userId', 'password', 'userType']
    for field in required_fields:
        if field not in request.json:
            return jsonify({'error': f'{field} is required'}), 400
    
    school_id = request.json['schoolID']
    class_id = request.json['classID']
    number = request.json['userId']  # userId in frontend corresponds to number (出席番号)
    password = request.json['password']
    user_type = request.json['userType']
    
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        # ユーザーを調べる
        c.execute('''SELECT id, school_id, class_id, number, name, user_type, sum_point, have_point, 
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
        c.execute('''SELECT id, school_id, class_id, number, name, user_type, sum_point, have_point,
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
        return jsonify({'error': 'Request body is required'}), 400
    
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
            return jsonify({'error': 'No valid fields to update'}), 400
        
        values.append(student_id)
        query = f"UPDATE students SET {', '.join(update_fields)} WHERE id = ?"
        
        c.execute(query, values)
        conn.commit()
        
        if c.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Student not found'}), 404
            
        conn.close()
        return jsonify({'status': 'success', 'message': 'Points updated successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/<int:student_id>/camp', methods=['PATCH'])
def update_student_camp(student_id):
    if not request.json:
        return jsonify({'error': 'Request body is required'}), 400
    
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
            return jsonify({'error': 'No valid fields to update'}), 400
        
        values.append(student_id)
        query = f"UPDATE students SET {', '.join(update_fields)} WHERE id = ?"
        
        c.execute(query, values)
        conn.commit()
        
        if c.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Student not found'}), 404
            
        conn.close()
        return jsonify({'status': 'success', 'message': 'Camp settings updated successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/class/<class_id>', methods=['GET'])
def get_students_by_class(class_id):
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute('''SELECT id, school_id, class_id, number, name, user_type, sum_point, have_point,
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

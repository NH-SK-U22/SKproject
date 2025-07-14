from flask import Flask, jsonify, request
import sqlite3
from flask_cors import CORS # Flask-CORSをインポート

app = Flask(__name__)
CORS(app) # CORSをアプリケーション全体に適用

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
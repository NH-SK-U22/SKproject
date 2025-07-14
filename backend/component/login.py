from flask import jsonify, request
import sqlite3
from flask import Blueprint

login_o = Blueprint('login_o', __name__, url_prefix='/api')

@login_o.route('/login', methods=['POST'])
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
        
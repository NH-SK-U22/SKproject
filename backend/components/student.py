from flask import jsonify, request
import sqlite3
from flask import Blueprint
from components.init import get_db_connection

student_o = Blueprint('student_o', __name__, url_prefix='/api')

@student_o.route('/students', methods=['GET'])
def get_students():
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute('''SELECT student_id, school_id, class_id, number, name, user_type, sum_point, have_point,
                            camp_id, theme_color, user_color, blacklist_point, created_at, ex_flag 
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
                'created_at': row[12],
                'ex_flag': row[13]
            })
        conn.close()
        
        return jsonify(students)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_o.route('/students/<int:student_id>', methods=['GET'])
def get_student(student_id):
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute('''SELECT student_id, school_id, class_id, number, name, user_type, sum_point, have_point,
                            camp_id, theme_color, user_color, blacklist_point, created_at, ex_flag 
                     FROM students WHERE student_id = ?''', (student_id,))
        student = c.fetchone()
        conn.close()
        
        if not student:
            return jsonify({'error': '生徒が見つかりません'}), 404
        
        return jsonify({
            'id': student[0],
            'school_id': student[1],
            'class_id': student[2],
            'number': student[3],
            'name': student[4],
            'user_type': student[5],
            'sum_point': student[6],
            'have_point': student[7],
            'camp_id': student[8],
            'theme_color': student[9],
            'user_color': student[10],
            'blacklist_point': student[11],
            'created_at': student[12],
            'ex_flag': student[13]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_o.route('/students/<int:student_id>/points', methods=['PATCH'])
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

@student_o.route('/students/<int:student_id>/camp', methods=['PATCH'])
def update_student_camp(student_id):
    if not request.json:
        return jsonify({'error': 'リクエストボディが必要です'}), 400
    
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        # 陣営IDを更新しようとしている場合は期間チェックを行う
        if 'camp_id' in request.json:
            # 学生の現在の情報を取得
            c.execute('SELECT student_id, camp_id, school_id FROM students WHERE student_id = ?', (student_id,))
            student = c.fetchone()
            if not student:
                conn.close()
                return jsonify({'error': '学生が見つかりません'}), 404
            
            current_camp_id = student[1]
            school_id = student[2]
            
            # 現在のテーマの終了日時をチェック
            c.execute('''
                SELECT end_date, theme_id FROM debate_settings 
                WHERE school_id = ? 
                ORDER BY theme_id DESC 
                LIMIT 1
            ''', (school_id,))
            theme_result = c.fetchone()
            
            if theme_result:
                end_date_str = theme_result[0]
                
                # 現在時刻と終了時刻を比較
                from datetime import datetime
                try:
                    # SQLiteの日時形式をパース
                    end_date = datetime.fromisoformat(end_date_str.replace('Z', ''))
                    current_date = datetime.now()
                    
                    # 既に陣営を選択済みで、まだ期間が終了していない場合は変更を禁止
                    if current_camp_id is not None and current_date < end_date:
                        conn.close()
                        return jsonify({'error': '討論期間中は陣営を変更できません'}), 400
                        
                except ValueError:
                    # 日時パースエラーの場合は継続
                    pass
        
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
        
        if 'ai_advice' in request.json:
            update_fields.append('ai_advice = ?')
            values.append(request.json['ai_advice'])
            
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


@student_o.route('/students/<int:student_id>/ex_flag', methods=['PATCH'])
def update_student_ex_flag(student_id):
    if not request.json:
        return jsonify({'error': 'リクエストボディが必要です'}), 400
    
    if 'ex_flag' not in request.json:
        return jsonify({'error': 'ex_flag が必要です'}), 400
    
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute('UPDATE students SET ex_flag = ? WHERE student_id = ?', (request.json['ex_flag'], student_id))
        conn.commit()
        affected = c.rowcount
        conn.close()
        if affected == 0:
            return jsonify({'error': '学生が見つかりません'}), 404
        return jsonify({'status': 'success', 'message': 'ex_flag を更新しました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_o.route('/students/class/<class_id>', methods=['GET'])
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

@student_o.route('/notifications/<int:teacher_id>', methods=['GET'])
def get_notifications(teacher_id):
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute('''
            SELECT notification_id, student_id, reward_id, notification_content, is_read, saved_time
            FROM notification 
            WHERE teacher_id = ? 
            ORDER BY saved_time DESC
        ''', (teacher_id,))
        
        notifications = []
        for row in c.fetchall():
            notifications.append({
                'notification_id': row[0],
                'student_id': row[1],
                'reward_id': row[2],
                'notification_content': row[3],
                'is_read': bool(row[4]),
                'saved_time': row[5]
            })
        conn.close()
        
        return jsonify(notifications)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_o.route('/notifications/<int:notification_id>/read', methods=['PATCH'])
def mark_notification_read(notification_id):
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute('''
            UPDATE notification 
            SET is_read = 1 
            WHERE notification_id = ?
        ''', (notification_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'marked as read'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_o.route('/studentlist', methods=['GET'])
def get_studentlist():
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        # 必要なカラムのみ取得（class, number, name, rank）
        c.execute('''SELECT class, number, name, rank FROM students ORDER BY created_at DESC''')
        students = []
        for row in c.fetchall():
            students.append({
                'class': row[0],   # 〇年〇組（全角のまま）
                'number': row[1],  # 〇番（全角のまま）
                'name': row[2],
                'rank': row[3]     # 画像名（diamond, 1st, 2nd, 3rd など）
            })
        conn.close()
        return jsonify(students)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
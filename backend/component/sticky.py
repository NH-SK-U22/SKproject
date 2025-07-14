from flask import Flask, jsonify, request
import sqlite3
from flask_socketio import SocketIO
from flask import Blueprint

sticky_o = Blueprint('sticky_o', __name__, url_prefix='/api')
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Sticky Notes API endpoints
@sticky_o.route('/sticky', methods=['POST'])
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

@sticky_o.route('/sticky', methods=['GET'])
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

@sticky_o.route('/sticky/<int:sticky_id>', methods=['PATCH'])
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

@sticky_o.route('/sticky/<int:sticky_id>', methods=['DELETE'])
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

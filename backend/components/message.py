from flask import jsonify, request
import sqlite3
from flask import Blueprint

message_o = Blueprint('message_o', __name__, url_prefix='/api')

# Message API endpoints
@message_o.route('/message', methods=['POST'])
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

@message_o.route('/message/sticky/<int:sticky_id>', methods=['GET'])
def get_messages_by_sticky(sticky_id):
    try:
        # クエリパラメータからschool_idとvoter_idを取得
        school_id = request.args.get('school_id')
        voter_id = request.args.get('voter_id')
        
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        # 投票情報も含めてメッセージを取得
        query = '''SELECT m.message_id, m.student_id, m.message_content, m.camp_id, m.sticky_id, 
                          m.feedback_A, m.feedback_B, m.feedback_C, m.created_at, s.name, s.number, s.user_color,
                          v.vote_type
                   FROM message m
                   JOIN students s ON m.student_id = s.student_id
                   LEFT JOIN sticky_room_votes v ON m.message_id = v.message_id 
                        AND v.school_id = ? AND v.voter_id = ?
                   WHERE m.sticky_id = ? ORDER BY m.created_at ASC'''
        
        c.execute(query, (school_id, voter_id, sticky_id))
        
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
                'student_name': row[9],
                'student_number': row[10],
                'user_color': row[11],
                'user_vote_type': row[12]  # ユーザーの投票タイプ
            })
        
        # メッセージ数を取得
        c.execute('SELECT COUNT(*) FROM message WHERE sticky_id = ?', (sticky_id,))
        message_count = c.fetchone()[0]
        
        conn.close()
        return jsonify({
            'messages': messages,
            'message_count': message_count
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

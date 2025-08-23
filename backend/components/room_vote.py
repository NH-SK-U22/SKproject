from flask import jsonify, request
import sqlite3
from flask import Blueprint

room_vote_o = Blueprint('room_vote_o', __name__, url_prefix='/api')

@room_vote_o.route('/room-vote', methods=['POST'])
def submit_room_vote():
    if not request.json:
        return jsonify({'error': 'リクエストボディが必要です'}), 400
    
    required_fields = ['sticky_id', 'message_id', 'voter_id', 'school_id', 'vote_type']
    for field in required_fields:
        if field not in request.json:
            return jsonify({'error': f'{field}が必要です'}), 400
    
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        sticky_id = request.json['sticky_id']
        message_id = request.json['message_id']
        voter_id = request.json['voter_id']
        school_id = request.json['school_id']
        vote_type = request.json['vote_type']
        
        print(sticky_id, message_id, voter_id, school_id, vote_type)
        # 既存の投票をチェック
        c.execute('''SELECT room_vote_id FROM sticky_room_votes 
                     WHERE sticky_id = ? AND message_id = ? AND voter_id = ? AND school_id = ?''', 
                  (sticky_id, message_id, voter_id, school_id))
        
        existing_vote = c.fetchone()
        
        if existing_vote:
            # 既存の投票を更新
            c.execute('''UPDATE sticky_room_votes 
                         SET vote_type = ? 
                         WHERE sticky_id = ? AND message_id = ? AND voter_id = ? AND school_id = ?''',
                      (vote_type, sticky_id, message_id, voter_id, school_id))
        else:
            # 新しい投票を追加
            c.execute('''INSERT INTO sticky_room_votes 
                         (sticky_id, message_id, voter_id, school_id, vote_type) 
                         VALUES (?, ?, ?, ?, ?)''',
                      (sticky_id, message_id, voter_id, school_id, vote_type))
        
        conn.commit()
        
        # 投票集計を更新
        update_message_feedback_counts(sticky_id, message_id, school_id)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'message': '投票が完了しました'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def update_message_feedback_counts(sticky_id, message_id, school_id):
    """sticky_room_votesから投票数を集計してmessagesテーブルを更新"""
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        # sticky_room_votesから投票数を集計
        c.execute('''
            SELECT 
                vote_type,
                COUNT(*) as count
            FROM sticky_room_votes 
            WHERE sticky_id = ? AND message_id = ? AND school_id = ?
            GROUP BY vote_type
        ''', (sticky_id, message_id, school_id))
        
        vote_counts = c.fetchall()
        
        # 投票数を初期化
        feedback_A = 0
        feedback_B = 0
        feedback_C = 0
        
        # 集計結果を設定
        for vote_type, count in vote_counts:
            if vote_type == 'A':
                feedback_A = count
            elif vote_type == 'B':
                feedback_B = count
            elif vote_type == 'C':
                feedback_C = count
        
        # messagesテーブルを更新
        c.execute('''
            UPDATE message 
            SET feedback_A = ?, feedback_B = ?, feedback_C = ?
            WHERE message_id = ?
        ''', (feedback_A, feedback_B, feedback_C, message_id))
        
        conn.commit()
        conn.close()
        
        print(f"Updated message {message_id} feedback counts: A={feedback_A}, B={feedback_B}, C={feedback_C}")
        
    except Exception as e:
        print(f"Error updating message feedback counts: {e}")
        if conn:
            conn.close()

@room_vote_o.route('/room-vote/update-feedback', methods=['POST'])
def update_all_message_feedback():
    """全てのメッセージの投票集計を更新"""
    if not request.json:
        return jsonify({'error': 'リクエストボディが必要です'}), 400
    
    try:
        sticky_id = request.json.get('sticky_id')
        school_id = request.json.get('school_id')
        
        if not sticky_id or not school_id:
            return jsonify({'error': 'sticky_id と school_id が必要です'}), 400
        
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        # 指定されたsticky_idの全メッセージを取得
        c.execute('''
            SELECT message_id FROM message 
            WHERE sticky_id = ?
        ''', (sticky_id,))
        
        messages = c.fetchall()
        conn.close()
        
        updated_count = 0
        for (message_id,) in messages:
            try:
                update_message_feedback_counts(sticky_id, message_id, school_id)
                updated_count += 1
            except Exception as e:
                print(f"Error updating message {message_id}: {e}")
        
        return jsonify({
            'success': True,
            'message': f'{updated_count}件のメッセージの投票集計を更新しました'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
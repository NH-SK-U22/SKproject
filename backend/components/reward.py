from flask import jsonify, request
import sqlite3
from flask import Blueprint
from components.init import get_db_connection

reward_o = Blueprint('reward_o', __name__, url_prefix='/api')

# 報酬を追加するAPI
@reward_o.route('/rewards', methods=['POST', 'OPTIONS'])
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
        if not isinstance(data['need_point'], int) or data['need_point'] < 0:
            return jsonify({'error': '必要ポイントは0以上の整数である必要があります'}), 400
        
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
    
@reward_o.route('/rewards',methods=['GET'])
def get_rewards():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT reward_id,reward_content,need_point,need_rank,creater FROM reward')
        rewards = [
            {
                'reward_id': row[0],
                'reward_content': row[1],
                'need_point': row[2],
                'need_rank': row[3],
                'creater': row[4]
            }
            for row in cursor.fetchall()
        ]
        conn.close()
        return jsonify(rewards),200
    except Exception as e:
        return jsonify({'error':str(e)}),500

@reward_o.route('/rewards/<int:reward_id>', methods=['DELETE'])
def delete_reward(reward_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM reward WHERE reward_id = ?', (reward_id,))
        conn.commit()
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': '報酬が見つかりません'}), 404
        conn.close()
        return jsonify({'status': 'success', 'message': '報酬が削除されました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@reward_o.route('/rewards/<int:reward_id>', methods=['GET'])
def get_reward(reward_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT reward_id, reward_content, need_point, need_rank, creater FROM reward WHERE reward_id = ?', (reward_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({'error': '報酬が見つかりません'}), 404
    return jsonify({
        'reward_id': row[0],
        'reward_content': row[1],
        'need_point': row[2],
        'need_rank': row[3],
        'creater': row[4]
    }), 200
# 1) すべての保持報酬（または student_id で絞り込み）を取得
@reward_o.route('/holdRewards', methods=['GET'])
def list_hold_rewards():
    try:
        student_id = request.args.get('student_id', type=int)
        conn = get_db_connection()
        c = conn.cursor()
        if student_id is not None:
            c.execute('''
              SELECT hold_id, student_id, reward_id, is_holding, used_at
                FROM holdReward
               WHERE student_id = ?
            ''', (student_id,))
        else:
            c.execute('''
              SELECT hold_id, student_id, reward_id, is_holding, used_at
                FROM holdReward
            ''')
        rows = c.fetchall()
        conn.close()

        result = []
        for r in rows:
            result.append({
                'hold_id':    r[0],
                'student_id': r[1],
                'reward_id':  r[2],
                'is_holding': bool(r[3]),
                'used_at':    r[4]
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 2) 新しい保持報酬を作成
@reward_o.route('/holdRewards', methods=['POST'])
def create_hold_reward():
    data = request.get_json() or {}
    if 'student_id' not in data or 'reward_id' not in data:
        return jsonify({'error': 'student_id と reward_id が必要です'}), 400

    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('''
          INSERT INTO holdReward (student_id, reward_id, is_holding, used_at)
          VALUES (?, ?, ?, ?)
        ''', (
          data['student_id'],
          data['reward_id'],
          data.get('is_holding', True),
          data.get('used_at')  # null なら自動で NULL
        ))
        hold_id = c.lastrowid
        conn.commit()
        conn.close()
        return jsonify({'hold_id': hold_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 3) 保持報酬の更新（is_holding / used_at など）
@reward_o.route('/holdRewards/<int:hold_id>', methods=['PATCH'])
def update_hold_reward(hold_id):
    data = request.get_json() or {}
    allowed = []
    vals = []
    if 'is_holding' in data:
        allowed.append('is_holding = ?')
        vals.append(1 if data['is_holding'] else 0)
    if 'used_at' in data:
        allowed.append('used_at = ?')
        vals.append(data['used_at'])
    if not allowed:
        return jsonify({'error': '更新できるフィールドがありません'}), 400

    vals.append(hold_id)
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # 報酬使用前の情報を取得
        c.execute('''
            SELECT hr.student_id, hr.reward_id, s.name, s.class_id, r.reward_content
            FROM holdReward hr
            JOIN students s ON hr.student_id = s.student_id
            JOIN reward r ON hr.reward_id = r.reward_id
            WHERE hr.hold_id = ?
        ''', (hold_id,))
        hold_info = c.fetchone()
        
        if not hold_info:
            conn.close()
            return jsonify({'error': 'hold_id が見つかりません'}), 404
            
        student_id, reward_id, student_name, class_id, reward_content = hold_info
        
        # 報酬使用処理
        c.execute(f'''
          UPDATE holdReward
             SET {', '.join(allowed)}
           WHERE hold_id = ?
        ''', vals)
        
        # 報酬が使用された場合（is_holdingがFalseになった場合）に通知を作成
        if 'is_holding' in data and not data['is_holding']:
            # 同じclass_idの先生を取得
            c.execute('''
                SELECT teacher_id FROM teachers 
                WHERE class_id = ? AND user_type = 'teacher'
            ''', (class_id,))
            teachers = c.fetchall()
            
            # 各先生に通知を作成（重複チェック付き）
            for teacher in teachers:
                teacher_id = teacher[0]
                
                # 既に同じ報酬に対する通知が存在するかチェック
                c.execute('''
                    SELECT COUNT(*) FROM notification 
                    WHERE student_id = ? AND teacher_id = ? AND reward_id = ?
                ''', (student_id, teacher_id, reward_id))
                
                existing_count = c.fetchone()[0]
                if existing_count == 0:  # 通知が存在しない場合のみ作成
                    notification_content = f"{student_name}が{reward_content}を使用しました"
                    
                    c.execute('''
                        INSERT INTO notification (student_id, teacher_id, reward_id, notification_content)
                        VALUES (?, ?, ?, ?)
                    ''', (student_id, teacher_id, reward_id, notification_content))
                else:
                    # 既存の通知を更新（時間を最新に）
                    c.execute('''
                        UPDATE notification 
                        SET saved_time = datetime('now', '+9 hours')
                        WHERE student_id = ? AND teacher_id = ? AND reward_id = ?
                    ''', (student_id, teacher_id, reward_id))
        
        conn.commit()
        conn.close()
        return jsonify({'status': 'updated'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 4) 保持報酬の削除
@reward_o.route('/holdRewards/<int:hold_id>', methods=['DELETE'])
def delete_hold_reward(hold_id):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('DELETE FROM holdReward WHERE hold_id = ?', (hold_id,))
        conn.commit()
        if c.rowcount == 0:
            conn.close()
            return jsonify({'error': 'hold_id が見つかりません'}), 404
        conn.close()
        return jsonify({'status': 'deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
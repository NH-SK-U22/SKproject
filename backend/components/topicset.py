from flask import Blueprint, request, jsonify
import sqlite3
import random
from datetime import datetime

topicset_o = Blueprint('topicset_o', __name__, url_prefix='/api')

@topicset_o.route('/topics', methods=['POST'])
def add_topic():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    # ランダム選擇colorset_id (1-10)
    colorset_id = random.randint(1, 10)
    start_date = data.get('startDate')
    end_date = data.get('endDate')
    team1 = data.get('team1')
    team2 = data.get('team2')
    school_id = data.get('school_id')
    
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        # debate_settingsk記録を挿入する
        c.execute(
            '''
            INSERT INTO debate_settings (title, description, colorset_id, start_date, end_date, team1, team2, school_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (title, description, colorset_id, start_date, end_date, team1, team2, school_id)
        )
        
        # 新規に挿入された記録のIDを取得する
        theme_id = c.lastrowid
        
        # camps記録を作成する
        c.execute(
            '''
            INSERT INTO camps (theme_id, camp_name, is_winner)
            VALUES (?, ?, 0), (?, ?, 0)
            ''',
            (theme_id, team1, theme_id, team2)
        )
        
        conn.commit()
        return jsonify({'message': 'テーマが追加されました', 'theme_id': theme_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@topicset_o.route('/newest_theme', methods=['GET'])
def get_newest_theme():
    school_id = request.args.get('school_id')
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        c.execute('''
            SELECT * FROM debate_settings WHERE school_id = ? ORDER BY theme_id DESC LIMIT 1
        ''', (school_id,))
        row = c.fetchone()
        if row:
            col_names = [description[0] for description in c.description]
            theme = dict(zip(col_names, row))
            return jsonify(theme), 200
        else:
            return jsonify({'error': 'テーマが見つかりません'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@topicset_o.route('/all_debate', methods=['GET'])
def get_all_debates():
    school_id = request.args.get('school_id')
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        c.execute('''
            SELECT 
                d.*,
                c1.is_winner as team1_is_winner,
                c2.is_winner as team2_is_winner
            FROM debate_settings d
            LEFT JOIN camps c1 ON d.theme_id = c1.theme_id AND d.team1 = c1.camp_name
            LEFT JOIN camps c2 ON d.theme_id = c2.theme_id AND d.team2 = c2.camp_name
            WHERE d.school_id = ? 
            ORDER BY d.theme_id DESC
        ''', (school_id,))
        rows = c.fetchall()
        if rows:
            col_names = [description[0] for description in c.description] + ['team1_is_winner', 'team2_is_winner']
            themes = [dict(zip(col_names, row)) for row in rows]
            return jsonify(themes), 200
        else:
            return jsonify([]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@topicset_o.route('/calculate_winner/<int:theme_id>', methods=['POST'])
def calculate_winner(theme_id):
    """計算してディベートテーマの勝者を更新する"""
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        # テーマ情報を取得する
        c.execute('''
            SELECT team1, team2 FROM debate_settings 
            WHERE theme_id = ?
        ''', (theme_id,))
        theme = c.fetchone()
        if not theme:
            return jsonify({'error': 'テーマが見つかりません'}), 404

        team1, team2 = theme

        # 各陣営の総得点を計算する
        # sticky表から各陣営の平均得点を取得する
        c.execute('''
            SELECT 
                s.theme_id,
                AVG(CASE WHEN st.camp_id = 1 THEN s.overall_avg_score ELSE NULL END) as team1_score,
                AVG(CASE WHEN st.camp_id = 2 THEN s.overall_avg_score ELSE NULL END) as team2_score
            FROM sticky s
            JOIN students st ON s.student_id = st.student_id
            WHERE s.theme_id = ?
            GROUP BY s.theme_id
        ''', (theme_id,))
        
        result = c.fetchone()
        if not result:
            return jsonify({'error': '関連する得点データが見つかりません'}), 404

        _, team1_score, team2_score = result
        team1_score = team1_score or 0
        team2_score = team2_score or 0

        # 勝者を決定する
        winner = team1 if team1_score > team2_score else team2 if team2_score > team1_score else None

        # debate_settings表を更新する
        c.execute('''
            UPDATE debate_settings 
            SET winner = ?,
                team1_score = ?,
                team2_score = ?
            WHERE theme_id = ?
        ''', (winner, team1_score, team2_score, theme_id))

        # camps表の記録を取得する
        c.execute('''
            SELECT camp_id, camp_name FROM camps
            WHERE theme_id = ?
            ORDER BY camp_id
        ''', (theme_id,))
        camps = c.fetchall()

        # camps表に記録がない場合、新規に記録を作成する
        if not camps:
            c.execute('''
                INSERT INTO camps (theme_id, camp_name, is_winner)
                VALUES (?, ?, ?), (?, ?, ?)
            ''', (
                theme_id, team1, 1 if winner == team1 else 0,
                theme_id, team2, 1 if winner == team2 else 0
            ))
        else:
            # 既存の記録を更新する
            for camp in camps:
                camp_id, camp_name = camp
                is_winner = 1 if (camp_name == team1 and winner == team1) or (camp_name == team2 and winner == team2) else 0
                c.execute('''
                    UPDATE camps
                    SET is_winner = ?
                    WHERE camp_id = ?
                ''', (is_winner, camp_id))

        conn.commit()
        return jsonify({
            'message': '勝者が更新されました',
            'winner': winner,
            'team1_score': team1_score,
            'team2_score': team2_score
        }), 200

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@topicset_o.route('/clear_camp_selections', methods=['POST'])
def clear_camp_selections():
    """討論時間が終了したらすべての学生のcamp_idをクリアする"""
    data = request.get_json()
    school_id = data.get('school_id')
    
    if not school_id:
        return jsonify({'error': 'school_idが必要です'}), 400
    
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        # 現在の時間を取得する
        now = datetime.now()
        
        # 終了した討論テーマを検索する
        c.execute('''
            SELECT theme_id FROM debate_settings 
            WHERE school_id = ? AND end_date <= ?
        ''', (school_id, now.strftime('%Y-%m-%d %H:%M:%S')))
        
        ended_themes = c.fetchall()
        
        if not ended_themes:
            return jsonify({'message': '終了した討論テーマがありません'}), 200
        
        # すべての学生のcamp_idをクリアする
        c.execute('''
            UPDATE students 
            SET camp_id = NULL 
            WHERE school_id = ?
        ''', (school_id,))
        
        conn.commit()
        
        return jsonify({
            'message': '陣営選択がクリアされました',
            'cleared_students': c.rowcount
        }), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@topicset_o.route('/check_theme_status', methods=['GET'])
def check_theme_status():
    """討論テーマの状態を確認し、終了した場合は自動的にcamp_idをクリアする"""
    school_id = request.args.get('school_id')
    
    if not school_id:
        return jsonify({'error': 'school_idが必要です'}), 400
    
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        # 現在の時間を取得する
        now = datetime.now()
        
        # 終了した討論テーマを検索する
        c.execute('''
            SELECT theme_id, title, end_date FROM debate_settings 
            WHERE school_id = ? AND end_date <= ?
        ''', (school_id, now.strftime('%Y-%m-%d %H:%M:%S')))
        
        ended_themes = c.fetchall()
        
        if ended_themes:
            # すべての学生のcamp_idをクリアする
            c.execute('''
                UPDATE students 
                SET camp_id = NULL 
                WHERE school_id = ?
            ''', (school_id,))
            
            conn.commit()
            
            return jsonify({
                'message': '討論が終了し、陣営選択がクリアされました',
                'ended_themes': [{'theme_id': t[0], 'title': t[1], 'end_date': t[2]} for t in ended_themes],
                'cleared_students': c.rowcount
            }), 200
        else:
            return jsonify({'message': '進行中の討論があります'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

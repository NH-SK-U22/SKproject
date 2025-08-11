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
        c.execute(
            '''
            INSERT INTO debate_settings (title, description, colorset_id, start_date, end_date, team1, team2, school_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (title, description, colorset_id, start_date, end_date, team1, team2, school_id)
        )
        conn.commit()
        return jsonify({'message': 'テーマが追加されました'}), 201
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
            SELECT * FROM debate_settings WHERE school_id = ? ORDER BY theme_id DESC
        ''', (school_id,))
        rows = c.fetchall()
        if rows:
            col_names = [description[0] for description in c.description]
            themes = [dict(zip(col_names, row)) for row in rows]
            return jsonify(themes), 200
        else:
            return jsonify([]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@topicset_o.route('/clear_camp_selections', methods=['POST'])
def clear_camp_selections():
    """讨论时间结束时清除所有学生的camp_id"""
    data = request.get_json()
    school_id = data.get('school_id')
    
    if not school_id:
        return jsonify({'error': 'school_idが必要です'}), 400
    
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        # 获取当前时间
        now = datetime.now()
        
        # 查找已结束的讨论主题
        c.execute('''
            SELECT theme_id FROM debate_settings 
            WHERE school_id = ? AND end_date <= ?
        ''', (school_id, now.strftime('%Y-%m-%d %H:%M:%S')))
        
        ended_themes = c.fetchall()
        
        if not ended_themes:
            return jsonify({'message': '終了した討論テーマがありません'}), 200
        
        # 清除所有学生的camp_id
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
    """检查讨论主题状态，如果已结束则自动清除camp_id"""
    school_id = request.args.get('school_id')
    
    if not school_id:
        return jsonify({'error': 'school_idが必要です'}), 400
    
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        # 获取当前时间
        now = datetime.now()
        
        # 查找已结束的讨论主题
        c.execute('''
            SELECT theme_id, title, end_date FROM debate_settings 
            WHERE school_id = ? AND end_date <= ?
        ''', (school_id, now.strftime('%Y-%m-%d %H:%M:%S')))
        
        ended_themes = c.fetchall()
        
        if ended_themes:
            # 清除所有学生的camp_id
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

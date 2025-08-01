from flask import Blueprint, request, jsonify
import sqlite3
import random

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

from flask import jsonify, request, current_app
from flask import Blueprint
from flask import Flask
from components.init import get_db_connection

themes_o = Blueprint('themes_o', __name__, url_prefix='/api')

# 1) テーマ一覧を取得
@themes_o.route('/themes', methods=['GET'])
def list_themes():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
      SELECT theme_id, title, description, colorset_id, start_date, end_date
        FROM debate_settings
        ORDER BY start_date DESC
    ''')
    themes = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(themes)


# 2) 新しいテーマを作成
@themes_o.route('/themes', methods=['POST'])
def create_theme():
    data = request.get_json() or {}
    required = ['title', 'description', 'colorset_id', 'start_date', 'end_date']
    for f in required:
        if f not in data:
            return jsonify({'error': f'{f} が必要です'}), 400

    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
      INSERT INTO debate_settings
        (title, description, colorset_id, start_date, end_date)
      VALUES (?, ?, ?, ?, ?)
    ''', (
      data['title'],
      data['description'],
      data['colorset_id'],
      data['start_date'],
      data['end_date'],
    ))
    theme_id = c.lastrowid
    conn.commit()
    conn.close()
    return jsonify({'theme_id': theme_id}), 201


# 3) テーマ詳細を取得
@themes_o.route('/themes/<int:theme_id>', methods=['GET'])
def get_theme(theme_id):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
      SELECT theme_id, title, description, colorset_id, start_date, end_date
        FROM debate_settings
      WHERE theme_id = ?
    ''', (theme_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'テーマが見つかりません'}), 404
    return jsonify(dict(row))


# 4) テーマ情報を更新
@themes_o.route('/themes/<int:theme_id>', methods=['PATCH'])
def update_theme(theme_id):
    data = request.get_json() or {}
    fields = []
    vals = []
    for col in ('title', 'description', 'colorset_id', 'start_date', 'end_date'):
        if col in data:
            fields.append(f"{col} = ?")
            vals.append(data[col])
    if not fields:
        return jsonify({'error': '更新フィールドがありません'}), 400

    vals.append(theme_id)
    conn = get_db_connection()
    c = conn.cursor()
    c.execute(f'''
      UPDATE debate_settings
        SET {', '.join(fields)}
      WHERE theme_id = ?
    ''', vals)
    conn.commit()
    conn.close()
    return jsonify({'status': 'updated'})
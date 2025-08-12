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
    required = ['title', 'description', 'colorset_id', 'start_date', 'end_date', 'school_id']
    for f in required:
        if f not in data:
            return jsonify({'error': f'{f} が必要です'}), 400

    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
      INSERT INTO debate_settings
        (title, description, colorset_id, start_date, end_date, school_id)
      VALUES (?, ?, ?, ?, ?, ?)
    ''', (
      data['title'],
      data['description'],
      data['colorset_id'],
      data['start_date'],
      data['end_date'],
      data['school_id'],
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


# newest_theme: 学校ごとの最新(終了が未来のもの優先)テーマを一件取得
@themes_o.route('/newest_theme', methods=['GET'])
def newest_theme():
    school_id = request.args.get('school_id')
    if not school_id:
        return jsonify({'error': 'school_id が必要です'}), 400

    conn = get_db_connection()
    c = conn.cursor()
    # まず未終了のものを終了日時昇順で、なければ終了済みを終了日時降順で1件
    c.execute('''
        SELECT theme_id, title, description, colorset_id, start_date, end_date
          FROM debate_settings
         WHERE school_id = ? AND end_date > datetime('now')
         ORDER BY end_date ASC
         LIMIT 1
    ''', (school_id,))
    row = c.fetchone()
    if not row:
        c.execute('''
            SELECT theme_id, title, description, colorset_id, start_date, end_date
              FROM debate_settings
             WHERE school_id = ?
             ORDER BY end_date DESC
             LIMIT 1
        ''', (school_id,))
        row = c.fetchone()

    conn.close()
    if not row:
        return jsonify(None)
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
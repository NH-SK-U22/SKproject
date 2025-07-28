from flask import json, jsonify
import sqlite3
from flask import Blueprint
from components.init import get_db_connection

colorset_o = Blueprint('colorset_o', __name__, url_prefix='/api')

# colorset
@colorset_o.route('/colorsets/<camp>', methods=['GET'])
def get_colorsets(camp):
    try:
        # camp1 = camp_type 1, camp2 = camp_type 2
        camp_type = 1 if camp == 'camp1' else 2
        
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute('SELECT group_number, colors FROM colorsets WHERE camp_type = ? ORDER BY group_number', (camp_type,))
        rows = c.fetchall()
        conn.close()
        
        colorsets = []
        for row in rows:
            colors = json.loads(row[1])
            colorsets.append({
                'group_number': row[0],
                'colors': colors
            })
        
        return jsonify(colorsets)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# theme_idに基づいて、そのテーマのカラーセットを取得する
@colorset_o.route('/colorsets/theme/<int:theme_id>', methods=['GET'])
def get_theme_colorsets(theme_id):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # このテーマのgroup_numberを取得する（colorset_idをgroup_numberとして使用）
        c.execute('''
            SELECT colorset_id FROM debate_settings WHERE theme_id = ?
        ''', (theme_id,))
        
        theme_result = c.fetchone()
        if not theme_result:
            conn.close()
            return jsonify({'error': 'テーマが見つかりません'}), 404
        
        group_number = theme_result[0]
        
        # そのgroup_numberのすべての陣営の色を取得する
        c.execute('''
            SELECT camp_type, colors FROM colorsets 
            WHERE group_number = ? 
            ORDER BY camp_type
        ''', (group_number,))
        
        rows = c.fetchall()
        conn.close()
        
        if not rows:
            return jsonify({'error': 'カラーセットが見つかりません'}), 404
        
        colorsets = []
        for row in rows:
            colors = json.loads(row[1])
            colorsets.append({
                'camp_type': row[0],
                'colors': colors
            })
        
        return jsonify({
            'group_number': group_number,
            'colorsets': colorsets
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
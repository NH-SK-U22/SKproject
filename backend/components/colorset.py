from flask import json, jsonify
import sqlite3
from flask import Blueprint

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
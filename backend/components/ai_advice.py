from flask import jsonify, request
import sqlite3
from flask import Blueprint
from components.init import get_db_connection

ai_advice_o = Blueprint('ai_advice_o', __name__, url_prefix='/api')

@ai_advice_o.route('/students/<int:student_id>/ai-advice', methods=['GET'])
def get_student_ai_advice(student_id):
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        # Get the ai_advice status for the student
        c.execute('''SELECT ai_advice FROM students WHERE student_id = ?''', (student_id,))
        result = c.fetchone()
        conn.close()
        
        if not result:
            return jsonify({'error': '生徒が見つかりません'}), 404
        
        ai_advice_value = result[0]
        
        return jsonify({
            'success': True,
            'ai_advice': ai_advice_value,
            'student_id': student_id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_advice_o.route('/students/<int:student_id>/ai-advice', methods=['PATCH'])
def update_student_ai_advice(student_id):
    if not request.json:
        return jsonify({'error': 'リクエストボディが必要です'}), 400
    
    try:
        ai_advice = request.json.get('ai_advice')
        if ai_advice is None:
            return jsonify({'error': 'ai_adviceフィールドが必要です'}), 400
        
        # Convert boolean to integer for database storage
        ai_advice_value = 1 if ai_advice else 0
        
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        c.execute('''UPDATE students SET ai_advice = ? WHERE student_id = ?''', 
                 (ai_advice_value, student_id))
        
        if c.rowcount == 0:
            conn.close()
            return jsonify({'error': '生徒が見つかりません'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'ai_advice': ai_advice,
            'student_id': student_id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

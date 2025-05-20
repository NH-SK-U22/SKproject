from flask import Flask, jsonify
from flask_cors import CORS # Flask-CORSをインポート

app = Flask(__name__)
CORS(app) # CORSをアプリケーション全体に適用

@app.route('/')
def health():
    print('yattane')
    return jsonify({'status': 'okdedidimaru'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

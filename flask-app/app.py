from flask import Flask
from flask_cors import CORS # flask_cors をインポート

app = Flask(__name__)
CORS(app) # CORS を有効にする

@app.route('/')
def hello_world():
    return 'Hello, SK member!!!!!'

if __name__ == '__main__':
    app.run(debug=True)

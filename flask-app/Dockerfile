# flask-app/Dockerfile
FROM python:3.11

WORKDIR /app

# 依存関係のコピーとインストール
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# アプリのソースコードをコピー
COPY . .

# Flask の実行に必要な環境変数設定
ENV FLASK_APP=app.py

# コンテナ内で使用するポート（例：5000）
EXPOSE 5000

# Flask アプリの起動（0.0.0.0 を指定して外部アクセス可能に）
CMD ["flask", "run", "--debugger", "--reload", "--host=0.0.0.0"]

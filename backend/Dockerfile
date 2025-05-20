# backend/Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Python 依存インストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 開発モードで自動リロードを有効化
ENV FLASK_APP=app.py
ENV FLASK_ENV=development

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
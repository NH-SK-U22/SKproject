# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# パッケージファイルのみ先にコピー
COPY package.json package-lock.json* ./

# キャッシュをクリアして新しくインストール
RUN npm cache clean --force
RUN rm -rf node_modules package-lock.json
RUN npm install

# ソースコードをコピー
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

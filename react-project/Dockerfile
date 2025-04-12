# react-project/Dockerfile
FROM node:16

WORKDIR /app

# package.json と package-lock.json（あるいは yarn.lock）がある場合は先にコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# ソースコードをコピー
COPY . .

# コンテナ内で使用するポート（例：3000）
EXPOSE 3000

# 開発時はホットリロードを使うためnpm start
CMD ["npm", "run", "winstart"]

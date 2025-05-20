# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package.json yarn.lock* pnpm-lock.yaml* ./

# 依存インストール
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ベースイメージ
FROM node:20-alpine AS base
# OpenSSLをインストール（Prisma用）
RUN apk add --no-cache openssl libc6-compat

# 依存関係インストール用ステージ
FROM base AS deps
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package.json package-lock.json* ./
RUN npm ci

# 開発用ステージ
FROM base AS dev
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prismaクライアント生成
RUN npx prisma generate

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 開発サーバー起動
CMD ["npm", "run", "dev"]

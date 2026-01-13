# 営業日報システム

営業担当者が日々の活動を報告し、上長がフィードバックを行うための日報管理システムです。

## 機能

- **日報管理**: 日報の作成・編集・閲覧
- **訪問記録**: 1日報に複数の訪問記録を登録可能
- **上長コメント**: 管理者による日報へのフィードバック
- **顧客マスタ管理**: 顧客情報の登録・編集
- **営業マスタ管理**: 営業担当者の登録・編集（管理者のみ）

## ユーザー権限

| 権限 | 日報作成 | 日報閲覧 | コメント投稿 | 顧客管理 | 営業管理 |
|------|---------|---------|-------------|---------|---------|
| 一般営業 | 自分のみ | 自分のみ | - | 全員 | - |
| 管理者 | 自分のみ | 全員 | 全員 | 全員 | 全員 |

## 技術スタック

| 項目 | 技術 |
|------|------|
| 言語 | TypeScript |
| フレームワーク | Next.js 14 (App Router) |
| UIコンポーネント | shadcn/ui + Tailwind CSS |
| データベース | PostgreSQL 16 |
| ORM | Prisma |
| 認証 | JWT (jose) |
| コンテナ | Docker / Docker Compose |

## セットアップ

### 前提条件

- Node.js 20以上
- Docker / Docker Compose

### Docker環境（推奨）

```bash
# クローン
git clone https://github.com/<your-username>/company-system.git
cd company-system

# 起動
docker compose up --build

# シードデータ投入（初回のみ）
docker compose exec app npx prisma db seed
```

### ローカル環境

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
# .envを編集してDATABASE_URLを設定

# DBマイグレーション
npm run db:migrate

# シードデータ投入
npm run db:seed

# 開発サーバー起動
npm run dev
```

## アクセス

- **URL**: http://localhost:3000

### テストアカウント

| メールアドレス | パスワード | 権限 |
|---------------|-----------|------|
| manager@example.com | password123 | 管理者 |
| tanaka@example.com | password123 | 一般営業 |
| suzuki@example.com | password123 | 一般営業 |

## スクリプト

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# 本番サーバー
npm run start

# Lint
npm run lint

# テスト
npm run test

# DBマイグレーション
npm run db:migrate

# Prisma Studio（DB GUI）
npm run db:studio
```

## Docker コマンド

```bash
# 起動
docker compose up -d

# 停止
docker compose down

# ログ確認
docker compose logs -f app

# DB接続
docker compose exec db psql -U postgres -d company_system

# DBリセット
docker compose down -v
docker compose up -d --build
docker compose exec app npx prisma db seed
```

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証画面
│   ├── (main)/            # メイン画面（認証必須）
│   │   ├── dashboard/     # ダッシュボード
│   │   ├── daily-reports/ # 日報管理
│   │   ├── customers/     # 顧客管理
│   │   └── sales-persons/ # 営業管理
│   └── api/v1/            # API Routes
├── components/            # UIコンポーネント
│   └── ui/               # shadcn/ui
├── lib/                   # ユーティリティ
├── schemas/               # Zodスキーマ
└── types/                 # 型定義
```

## ライセンス

MIT

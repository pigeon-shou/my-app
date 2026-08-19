@AGENTS.md
# my-app — サブスク管理アプリ

自分専用のサブスク管理アプリ。月額合計の把握と「解約締切日」管理がコアバリュー。
詳しい要件定義は `readme.md` を参照。

## 構成
- frontend/: Next.js (App Router) + TypeScript + Tailwind CSS
- backend/: Hono + TypeScript、Prisma + PostgreSQL（Docker）

## 起動方法
1. DB起動: `docker compose up -d`（リポジトリのルートで実行）
2. backend: `cd backend && npm install && npx prisma migrate dev && npm run dev`（ポート8787）
3. frontend: `cd frontend && npm install && npm run dev`（ポート3000）
4. backend/.env に `DATABASE_URL` が必要（docker-compose.yml の認証情報に合わせる）

## 注意点
- API通信先URLはフロント側にハードコード（http://localhost:8787）。将来的に環境変数化を検討。
- カテゴリは固定選択肢。categoriesテーブルをseedしてから動作確認する想定。
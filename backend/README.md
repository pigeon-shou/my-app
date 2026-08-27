```
npm install
npm run dev
```

```
open http://localhost:3000
```

## 解約締切リマインダーメールの設定

1. `.env.example` を `.env` にコピーする
2. `DATABASE_URL` を設定する
3. `SMTP_USER` / `SMTP_PASS` / `NOTIFY_TO_EMAIL` を設定する
   - デフォルトはGmail（[アプリパスワード](https://myaccount.google.com/apppasswords)）を使う
   - Gmail以外のSMTPサービスを使う場合は `SMTP_HOST` / `SMTP_PORT` も設定する
4. 必要に応じて `REMINDER_DAYS_BEFORE`（何日前から通知するか）、`REMINDER_CRON`（自動チェックの時刻）を調整する
5. `npx prisma migrate dev` でDBに反映する

サーバー起動中は毎日指定時刻（デフォルト9:00 JST）に自動でチェック・送信される。
すぐに動作確認したい場合は、サーバー起動中に以下を実行すると即座にチェック・送信される。

```
curl -X POST http://localhost:8787/api/notify/check-deadlines
```

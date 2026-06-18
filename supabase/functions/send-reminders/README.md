# send-reminders (웹푸시 B)

매일 1회 실행되어 `alarm_targets`를 검사하고, 오늘이 D-N 이내인 항목을 해당 기기로 푸시 발송한다.

## 1. VAPID 키 생성
```bash
npx web-push generate-vapid-keys
```
- **Public Key** → `src/config.js`의 `VAPID_PUBLIC_KEY`에 붙여넣기
- **Private Key** → 아래 시크릿으로만 저장 (코드에 두지 말 것)

## 2. 시크릿 등록
```bash
supabase secrets set \
  VAPID_PUBLIC_KEY=<공개키> \
  VAPID_PRIVATE_KEY=<비공개키> \
  VAPID_SUBJECT=mailto:cron.phj@gmail.com
```

## 3. 배포
```bash
supabase functions deploy send-reminders
```

## 4. 매일 cron (pg_cron + pg_net)
Supabase SQL Editor에서 실행 (KST 오전 9시 = UTC 0시):
```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'send-reminders-daily',
  '0 0 * * *',
  $$
  select net.http_post(
    url    := 'https://<프로젝트>.functions.supabase.co/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    )
  );
  $$
);
```

## 동작 흐름
1. 앱에서 알림 On → `push_subscriptions`(구독) + `alarm_targets`(대상) 저장
2. 이 함수가 매일 검사 → D-N 맞으면 push 발송
3. 폰의 `sw.js` `push` 핸들러가 받아 시스템 알림 표시

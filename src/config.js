// Supabase 연결 설정
// anon key는 공개돼도 안전한 키 (RLS가 데이터 보호). 정적 사이트라 코드에 포함됨.
export const SUPABASE_URL = 'https://vghkaykcqvihamirnhma.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnaGtheWtjcXZpaGFtaXJuaG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzExMDAsImV4cCI6MjA5NzIwNzEwMH0.umFz_Lhpz14MKDOYNXG_a26658O_oE-cP-qsuiwQz9c';

// 웹푸시(B) VAPID 공개키 — `npx web-push generate-vapid-keys`로 생성 후 붙여넣기.
// 비공개키는 코드에 두지 말고 Supabase Edge Function 시크릿(VAPID_PRIVATE_KEY)에 저장.
export const VAPID_PUBLIC_KEY =
  'BLPgdSV9ZawfBTHfQJax2tR2E1OD5qJ_Egpdr3HVaEo6LWXsvAOgOxEwu7AlzKXTrH1e7Hz38VsP-katPzIh4l0';

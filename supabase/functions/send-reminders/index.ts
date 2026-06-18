// 마감 알림 발송 (B) — 매일 1회 cron 실행.
// alarm_targets를 훑어 오늘이 D-N 이내인 항목을 찾아 해당 기기로 웹푸시 발송.
//
// 배포:  supabase functions deploy send-reminders
// 시크릿: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:cron.phj@gmail.com
// cron:  아래 SQL_CRON 참고 (pg_cron + pg_net로 매일 호출)
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:cron.phj@gmail.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

// 프런트 utils/exam.js와 동일한 단계 순서
const MILESTONES: [string, string][] = [
  ['written_apply_end', '필기접수'],
  ['written_exam_start', '필기시험'],
  ['written_result_date', '필기발표'],
  ['practical_apply_end', '실기접수'],
  ['practical_exam_start', '실기시험'],
  ['final_result_date', '실기발표'],
];

const todayKST = () => {
  // KST(UTC+9) 기준 자정
  const now = new Date(Date.now() + 9 * 3600 * 1000);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const daysUntil = (dateStr: string | null) => {
  if (!dateStr) return null;
  const t = new Date(dateStr + 'T00:00:00Z');
  return Math.round((t.getTime() - todayKST().getTime()) / 86400000);
};

const ddayLabel = (d: number) => (d === 0 ? 'D-DAY' : `D-${d}`);

Deno.serve(async () => {
  const [{ data: targets }, { data: subs }] = await Promise.all([
    supabase.from('alarm_targets').select('*'),
    supabase.from('push_subscriptions').select('*'),
  ]);
  const subByDevice = new Map((subs ?? []).map((s) => [s.device_id, s.subscription]));

  // 필요한 시험/공고만 로드
  const { data: exams } = await supabase
    .from('exam_schedules')
    .select('id,round,certifications(name),written_apply_end,written_exam_start,written_result_date,practical_apply_end,practical_exam_start,final_result_date');
  const { data: jobs } = await supabase
    .from('job_postings')
    .select('id,company_name,position,due_date');
  const examById = new Map((exams ?? []).map((e) => [String(e.id), e]));
  const jobById = new Map((jobs ?? []).map((j) => [String(j.id), j]));

  let sent = 0;
  for (const t of targets ?? []) {
    const sub = subByDevice.get(t.device_id);
    if (!sub) continue;

    let date: string | null = null;
    let name = '';
    let stage = '마감';
    if (t.ref_type === 'exam') {
      const e = examById.get(String(t.ref_id));
      if (!e) continue;
      for (const [key, label] of MILESTONES) {
        const d = daysUntil((e as Record<string, string>)[key]);
        if (d !== null && d >= 0) { date = (e as Record<string, string>)[key]; stage = label; break; }
      }
      // @ts-ignore — 조인 형태
      name = e.certifications?.name ?? '자격증';
    } else if (t.ref_type === 'job') {
      const j = jobById.get(String(t.ref_id));
      if (!j || !j.due_date) continue;
      date = j.due_date;
      name = `[${j.company_name}] ${j.position}`;
    }

    const left = daysUntil(date);
    if (left === null || left < 0 || left > t.days) continue;

    const payload = JSON.stringify({
      title: '취준이',
      body: `${name} ${stage} ${ddayLabel(left)}`,
      tag: `${t.ref_type}:${t.ref_id}@${date}`,
      url: './',
    });
    try {
      await webpush.sendNotification(sub, payload);
      sent++;
    } catch (err) {
      // 만료(410/404) 구독은 정리
      if ((err as { statusCode?: number }).statusCode === 410 ||
          (err as { statusCode?: number }).statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('device_id', t.device_id);
      }
      console.error('push 실패', t.device_id, err);
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { 'content-type': 'application/json' },
  });
});

-- =====================================================================
-- qualifications_helper — Supabase 스키마
-- 자격증 시험일정(큐넷) + 채용공고(원티드) 통합 관리
--
-- 적용 방법: Supabase 대시보드 > SQL Editor 에 붙여넣고 실행
-- =====================================================================

-- 공통: updated_at 자동 갱신 트리거 함수
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- =====================================================================
-- 1. certifications — 내가 추적할 자격증 종목 (마스터)
-- =====================================================================
create table if not exists certifications (
  id          bigint generated always as identity primary key,
  name        text not null,              -- 예: 정보처리기사
  qnet_code   text,                       -- 큐넷/공공데이터 종목코드 (jmCd)
  category    text,                       -- 기사 / 산업기사 등
  is_active   boolean not null default true,  -- 대시보드 표시 여부
  created_at  timestamptz not null default now()
);

comment on table certifications is '추적 대상 자격증 종목';

-- 초기 타겟 종목 (종목코드는 수집 시 채움)
insert into certifications (name, category) values
  ('정보처리기사',   '기사'),
  ('빅데이터분석기사', '기사'),
  ('정보보안기사',   '기사')
on conflict do nothing;


-- =====================================================================
-- 2. exam_schedules — 시험 회차별 일정 (큐넷 수집)
-- =====================================================================
create table if not exists exam_schedules (
  id                bigint generated always as identity primary key,
  certification_id  bigint not null references certifications(id) on delete cascade,
  round             text not null,        -- 회차 (예: 2026년 정기 기사 1회)
  year              int,

  -- 필기
  written_apply_start   date,
  written_apply_end     date,
  written_exam_start    date,
  written_exam_end      date,
  written_result_date   date,

  -- 실기
  practical_apply_start date,
  practical_apply_end   date,
  practical_exam_start  date,
  practical_exam_end    date,
  final_result_date     date,

  raw         jsonb,                       -- 원본 응답 보관
  source      text not null default 'qnet',
  fetched_at  timestamptz,                 -- 마지막 수집 시각
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- 같은 종목/회차 중복 방지 → upsert 키
  unique (certification_id, round)
);

comment on table exam_schedules is '큐넷 시험 회차별 일정';

create index if not exists idx_exam_cert     on exam_schedules(certification_id);
create index if not exists idx_exam_wexam    on exam_schedules(written_exam_start);
create index if not exists idx_exam_pexam    on exam_schedules(practical_exam_start);

create trigger trg_exam_updated
  before update on exam_schedules
  for each row execute function set_updated_at();


-- =====================================================================
-- 3. job_filters — 공고 수집 조건 (원티드 쿼리 기준)
-- =====================================================================
create table if not exists job_filters (
  id                bigint generated always as identity primary key,
  name              text not null,          -- 예: 프론트 신입
  job_category      text,                   -- 직무 (Frontend 등)
  experience_min    int default 0,          -- 최소 경력(년)
  experience_max    int default 0,          -- 최대 경력(년), 0=신입
  location          text,                   -- 지역 (서울 등, null=전체)
  keywords_include  text[] default '{}',    -- 포함 키워드
  keywords_exclude  text[] default '{}',    -- 제외 키워드
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

comment on table job_filters is '원티드 공고 수집 조건';

-- 예시 필터 (실제 조건 확정 후 수정)
insert into job_filters (name, job_category, experience_min, experience_max, location)
values ('프론트 신입', 'Frontend', 0, 0, '서울')
on conflict do nothing;


-- =====================================================================
-- 4. job_postings — 채용 공고 (원티드 수집)
-- =====================================================================
create table if not exists job_postings (
  id            bigint generated always as identity primary key,
  source        text not null default 'wanted',
  external_id   text not null,              -- 원티드 공고 id (중복 방지)

  company_name  text,
  position      text,                       -- 포지션명
  job_category  text,                       -- 직무
  experience    text,                       -- 경력 표기
  location      text,
  url           text,
  due_date      date,                       -- 마감일 (null=상시)

  filter_id     bigint references job_filters(id) on delete set null,  -- 어떤 조건으로 수집됐는지

  is_bookmarked boolean not null default false,  -- 관심
  is_hidden     boolean not null default false,  -- 숨김

  raw         jsonb,
  fetched_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (source, external_id)             -- upsert 키
);

comment on table job_postings is '원티드 채용 공고';

create index if not exists idx_job_due       on job_postings(due_date);
create index if not exists idx_job_category  on job_postings(job_category);
create index if not exists idx_job_bookmark  on job_postings(is_bookmarked) where is_bookmarked;

create trigger trg_job_updated
  before update on job_postings
  for each row execute function set_updated_at();


-- =====================================================================
-- 5. sync_logs — 스케줄러 실행 기록 (디버깅용)
-- =====================================================================
create table if not exists sync_logs (
  id            bigint generated always as identity primary key,
  source        text not null,             -- qnet / wanted
  status        text not null,             -- success / error
  items_fetched int default 0,
  error_message text,
  ran_at        timestamptz not null default now()
);

comment on table sync_logs is '데이터 수집 스케줄러 실행 로그';


-- =====================================================================
-- 6. RLS (Row Level Security)
-- =====================================================================
-- 정책: 프론트(anon)는 읽기 + 북마크/숨김 토글만. 수집(쓰기)은 service_role 전용.
-- service_role 키는 RLS를 우회하므로 별도 쓰기 정책 불필요.
-- =====================================================================

alter table certifications  enable row level security;
alter table exam_schedules  enable row level security;
alter table job_filters     enable row level security;
alter table job_postings    enable row level security;
alter table sync_logs       enable row level security;

-- 읽기: 누구나 (개인용 + 민감정보 없음)
create policy "read_certifications" on certifications for select using (true);
create policy "read_exam_schedules" on exam_schedules for select using (true);
create policy "read_job_filters"    on job_filters    for select using (true);
create policy "read_job_postings"   on job_postings   for select using (true);

-- 공고 북마크/숨김 토글: anon 업데이트 허용 (개인용이라 허용, 단일 사용자 가정)
create policy "update_job_state" on job_postings for update using (true) with check (true);

-- sync_logs 는 service_role 만 접근 (읽기 정책 없음 → anon 차단)


-- =====================================================================
-- 7. 웹푸시(B) — 푸시 구독 + 알림 대상
-- =====================================================================
-- push_subscriptions: 기기별 브라우저 푸시 구독 정보
create table if not exists push_subscriptions (
  device_id     text primary key,            -- 프런트가 만든 기기 식별자
  subscription  jsonb not null,              -- PushSubscription.toJSON()
  updated_at    timestamptz not null default now()
);

comment on table push_subscriptions is '기기별 웹푸시 구독 (Edge Function 발송 대상)';

-- alarm_targets: 어떤 항목을 며칠 전(D-N) 알릴지 (기기별)
create table if not exists alarm_targets (
  id          bigint generated always as identity primary key,
  device_id   text not null,
  ref_type    text not null,                 -- 'exam' | 'job'
  ref_id      text not null,                 -- 대상 id
  days        int  not null default 3,       -- D-N
  created_at  timestamptz not null default now()
);

comment on table alarm_targets is '기기별 마감 알림 대상 (Edge Function이 매일 검사)';

create index if not exists idx_alarm_device on alarm_targets(device_id);

alter table push_subscriptions enable row level security;
alter table alarm_targets      enable row level security;

-- 단일 사용자 가정 → anon이 자기 기기 구독/대상 관리 (insert/update/delete) 허용.
-- 발송(service_role)은 RLS 우회.
create policy "anon_push_sub_all" on push_subscriptions
  for all using (true) with check (true);
create policy "anon_alarm_all" on alarm_targets
  for all using (true) with check (true);


-- =====================================================================
-- 8. quiz_questions — AI 생성 문제 은행 (필기/실기)
-- =====================================================================
-- collect.mjs(collectQuiz)가 Claude로 생성 → service_role로 insert.
-- AI 생성물이라 reviewed=false로 들어오고, 검수한 것만(reviewed=true) 앱에 노출.
create table if not exists quiz_questions (
  id                bigint generated always as identity primary key,
  certification_id  bigint not null references certifications(id) on delete cascade,
  exam_type         text not null,              -- 'written'(필기) | 'practical'(실기)
  category          text,                       -- 과목/파트 (예: 데이터베이스 구축)
  question          text not null,
  choices           jsonb not null,             -- 보기 4개 배열 ["...", "...", ...]
  answer_index      int  not null,              -- 정답 보기 인덱스 (0-based)
  explanation       text not null,              -- 해설
  reviewed          boolean not null default false,  -- 검수 통과 여부 (앱 노출 조건)
  source            text not null default 'ai',
  raw               jsonb,                       -- 생성 원본/메타
  created_at        timestamptz not null default now()
);

comment on table quiz_questions is 'AI 생성 자격증 문제 은행 (필기/실기)';

create index if not exists idx_quiz_cert on quiz_questions(certification_id, exam_type);
create index if not exists idx_quiz_reviewed on quiz_questions(reviewed) where reviewed;

alter table quiz_questions enable row level security;

-- 읽기: 검수 통과한 문제만 anon 노출 (미검수 문제는 차단)
create policy "read_reviewed_quiz" on quiz_questions
  for select using (reviewed = true);

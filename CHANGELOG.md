# CHANGELOG

변경 형식: `[타입] 설명` — 타입: `feat` / `fix` / `style` / `docs` / `refactor` / `chore`

---

## [2026-06-17] — 홈 대시보드 개선 (히어로 + compact 목록)

### feat
- 홈을 **가장 임박 1건 히어로**(큰 D-day + 유형 태그 + 다음 단계) + **나머지 한 줄 compact 목록**으로 재구성
  - 행마다 유형 아이콘(자격증/공고) + 제목 + 부제 + D-day → 한눈에 스캔
  - 공고는 행/히어로 클릭 시 원문 링크

### refactor
- 미사용 `ExamItem.js` 제거 (홈 카드 → Hero/Row로 대체)

### fix
- 긴 자격증명/제목이 카드 헤더를 넘쳐 깨지던 문제 (`card__title` 말줄임)
- 타임라인 단계 라벨/날짜 줄바꿈 방지(`white-space: nowrap`, `min-width: 0`)

### chore
- SW 캐시 `qh-v11` → `qh-v12`

---

## [2026-06-17] — 단계 타임라인 6단계 + 2줄 레이아웃

### feat
- 단계 타임라인을 **6단계**로 정정 (필기 접수·시험·발표 / 실기 접수·시험·발표)
  - 기존 4단계 + 부정확한 날짜 매핑 → 실제 컬럼 기준으로 정확히 매핑
  - **필기/실기 2줄 그룹** 레이아웃으로 정렬 (실기 없으면 줄 생략)
- nextMilestone 라벨 `최종발표` → `실기발표` 통일

### chore
- SW 캐시 `qh-v10` → `qh-v11`

---

## [2026-06-17] — 다음단계 D-day + 타임라인 정렬 + 달력 기간막대

### feat
- **동적 다음단계 D-day**: 시험일 고정이 아니라 다가오는 단계(필기접수→필기시험→필기발표→실기접수→실기시험→최종발표)까지 자동 표시 (`utils/exam.js` nextMilestone)
  - 홈/일정 카드에 `필기시험 D-3` 형태로 라벨+D-day, 모두 지나면 `종료`
- **일정 타임라인 정렬**: 가장 가까운 일정이 위로, 지난 일정은 맨 아래
- **단계 타임라인**: 실기 없는 자격증(ADsP/DAsP 등)은 실기 칸을 빈 칸으로 둠
- **달력 기간 막대**: 접수기간 등 다일 일정을 막대로 표시 (단일일은 점 유지), 상세는 기간 내 모든 날에 노출

### chore
- SW 캐시 `qh-v9` → `qh-v10`

---

## [2026-06-17] — CI 액션 버전 갱신

### chore
- GitHub Actions Node20 경고 대응: `checkout@v4→v5`, `setup-node@v4→v5`(collect/deploy)
- 수집 스크립트 런타임 Node `20 → 22`(LTS)

---

## [2026-06-17] — ADsP/DAsP 일정 + 달력 UI 개선

### feat
- **ADsP·DAsP 자격증 일정 추가** (dataq.or.kr 2026 공식 일정, 수동 입력)
  - ADsP 4회차, DAsP 2회차 / 단일 시험(실기 없음)
  - `collect.mjs` 자동 시드(`ensureCert`): 종목이 없으면 자동 생성
- **달력 UI 개선**: 색상 범례(접수/시험/발표/마감) + "오늘" 버튼 + 상세에 요일 표기

### chore
- SW 캐시 `qh-v8` → `qh-v9`

> ⚠️ ADsP/DAsP 날짜는 dataq.or.kr 기준으로 입력 — 시행처 공고와 한 번 대조 권장.
> 적용: 다음 수집(collect) 실행 시 종목 시드 + 일정 반영됨.

---

## [2026-06-17] — 사람인 공고 수집기 추가

### feat
- `scripts/collect.mjs`에 **사람인 공식 Open API 수집기**(`collectSaramin`) 추가
  - `job_filters` 재사용(키워드/지역), **실제 마감일(expiration-date) → due_date 채움**
  - `SARAMIN_ACCESS_KEY` 없으면 자동 건너뜀(graceful skip)
  - `source='saramin'`, on_conflict `source,external_id`로 원티드와 분리
- `collect.yml`에 `SARAMIN_ACCESS_KEY` 시크릿 전달 추가

> ⚠️ 사람인 Open API엔 "대기업/공채" 전용 필터 파라미터가 없음(직무/키워드/지역/마감일 검색).
> 게시일(posting-date)은 `raw`에 보존 — 카드 표기하려면 `posted_at` 컬럼 추가 고려.

---

## [2026-06-17] — 공고 필터/메타 + 폰 프레임 + 탭 스와이프

### feat
- **공고 직무 필터**: 데이터 기반 직무 칩(가로 스크롤) + 기존 전체/관심 세그먼트와 조합
- **공고 메타 표시**: 총 개수(`총 N건`) + 정렬 기준(`최근 등록순`)
- **카드 등록일**: `fetched_at`을 "등록 YYYY.MM.DD"로 표기, `due_date` 없으면 "상시 채용"
- **탭 스와이프**: 좌우 제스처로 홈/일정/공고 이동 (가로 제스처만 인식)

### refactor
- `jobService`: 정렬을 `due_date` → `fetched_at` 최신순 (원티드 공고는 due_date가 NULL)

### style
- 데스크톱에서 모바일 폭을 '폰처럼' 보이게 양옆 테두리 + 그림자 (480px↑)

### chore
- SW 캐시 `qh-v7` → `qh-v8`

> ⚠️ 한계: 원티드 목록 API는 게시일을 주지 않아 등록일은 수집시각(`fetched_at`) 기준.
> 정확한 최초 게시일/등록순을 원하면 `job_postings.created_at`(최초 insert 1회) 컬럼 추가 필요.

---

## [2026-06-17] — 로고 도트 통일 + 로딩 스켈레톤 + FAB 정리

### feat
- 데이터 로딩 중 **카드 스켈레톤(시머)** 표시 (`LoadingState`) — "불러오는 중…" 텍스트 대체
  - `prefers-reduced-motion` 시 애니메이션 정지

### style
- 헤더 마스코트를 인라인 SVG(벡터) → 아이콘 PNG(도트)로 교체해 아이콘과 통일

### chore
- 동작 없던 우측 하단 FAB(+) 버튼 제거 (HTML + CSS), SW 캐시 `qh-v6` → `qh-v7`

---

## [2026-06-17] — 앱 이름 '취준이' + 마스코트

### feat
- 앱 이름 `취준 일정 헬퍼` → **취준이** (`index.html` 제목/로고, `manifest.json`)
- 안경 쓴 와들디 마스코트 (도트 픽셀아트, 인라인 SVG)
- 로고를 한글 도트 폰트 **갈무리(Galmuri11)** 로 픽셀 렌더링
- 앱 아이콘(192/512)을 마스코트 픽셀아트로 교체 (투명 배경)
  - `scripts/gen-icons.mjs`: 의존성 없이 Node 내장 zlib로 PNG 직접 생성
  - manifest 아이콘 용도 `any maskable` → `any` (투명 배경에 맞춤)

### chore
- SW 캐시 `qh-v5` → `qh-v6`

---

## [2026-06-17] — 하단 nav + 자격증 단계 타임라인 (사용성 우선)

### feat
- **하단 네비게이션**: 상단 텍스트 탭 → 하단 아이콘 nav (홈/일정/공고 3개)
  - 달력·자격증을 '일정' 하나로 통합
- **자격증 단계 타임라인**: 필기지원 → 필기합격 → 실기지원 → 실기합격
  - 날짜로 자동 진행 표시 + 단계 탭하여 합격/불합격 수동 보정
  - `src/components/CertTimeline.js`, `src/services/progressService.js`(localStorage)
- **일정 페이지**: `src/pages/SchedulePage.js` — 세그먼트(타임라인/달력) 전환

### refactor
- `CalendarPage.js`: 달력 렌더를 `mountCalendar(root, exams, jobs)`로 추출해 재사용
- `ExamPage.js` 제거 (자격증 탭 → 일정 타임라인으로 흡수)

### chore
- SW 캐시 `qh-v4` → `qh-v5`

---

## [2026-06-17] — 달력 + UX 개선

### feat
- **달력 탭 추가**: 월별 달력에 일정 표시 + 날짜 탭 시 상세
  - `src/utils/calendar.js`: 월 그리드 생성, 시험/공고 → 이벤트 변환
  - `src/pages/CalendarPage.js`: 달 이동, 오늘/선택일 강조, 색 점 마커
  - 이벤트 색: 시험(코랄)/접수(앰버)/발표(틸)/마감(레드)
- **공고 탭 필터**: 전체 / 관심(북마크) 세그먼트 컨트롤
- 탭 구성: 홈 / 달력 / 공고 / 자격증
- Icon: calendar, chevronLeft/Right 추가

### chore
- SW 캐시 v4

---

## [2026-06-17] — 자격증 일정 정확도 보정

### fix
- 빅데이터분석기사·정보보안기사는 큐넷(인력공단) API에 없는 별도 시행 종목 확인
  - 빅데이터분석기사: 데이터자격검정, 연 2회(제12·13회)
  - 정보보안기사: KCA 시행, 정기 기사와 다른 일정
- 두 종목 2026 실제 일정을 `MANUAL_SCHEDULES`로 직접 입력, 큐넷 매칭에서 제외
- 수동 종목의 기존 오염(정기 기사) 행 자동 삭제
- PostgREST 일괄 upsert 위해 행 컬럼 정규화

### chore
- sync_logs 디버그용 읽기 정책 제거(원복)
- collect.yml 임시 트리거 제거

### 결과 (검증)
- 정보처리기사(큐넷) + 빅데이터/정보보안(수동) = 종목별 정확한 일정 8건

---

## [2026-06-17] — 데이터 수집 스크립트 연결

### feat
- `scripts/collect.mjs`: 큐넷(자격증 일정) + 원티드(공고) 수집기
  - service_role로 Supabase upsert, DRY_RUN 로컬 테스트 모드
- `.github/workflows/collect.yml`: 매일 06:00 KST 자동 수집 + 수동 실행

### 설계 결정 (변경)
- **스케줄러: Supabase pg_cron → GitHub Actions cron** (Edge Function 배포 불필요, 퍼블릭 repo 무료)

### API 스펙 확인
- 큐넷: `apis.data.go.kr/B490007/qualExamSchd/getQualExamSchdList` (implYy, qualgbCd=T, jmCd / doc·prac 일자 필드)
- 원티드: `wanted.co.kr/api/chaos/navigation/v1/results` (job_group_id=518, job_ids=669=Frontend)

### 검증
- 원티드 dry-run 통과: 100건 수신 → 49건 매칭 (프론트·서울·경력≤3)

### 필요 (1회 수동) — 완료
- GitHub Secret 2개: `SUPABASE_SERVICE_ROLE_KEY`, `DATA_GO_KR_KEY` 등록
- data.go.kr "국가자격 시험일정 조회" 활용신청 → 키 발급

### 첫 수집 결과 (검증 완료)
- 원티드 공고 50건 수집
- 큐넷 자격증 일정 9건 수집 (정보처리기사 정기 1·2·3회 등)

### 큐넷 API 동작 정리 (디버깅 끝에 확정)
- numOfRows 최대 50 → 페이지네이션 필요
- 응답 구조는 `json.body.items` (response 래퍼 없음)
- 이 API는 **등급별(기사/산업기사/기능사) 정기시험 일정**만 제공 (종목 구분 없음)
  → cert.category('기사')로 매칭
- 같은 회차 중복 반환 → (종목,회차) dedup 후 upsert
- **주의**: 빅데이터분석기사·정보보안기사는 실제로 별도 일정일 수 있어
  정기 기사 일정으로 채워진 값은 부정확할 수 있음 (추후 종목별 소스 검토)

---

## [2026-06-17] — 마스코트 단순화 + 아이콘화 (이모지 제거)

### feat
- `src/components/Icon.js`: 라인 아이콘 세트(SVG) — bell/cap/briefcase/bookmark/link/x/inbox/alert/plus
- 마스코트 미니멀 리디자인: 둥근 네모 + 점 눈 2개 (적은 도트)

### refactor
- 모든 이모지 → 라인 아이콘 교체 (페이지 타이틀/공고 버튼/빈 상태/FAB)
- 버튼·타이틀·빈상태 아이콘 정렬 CSS

### chore
- SW 캐시 v3

---

## [2026-06-17] — UI 컨셉 적용 (Claude 감성 + 도트)

### feat
- 디자인 컨셉 확정: 크림/코랄 팔레트 + 도트(픽셀) 감성
- `assets/mascot.png`: 오리지널 도트 마스코트 (헤더에 표시)
- `tools/generate-mascot.mjs`: 의존성 없는 마스코트 생성기
- `src/styles/main.css` 전면 리스킨
  - 폰트 Pretendard (CDN)
  - 메인 컬러 `--brand` 단일 토큰 → 나머지 color-mix 자동 파생 (교체 쉬움)
  - 도트 배경 패턴, 각진 뱃지/FAB, 마스코트 pixelated

### chore
- manifest/theme-color 크림(#f5f4ee)으로
- SW 캐시 버전 v2 (새 스타일 반영)

### 참고
- Anthropic 마스코트 직접 복제 대신 동일 감성의 오리지널 캐릭터 제작 (상표 회피)

---

## [2026-06-17] — PWA 완성 (오프라인 + 설치)

### feat
- `sw.js`: Service Worker (앱 셸 캐시, Supabase는 네트워크 우선)
- `src/app.js`: Service Worker 등록 추가
- `icons/icon-192.png`, `icon-512.png`: 앱 아이콘 생성
- `tools/generate-icons.mjs`: 의존성 없는 아이콘 생성기 (Node zlib)
- `manifest.json`: 아이콘 purpose "any maskable" 추가

### 결과
- 이제 "홈 화면에 추가" 설치 가능 (오프라인 동작)

---

## [2026-06-17] — GitHub Pages 배포 설정

### ci
- `.github/workflows/deploy.yml`: master push 시 GitHub Pages 자동 배포
- 빌드 없는 정적 사이트 → 루트 전체 업로드
- 모든 경로 상대경로라 서브경로(/qualifications_helper/)에서도 동작

### 필요 (1회 수동) — 완료
- 저장소 public 전환 (private는 Pages 유료)
- Settings → Pages → Source = "GitHub Actions"
- Settings → Actions → Workflow permissions = Read and write

### 배포 완료
- 라이브: https://piaoria.github.io/qualifications_helper/
- index/JS/CSS/manifest 전부 정상 로드 확인

---

## [2026-06-17] — 와이어프레임 UI 구현

### feat
- `index.html`: 앱 셸 (헤더 / 탭 네비 / 뷰 / FAB)
- `manifest.json`: PWA 매니페스트
- `src/styles/main.css`: 와이어프레임 스타일 (모바일 퍼스트, 점선 박스)
- `src/app.js`: 탭 라우팅 (대시보드/공고/자격증)
- 컴포넌트: `DdayBadge`, `ExamItem`, `JobCard`, `EmptyState`
- 페이지: `DashboardPage`, `ExamPage`, `JobPage`
- 유틸: `date.js`(D-day 계산), `dom.js`(html/esc 헬퍼)

### 확인
- 로컬 서빙 정상 (npx serve)
- 전체 JS 문법 체크 통과
- 자격증 종목 3개 DB→화면 표시 확인

### 참고
- Python 미설치(스토어 더미) → 로컬 서버는 `npx serve` 사용
- 아이콘(icons/) 미생성 → PWA 설치용 추후 추가

---

## [2026-06-17] — Supabase 프론트 연동

### feat
- `src/config.js`: Supabase URL + anon key
- `src/services/supabaseClient.js`: supabase-js 클라이언트 (CDN ESM)
- `src/services/certificationService.js`: 자격증/시험일정 조회
- `src/services/jobService.js`: 공고 조회 + 북마크/숨김 토글

### 확인
- Supabase 프로젝트 생성 (region: ap-northeast-2)
- schema.sql 실행 완료 → 테이블 5종 + 초기 자격증 3종목 생성
- anon key 연결 테스트 통과 (REST 읽기 OK)

---

## [2026-06-16] — DB 스키마 & 아키텍처 확정

### feat
- `db/schema.sql` 추가: Supabase 테이블 5종
  - `certifications` (자격증 종목 마스터)
  - `exam_schedules` (큐넷 시험 회차별 일정, 필기/실기)
  - `job_filters` (원티드 공고 수집 조건)
  - `job_postings` (채용 공고, 북마크/숨김)
  - `sync_logs` (스케줄러 실행 로그)
  - RLS 정책 + updated_at 트리거 포함

### chore
- `.gitignore` 추가
- `.claude/settings.json` 권한/훅 설정

### 설계 결정 (변경)
- **데이터 저장: localStorage → Supabase 전환** (자동 수집/알림 위해 백엔드 필요)
- 배포: GitHub Actions → GitHub Pages (정적, HTTPS)
- 알림 방식: 푸시 X, "열면 최신" pull 방식
- 데이터 소스: 큐넷(공공데이터포털 API), 원티드(비공식 API)
- 타겟 자격증: 정보처리기사, 빅데이터분석기사, 정보보안기사

---

## [2026-06-16] — 프로젝트 초기화

### docs
- `CLAUDE.md` 작성: 프로젝트 규칙, 디렉터리 구조, 컴포넌트 원칙, 기능 우선순위 정의
- `README.md` 작성: 프로젝트 소개, 기술 스택, UI 와이어프레임, 시작 방법
- `CHANGELOG.md` 생성

### 설계 결정 (Claude와 협의)
- 기술 선택: Vanilla JS + PWA (프레임워크 없이 학습 부담 최소화)
- 데이터 저장: localStorage 우선 (MVP 단계), IndexedDB는 추후 전환
- UI 방침: 모바일 퍼스트, 와이어프레임 스타일, 컴포넌트/서비스/페이지 레이어 분리
- 기능 우선순위: 자격증 일정 → 채용공고 → 대시보드 → PWA → 푸시 알림

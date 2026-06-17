# CHANGELOG

변경 형식: `[타입] 설명` — 타입: `feat` / `fix` / `style` / `docs` / `refactor` / `chore`

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

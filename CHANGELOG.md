# CHANGELOG

변경 형식: `[타입] 설명` — 타입: `feat` / `fix` / `style` / `docs` / `refactor` / `chore`

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

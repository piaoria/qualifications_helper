# CLAUDE.md — qualifications_helper

## 프로젝트 개요
취업 준비생을 위한 **채용공고 + 자격증 시험 일정 통합 관리 PWA**.
직장을 다니면서 취준하는 바쁜 사용자가 공고 마감일과 시험 일정을 놓치지 않도록 돕는다.

---

## 기술 스택
- **언어**: JavaScript (Vanilla JS 우선, 필요 시 경량 라이브러리 도입)
- **형태**: PWA (Progressive Web App)
  - `manifest.json` — 홈 화면 추가, 앱 아이콘
  - `service-worker.js` — 오프라인 캐시, 푸시 알림
- **스타일**: CSS (컴포넌트 단위 파일 분리, 와이어프레임 우선)
- **데이터 저장**: `localStorage` → 추후 IndexedDB 또는 외부 API 연동 고려

---

## 디렉터리 규칙

```
qualifications_helper/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── components/      # 재사용 가능한 UI 컴포넌트
│   ├── pages/           # 페이지 단위 뷰
│   ├── services/        # 데이터 CRUD, API 호출
│   ├── store/           # 상태 관리 (간단한 pub/sub 또는 전역 객체)
│   └── utils/           # 날짜 포맷, 유효성 검사 등 순수 함수
├── sw.js                # Service Worker (루트에 위치해야 스코프 전체 적용)
├── CLAUDE.md
├── README.md
└── CHANGELOG.md
```

---

## 컴포넌트 & 섹션 원칙
- **한 파일 = 한 컴포넌트**: 파일명은 PascalCase (`JobCard.js`, `ExamItem.js`)
- **컴포넌트는 순수하게**: 데이터를 props(인자)로 받고, DOM 조작만 담당
- **서비스 레이어 분리**: 데이터 저장/불러오기는 `services/`에서만 처리
- **페이지는 컴포넌트 조합**: `pages/`는 레이아웃 + 컴포넌트 조립만 담당

---

## 코드 스타일
- 들여쓰기: 스페이스 2칸
- 세미콜론: 사용
- 변수: `const` 우선, 재할당 필요 시 `let`, `var` 금지
- 함수: 화살표 함수 우선
- 주석: WHY가 명확하지 않은 곳에만 한 줄 작성, 설명용 주석 금지
- 파일 인코딩: UTF-8

---

## 기능 우선순위 (MVP 기준)
1. **자격증 시험 일정 등록/조회** — 시험명, 접수일, 시험일, 결과발표일
2. **채용공고 등록/조회** — 회사명, 포지션, 마감일, 링크, 메모
3. **D-day 뱃지** — 오늘 기준 남은 일수 표시
4. **홈 대시보드** — 임박한 일정 상위 노출
5. **PWA 설치 + 오프라인 지원**
6. **알림(Notification)** — 마감 N일 전 브라우저 푸시

---

## 변경 관리
- 기능 추가/수정 시 `CHANGELOG.md`에 항목 추가 (형식: `## [날짜] — 변경 내용`)
- 커밋 메시지: `[타입] 설명` 형식 (`feat`, `fix`, `style`, `docs`, `refactor`, `chore`)
- 스크린샷 또는 와이어프레임 변경 시 `docs/wireframes/`에 이미지 보관

---

## 개발 환경
- 모든 개발은 모바일 `/rc` (Remote Control) 모드로 진행
- Claude 응답은 모바일 화면 기준으로 작성
  - 응답은 짧고 간결하게
  - 넓은 표나 ASCII 다이어그램 지양 (모바일 너비 ~40자 기준)
  - 헤더 + 짧은 불릿 위주 구성
  - 한 번에 많은 정보 나열 금지

## Claude와 협업 시 주의사항
- 컴포넌트 신규 추가 시 반드시 `src/components/`에 배치
- 데이터 모델 변경 시 `services/` 먼저 수정 후 컴포넌트 반영
- 기능 완성 후 `CHANGELOG.md` 업데이트 제안
- UI 변경 시 모바일(360px 기준) 레이아웃 우선 확인
- 외부 라이브러리 도입 제안 시 번들 크기와 PWA 호환성 명시

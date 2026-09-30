# 프로젝트 지도 (PROJECT MAP)

처음 이 프로젝트를 열었을 때 "이게 다 뭐지" 싶으면 이 파일부터 읽으면 됨.
지도처럼: 여기서 큰 구역을 먼저 보고 → 필요한 폴더로 들어가서 → 그 안 파일들의
역할을 확인하면 됨. **각 파일을 열면 맨 위에도 똑같은 설명이 주석으로 달려있음.**

```
exercise-friend-next/
├─ app/            → Next.js 라우팅 + API 서버 + 전역 스타일
│  ├─ layout.js, page.js       (거의 안 건드림, App.jsx로 위임)
│  ├─ globals.css              (디자인 시스템 전체: 색상, 버튼, 카드 등)
│  └─ api/*/route.js           (서버 API 13개, 전부 Supabase에 저장/조회)
│
├─ components/     → 화면에 보이는 모든 것 (React 컴포넌트 20개)
│  └─ App.jsx 가 시작점. 여기서부터 읽으면 전체 흐름이 보임
│
├─ lib/            → 화면 없이 계산/데이터가공만 하는 로직 모음
│  ├─ logic.js      (제일 중요, 거의 모든 컴포넌트가 여기서 함수를 가져다 씀)
│  ├─ steps.js       (온보딩 7단계 질문 내용)
│  ├─ ranking.js     (체력인증 순위 계산)
│  └─ supabaseClient.js (DB 연결, API 라우트 전용)
│
├─ public/data/    → 가공된 공공데이터 JSON (자세한 설명은 이 폴더의 README.md)
│
├─ supabase/       → DB 테이블 만드는 SQL (자세한 설명은 이 폴더의 README.md)
│
├─ README.md            → 설치/실행 방법, 데이터 출처, 개인정보 처리 안내
├─ BRAND.md             → 왜 이 색상(흑백+주황)을 골랐는지 근거
├─ ACCESSIBILITY.md     → 명암비 실측 결과, 뭘 고쳤는지
└─ PROJECT_MAP.md       → 지금 읽고 있는 이 파일
```

## "이 기능은 어느 파일이야?" 빠른 찾기

| 찾고 싶은 기능 | 화면(components) | 서버(app/api) | DB 테이블 |
|---|---|---|---|
| 온보딩 설문 | QuizStep, App, ResumePrompt | - | (localStorage만 씀) |
| 홈 화면 전체 | HomeScreen | - | - |
| 지역 형평성 지수 | InfoCards(EquityCard) | - | (public/data/region_index.json) |
| 이번 주 일정 | CalendarWidget | - | - |
| 시설 카드 | FacilityCard | - | - |
| 후기 | FacilityReviews | api/reviews | reviews |
| 후기 신고 | FacilityReviews | api/reviews/report | review_reports |
| 예약/문의 | BookingRequest | api/booking-requests | booking_requests |
| 체력인증 도전과제 | CertChallenge (MypageScreen 안에 있음) | api/cert-records | cert_submissions |
| 커뮤니티 글/댓글/참여 | CommunityScreen | api/community-posts, .../join, .../comments, .../[id] | community_posts, community_joins, community_comments |
| 검색 | SearchScreen | - | (public/data/kspo_data.json) |
| 큰글씨 모드 | A11yBar, App | - | - |
| 탭 이동 | TabBar, TrackBar | - | - |

## 데이터가 어디서 와서 어디로 가는지 (전체 흐름)

```
공공데이터 원본(JSON, 정적파일)  →  lib/logic.js가 가공  →  components가 화면에 표시
사용자가 입력한 것(후기/예약/체력기록/커뮤니티)  →  components가 fetch  →  app/api  →  Supabase DB에 저장
```

즉 "우리 동네 시설/체력기준/운동영상" 같은 건 전부 **정적 파일**(빌드 시점에
이미 가공 완료), "후기/예약/커뮤니티" 같은 **사용자가 직접 남기는 것**만
Supabase DB로 감. 이 둘을 헷갈리지 않는 게 중요함.

## 더 자세히 알고 싶으면
- 어떤 SQL을 어떤 순서로 실행해야 하는지 → `supabase/README.md`
- 각 JSON 데이터 파일이 뭔지 → `public/data/README.md`
- 왜 이 디자인/색상인지 → `BRAND.md`
- 접근성 관련해서 뭘 검증하고 고쳤는지 → `ACCESSIBILITY.md`
- 설치하고 실행하는 법 → `README.md`

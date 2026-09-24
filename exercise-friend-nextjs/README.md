# 운동친구 (Next.js 버전)

체육 복지 취약지역 주민을 위한 맞춤 운동 프로그램 추천 서비스 프로토타입입니다.
기존 단일 HTML 프로토타입을 Next.js(App Router) 구조로 옮겼습니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속.

> 이 대화 환경(샌드박스)은 인터넷이 막혀 있어서 `npm install`을 직접 실행해줄 수 없었습니다.
> 로컬 컴퓨터에서 위 명령어를 실행하면 됩니다. Node.js 18 이상 권장.

## 폴더 구조

```
app/
  layout.js       루트 레이아웃 (메타데이터, globals.css 로드)
  page.js         진입점 (App 컴포넌트 렌더)
  globals.css     기존 프로토타입의 디자인 시스템 그대로 포팅
components/
  App.jsx         전체 상태 관리 (온보딩 답변, 현재 화면, 탭 등)
  A11yBar.jsx     큰글씨 / 고대비 모드 토글
  TrackBar.jsx    온보딩 진행 트랙(점 9개)
  TabBar.jsx      홈/캘린더/커뮤니티/마이 탭
  QuizStep.jsx    온보딩 질문 화면 (단일/다중/텍스트/동적선택)
  DoneScreen.jsx  설문 완료 요약 화면
  HomeScreen.jsx  맞춤 추천 결과 (지역형평성, 주간루틴, 체력참고, 재활영상,
                  목적별가이드, 시설목록, 장애인시설)
  CalendarScreen.jsx    요일별 프로그램
  CommunityScreen.jsx   동네 모임 매칭 (mock)
  MypageScreen.jsx      북마크·SMS알림·체력인증 도전과제
  FacilityCard.jsx      시설 카드 (후기 + 접근성 제보 포함)
  VideoCard.jsx         재활/가이드 영상 카드
  InfoCards.jsx         지역형평성 / 주간루틴 / 체력참고 카드
  CertChallenge.jsx     국민체력100 인증 체크리스트
lib/
  steps.js        온보딩 9단계 질문 은행
  logic.js        지역매칭, 체력참고, 영상필터, 형평성, 루틴, 인증 매칭 등
                  핵심 로직 전부 (순수 함수라 테스트하기 쉬움)
public/data/
  *.json          공공데이터를 가공한 정적 데이터 (지금은 정적 파일, 나중에
                  백엔드 API로 교체 가능)
```

## 원본 HTML 프로토타입과 달라진 점

- **상태 관리**: `innerHTML` 문자열 조립 대신 React state(`useState`)와 JSX로 관리합니다.
- **데이터 로딩**: `<script type="application/json">`에 박아넣던 방식 대신, `/public/data/*.json`을
  `fetch()`로 불러옵니다. 나중에 백엔드가 준비되면 이 fetch 주소만 실제 API 엔드포인트로
  바꾸면 됩니다.
- **로직 재사용**: 지역 매칭, 체력 참고, 형평성 계산 등은 모두 `lib/logic.js`의 순수 함수로
  분리되어 있어, 컴포넌트와 무관하게 테스트하거나 재사용하기 쉽습니다.

## 아직 mock인 부분 (백엔드 연동 필요)

- 시설 예약 / 문의 버튼
- 커뮤니티 가입, 문자(SMS) 알림, 강좌 알림 설정
- 리뷰(별점) — `facility.rv` 필드가 없으면 표시되지 않음. 크롤링 데이터를
  `{avg, count, top:[...]}` 형태로 채워주면 자동으로 나타남
- 접근성 제보 — 지금은 `localStorage`(내 브라우저에만 저장)로 동작. 여러 사용자와
  공유하려면 서버 DB 연동 필요

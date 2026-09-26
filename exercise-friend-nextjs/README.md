# 운동친구 (Next.js 버전)

체육 복지 취약지역 주민을 위한 맞춤 운동 프로그램 추천 서비스 프로토타입입니다.

## 실행 방법 (Supabase 설정 필요)

이 프로젝트는 후기·예약신청·체력인증기록·접근성정보를 **Supabase(무료 Postgres + 파일저장소)**에 저장합니다.
로컬 파일에만 저장하던 이전 버전과 달리, 실제 서버(Vercel 등)에 배포해도 데이터가 사라지지 않습니다.

### 1. Supabase 프로젝트 만들기
1. https://supabase.com 에서 무료 회원가입 후 새 프로젝트 생성
2. 왼쪽 메뉴 **SQL Editor** 클릭 → 이 프로젝트의 `supabase/schema.sql` 파일 내용을 그대로 붙여넣고 실행
   (`reviews`, `booking_requests`, `cert_submissions`, `accessibility_reports` 4개 테이블이 생성됩니다)
3. 왼쪽 메뉴 **Storage** 클릭 → **New bucket** → 이름을 정확히 `review-photos` 로 입력, **Public bucket** 옵션 체크 후 생성
   (후기 사진이 저장될 공간입니다)
4. 왼쪽 메뉴 **Project Settings > API** 클릭 → `Project URL`과 `service_role` 키(secret) 복사

### 2. 환경변수 설정
프로젝트 루트에 `.env.local.example`을 복사해서 `.env.local` 파일을 만들고, 위에서 복사한 값을 채워넣습니다.

```bash
cp .env.local.example .env.local
```

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=여기에_service_role_키_붙여넣기
```

> ⚠️ `service_role` 키는 매우 강력한 권한을 가진 키입니다. 절대 GitHub에 커밋하거나
> 브라우저(클라이언트) 코드에 넣지 마세요. `.env.local`은 `.gitignore`에 포함되어 있어
> 커밋되지 않습니다.

### 3. 설치 및 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속.

## 배포 (Vercel)

1. GitHub에 이 프로젝트를 올린 뒤 [vercel.com](https://vercel.com)에서 Import
2. Vercel 프로젝트 설정 > Environment Variables 에서 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 동일하게 등록
3. Deploy — 배포된 도메인이 곧 제출서류의 "서비스 URL"입니다

## 폴더 구조

```
app/
  layout.js, page.js, globals.css
  api/
    reviews/route.js            후기 저장·조회 (Supabase + Storage)
    booking-requests/route.js   예약 신청서 저장
    cert-records/route.js       체력인증 실측기록 저장 + 순위 계산 (이상치 검증 포함)
    accessibility/route.js      접근성 정보 크라우드소싱 (전체 사용자 공유)
components/                     화면 구성 요소
lib/
  steps.js                      온보딩 9단계 질문 은행
  logic.js                      지역매칭·체력참고·영상필터·형평성·루틴 등 순수 로직
  supabaseClient.js              Supabase 서버 클라이언트 (API 라우트 전용)
public/data/                    공공데이터 가공 정적 JSON (지역/시설/체력기준 등)
supabase/schema.sql             Supabase 테이블 생성 SQL
```

## 아직 정적 데이터인 부분

`public/data/*.json`(시설·강좌·체력기준 등)은 여전히 특정 시점에 내려받은 스냅샷입니다.
실시간 공공데이터 API 연동은 다음 단계 과제입니다.

## 개인정보 처리 관련

예약 신청 시 수집하는 연락처는 시설 확인 연락 목적으로만 사용하며, 화면에 안내 문구와 동의
체크박스를 넣어두었습니다. 다만 **자동 파기(30일 경과 시 삭제) 기능은 아직 구현되지 않았으므로**,
실제 운영 시에는 Supabase에서 주기적으로 오래된 레코드를 삭제하는 배치 작업을 별도로 만들어야 합니다.

-- ============================================================
-- 운동친구 서비스 DB 스키마
-- Supabase 프로젝트 생성 후, SQL Editor에 이 파일 내용을 그대로
-- 붙여넣고 실행하면 필요한 테이블 4개가 만들어져.
-- ============================================================

-- 1) 시설 후기 (별점 + 사진 + 텍스트 + 접근성 태그)
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  facility_key text not null,
  facility_name text not null,
  rating int not null check (rating between 1 and 5),
  text text not null default '',
  photo_url text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_reviews_facility_key on reviews (facility_key);

-- 2) 예약 신청서
create table if not exists booking_requests (
  id uuid primary key default gen_random_uuid(),
  facility_key text,
  facility_name text not null,
  facility_addr text,
  course_name text,
  phone text not null,
  message text,
  status text not null default '접수',
  created_at timestamptz not null default now()
);
create index if not exists idx_booking_facility_key on booking_requests (facility_key);

-- 3) 국민체력100 인증 도전과제 - 실측 기록 (전국/지역 순위 계산용)
create table if not exists cert_submissions (
  id uuid primary key default gen_random_uuid(),
  item text not null,
  stage text not null,
  age_range text not null,
  sex text not null,
  region text not null default '',
  value numeric not null,
  direction text not null check (direction in ('higher', 'lower')),
  created_at timestamptz not null default now()
);
create index if not exists idx_cert_bracket on cert_submissions (item, stage, age_range, sex);

-- 4) 접근성 정보 크라우드소싱 (시설별 태그 누적)
create table if not exists accessibility_reports (
  id uuid primary key default gen_random_uuid(),
  facility_key text not null,
  facility_name text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_accessibility_facility_key on accessibility_reports (facility_key);

-- 5) 커뮤니티 모임 게시글
create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  sport text not null,
  title text not null,
  message text not null default '',
  nickname text not null,
  join_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_community_region on community_posts (region);

-- ============================================================
-- Storage: 후기 사진을 담을 버킷도 하나 만들어야 해.
-- SQL로는 안 되고, Supabase 대시보드 > Storage 에서
-- "review-photos" 라는 이름으로 Public 버킷을 하나 생성해줘.
-- (자세한 방법은 README.md 참고)
-- ============================================================

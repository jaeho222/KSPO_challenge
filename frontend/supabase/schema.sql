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
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_reviews_facility_key on reviews (facility_key);

-- 1-1) 후기 신고 기록 (같은 사람이 같은 후기를 여러 번 신고 못 하게 (review_id, reporter) 유일)
create table if not exists review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews (id) on delete cascade,
  reporter_participant_id text not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (review_id, reporter_participant_id)
);

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
-- 참여자 구분용 컬럼 (이미 테이블이 있는 DB에서도 에러 없이 추가되도록 alter를 함께 둠)
alter table cert_submissions add column if not exists participant_id text;
create index if not exists idx_cert_participant on cert_submissions (participant_id);

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
  creator_participant_id text,
  max_members int,
  created_at timestamptz not null default now()
);
create index if not exists idx_community_region on community_posts (region);
create index if not exists idx_community_creator on community_posts (creator_participant_id);

-- 6-1) 커뮤니티 댓글
create table if not exists community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts (id) on delete cascade,
  nickname text not null,
  message text not null,
  participant_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_comments_post on community_comments (post_id);

-- 6) 커뮤니티 참여 신청 기록 (같은 사람이 같은 글에 중복 신청 못 하게)
create table if not exists community_joins (
  post_id uuid not null references community_posts (id) on delete cascade,
  participant_id text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, participant_id)
);
alter table community_joins enable row level security;

-- ============================================================
-- Storage: 후기 사진을 담을 버킷도 하나 만들어야 해.
-- SQL로는 안 되고, Supabase 대시보드 > Storage 에서
-- "review-photos" 라는 이름으로 Public 버킷을 하나 생성해줘.
-- (자세한 방법은 README.md 참고)
-- ============================================================

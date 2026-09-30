-- ============================================================
-- 추가 마이그레이션: 신고하기 실제 동작 + 커뮤니티 수정/삭제/댓글/정원
-- SQL Editor에서 한 번만 실행하면 돼. (여러 번 실행해도 안전함)
-- ============================================================

-- 1) 후기 숨김 처리용 컬럼 + 신고 기록 테이블
alter table reviews add column if not exists hidden boolean not null default false;

create table if not exists review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews (id) on delete cascade,
  reporter_participant_id text not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (review_id, reporter_participant_id)
);

-- 2) 커뮤니티: 작성자 식별 + 정원
alter table community_posts add column if not exists creator_participant_id text;
alter table community_posts add column if not exists max_members int;
create index if not exists idx_community_creator on community_posts (creator_participant_id);

-- 3) 커뮤니티 댓글
create table if not exists community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts (id) on delete cascade,
  nickname text not null,
  message text not null,
  participant_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_comments_post on community_comments (post_id);

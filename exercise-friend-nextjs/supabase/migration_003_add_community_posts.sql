-- ============================================================
-- 추가 마이그레이션: 커뮤니티 게시글 테이블 신규 생성
-- (이미 schema.sql을 실행해서 DB를 만든 경우, 이 파일을
--  SQL Editor에서 한 번 더 실행해줘야 해)
-- ============================================================

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

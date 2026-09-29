-- ============================================================
-- 추가 마이그레이션: reviews 테이블에 tags(접근성 정보) 컬럼 추가
-- (이미 schema.sql을 실행해서 테이블을 만든 경우, 이 파일을
--  SQL Editor에서 한 번 더 실행해줘야 해)
-- ============================================================

alter table reviews add column if not exists tags text[] not null default '{}';

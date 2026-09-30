-- ============================================================
-- 추가 마이그레이션: booking_requests 테이블에 facility_key 컬럼 추가
-- (이미 schema.sql을 한 번 실행해서 테이블을 만든 경우, 이 파일도
--  SQL Editor에서 한 번 더 실행해줘야 해. 새로 처음 만드는 경우엔
--  schema.sql에 이미 포함되어 있어서 이 파일은 필요 없음.)
-- ============================================================

alter table booking_requests add column if not exists facility_key text;
create index if not exists idx_booking_facility_key on booking_requests (facility_key);

-- ============================================================
-- 개인정보 자동 파기: 예약신청(booking_requests) 연락처를
-- 30일이 지나면 매일 자동으로 삭제함 (pg_cron 확장 사용)
-- 이 파일은 SQL Editor에서 딱 한 번만 실행하면 돼.
-- ============================================================

-- 1) pg_cron 확장 활성화 (Supabase에서 기본 지원, 없으면 새로 켬)
create extension if not exists pg_cron;

-- 2) 30일 지난 예약신청 데이터를 지우는 함수
create or replace function delete_old_booking_requests()
returns void
language plpgsql
security definer
as $$
begin
  delete from booking_requests
  where created_at < now() - interval '30 days';
end;
$$;

-- 3) 매일 새벽 3시(UTC, 한국시간 낮 12시)에 자동 실행되도록 예약
--    이미 같은 이름의 예약이 있으면 먼저 지우고 다시 등록함 (재실행해도 안전)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'delete-old-booking-requests') then
    perform cron.unschedule('delete-old-booking-requests');
  end if;
end $$;

select cron.schedule(
  'delete-old-booking-requests',
  '0 3 * * *',
  $$ select delete_old_booking_requests(); $$
);

-- ============================================================
-- 확인 방법: 아래 쿼리로 예약이 잘 등록됐는지 볼 수 있음
--   select * from cron.job;
-- 수동으로 한 번 바로 실행해보고 싶으면:
--   select delete_old_booking_requests();
-- ============================================================

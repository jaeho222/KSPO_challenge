-- ============================================================
-- 추가 마이그레이션: 익명 참여자 구분 (중복 제출/중복 클릭 방지)
--  1) cert_submissions에 participant_id 컬럼 추가
--     → 한 사람이 여러 번 입력해도 순위 계산에서는 1명으로 셈
--  2) community_joins 테이블 신규 생성
--     → 같은 사람이 같은 모임에 참여 신청을 여러 번 눌러도 1번만 인정
-- SQL Editor에서 한 번만 실행하면 돼. (여러 번 실행해도 안전함)
-- ============================================================

-- 1) 체력인증 기록에 참여자 ID 추가
alter table cert_submissions add column if not exists participant_id text;
create index if not exists idx_cert_participant on cert_submissions (participant_id);

-- 2) 커뮤니티 참여 신청 기록 (참여자 + 글 조합은 딱 1번만 허용)
create table if not exists community_joins (
  post_id uuid not null references community_posts (id) on delete cascade,
  participant_id text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, participant_id)
);
alter table community_joins enable row level security;

-- ============================================================
-- (선택) 테스트하면서 쌓인 예전 기록 정리하기
-- participant_id가 없는 예전 기록은 "각각 다른 사람"으로 계산돼서,
-- 개발 중 혼자 여러 번 입력한 테스트 데이터가 있으면 인원수가 부풀려 보여.
-- 테스트 데이터를 지워도 괜찮다면 아래 줄의 맨 앞 '--'를 지우고 실행해.
-- (주의: 되돌릴 수 없으니 실제 사용자 데이터가 없을 때만!)
--
-- delete from cert_submissions where participant_id is null;
-- ============================================================

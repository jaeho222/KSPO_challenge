# supabase 폴더 설명

## 이 폴더가 하는 일
Supabase(Postgres DB)에 필요한 테이블/함수/예약작업을 만드는 SQL 모음.
SQL Editor에서 직접 실행해야 하고, 앱 코드가 자동으로 실행해주지 않음.

## 새로 시작할 때 (테이블이 하나도 없는 상태)
`schema.sql` **하나만** 실행하면 됨. 지금까지의 모든 migration 내용이
전부 이 파일 안에 이미 합쳐져 있음. (`migration_004`의 pg_cron만 예외 - 아래 참고)

## 이미 테이블이 있는 상태에서 하나씩 따라온 경우
아래 순서대로, 없는 것만 실행 (전부 `if not exists` 방식이라 중복 실행해도 안전함):

| 순서 | 파일 | 내용 |
|---|---|---|
| ① | `schema.sql` | 테이블 6개 전체 생성 (reviews, booking_requests, cert_submissions, accessibility_reports*, community_posts, community_joins, community_comments, review_reports) |
| ② | `migration_004_auto_delete_booking_requests.sql` | **schema.sql에 없는 유일한 것.** pg_cron으로 예약신청 연락처 30일 후 자동삭제 |

*`accessibility_reports`는 만들어뒀지만 실제로는 안 씀 (접근성 정보가 후기 태그 기능으로 통합됨)

`migration_001`~`003`, `005`, `006`은 전부 schema.sql에 이미 통합되어 있어서
개별 실행은 필요 없음 (과거 작업 순서를 기록으로 남겨두기 위해 파일은 지우지 않음).

## 테이블별 역할 요약

| 테이블 | 역할 | 쓰는 곳 |
|---|---|---|
| `reviews` | 시설 후기 (별점/텍스트/사진/접근성태그/숨김여부) | app/api/reviews |
| `review_reports` | 후기 신고 기록 (3명 신고 시 자동 숨김) | app/api/reviews/report |
| `booking_requests` | 예약/문의 신청 (30일 후 자동삭제) | app/api/booking-requests |
| `cert_submissions` | 체력인증 실측 기록 (참여자ID로 중복 제거 후 순위 계산) | app/api/cert-records |
| `community_posts` | 커뮤니티 모임 글 (작성자ID/정원 포함) | app/api/community-posts |
| `community_joins` | 모임 참여 신청 기록 (중복 신청 방지 + 정원 체크) | app/api/community-posts/join |
| `community_comments` | 커뮤니티 댓글 | app/api/community-posts/comments |

## Storage (SQL 아님, 대시보드에서 직접 설정)
Storage 메뉴에서 `review-photos`라는 이름의 **Public 버킷**을 만들어야
후기 사진 업로드가 동작함.

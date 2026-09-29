// ============================================================
// [후기 신고 접수 API]
// - 호출하는 곳: components/FacilityReviews.jsx의 "🚩 신고하기" 버튼
// - review_reports 테이블에 (review_id, reporter_participant_id) 유니크로 저장
//   (같은 사람이 같은 후기를 여러 번 신고 못 하게)
// - 서로 다른 참여자 3명 이상이 신고하면(HIDE_THRESHOLD) reviews.hidden=true로
//   자동 전환 → 이후 목록 조회(GET /api/reviews)에서 자동으로 안 보이게 됨
// ============================================================

import { getSupabaseServerClient } from "../../../../lib/supabaseClient";

export const runtime = "nodejs";

const HIDE_THRESHOLD = 3; // 서로 다른 참여자 3명 이상이 신고하면 자동 숨김

export async function POST(request) {
  try {
    const { reviewId, reason, participantId } = await request.json();
    if (!reviewId) {
      return Response.json({ error: "reviewId required" }, { status: 400 });
    }
    if (typeof participantId !== "string" || participantId.length < 8 || participantId.length > 64) {
      return Response.json({ error: "참여자 정보를 확인할 수 없어요. 페이지를 새로고침한 뒤 다시 시도해주세요." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // 같은 사람이 같은 후기를 두 번 신고하면 (review_id, reporter) 중복으로 걸러짐
    const { error: insertError } = await supabase
      .from("review_reports")
      .insert({ review_id: reviewId, reporter_participant_id: participantId, reason: (reason || "").slice(0, 100) });

    let alreadyReported = false;
    if (insertError) {
      if (insertError.code === "23505") {
        alreadyReported = true;
      } else if (insertError.code === "23503") {
        return Response.json({ error: "존재하지 않는 후기예요." }, { status: 404 });
      } else {
        return Response.json({ error: `신고 접수에 실패했어요: ${insertError.message}` }, { status: 500 });
      }
    }

    // 누적 신고 수(서로 다른 사람 기준) 확인 후, 기준 넘으면 자동 숨김
    const { count, error: countError } = await supabase
      .from("review_reports")
      .select("id", { count: "exact", head: true })
      .eq("review_id", reviewId);

    if (!countError && count >= HIDE_THRESHOLD) {
      await supabase.from("reviews").update({ hidden: true }).eq("id", reviewId);
    }

    return Response.json({ alreadyReported, reportCount: count ?? null });
  } catch (e) {
    return Response.json({ error: `서버 오류: ${e.message || String(e)}` }, { status: 500 });
  }
}

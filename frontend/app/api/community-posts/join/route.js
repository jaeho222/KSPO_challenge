// ============================================================
// [모임 참여 신청 API]
// - 호출하는 곳: components/CommunityScreen.jsx의 "참여 신청하기" 버튼
// - community_joins 테이블에 (post_id, participant_id) 쌍으로 저장, 이 조합이
//   유니크 제약이라 같은 사람이 두 번 신청해도 자동으로 막힘(23505 에러로 감지)
// - 정원(max_members)이 찬 모임은 새 참여자를 거절함 (이미 신청한 사람은 예외)
// ============================================================

import { getSupabaseServerClient } from "../../../../lib/supabaseClient";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { postId, participantId } = await request.json();
    if (!postId) {
      return Response.json({ error: "postId required" }, { status: 400 });
    }
    if (typeof participantId !== "string" || participantId.length < 8 || participantId.length > 64) {
      return Response.json({ error: "참여자 정보를 확인할 수 없어요. 페이지를 새로고침한 뒤 다시 시도해주세요." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // 정원이 찼는지 먼저 확인 (이미 신청한 사람이 다시 누르는 건 막지 않음)
    const { data: postRow, error: postError } = await supabase
      .from("community_posts")
      .select("join_count, max_members")
      .eq("id", postId)
      .single();
    if (postError) {
      return Response.json({ error: "존재하지 않는 모임이에요." }, { status: 404 });
    }
    if (postRow.max_members && postRow.join_count >= postRow.max_members) {
      const { data: myJoin } = await supabase
        .from("community_joins")
        .select("post_id")
        .eq("post_id", postId)
        .eq("participant_id", participantId)
        .maybeSingle();
      if (!myJoin) {
        return Response.json({ error: "정원이 다 찼어요." }, { status: 409 });
      }
    }

    // 같은 참여자가 같은 글에 두 번 신청하면 (post_id, participant_id) 중복으로 걸러짐
    const { error: joinError } = await supabase
      .from("community_joins")
      .insert({ post_id: postId, participant_id: participantId });

    let alreadyJoined = false;
    if (joinError) {
      if (joinError.code === "23505") {
        alreadyJoined = true; // 이미 신청한 사람
      } else if (joinError.code === "23503") {
        return Response.json({ error: "존재하지 않는 모임이에요." }, { status: 404 });
      } else {
        return Response.json({ error: `참여 신청에 실패했어요: ${joinError.message}` }, { status: 500 });
      }
    }

    if (alreadyJoined) {
      return Response.json({ joinCount: postRow.join_count, alreadyJoined: true });
    }

    const { data, error } = await supabase
      .from("community_posts")
      .update({ join_count: (postRow.join_count || 0) + 1 })
      .eq("id", postId)
      .select("join_count")
      .single();
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ joinCount: data.join_count, alreadyJoined: false });
  } catch (e) {
    return Response.json({ error: `서버 오류: ${e.message || String(e)}` }, { status: 500 });
  }
}

// ============================================================
// [커뮤니티 댓글 조회/작성 API]
// - 호출하는 곳: components/CommunityScreen.jsx (글 카드 안 "댓글" 펼침 영역)
// - community_comments 테이블 사용. 간단한 시간순 목록 + 작성만 지원
//   (수정/삭제, 금칙어 필터는 아직 없음)
// ============================================================

import { getSupabaseServerClient } from "../../../../lib/supabaseClient";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    if (!postId) {
      return Response.json({ error: "postId required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("community_comments")
      .select("id, nickname, message, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const comments = data.map((c) => ({
      id: c.id,
      nickname: c.nickname,
      message: c.message,
      ts: new Date(c.created_at).getTime(),
    }));

    return Response.json({ comments });
  } catch (e) {
    return Response.json({ error: `서버 오류: ${e.message || String(e)}` }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { postId, nickname, message, participantId } = await request.json();
    if (!postId || !nickname || !message) {
      return Response.json({ error: "닉네임과 댓글 내용을 입력해주세요." }, { status: 400 });
    }
    if (typeof participantId !== "string" || participantId.length < 8) {
      return Response.json({ error: "참여자 정보를 확인할 수 없어요." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        nickname: nickname.toString().trim().slice(0, 20),
        message: message.toString().trim().slice(0, 300),
        participant_id: participantId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23503") {
        return Response.json({ error: "존재하지 않는 모임이에요." }, { status: 404 });
      }
      return Response.json({ error: `댓글 등록에 실패했어요: ${error.message}` }, { status: 500 });
    }

    return Response.json({
      comment: { id: data.id, nickname: data.nickname, message: data.message, ts: new Date(data.created_at).getTime() },
    });
  } catch (e) {
    return Response.json({ error: `서버 오류: ${e.message || String(e)}` }, { status: 500 });
  }
}

// ============================================================
// [커뮤니티 글 수정/삭제 API] URL의 [id] 부분이 글 ID (동적 라우트)
// - 호출하는 곳: components/CommunityScreen.jsx의 "수정"/"삭제" 버튼
// - assertOwner(): 요청한 participantId가 글 작성자(creator_participant_id)와
//   같은지 먼저 확인 -> 본인 글이 아니면 403 거절
// ============================================================
import { getSupabaseServerClient } from "../../../../lib/supabaseClient";

export const runtime = "nodejs";

async function assertOwner(supabase, id, participantId) {
  const { data, error } = await supabase.from("community_posts").select("creator_participant_id").eq("id", id).single();
  if (error) return { ok: false, status: 404, message: "존재하지 않는 모임이에요." };
  if (!data.creator_participant_id || data.creator_participant_id !== participantId) {
    return { ok: false, status: 403, message: "본인이 작성한 모임만 수정·삭제할 수 있어요." };
  }
  return { ok: true };
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { title, message, participantId, maxMembers } = await request.json();
    if (typeof participantId !== "string" || participantId.length < 8) {
      return Response.json({ error: "참여자 정보를 확인할 수 없어요." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const owner = await assertOwner(supabase, id, participantId);
    if (!owner.ok) return Response.json({ error: owner.message }, { status: owner.status });

    const patch = {};
    if (title !== undefined) patch.title = title.toString().trim().slice(0, 60);
    if (message !== undefined) patch.message = message.toString().trim().slice(0, 500);
    if (maxMembers !== undefined) {
      if (maxMembers === null || maxMembers === "") {
        patch.max_members = null;
      } else {
        const n = parseInt(maxMembers, 10);
        patch.max_members = Number.isFinite(n) && n > 0 && n <= 999 ? n : null;
      }
    }

    const { data, error } = await supabase.from("community_posts").update(patch).eq("id", id).select().single();
    if (error) {
      return Response.json({ error: `수정에 실패했어요: ${error.message}` }, { status: 500 });
    }

    return Response.json({
      post: {
        id: data.id,
        title: data.title,
        message: data.message,
        maxMembers: data.max_members,
      },
    });
  } catch (e) {
    return Response.json({ error: `서버 오류: ${e.message || String(e)}` }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get("participantId");
    if (typeof participantId !== "string" || participantId.length < 8) {
      return Response.json({ error: "참여자 정보를 확인할 수 없어요." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const owner = await assertOwner(supabase, id, participantId);
    if (!owner.ok) return Response.json({ error: owner.message }, { status: owner.status });

    const { error } = await supabase.from("community_posts").delete().eq("id", id);
    if (error) {
      return Response.json({ error: `삭제에 실패했어요: ${error.message}` }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: `서버 오류: ${e.message || String(e)}` }, { status: 500 });
  }
}

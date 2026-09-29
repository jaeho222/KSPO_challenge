// ============================================================
// [커뮤니티 글 목록조회/작성 API]
// - 호출하는 곳: components/CommunityScreen.jsx
// - GET: 지역별 글 목록 + 내가 참여했는지(joined)/내 글인지(mine)/정원찼는지(full)/
//   댓글개수까지 한 번에 계산해서 내려줌
// - POST: 글 작성. 도배 방지로 같은 참여자가 24시간 안에 5개 넘게 못 만들게 막음
//   (MAX_POSTS_PER_DAY 상수)
// ============================================================

import { getSupabaseServerClient } from "../../../lib/supabaseClient";

export const runtime = "nodejs";

const MAX_POSTS_PER_DAY = 5; // 한 사람이 하루에 만들 수 있는 모임 개수 (도배 방지)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const participantId = searchParams.get("participantId");

    const supabase = getSupabaseServerClient();
    let query = supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(30);
    if (region) query = query.eq("region", region);

    const { data, error } = await query;
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // 내가 이미 참여 신청한 글 목록, 댓글 개수를 한 번에 조회
    let joinedSet = new Set();
    const commentCounts = {};
    if (data.length) {
      const postIds = data.map((p) => p.id);
      const [{ data: joins }, { data: comments }] = await Promise.all([
        participantId
          ? supabase.from("community_joins").select("post_id").eq("participant_id", participantId).in("post_id", postIds)
          : Promise.resolve({ data: [] }),
        supabase.from("community_comments").select("post_id").in("post_id", postIds),
      ]);
      joinedSet = new Set((joins || []).map((j) => j.post_id));
      (comments || []).forEach((c) => {
        commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
      });
    }

    const posts = data.map((p) => ({
      id: p.id,
      region: p.region,
      sport: p.sport,
      title: p.title,
      message: p.message,
      nickname: p.nickname,
      joinCount: p.join_count,
      joined: joinedSet.has(p.id),
      mine: !!participantId && p.creator_participant_id === participantId,
      maxMembers: p.max_members,
      full: p.max_members ? p.join_count >= p.max_members : false,
      commentCount: commentCounts[p.id] || 0,
      ts: new Date(p.created_at).getTime(),
    }));

    return Response.json({ posts });
  } catch (e) {
    return Response.json({ error: `서버 오류: ${e.message || String(e)}` }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { region, sport, title, message, nickname, participantId, maxMembers } = body || {};

    if (!region || !sport || !title || !nickname) {
      return Response.json({ error: "지역, 종목, 제목, 닉네임은 필수예요." }, { status: 400 });
    }
    if (typeof participantId !== "string" || participantId.length < 8 || participantId.length > 64) {
      return Response.json({ error: "참여자 정보를 확인할 수 없어요. 페이지를 새로고침한 뒤 다시 시도해주세요." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // 도배 방지: 최근 24시간 안에 이 사람이 만든 모임이 너무 많으면 거절
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount, error: countError } = await supabase
      .from("community_posts")
      .select("id", { count: "exact", head: true })
      .eq("creator_participant_id", participantId)
      .gte("created_at", since);
    if (!countError && recentCount >= MAX_POSTS_PER_DAY) {
      return Response.json(
        { error: `하루에 만들 수 있는 모임 개수(${MAX_POSTS_PER_DAY}개)를 넘었어요. 내일 다시 시도해주세요.` },
        { status: 429 }
      );
    }

    let cleanMax = null;
    if (maxMembers !== undefined && maxMembers !== null && maxMembers !== "") {
      const n = parseInt(maxMembers, 10);
      if (Number.isFinite(n) && n > 0 && n <= 999) cleanMax = n;
    }

    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        region,
        sport,
        title: title.toString().trim().slice(0, 60),
        message: (message || "").toString().trim().slice(0, 500),
        nickname: nickname.toString().trim().slice(0, 20),
        creator_participant_id: participantId,
        max_members: cleanMax,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: `저장에 실패했어요: ${error.message}` }, { status: 500 });
    }

    return Response.json({
      post: {
        id: data.id,
        region: data.region,
        sport: data.sport,
        title: data.title,
        message: data.message,
        nickname: data.nickname,
        joinCount: data.join_count,
        mine: true,
        maxMembers: data.max_members,
        full: false,
        commentCount: 0,
        ts: new Date(data.created_at).getTime(),
      },
    });
  } catch (e) {
    return Response.json({ error: `서버 오류: ${e.message || String(e)}` }, { status: 500 });
  }
}

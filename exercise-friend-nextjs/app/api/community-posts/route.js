import { getSupabaseServerClient } from "../../../lib/supabaseClient";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");

    const supabase = getSupabaseServerClient();
    let query = supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(30);
    if (region) query = query.eq("region", region);

    const { data, error } = await query;
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const posts = data.map((p) => ({
      id: p.id,
      region: p.region,
      sport: p.sport,
      title: p.title,
      message: p.message,
      nickname: p.nickname,
      joinCount: p.join_count,
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
    const { region, sport, title, message, nickname } = body || {};

    if (!region || !sport || !title || !nickname) {
      return Response.json({ error: "지역, 종목, 제목, 닉네임은 필수예요." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        region,
        sport,
        title: title.toString().trim().slice(0, 60),
        message: (message || "").toString().trim().slice(0, 500),
        nickname: nickname.toString().trim().slice(0, 20),
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
        ts: new Date(data.created_at).getTime(),
      },
    });
  } catch (e) {
    return Response.json({ error: `서버 오류: ${e.message || String(e)}` }, { status: 500 });
  }
}

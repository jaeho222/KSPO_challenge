import { getSupabaseServerClient } from "../../../../lib/supabaseClient";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { postId } = await request.json();
    if (!postId) {
      return Response.json({ error: "postId required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    const { data: current, error: fetchError } = await supabase
      .from("community_posts")
      .select("join_count")
      .eq("id", postId)
      .single();
    if (fetchError) {
      return Response.json({ error: fetchError.message }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("community_posts")
      .update({ join_count: (current.join_count || 0) + 1 })
      .eq("id", postId)
      .select("join_count")
      .single();
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ joinCount: data.join_count });
  } catch (e) {
    return Response.json({ error: `서버 오류: ${e.message || String(e)}` }, { status: 500 });
  }
}

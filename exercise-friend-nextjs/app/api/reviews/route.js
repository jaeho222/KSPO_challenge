import { getSupabaseServerClient } from "../../../lib/supabaseClient";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const BUCKET = "review-photos";
const MAX_TAGS = 5;

function safeExt(mimeType) {
  const map = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
  return map[mimeType] || "jpg";
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityKey = searchParams.get("facilityKey");
    if (!facilityKey) {
      return Response.json({ error: "facilityKey required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("id, rating, text, photo_url, tags, created_at")
      .eq("facility_key", facilityKey)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const reviews = data.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text,
      photoUrl: r.photo_url,
      tags: r.tags || [],
      ts: new Date(r.created_at).getTime(),
    }));
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

    const tagCounts = {};
    reviews.forEach((r) => {
      (r.tags || []).forEach((t) => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });
    const tagSummary = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return Response.json({ reviews, avg, count: reviews.length, tagSummary });
  } catch (e) {
    return Response.json({ error: `서버 오류: ${e.message || String(e)}` }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    let form;
    try {
      form = await request.formData();
    } catch (e) {
      return Response.json({ error: "invalid form data" }, { status: 400 });
    }

    const facilityKey = form.get("facilityKey");
    const facilityName = (form.get("facilityName") || "").toString();
    const rating = parseInt(form.get("rating"), 10);
    const text = (form.get("text") || "").toString().trim().slice(0, 1000);
    const file = form.get("photo");
    const tags = form
      .getAll("tags")
      .map((t) => (t || "").toString().trim())
      .filter(Boolean)
      .slice(0, MAX_TAGS);

    if (!facilityKey || !rating || rating < 1 || rating > 5) {
      return Response.json({ error: "invalid input" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    let photoUrl = null;

    if (file && typeof file === "object" && typeof file.arrayBuffer === "function" && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) {
        return Response.json({ error: "사진 용량이 너무 커요 (5MB 이하로 올려주세요)." }, { status: 400 });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return Response.json({ error: "지원하지 않는 사진 형식이에요. (jpg/png/webp/gif만 가능)" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt(file.type)}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) {
        return Response.json(
          { error: `사진 업로드에 실패했어요: ${uploadError.message} (Storage에 "review-photos" Public 버킷이 있는지 확인해주세요)` },
          { status: 500 }
        );
      }
      const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      photoUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert({ facility_key: facilityKey, facility_name: facilityName, rating, text, photo_url: photoUrl, tags })
      .select()
      .single();

    if (error) {
      return Response.json({ error: `저장에 실패했어요: ${error.message}` }, { status: 500 });
    }

    return Response.json({
      review: {
        id: data.id,
        rating: data.rating,
        text: data.text,
        photoUrl: data.photo_url,
        tags: data.tags || [],
        ts: new Date(data.created_at).getTime(),
      },
    });
  } catch (e) {
    // 여기서 못 잡았으면 서버가 조용히 500 에러 페이지를 돌려줘서 "알 수 없는 오류"로 보였던 부분.
    // 이제 어떤 에러든 이유를 그대로 화면에 보여줌 (환경변수 누락도 여기서 잡힘).
    return Response.json({ error: `서버 오류: ${e.message || String(e)}` }, { status: 500 });
  }
}

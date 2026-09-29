// ============================================================
// [예약/문의 신청 API] Supabase의 booking_requests 테이블에 저장
// - 호출하는 곳: components/BookingRequest.jsx
// - 전화번호는 숫자만 남기고(normalizePhone) 정규화해서 저장
// - 개인정보 자동파기: supabase/migration_004 (pg_cron)로 30일 후 자동 삭제됨
// ============================================================

import { getSupabaseServerClient } from "../../../lib/supabaseClient";

export const runtime = "nodejs";

function normalizePhone(phone) {
  return (phone || "").replace(/\D/g, ""); // 숫자만 남김 (하이픈 유무 차이 방지)
}
function isValidPhone(phone) {
  const digits = normalizePhone(phone);
  return digits.length >= 9 && digits.length <= 11;
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return Response.json({ error: "invalid json" }, { status: 400 });
    }

    const { facilityKey, facilityName, facilityAddr, courseName, phone, message } = body || {};
    if (!facilityName || !isValidPhone(phone)) {
      return Response.json({ error: "시설명과 올바른 연락처가 필요해요." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("booking_requests")
      .insert({
        facility_key: facilityKey || null,
        facility_name: facilityName,
        facility_addr: facilityAddr || "",
        course_name: courseName || "",
        phone: normalizePhone(phone),
        message: (message || "").toString().trim().slice(0, 500),
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: `저장에 실패했어요: ${error.message}` }, { status: 500 });
    }

    return Response.json({ record: data });
  } catch (e) {
    return Response.json({ error: `서버 오류: ${e.message || String(e)}` }, { status: 500 });
  }
}

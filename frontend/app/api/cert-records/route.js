// ============================================================
// [체력인증 기록 저장 + 순위 계산 API]
// - 호출하는 곳: components/CertChallenge.jsx
// - 이상치 검증: 항목별 실제 등급 기준치 범위(여유폭 포함)를 벗어나면 거절
//   (유연성처럼 음수가 정상인 항목도 있어서 배수가 아니라 여유폭 방식 사용)
// - 순위 계산: lib/ranking.js 의 dedupeByParticipant로 같은 사람의 중복 제출을
//   먼저 걸러낸 뒤 전국/지역 상위 % 계산 (표본 3명 미만이면 숨김)
// ============================================================

import { getSupabaseServerClient } from "../../../lib/supabaseClient";
import { dedupeByParticipant, computeTop } from "../../../lib/ranking";

export const runtime = "nodejs";

const MIN_SAMPLE = 3; // 표본이 이보다 적으면 순위를 보여주지 않음 (너무 적으면 의미 없어서)

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return Response.json({ error: "invalid json" }, { status: 400 });
    }

    const { item, stage, range, sex, region, value, direction, thresholds, participantId } = body || {};
    if (!item || !stage || !range || !sex || typeof value !== "number" || !direction) {
      return Response.json({ error: "missing or invalid fields" }, { status: 400 });
    }
    if (!Number.isFinite(value)) {
      return Response.json({ error: "비정상적인 측정값이에요. 다시 확인해주세요." }, { status: 400 });
    }
    if (typeof participantId !== "string" || participantId.length < 8 || participantId.length > 64) {
      return Response.json({ error: "참여자 정보를 확인할 수 없어요. 페이지를 새로고침한 뒤 다시 시도해주세요." }, { status: 400 });
    }

    // 항목별 실제 등급 기준치를 기준으로 "말이 되는 범위"인지 확인.
    // 유연성(앉아 굽히기)처럼 음수가 나올 수 있는 항목이 있어서, 음수 자체를 막지 않고
    // 기준치 범위에 여유폭을 더하는 방식으로 계산함.
    if (thresholds && typeof thresholds === "object") {
      const nums = Object.values(thresholds).map(Number).filter((n) => Number.isFinite(n));
      if (nums.length) {
        const lo0 = Math.min(...nums);
        const hi0 = Math.max(...nums);
        const span = Math.max(hi0 - lo0, Math.abs(hi0) * 0.5, 1);
        const lo = lo0 - span * 3;
        const hi = hi0 + span * 3;
        if (value < lo || value > hi) {
          return Response.json(
            { error: `측정값이 일반적인 범위(${lo.toFixed(2)}~${hi.toFixed(2)})를 크게 벗어났어요. 값을 다시 확인해주세요.` },
            { status: 400 }
          );
        }
      }
    }

    const supabase = getSupabaseServerClient();

    const { error: insertError } = await supabase.from("cert_submissions").insert({
      item,
      stage,
      age_range: range,
      sex,
      region: region || "",
      value,
      direction,
      participant_id: participantId,
    });
    if (insertError) {
      return Response.json({ error: `저장에 실패했어요: ${insertError.message}` }, { status: 500 });
    }

    const { data: bracketRows, error: fetchError } = await supabase
      .from("cert_submissions")
      .select("id, value, region, participant_id, created_at")
      .eq("item", item)
      .eq("stage", stage)
      .eq("age_range", range)
      .eq("sex", sex);

    if (fetchError) {
      return Response.json({ error: `순위 계산에 실패했어요: ${fetchError.message}` }, { status: 500 });
    }

    // 한 사람이 여러 번 제출해도 1명으로만 셈 (참여자별 최신 기록 1건)
    const uniqueRows = dedupeByParticipant(bracketRows);
    const bracketValues = uniqueRows.map((r) => r.value);
    const regionValues = region ? uniqueRows.filter((r) => r.region === region).map((r) => r.value) : [];

    const national = bracketValues.length >= MIN_SAMPLE ? computeTop(bracketValues, value, direction) : null;
    const local = regionValues.length >= MIN_SAMPLE ? computeTop(regionValues, value, direction) : null;

    return Response.json({
      national,
      nationalCount: bracketValues.length,
      local,
      localCount: regionValues.length,
    });
  } catch (e) {
    return Response.json({ error: `서버 오류: ${e.message || String(e)}` }, { status: 500 });
  }
}

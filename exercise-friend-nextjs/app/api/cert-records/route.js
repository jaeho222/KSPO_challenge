import { getSupabaseServerClient } from "../../../lib/supabaseClient";

export const runtime = "nodejs";

const MIN_SAMPLE = 3; // 표본이 이보다 적으면 순위를 보여주지 않음 (너무 적으면 의미 없어서)

// "상위 몇 %" 계산: 나보다 같거나 잘한 사람 수 / 전체 인원 수
function computeTop(values, value, direction) {
  if (!values.length) return null;
  const betterOrEqual = values.filter((v) => (direction === "higher" ? v >= value : v <= value)).length;
  return Math.max(1, Math.round((betterOrEqual / values.length) * 100));
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const { item, stage, range, sex, region, value, direction, thresholds } = body || {};
  if (!item || !stage || !range || !sex || typeof value !== "number" || !direction) {
    return Response.json({ error: "missing or invalid fields" }, { status: 400 });
  }
  if (!Number.isFinite(value)) {
    return Response.json({ error: "비정상적인 측정값이에요. 다시 확인해주세요." }, { status: 400 });
  }

  // 항목별 실제 등급 기준치를 기준으로 "말이 되는 범위"인지 확인.
  // 주의: 유연성(앉아 굽히기) 같은 항목은 실제로 음수가 나올 수 있어서
  // (발끝에 손이 안 닿으면 -3cm처럼) 음수 자체를 막으면 안 됨.
  // 그래서 배수(x5) 대신, 기준치 범위에 여유폭을 더하는 방식으로 계산함.
  if (thresholds && typeof thresholds === "object") {
    const nums = Object.values(thresholds).map(Number).filter((n) => Number.isFinite(n));
    if (nums.length) {
      const lo0 = Math.min(...nums);
      const hi0 = Math.max(...nums);
      const span = Math.max(hi0 - lo0, Math.abs(hi0) * 0.5, 1); // 최소 여유폭 보장
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
  });
  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  const { data: bracketRows, error: fetchError } = await supabase
    .from("cert_submissions")
    .select("value, region")
    .eq("item", item)
    .eq("stage", stage)
    .eq("age_range", range)
    .eq("sex", sex);

  if (fetchError) {
    return Response.json({ error: fetchError.message }, { status: 500 });
  }

  const bracketValues = bracketRows.map((r) => r.value);
  const regionValues = region ? bracketRows.filter((r) => r.region === region).map((r) => r.value) : [];

  const national = bracketValues.length >= MIN_SAMPLE ? computeTop(bracketValues, value, direction) : null;
  const local = regionValues.length >= MIN_SAMPLE ? computeTop(regionValues, value, direction) : null;

  return Response.json({
    national,
    nationalCount: bracketValues.length,
    local,
    localCount: regionValues.length,
  });
}

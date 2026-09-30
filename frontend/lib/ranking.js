// ============================================================
// [체력인증 순위 계산 순수함수] 어디서든 테스트 가능하게 따로 뺀 파일
// - 쓰이는 곳: app/api/cert-records/route.js
// - dedupeByParticipant: 같은 참여자(participant_id)가 여러 번 제출했으면
//   가장 최근 기록 1건만 남김 (한 사람 = 여러 명으로 잘못 세는 문제 방지)
// - computeTop: "나와 같거나 잘한 사람 비율"로 상위 % 계산
// ============================================================

// 체력인증 순위 계산용 순수 함수 모음 (서버 API에서 사용, 단독으로 테스트 가능)

// 같은 참여자가 여러 번 제출했으면 "가장 최근 기록 1건"만 남김.
// participant_id가 없는 예전 기록은 각각 다른 참여자로 취급함 (구분할 방법이 없어서).
export function dedupeByParticipant(rows) {
  const latest = new Map();
  rows.forEach((r) => {
    const key = r.participant_id ? `p:${r.participant_id}` : `legacy:${r.id}`;
    const prev = latest.get(key);
    if (!prev || new Date(r.created_at) > new Date(prev.created_at)) {
      latest.set(key, r);
    }
  });
  return Array.from(latest.values());
}

// "상위 몇 %" 계산: 나와 같거나 더 잘한 사람 수 / 전체 인원 수
export function computeTop(values, value, direction) {
  if (!values.length) return null;
  const betterOrEqual = values.filter((v) => (direction === "higher" ? v >= value : v <= value)).length;
  return Math.max(1, Math.round((betterOrEqual / values.length) * 100));
}

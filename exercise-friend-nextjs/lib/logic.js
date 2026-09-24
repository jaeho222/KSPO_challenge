// ============================================================
// 종목 이름 -> 이모지 매핑
// ============================================================
export const SPORT_EMOJI = {
  태권도: "🥋", 기타종목: "🏅", 헬스: "🏋️", 필라테스: "🧘", 복싱: "🥊",
  합기도: "🥋", 검도: "🤺", 유도: "🥋", 수영: "🏊", 요가: "🧘",
  "축구(풋살)": "⚽", 축구: "⚽", 주짓수: "🥋", 탁구: "🏓", "댄스(줌바 등)": "💃",
  줄넘기: "🤸", "무용(발레 등)": "🩰", 댄스: "💃", 농구: "🏀", 종합체육시설: "🏢",
  발레: "🩰", 골프: "⛳", 테니스: "🎾", 볼링: "🎳", 배드민턴: "🏸",
  에어로빅: "🤸", 클라이밍: "🧗", 야구: "⚾", 승마: "🐎", 롤러인라인: "🛼",
  당구: "🎱", 펜싱: "🤺", 크로스핏: "🏋️", 스쿼시: "🎾", 배구: "🏐",
  빙상: "⛸️", "빙상(스케이트)": "⛸️", "클라이밍(암벽등반)": "🧗",
};
export function sportEmoji(name) {
  return SPORT_EMOJI[name] || "🏅";
}

// ============================================================
// 지역 매칭 (사용자가 입력한 텍스트 -> 데이터 안의 정확한 지역 키)
// ============================================================
export function normalizeRegion(text) {
  return (text || "").trim().replace(/\s+/g, " ");
}
export function findRegionKey(kspoData, text) {
  const norm = normalizeRegion(text);
  if (!norm) return null;
  if (kspoData.regions.includes(norm)) return norm;
  const tokens = norm.split(" ").filter(Boolean);
  let candidates = kspoData.regions.filter((r) => tokens.every((t) => r.includes(t)));
  if (candidates.length) return candidates[0];
  candidates = kspoData.regions.filter((r) => r.includes(norm) || norm.includes(r));
  return candidates[0] || null;
}

// 지역의 관심 운동 목록 (실제 등록 시설 데이터 기반, 상한선 없음)
export function getRegionSports(kspoData, regionKey) {
  if (!regionKey) return [];
  const list = kspoData.regionSports[regionKey] || [];
  return list.map((item) => ({
    emoji: sportEmoji(item.name),
    label: item.cnt > 1 ? `${item.name} · 개설 ${item.cnt}곳` : item.name,
    rawLabel: item.name,
  }));
}

// ============================================================
// 국민체력100 참고 정보
// ============================================================
export const AGE_TO_FITNESS = {
  "10대": { stage: "청소년기(만13세~18세)", range: "16" },
  "20대": { stage: "성인기(만19세~64세)", range: "25~29" },
  "30대": { stage: "성인기(만19세~64세)", range: "35~39" },
  "40대": { stage: "성인기(만19세~64세)", range: "45~49" },
  "50대": { stage: "성인기(만19세~64세)", range: "55~59" },
  "60대": { stage: "성인기(만19세~64세)", range: "60~64" },
  "70대 이상": { stage: "어르신기(만65세 이상)", range: "70~74" },
};
export function findFitnessRef(fitnessStandards, genderLabel, ageLabel) {
  const map = AGE_TO_FITNESS[ageLabel];
  if (!map) return null;
  const sex = genderLabel === "여성" ? "여" : "남";
  const rows = fitnessStandards.filter(
    (s) => s.age_stage === map.stage && s.age_range === map.range && s.sex === sex
  );
  if (!rows.length) return null;
  const g1 = rows.find((r) => r.grade === "1등급");
  if (!g1) return null;
  const itemKeys = Object.keys(g1.items);
  const item =
    itemKeys.find((k) => k.includes("걷기")) ||
    itemKeys.find((k) => k.includes("왕복")) ||
    itemKeys[0];
  const grades = rows
    .map((r) => ({ grade: r.grade, value: r.items[item] }))
    .sort((a, b) => a.grade.localeCompare(b.grade));
  return { stage: map.stage, range: map.range, sex, item, grades };
}
export function difficultyFromActivity(activityLabel) {
  const table = {
    "거의 하지 않아요": "입문",
    "가끔, 산책 정도예요": "초급",
    "주 1~2회 정도 해요": "중급",
    "주 3회 이상 꾸준히 해요": "중상급",
  };
  return table[activityLabel] || "초급";
}

// ============================================================
// 재활 스트레칭 (MSCL) / 목적별 운동가이드 (GUIDE)
// ============================================================
export function getRehabVideos(msclVideos, painAreas) {
  const areas = (painAreas || []).filter((a) => a !== "특별히 없음");
  if (!areas.length) return [];
  const picked = [];
  areas.forEach((area) => {
    const matches = msclVideos.filter((v) => v.part === area).slice(0, 2);
    picked.push(...matches);
  });
  return picked.slice(0, 4);
}

const AGE_GROUP_MAP = {
  "10대": ["청소년", "공통"], "20대": ["공통"], "30대": ["공통"], "40대": ["공통"],
  "50대": ["공통", "어르신"], "60대": ["어르신", "공통"], "70대 이상": ["어르신", "공통"],
};
const PLACE_MATCH = {
  헬스장에서: ["헬스장"], "집에서 간단히": ["실내"], 야외에서: ["실외", "운동장"],
};
export function getGuideVideos(guideVideos, goals, ageLabel, placePref) {
  if (!goals || !goals.length) return [];
  const allowedGrp = AGE_GROUP_MAP[ageLabel] || ["공통"];
  const placeTokens = PLACE_MATCH[placePref];
  return guideVideos
    .filter((v) => {
      if (!goals.includes(v.b)) return false;
      if (!allowedGrp.includes(v.grp)) return false;
      if (placeTokens && !placeTokens.some((t) => v.p.includes(t))) return false;
      return true;
    })
    .slice(0, 4);
}

// ============================================================
// 장애인 스포츠강좌 시설
// ============================================================
export function getDisableFacilities(disableFacilities, regionKey, interests) {
  const all = regionKey ? disableFacilities[regionKey] || [] : [];
  if (!all.length) return { list: [], note: "" };
  const matched = all.filter((f) => (interests || []).includes(f.m));
  if (!matched.length) {
    return {
      list: all.slice(0, 4),
      note: "선택하신 종목의 장애인 스포츠강좌는 아직 없어서, 같은 지역의 다른 종목을 보여드려요.",
    };
  }
  return { list: matched.slice(0, 4), note: "" };
}

// ============================================================
// 지역 형평성 지수
// ============================================================
export function getRegionEquity(kspoData, regionKey) {
  if (!regionKey) return null;
  const regions = Object.keys(kspoData.regionFacilities);
  const counts = regions.map((r) => ({ r, cnt: (kspoData.regionFacilities[r] || []).length }));
  counts.sort((a, b) => b.cnt - a.cnt);
  const total = counts.length;
  const myIdx = counts.findIndex((c) => c.r === regionKey);
  if (myIdx === -1) return null;
  const myCnt = counts[myIdx].cnt;
  const rank = myIdx + 1;
  const percentile = Math.max(1, Math.round((rank / total) * 100));
  const avgCnt = counts.reduce((s, c) => s + c.cnt, 0) / total;

  const sportsCounts = Object.keys(kspoData.regionSports).map((r) => kspoData.regionSports[r].length);
  const mySports = (kspoData.regionSports[regionKey] || []).length;
  const avgSports = sportsCounts.reduce((a, b) => a + b, 0) / sportsCounts.length;

  return { myCnt, rank, total, percentile, avgCnt, mySports, avgSports };
}

// ============================================================
// 이번 주 표준 운동 루틴 (STD_FTNS)
// ============================================================
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}
export function getWeeklyRoutine(stdFtnsData, ageLabel) {
  const grp = ageLabel === "70대 이상" ? "어르신" : "성인";
  const weekIdx = getISOWeek(new Date()) % 4;
  const weekLabel = `${weekIdx + 1}주차`;
  const filtered = stdFtnsData.filter((s) => s.grp === grp && s.week === weekLabel);
  const bySeq = { "준비 운동": [], "본 운동": [], "정리 운동": [] };
  const seen = { "준비 운동": new Set(), "본 운동": new Set(), "정리 운동": new Set() };
  filtered.forEach((item) => {
    if (!bySeq[item.seq] || seen[item.seq].has(item.n)) return;
    seen[item.seq].add(item.n);
    bySeq[item.seq].push(item);
  });
  const hasAny = Object.values(bySeq).some((arr) => arr.length);
  if (!hasAny) return null;
  return { grp, weekLabel, bySeq };
}

// ============================================================
// 국민체력100 인증 도전과제 (CERT)
// ============================================================
function normalizeName(s) {
  return (s || "").replace(/\(.*?\)/g, "").replace(/미터/g, "m").replace(/\s+/g, "");
}
export function findCertVideo(certVideos, itemName) {
  const norm = normalizeName(itemName);
  return certVideos.find((c) => {
    const cn = normalizeName(c.n);
    return norm.includes(cn) || cn.includes(norm);
  });
}
export function getFitnessItemList(fitnessStandards, genderLabel, ageLabel) {
  const map = AGE_TO_FITNESS[ageLabel];
  if (!map) return [];
  const sex = genderLabel === "여성" ? "여" : "남";
  const row = fitnessStandards.find(
    (s) => s.age_stage === map.stage && s.age_range === map.range && s.sex === sex && s.grade === "1등급"
  );
  return row ? Object.keys(row.items) : [];
}

// 항목별로 "실제 존재하는 등급만"으로 단계를 구성한 상세 정보.
// 예: 어떤 항목은 3등급 기준이 아예 없을 수 있어서, 그런 경우 2등급부터 시작함.
// 항상 마지막 단계는 1등급(가장 어려움)이 되도록 함.
export function getFitnessItemDetails(fitnessStandards, genderLabel, ageLabel) {
  const map = AGE_TO_FITNESS[ageLabel];
  if (!map) return [];
  const sex = genderLabel === "여성" ? "여" : "남";
  const rows = fitnessStandards.filter((s) => s.age_stage === map.stage && s.age_range === map.range && s.sex === sex);
  const g1 = rows.find((r) => r.grade === "1등급");
  if (!g1) return [];

  return Object.keys(g1.items).map((name) => {
    const thresholds = {};
    rows.forEach((r) => {
      const v = parseFloat(r.items[name]);
      if (!Number.isNaN(v)) thresholds[r.grade] = v;
    });
    const levels = ["3등급", "2등급", "1등급"].filter((g) => thresholds[g] !== undefined);
    // 1등급과, 존재하는 등급 중 가장 관대한(느슨한) 등급을 비교해서 방향(클수록/작을수록 좋음) 판단
    const loosest = levels[0];
    const v1 = thresholds["1등급"];
    const vLoose = thresholds[loosest];
    const direction = loosest !== "1등급" && v1 < vLoose ? "lower" : "higher";
    return { name, thresholds, levels, direction };
  });
}

// ============================================================
// 브라우저 저장(localStorage) 도우미
// - 접근성 제보, 체력인증 체크리스트는 지금은 "내 브라우저에만" 저장됨.
//   (여러 사람과 공유하려면 서버 DB 연동이 필요함)
// ============================================================
function safeGetItem(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}
function safeSetItem(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch (e) {
    /* ignore */
  }
}

export function facilityKey(f) {
  return `${f.n}|${f.a}`;
}
export function getAccessibilityInfo(f) {
  const raw = safeGetItem(`a11y:${facilityKey(f)}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
export function submitAccessibility(f, inputText) {
  const tags = (inputText || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (!tags.length) return null;
  const existing = getAccessibilityInfo(f) || { tags: [], count: 0 };
  const mergedTags = Array.from(new Set(existing.tags.concat(tags))).slice(0, 6);
  const updated = { tags: mergedTags, count: existing.count + 1 };
  safeSetItem(`a11y:${facilityKey(f)}`, JSON.stringify(updated));
  return updated;
}

export function getCertLevel(name) {
  const raw = safeGetItem(`cert-level:${name}`);
  if (raw === null) return -1; // 아직 아무 단계도 달성 못함
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? -1 : n;
}
export function setCertLevel(name, level) {
  safeSetItem(`cert-level:${name}`, String(level));
}

// ============================================================
// 게임 요소: 실제로 입력된 기록들과 비교한 "진짜" 순위
// 사용자가 입력한 값을 서버에 실제로 저장하고, 지금까지 쌓인
// 다른 사람들의 기록과 비교해서 상위 몇 %인지 계산해줌.
// (지역 표본이 너무 적으면 local이 null로 와서 안전하게 숨김)
// ------------------------------------------------------------
export async function submitCertRecord(payload) {
  try {
    const res = await fetch("/api/cert-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null; // 네트워크 문제 등으로 실패해도 앱이 멈추지 않게
  }
}

// ============================================================
// 전국 시설 검색 (지역명 / 종목명 / 시설명을 자유롭게 조합해서 검색)
// 비유: "강동구"라고만 치면 그 동네 시설을 통째로, "태권도"라고만
// 치면 전국 태권도 시설을 다 보여주는 안내데스크 검색창.
// ============================================================
export function searchFacilities(kspoData, query, limit = 30) {
  const norm = normalizeRegion(query).toLowerCase();
  if (!norm) return { results: [], total: 0 };
  const tokens = norm.split(" ").filter(Boolean);

  // 이 서비스에 등록된 전체 종목 이름 모음 (지역별 종목 목록을 다 합침)
  const allSportNames = new Set();
  Object.values(kspoData.regionSports).forEach((list) =>
    list.forEach((i) => allSportNames.add(i.name.toLowerCase()))
  );

  const sportTokens = tokens.filter((t) => allSportNames.has(t));
  const otherTokens = tokens.filter((t) => !allSportNames.has(t));
  const regionText = otherTokens.join(" ");
  const regionKey = regionText ? findRegionKey(kspoData, regionText) : null;

  let pool = regionKey
    ? kspoData.regionFacilities[regionKey] || []
    : Object.values(kspoData.regionFacilities).flat();

  if (sportTokens.length) {
    // 종목이 인식됐으면 (지역이 있으면 그 지역 안에서, 없으면 전국에서) 종목으로 좁힘
    pool = pool.filter((f) => sportTokens.some((s) => f.m.toLowerCase().includes(s)));
  } else if (!regionKey) {
    // 지역도 종목도 인식 안 됐으면 -> 시설명/종목명/주소 아무거나 포함되는지로 검색
    pool = pool.filter(
      (f) =>
        f.n.toLowerCase().includes(norm) ||
        f.m.toLowerCase().includes(norm) ||
        f.a.toLowerCase().includes(norm)
    );
  }
  // (지역만 인식되고 종목 지정이 없으면 그 지역 전체를 그대로 보여줌)

  return { results: pool.slice(0, limit), total: pool.length };
}

// ============================================================
// [핵심 비즈니스 로직 모음] 이 프로젝트의 "계산기" 역할 - 거의 모든 컴포넌트가
// 여기서 함수를 가져다 씀. 화면을 안 그리고 순수 계산/데이터가공만 담당함.
// 주요 영역: 종목-이모지 매핑, 지역매칭, 지역형평성지수, 체력기준 조회+난이도추천,
// 영상 필터링(재활/가이드/목표별루틴), 장애인시설 조회, 온보딩 저장/복원,
// localStorage 헬퍼(체력등급, 익명참여자ID), 이모지 자동분리(스크린리더 대응)
// ============================================================
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
// ============================================================
// 난이도 추천 (하이브리드 방식)
// - 체력인증 도전과제에서 실제 기록이 하나라도 있으면 그걸로 (정확)
// - 아직 없으면 "통증 부위 있음/없음" 답변으로 대충 추정 (즉시 가능)
// ------------------------------------------------------------
export function getBaselineDifficulty(painAreas) {
  const hasPain = (painAreas || []).some((p) => p !== "특별히 없음");
  return hasPain ? "입문" : "중급";
}

const GRADE_RANK = { "1등급": 3, "2등급": 2, "3등급": 1 };
const GRADE_TO_LABEL = { "1등급": "상급", "2등급": "중급", "3등급": "입문" };

export function getCertBasedDifficulty(fitnessStandards, genderLabel, ageLabel) {
  const items = getFitnessItemDetails(fitnessStandards, genderLabel, ageLabel);
  const achievedGrades = items
    .map((it) => {
      const level = getCertLevel(it.name);
      return level >= 0 ? it.levels[level] : null;
    })
    .filter(Boolean);
  if (!achievedGrades.length) return null;
  const best = achievedGrades.reduce((a, b) => (GRADE_RANK[b] > GRADE_RANK[a] ? b : a));
  return { grade: best, label: GRADE_TO_LABEL[best] || "중급", count: achievedGrades.length };
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
export function getGuideVideos(guideVideos, goals, ageLabel) {
  if (!goals || !goals.length) return [];
  const allowedGrp = AGE_GROUP_MAP[ageLabel] || ["공통"];
  return guideVideos
    .filter((v) => {
      if (!goals.includes(v.b)) return false;
      if (!allowedGrp.includes(v.grp)) return false;
      return true;
    })
    .slice(0, 4);
}

// ============================================================
// 장애인 이용 가능 시설 안내
// (강좌 데이터와의 조인 키가 없어 시설 목록만 제공함 — README.md 참고)
// ============================================================
export function getDisableFacilities(disableFacilities, regionKey, interests) {
  const source = disableFacilities || {};
  const all = regionKey ? source[regionKey] || [] : [];
  if (!all.length) return { list: [], note: "" };
  const matched = all.filter((f) => (interests || []).includes(f.m));
  if (!matched.length) {
    return {
      list: all.slice(0, 4),
      note: "선택하신 종목의 장애인 이용 가능 시설은 아직 없어서, 같은 지역의 다른 종목을 보여드려요.",
    };
  }
  return { list: matched.slice(0, 4), note: "" };
}

// ============================================================
// 지역 형평성 지수
// ============================================================
export function getRegionEquity(kspoData, regionKey) {
  if (!regionKey) return null;
  // regionFacilityCounts: {지역명: 시설개수} - 지연로딩 중에도 항상 전체 259개 지역이 들어있는 가벼운 맵.
  // (regionFacilities는 지금 화면에 필요한 지역만 부분적으로 들어있을 수 있어서, 순위 계산에는 못 씀)
  const countsMap = kspoData.regionFacilityCounts;
  if (!countsMap) return null;
  const counts = Object.entries(countsMap).map(([r, cnt]) => ({ r, cnt }));
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
// ============================================================
// 목표별 맞춤 루틴 (미활용이던 ROUTINE 공공데이터 활용)
// 통증부위/연령/운동목적을 보고, 가장 관련 있는 목표 하나를 골라서
// 준비-본-정리 운동으로 구성된 루틴을 보여줌.
// ------------------------------------------------------------
export function getGoalRoutine(routineData, painAreas, ageLabel, goals) {
  const pains = painAreas || [];
  const goalList = goals || [];
  const candidates = [];

  if (ageLabel === "70대 이상") candidates.push("낙상 예방", "골다공증 예방", "인지노쇠 예방");
  if (pains.includes("허리")) candidates.push("요통 예방");
  if (pains.includes("어깨")) candidates.push("직장인 뭉친 어깨 예방");
  if (goalList.includes("유연성 · 뻐근함 완화")) candidates.push("스트레칭");
  if (goalList.includes("근력 키우기")) candidates.push("근력운동");
  if (goalList.includes("체중 관리 · 유산소")) candidates.push("유산소");

  const aim = candidates.find((c) => routineData.some((r) => r.aim === c));
  if (!aim) return null;

  const items = routineData.filter(
    (r) => r.aim === aim && (r.grp === "공통" || r.grp === "성인") && r.seq && r.n && r.n.trim()
  );
  // 목표마다 운동단계 이름 체계가 달라서(예: 요통예방=준비/본/정리, 스트레칭=스트레칭(짐볼) 등)
  // 고정된 3단계로 묶지 않고, 실제 존재하는 단계명 기준으로 동적으로 묶음.
  const bySeq = {};
  const seen = {};
  items.forEach((item) => {
    if (!bySeq[item.seq]) {
      bySeq[item.seq] = [];
      seen[item.seq] = new Set();
    }
    if (seen[item.seq].has(item.n)) return;
    seen[item.seq].add(item.n);
    bySeq[item.seq].push(item);
  });
  if (!Object.keys(bySeq).length) return null;
  return { aim, bySeq };
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

// ============================================================
// 익명 참여자 ID
// 로그인이 없는 서비스라서, 브라우저마다 랜덤 ID를 하나 만들어 저장해두고
// "같은 참여자의 반복 제출/반복 클릭"을 구분하는 데 씀.
// (한계: 브라우저 데이터를 지우거나 기기를 바꾸면 다른 참여자로 인식됨)
// ------------------------------------------------------------
export function getParticipantId() {
  const KEY = "ef-participant-id";
  const existing = safeGetItem(KEY);
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `p-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  safeSetItem(KEY, id);
  return id;
}

export function facilityKey(f) {
  return `${f.n}|${f.a}`;
}

// ============================================================
// 스크린리더 접근성: 문자열 맨 앞의 이모지를 분리해줌.
// 이모지는 장식용이라 스크린리더가 읽으면 오히려 방해되므로
// (예: "사람 10대" 처럼 이상하게 읽힘), 아이콘은 aria-hidden으로
// 숨기고 실제 텍스트만 읽히게 만들 때 씀.
// ------------------------------------------------------------
export function splitLeadingEmoji(str) {
  const s = str || "";
  const m = s.match(/^([\p{Extended_Pictographic}\uFE0F\u200D]+)\s*/u);
  if (!m) return { icon: null, text: s };
  return { icon: m[1], text: s.slice(m[0].length) };
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
// 온보딩 중간저장
// 비유: 게임 중간 저장(세이브포인트) 같은 거야. 9단계 설문 도중
// 브라우저를 닫아도, 다음에 다시 오면 "이어서 할래요?" 하고 물어봄.
// ------------------------------------------------------------
const ONBOARDING_KEY = "ef-onboarding-progress";
export function saveOnboardingProgress(state) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  } catch (e) {
    /* 저장 실패해도 앱은 계속 동작해야 하므로 무시 */
  }
}
export function loadOnboardingProgress() {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(ONBOARDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
export function clearOnboardingProgress() {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ONBOARDING_KEY);
  } catch (e) {
    /* ignore */
  }
}

// ---- 설문을 끝까지 마친 사용자의 답변 (다음 방문 때 설문을 건너뛰고 바로 결과로 가기 위함) ----
const COMPLETED_KEY = "ef-onboarding-completed";
export function saveCompletedOnboarding(answers) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COMPLETED_KEY, JSON.stringify(answers));
  } catch (e) {
    /* ignore */
  }
}
export function loadCompletedOnboarding() {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(COMPLETED_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" && parsed.region ? parsed : null;
  } catch (e) {
    return null;
  }
}
export function clearCompletedOnboarding() {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(COMPLETED_KEY);
  } catch (e) {
    /* ignore */
  }
}

// ============================================================
// (참고) 국민체력100 기록 제출은 이제 components/CertChallenge.jsx에서
// 서버 응답 에러 메시지를 직접 다루기 위해 fetch를 인라인으로 호출함.
// ------------------------------------------------------------

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

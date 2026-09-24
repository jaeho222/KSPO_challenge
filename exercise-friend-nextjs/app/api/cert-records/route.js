import { promises as fs } from "fs";
import path from "path";

// 이 라우트는 서버(Node)에서 실행돼야 파일을 읽고 쓸 수 있어서 nodejs 런타임 고정.
export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "cert-submissions.json");

async function readRecords() {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return []; // 파일이 아직 없으면 빈 배열로 시작
  }
}

async function writeRecords(records) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(records), "utf-8");
}

// "상위 몇 %" 계산: 나보다 같거나 잘한 사람 수 / 전체 인원 수
function computeTop(records, value, direction) {
  if (!records.length) return null;
  const betterOrEqual = records.filter((r) =>
    direction === "higher" ? r.value >= value : r.value <= value
  ).length;
  return Math.max(1, Math.round((betterOrEqual / records.length) * 100));
}

const MIN_SAMPLE = 3; // 표본이 이보다 적으면 순위를 보여주지 않음 (너무 적으면 의미 없어서)

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const { item, stage, range, sex, region, value, direction } = body || {};
  if (!item || !stage || !range || !sex || typeof value !== "number" || !direction) {
    return Response.json({ error: "missing or invalid fields" }, { status: 400 });
  }

  const records = await readRecords();
  records.push({ item, stage, range, sex, region: region || "", value, direction, ts: Date.now() });
  await writeRecords(records);

  // 같은 항목 + 같은 연령대/성별 기준(같은 기준표를 보는 사람들)끼리만 비교
  const bracketMatches = records.filter(
    (r) => r.item === item && r.stage === stage && r.range === range && r.sex === sex
  );
  const regionMatches = region ? bracketMatches.filter((r) => r.region === region) : [];

  const national = bracketMatches.length >= MIN_SAMPLE ? computeTop(bracketMatches, value, direction) : null;
  const local = regionMatches.length >= MIN_SAMPLE ? computeTop(regionMatches, value, direction) : null;

  return Response.json({
    national,
    nationalCount: bracketMatches.length,
    local,
    localCount: regionMatches.length,
  });
}

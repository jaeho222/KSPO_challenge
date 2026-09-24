import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "booking-requests.json");

async function readRequests() {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
async function writeRequests(list) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(list), "utf-8");
}

function isValidPhone(phone) {
  return /^[0-9-]{9,13}$/.test((phone || "").trim());
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const { facilityName, facilityAddr, courseName, phone, message } = body || {};
  if (!facilityName || !isValidPhone(phone)) {
    return Response.json({ error: "시설명과 올바른 연락처가 필요해요." }, { status: 400 });
  }

  const list = await readRequests();
  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    facilityName,
    facilityAddr: facilityAddr || "",
    courseName: courseName || "",
    phone: phone.trim(),
    message: (message || "").toString().trim().slice(0, 500),
    status: "접수",
    ts: Date.now(),
  };
  list.push(record);
  await writeRequests(list);

  return Response.json({ record });
}

import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "reviews.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "reviews");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

async function readReviews() {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
async function writeReviews(list) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(list), "utf-8");
}
function safeExt(name) {
  const ext = path.extname(name || "").toLowerCase();
  return ALLOWED_EXT.includes(ext) ? ext : ".jpg";
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const facilityKey = searchParams.get("facilityKey");
  if (!facilityKey) {
    return Response.json({ error: "facilityKey required" }, { status: 400 });
  }
  const all = await readReviews();
  const list = all.filter((r) => r.facilityKey === facilityKey).sort((a, b) => b.ts - a.ts);
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : null;
  return Response.json({ reviews: list, avg, count: list.length });
}

export async function POST(request) {
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

  if (!facilityKey || !rating || rating < 1 || rating > 5) {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }

  let photoUrl = null;
  if (file && typeof file === "object" && typeof file.arrayBuffer === "function" && file.size > 0) {
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "file too large (max 5MB)" }, { status: 400 });
    }
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
    photoUrl = `/uploads/reviews/${filename}`;
  }

  const all = await readReviews();
  const review = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    facilityKey,
    facilityName,
    rating,
    text,
    photoUrl,
    ts: Date.now(),
  };
  all.push(review);
  await writeReviews(all);

  return Response.json({ review });
}

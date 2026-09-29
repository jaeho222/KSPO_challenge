// ============================================================
// [Supabase 서버 클라이언트] service_role 키로 DB에 접근하는 클라이언트 생성
// - 쓰이는 곳: app/api/*/route.js 전체 (모든 API 라우트에서 공통으로 씀)
// - ⚠️ 반드시 서버(API 라우트)에서만 import 할 것. 브라우저 코드에서 쓰면 안 됨
//   (SUPABASE_SERVICE_ROLE_KEY가 노출되면 DB 전체가 뚫림)
// - .env.local 에 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없으면
//   명확한 에러 메시지를 던짐 (원인 파악 쉽게)
// ============================================================

import { createClient } from "@supabase/supabase-js";

// 이 클라이언트는 API 라우트(서버)에서만 써야 해.
// SUPABASE_SERVICE_ROLE_KEY는 절대 브라우저로 노출되면 안 되는 키라서,
// 이름 앞에 NEXT_PUBLIC_ 을 붙이지 않은 환경변수로만 관리함.
let cachedClient = null;

export function getSupabaseServerClient() {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요."
    );
  }

  cachedClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cachedClient;
}

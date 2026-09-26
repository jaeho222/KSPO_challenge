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

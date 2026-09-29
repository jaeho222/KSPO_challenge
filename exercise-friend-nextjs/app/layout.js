// ============================================================
// [Next.js 루트 레이아웃] 모든 페이지를 감싸는 최상위 틀
// - globals.css(디자인 시스템 전체)를 여기서 한 번만 import함
// ============================================================

import "./globals.css";

export const metadata = {
  title: "운동친구",
  description: "체육 복지 취약지역을 위한 맞춤 운동 프로그램 추천 서비스",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

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

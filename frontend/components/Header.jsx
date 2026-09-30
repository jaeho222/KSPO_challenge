// ============================================================
<<<<<<< HEAD
// [상단 헤더] 로고(호랑이 캐릭터 이미지) + 통합검색 입력창
// - 렌더링 위치: App.jsx 맨 위에서 항상 렌더링됨
// - 검색창에 뭔가 입력하면 App.jsx의 screenMode가 자동으로 'search'로 바뀜
// - 로고 이미지 파일: public/logo.png (256x256으로 리사이즈됨)
=======
// [상단 헤더] 로고(백호 얼굴 SVG) + 통합검색 입력창
// - 렌더링 위치: App.jsx 맨 위에서 항상 렌더링됨
// - 검색창에 뭔가 입력하면 App.jsx의 screenMode가 자동으로 'search'로 바뀜
>>>>>>> 2842d5ac3257e17328cb38faf725cfbcdc2670ec
// ============================================================

"use client";

<<<<<<< HEAD
=======
function TigerMark() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {/* 귀 */}
      <circle cx="22" cy="24" r="14" fill="#111111" />
      <circle cx="78" cy="24" r="14" fill="#111111" />
      <circle cx="22" cy="24" r="6.5" fill="#ffffff" />
      <circle cx="78" cy="24" r="6.5" fill="#ffffff" />
      {/* 얼굴 */}
      <circle cx="50" cy="56" r="38" fill="#ffffff" stroke="#111111" strokeWidth="4" />
      {/* 눈썹 줄무늬 */}
      <path d="M18 42 Q28 30 40 40" stroke="#111111" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M82 42 Q72 30 60 40" stroke="#111111" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      {/* 눈 */}
      <circle cx="36" cy="54" r="4.2" fill="#111111" />
      <circle cx="64" cy="54" r="4.2" fill="#111111" />
      {/* 코 */}
      <path d="M45 64 L55 64 L50 71 Z" fill="#111111" />
      {/* 입 */}
      <path d="M50 71 Q42 80 32 75" stroke="#111111" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M50 71 Q58 80 68 75" stroke="#111111" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

>>>>>>> 2842d5ac3257e17328cb38faf725cfbcdc2670ec
export default function Header({ title, showSearch, query, onQueryChange }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <span className="site-title">
<<<<<<< HEAD
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" aria-hidden="true" width={33} height={33} style={{ flexShrink: 0 }} />
=======
          <TigerMark />
>>>>>>> 2842d5ac3257e17328cb38faf725cfbcdc2670ec
          {title}
        </span>
        {showSearch ? (
          <input
            className="site-search-input"
            type="text"
            placeholder="시설, 종목, 지역으로 검색"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        ) : null}
      </div>
    </header>
  );
}

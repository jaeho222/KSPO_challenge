// ============================================================
// [상단 헤더] 로고(호랑이 캐릭터 이미지) + 통합검색 입력창
// - 렌더링 위치: App.jsx 맨 위에서 항상 렌더링됨
// - 검색창에 뭔가 입력하면 App.jsx의 screenMode가 자동으로 'search'로 바뀜
// - 로고 이미지 파일: public/logo.png (256x256으로 리사이즈됨)
// ============================================================

"use client";

export default function Header({ title, showSearch, query, onQueryChange }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <span className="site-title">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" aria-hidden="true" width={33} height={33} style={{ flexShrink: 0 }} />
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
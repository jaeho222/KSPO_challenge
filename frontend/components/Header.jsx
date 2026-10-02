// ============================================================
// [상단 헤더] 로고(호랑이 캐릭터 이미지) + 통합검색 입력창 + 다크모드 토글
// - 렌더링 위치: App.jsx 맨 위에서 항상 렌더링됨
// - 검색창에 뭔가 입력하면 App.jsx의 screenMode가 자동으로 'search'로 바뀜
// - 로고 이미지 파일: public/logo.png (256x256으로 리사이즈됨)
// - 다크모드: <html data-theme="light|dark">로 제어 (색상은 globals.css),
//   선택값은 localStorage("theme")에 저장, 없으면 브라우저 설정을 따름
// ============================================================

"use client";

import { useEffect, useState } from "react";

export default function Header({ title, showSearch, query, onQueryChange }) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem("theme");
    } catch (e) {}
    const initial =
      saved === "light" || saved === "dark"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    document.documentElement.setAttribute("data-theme", initial);
    setTheme(initial);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    setTheme(next);
  }

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
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
          style={{
            flexShrink: 0,
            marginLeft: "auto",
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid currentColor",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
}
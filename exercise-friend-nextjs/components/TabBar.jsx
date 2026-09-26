"use client";

// 흑백 브랜드에 맞춘 라인 아이콘 (currentColor를 써서 탭 활성/비활성 색이 자동으로 반영됨)
function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 9.5L10 3l7 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 8.5V17h10V8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 17v-4h4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CommunityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="7" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.3 17c0-3.3 2.1-5.6 4.7-5.6s4.7 2.3 4.7 5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="14.2" cy="7.8" r="2.1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.6 17c.2-2.8 1.8-4.8 3.8-4.8 2.1 0 3.8 2.2 4 4.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="10" cy="6.8" r="3.3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 17.2c0-4.1 3-7 6.5-7s6.5 2.9 6.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const TABS = [
  { key: "results", icon: <HomeIcon />, label: "홈" },
  { key: "community", icon: <CommunityIcon />, label: "커뮤니티" },
  { key: "mypage", icon: <PersonIcon />, label: "마이" },
];

export default function TabBar({ screenMode, onSwitch }) {
  return (
    <div className="tab-row">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          className={"tab-btn" + (screenMode === t.key ? " active" : "")}
          onClick={() => onSwitch(t.key)}
        >
          <span className="tab-icon">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

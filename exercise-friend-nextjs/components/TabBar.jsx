"use client";

const TABS = [
  { key: "results", emoji: "🏠", label: "홈" },
  { key: "calendar", emoji: "📅", label: "캘린더" },
  { key: "community", emoji: "👥", label: "커뮤니티" },
  { key: "mypage", emoji: "🔖", label: "마이" },
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
          <span className="tab-icon">{t.emoji}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

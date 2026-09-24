"use client";

export default function A11yBar({ largeText, highContrast, onToggleLargeText, onToggleContrast }) {
  return (
    <div className="a11y-bar">
      <button
        type="button"
        className={"a11y-btn" + (largeText ? " active" : "")}
        onClick={onToggleLargeText}
      >
        가+ 큰글씨
      </button>
      <button
        type="button"
        className={"a11y-btn" + (highContrast ? " active" : "")}
        onClick={onToggleContrast}
      >
        ◐ 고대비
      </button>
    </div>
  );
}

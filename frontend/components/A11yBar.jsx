// ============================================================
// [큰글씨 토글 버튼] 상단에 항상 떠있는 접근성 바
// - 렌더링 위치: App.jsx 가 모든 화면 위에 공통으로 표시
// - largeText 값과 토글 함수를 App.jsx로부터 props로 받아서 버튼만 그림
//   (실제 글자 크기 변경은 App.jsx의 useEffect가 <html> 태그에 클래스를 붙여서 처리)
// ============================================================

"use client";

export default function A11yBar({ largeText, onToggleLargeText }) {
  return (
    <div className="a11y-bar">
      <button
        type="button"
        className={"a11y-btn" + (largeText ? " active" : "")}
        onClick={onToggleLargeText}
      >
        가+ 큰글씨
      </button>
    </div>
  );
}

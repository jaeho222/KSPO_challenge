// ============================================================
// [온보딩 진행 표시 바] 화면 상단에 "몇 단계 중 몇 번째"를 점으로 표시
// - 렌더링 위치: App.jsx가 온보딩(quiz) 화면일 때 TabBar 대신 이걸 보여줌
// ============================================================

export default function TrackBar({ steps, current }) {
  return (
    <div className="track">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "";
        return (
          <div key={s.key} style={{ display: "contents" }}>
            <span className={"step-dot " + state}>{i < current ? "✓" : i + 1}</span>
            {i < steps.length - 1 ? <span className={"rail " + (i < current ? "done" : "")} /> : null}
          </div>
        );
      })}
    </div>
  );
}

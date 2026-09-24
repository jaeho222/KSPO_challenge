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

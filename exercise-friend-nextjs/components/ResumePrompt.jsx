"use client";

export default function ResumePrompt({ stepLabel, onResume, onRestart }) {
  return (
    <div className="done-screen">
      <div className="big-emoji">📝</div>
      <h1>하던 설문이 있어요</h1>
      <p className="sub">{stepLabel} 단계까지 답변하셨어요. 이어서 하시겠어요?</p>
      <div className="actions">
        <button className="nav btn-back" style={{ flex: 1 }} onClick={onRestart}>
          처음부터 다시
        </button>
        <button className="nav btn-next" onClick={onResume}>
          이어서 하기
        </button>
      </div>
    </div>
  );
}

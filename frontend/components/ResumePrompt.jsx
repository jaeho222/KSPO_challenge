// ============================================================
// [이어서 하기 안내 화면] 온보딩 중간에 나갔다가 다시 들어왔을 때 뜨는 화면
// - 렌더링 위치: App.jsx가 저장된 온보딩 진행상태(localStorage)를 발견하면
//   QuizStep 대신 이 화면을 먼저 보여줌
// - "이어서 하기" 누르면 멈췄던 단계+답변 그대로 복원, "처음부터 다시"는 초기화
// ============================================================

"use client";

export default function ResumePrompt({ stepLabel, onResume, onRestart }) {
  return (
    <div className="done-screen">
      <div className="big-emoji" aria-hidden="true">📝</div>
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

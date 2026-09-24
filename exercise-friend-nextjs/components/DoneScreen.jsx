"use client";

export default function DoneScreen({ answers, onRestart, onGoToResults }) {
  const interestsText = (answers.interests || []).join(", ") || "-";
  const painText = (answers.painAreas || []).join(", ") || "-";
  const goalsText = (answers.goals || []).join(", ") || "-";

  return (
    <div className="done-screen">
      <div className="big-emoji">🎉</div>
      <h1>설문이 끝났어요!</h1>
      <p className="sub">입력하신 내용을 바탕으로 딱 맞는 프로그램을 찾아드릴게요.</p>
      <div className="summary">
        <div>
          성별 &nbsp; <b>{answers.gender || "-"}</b>
        </div>
        <div>
          연령대 &nbsp; <b>{answers.age || "-"}</b>
        </div>
        <div>
          운동 빈도 &nbsp; <b>{answers.activity || "-"}</b>
        </div>
        <div>
          불편한 부위 &nbsp; <b>{painText}</b>
        </div>
        <div>
          운동 목적 &nbsp; <b>{goalsText}</b>
        </div>
        <div>
          선호 장소 &nbsp; <b>{answers.placePref || "-"}</b>
        </div>
        <div>
          장애인 정보 &nbsp; <b>{answers.disabilityInterest || "-"}</b>
        </div>
        <div>
          거주 지역 &nbsp; <b>{answers.region || "-"}</b>
        </div>
        <div>
          관심 종목 &nbsp; <b>{interestsText}</b>
        </div>
      </div>
      <div className="actions">
        <button className="nav btn-back" style={{ flex: 1 }} onClick={onRestart}>
          다시 하기
        </button>
        <button className="nav btn-next" onClick={onGoToResults}>
          맞춤 시설 보러가기
        </button>
      </div>
    </div>
  );
}

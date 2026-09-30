// ============================================================
// [온보딩 질문 화면] 7단계 설문 중 "현재 보여줄 질문 1개"를 그리는 컴포넌트
// - 렌더링 위치: App.jsx가 screenMode==='quiz'일 때 렌더링 (resumeData 없을 때)
// - step.type에 따라 4가지 다른 UI를 그림: single(단일선택)/multi(다중선택)/
//   text(직접입력, 지역명)/dynamic-multi(지역 데이터 기반 종목 선택)
// - 선택지 이모지는 aria-hidden 처리되어 스크린리더가 안 읽음
// - 질문 데이터 자체는 lib/steps.js 에 정의되어 있음
// ============================================================

"use client";

export default function QuizStep({
  step,
  stepIndex,
  totalSteps,
  answers,
  dynamicOptions, // dynamic-multi 전용: null(로딩중) | [] | [{emoji,label,rawLabel}]
  regions, // text(지역) 전용: 자동완성 목록
  onSelect,
  onTextChange,
  onNext,
  onBack,
}) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  function isSelected(label) {
    const saved = answers[step.key];
    if (step.type === "multi" || step.type === "dynamic-multi") {
      return Array.isArray(saved) && saved.includes(label);
    }
    return saved === label;
  }

  function canProceed() {
    const val = answers[step.key];
    if (step.type === "multi" || step.type === "dynamic-multi") {
      return Array.isArray(val) && val.length > 0;
    }
    if (step.type === "text") return !!(val && val.trim().length > 0);
    return !!val;
  }

  // ---- 지역 데이터 아직 못 찾은 상태(dynamic-multi 로딩 중) ----
  if (step.type === "dynamic-multi" && dynamicOptions === null) {
    const region = answers.region || "입력하신 지역";
    return (
      <>
        <p className="eyebrow">{step.eyebrow}</p>
        <h1>{step.title}</h1>
        <div className="loading-wrap">
          <div className="spinner" />
          <p>
            {region}의 운동 프로그램을
            <br />
            확인하고 있어요...
          </p>
        </div>
      </>
    );
  }

  const options = step.type === "dynamic-multi" ? dynamicOptions : step.options;

  let body = null;
  if (step.type === "text") {
    body = (
      <div className="choices">
        <input
          className="text-input"
          list="region-list"
          type="text"
          placeholder={step.placeholder}
          value={answers[step.key] || ""}
          onChange={(e) => onTextChange(e.target.value)}
        />
        <datalist id="region-list">
          {(regions || []).map((r) => (
            <option value={r} key={r} />
          ))}
        </datalist>
        <p className="hint">입력하면 실제 등록된 지역 목록에서 추천해드려요.</p>
      </div>
    );
  } else if (!options || options.length === 0) {
    body = (
      <div className="choices">
        <p className="hint">이 지역에 등록된 정보를 아직 찾지 못했어요. 이전 단계에서 지역을 다시 확인해주세요.</p>
      </div>
    );
  } else {
    body = (
      <div className="choices">
        {options.map((opt) => {
          const label = opt.rawLabel || opt.label;
          return (
            <button
              key={label}
              type="button"
              className={"choice" + (isSelected(label) ? " selected" : "")}
              onClick={() => onSelect(label)}
            >
              <span className="emoji" aria-hidden="true">{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <p className="eyebrow">{step.eyebrow}</p>
      <h1>{step.title}</h1>
      <p className="sub">{step.sub}</p>
      {body}
      <div className="actions">
        {!isFirst ? (
          <button className="nav btn-back" onClick={onBack}>
            이전
          </button>
        ) : null}
        <button className="nav btn-next" disabled={!canProceed()} onClick={onNext}>
          {isLast ? "완료하고 결과보기" : "다음"}
        </button>
      </div>
    </>
  );
}

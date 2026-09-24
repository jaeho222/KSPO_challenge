export function EquityCard({ eq, regionName }) {
  const belowAvg = eq.myCnt < eq.avgCnt;
  const comment = belowAvg
    ? "전국 평균보다 등록 시설이 적어, 정보 접근이 더 필요한 지역이에요."
    : "전국 평균 이상으로 다양한 체육시설이 등록되어 있어요.";
  return (
    <div className="ref-card">
      <p className="ref-title">📍 우리 동네 체육 복지 지수</p>
      <p className="ref-sub">
        {regionName} · 전국 {eq.total}개 지역 비교 (공공데이터 기준)
      </p>
      <div className="ref-grades">
        등록 시설 <b>{eq.myCnt}개</b> · 전국 {eq.total}개 지역 중 <b>{eq.rank}위</b> (상위 {eq.percentile}%)
        <br />
        종목 다양성 <b>{eq.mySports}개</b> (전국 평균 {eq.avgSports.toFixed(1)}개)
      </div>
      <p className="ref-hint">{comment}</p>
    </div>
  );
}

export function RoutineCard({ routine }) {
  const seqs = ["준비 운동", "본 운동", "정리 운동"];
  return (
    <div className="ref-card">
      <p className="ref-title">🗓️ 이번 주 표준 운동 루틴</p>
      <p className="ref-sub">
        {routine.grp} · {routine.weekLabel} 프로그램 (공공데이터)
      </p>
      {seqs.map((seq) => {
        const items = routine.bySeq[seq].slice(0, 2);
        if (!items.length) return null;
        return (
          <div key={seq}>
            <p style={{ margin: "8px 0 4px", fontSize: "13px", fontWeight: 700, color: "var(--primary-dark)" }}>
              {seq}
            </p>
            {items.map((it) => (
              <p className="review-snippet" style={{ margin: "0 0 4px" }} key={it.n}>
                · {it.n}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function FitnessRefCard({ data, diff }) {
  const g = {};
  data.grades.forEach((r) => (g[r.grade] = r.value));
  return (
    <div className="ref-card">
      <p className="ref-title">📊 국민체력100 참고 정보</p>
      <p className="ref-sub">
        {data.stage.split("(")[0]} · 만 {data.range}세 · {data.sex}성 기준 (공공데이터)
      </p>
      <div className="ref-grades">
        <b>{data.item}</b>
        <br />
        3등급 {g["3등급"] || "-"} · 2등급 {g["2등급"] || "-"} · 1등급 {g["1등급"] || "-"}
      </div>
      <p className="ref-hint">
        답변하신 운동 빈도를 보면 <b>{diff}</b> 난이도 프로그램부터 시작하는 걸 추천드려요.
      </p>
    </div>
  );
}

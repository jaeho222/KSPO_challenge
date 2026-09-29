// ============================================================
// [정보 카드 3종 모음] EquityCard(형평성지수) / RoutineCard(주간루틴) /
//   FitnessRefCard(체력참고정보) - 관련있는 작은 카드들이라 한 파일에 모아둠
// - 렌더링 위치: HomeScreen.jsx에서 각각 호출
// - FitnessRefCard는 클라이언트 컴포넌트(useEffect)임: 체력인증 도전과제에서
//   실제 측정 기록이 있으면 그걸로, 없으면 통증부위 답변으로 난이도를 추정하는
//   하이브리드 로직(getCertBasedDifficulty/getBaselineDifficulty)을 씀
// - IconTitle: 제목 문자열 앞 이모지를 자동으로 aria-hidden 처리하는 내부 헬퍼
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { getBaselineDifficulty, getCertBasedDifficulty, splitLeadingEmoji } from "../lib/logic";

function IconTitle({ text }) {
  const { icon, text: rest } = splitLeadingEmoji(text);
  return (
    <p className="ref-title">
      {icon ? <span aria-hidden="true">{icon} </span> : null}
      {rest}
    </p>
  );
}

export function EquityCard({ eq, regionName }) {
  const belowAvg = eq.myCnt < eq.avgCnt;
  const comment = belowAvg
    ? "전국 평균보다 등록 시설이 적어, 정보 접근이 더 필요한 지역이에요."
    : "전국 평균 이상으로 다양한 체육시설이 등록되어 있어요.";
  return (
    <div className="ref-card">
      <IconTitle text="🏆 우리 동네 체육 복지 지수" />
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
      <IconTitle text="🗓️ 이번 주 표준 운동 루틴" />
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

export function FitnessRefCard({ data, gender, age, painAreas, fitnessStandards }) {
  const [diffInfo, setDiffInfo] = useState(null);

  useEffect(() => {
    const certBased = getCertBasedDifficulty(fitnessStandards, gender, age);
    if (certBased) {
      setDiffInfo({ source: "cert", label: certBased.label, count: certBased.count });
    } else {
      setDiffInfo({ source: "baseline", label: getBaselineDifficulty(painAreas) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender, age, painAreas]);

  const g = {};
  data.grades.forEach((r) => (g[r.grade] = r.value));
  return (
    <div className="ref-card">
      <IconTitle text="📊 국민체력100 참고 정보" />
      <p className="ref-sub">
        {data.stage.split("(")[0]} · 만 {data.range}세 · {data.sex}성 기준
      </p>
      <p className="ref-source">
        출처: 국민체력100 누리집(nfa.kspo.or.kr) 공개 기준표를 직접 수집·정리함 (Open API 미제공 항목)
      </p>
      <div className="ref-grades">
        <b>{data.item}</b>
        <br />
        3등급 {g["3등급"] || "-"} · 2등급 {g["2등급"] || "-"} · 1등급 {g["1등급"] || "-"}
      </div>
      {diffInfo ? (
        diffInfo.source === "cert" ? (
          <p className="ref-hint">
            체력인증 도전과제에서 실제 기록하신 결과({diffInfo.count}개 항목)를 보면, <b>{diffInfo.label}</b> 난이도
            프로그램이 잘 맞아요.
          </p>
        ) : (
          <p className="ref-hint">
            지금은 <b>{diffInfo.label}</b> 난이도부터 시작해보는 걸 추천드려요. 마이페이지의 <b>국민체력100 도전과제</b>
            에서 실제 기록을 입력하면 더 정확하게 알려드려요!
          </p>
        )
      ) : null}
    </div>
  );
}

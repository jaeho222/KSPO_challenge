"use client";

import {
  findRegionKey,
  findFitnessRef,
  difficultyFromActivity,
  getRehabVideos,
  getGuideVideos,
  getDisableFacilities,
  getRegionEquity,
  getWeeklyRoutine,
  sportEmoji,
} from "../lib/logic";
import { EquityCard, RoutineCard, FitnessRefCard } from "./InfoCards";
import VideoCard from "./VideoCard";
import FacilityCard, { DisableFacilityCard } from "./FacilityCard";

export default function HomeScreen({ data, answers }) {
  const regionKey = findRegionKey(data.kspo, answers.region || "");
  const allFac = regionKey ? data.kspo.regionFacilities[regionKey] || [] : [];
  const interests = answers.interests || [];

  let matched = allFac.filter((f) => interests.includes(f.m));
  let note = "";
  if (!matched.length && allFac.length) {
    matched = allFac.slice(0, 6);
    note = "선택하신 종목의 강좌를 아직 못 찾아서, 같은 지역의 다른 프로그램을 보여드려요.";
  }

  const fitnessRef = findFitnessRef(data.fitness, answers.gender, answers.age);
  const diff = difficultyFromActivity(answers.activity);
  const rehabVideos = getRehabVideos(data.mscl, answers.painAreas);
  const guideVideos = getGuideVideos(data.guide, answers.goals, answers.age, answers.placePref);
  const wantsDisable = answers.disabilityInterest === "예";
  const disableInfo = wantsDisable
    ? getDisableFacilities(data.disable, regionKey, interests)
    : { list: [], note: "" };
  const equity = regionKey ? getRegionEquity(data.kspo, regionKey) : null;
  const routine = getWeeklyRoutine(data.stdFtns, answers.age);

  return (
    <>
      <p className="eyebrow">맞춤 추천 결과</p>
      <h1>{answers.region || "입력하신 지역"}에서 찾은 프로그램이에요</h1>
      <div style={{ marginBottom: 16 }}>
        {interests.map((i) => (
          <span className="region-summary-chip" key={i}>
            {sportEmoji(i)} {i}
          </span>
        ))}
      </div>

      {equity ? <EquityCard eq={equity} regionName={answers.region || regionKey} /> : null}
      {routine ? <RoutineCard routine={routine} /> : null}
      {fitnessRef ? <FitnessRefCard data={fitnessRef} diff={diff} /> : null}

      {rehabVideos.length ? (
        <>
          <p className="section-title">🧘 통증 완화에 도움되는 스트레칭</p>
          <div className="facility-list">
            {rehabVideos.map((v, i) => (
              <VideoCard key={i} title={v.n} desc={v.d} tags={[v.part, v.step]} />
            ))}
          </div>
        </>
      ) : null}

      {guideVideos.length ? (
        <>
          <p className="section-title">🎯 목적에 맞는 운동 가이드</p>
          <div className="facility-list">
            {guideVideos.map((v, i) => (
              <VideoCard key={i} title={v.n} desc={v.d} tags={[v.lv, v.p]} />
            ))}
          </div>
        </>
      ) : null}

      <p className="section-title">🏟️ 우리 동네 프로그램 ({matched.length}곳)</p>
      {note ? (
        <p className="hint" style={{ marginBottom: 12 }}>
          {note}
        </p>
      ) : null}
      <div className="facility-list">
        {matched.length ? (
          matched.map((f, i) => <FacilityCard key={i} f={f} />)
        ) : (
          <p className="hint">
            아직 등록된 시설 정보를 찾지 못했어요. 이전 단계에서 지역 이름을 목록에 있는 이름으로 다시 선택해보세요.
          </p>
        )}
      </div>

      {wantsDisable ? (
        <>
          <p className="section-title">♿ 장애인 스포츠강좌 등록시설</p>
          {disableInfo.note ? (
            <p className="hint" style={{ marginBottom: 12 }}>
              {disableInfo.note}
            </p>
          ) : null}
          <div className="facility-list">
            {disableInfo.list.length ? (
              disableInfo.list.map((f, i) => <DisableFacilityCard key={i} f={f} />)
            ) : (
              <p className="hint">이 지역에는 아직 등록된 장애인 스포츠강좌 시설이 없어요.</p>
            )}
          </div>
        </>
      ) : null}
    </>
  );
}

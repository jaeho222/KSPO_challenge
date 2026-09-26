"use client";

import {
  findRegionKey,
  findFitnessRef,
  getRehabVideos,
  getGuideVideos,
  getDisableFacilities,
  getRegionEquity,
  getWeeklyRoutine,
  sportEmoji,
} from "../lib/logic";
import { EquityCard, RoutineCard, FitnessRefCard } from "./InfoCards";
import CalendarWidget from "./CalendarWidget";
import CollapsibleSection from "./CollapsibleSection";
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
  const rehabVideos = getRehabVideos(data.mscl, answers.painAreas);
  const guideVideos = getGuideVideos(data.guide, answers.goals, answers.age);
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

      {/* 항상 바로 보이는 핵심 위젯 (작고 한눈에 들어오는 것들만) */}
      {regionKey ? <CalendarWidget data={data} answers={answers} /> : null}

      {/* 형평성 지수는 서비스 핵심 차별점이라 접지 않고 바로 보여줌 */}
      {equity ? <EquityCard eq={equity} regionName={answers.region || regionKey} /> : null}

      {/* 나머지 보조 정보는 접어두고, 필요할 때만 펼쳐보게 함 (한 화면 정보 과밀 방지) */}
      {routine ? (
        <CollapsibleSection title="🗓️ 이번 주 표준 운동 루틴" subtitle={`${routine.grp} · ${routine.weekLabel}`}>
          <RoutineCard routine={routine} />
        </CollapsibleSection>
      ) : null}

      {fitnessRef ? (
        <CollapsibleSection title="📊 국민체력100 참고 정보" subtitle="내 연령대 기준 보기">
          <FitnessRefCard
            data={fitnessRef}
            gender={answers.gender}
            age={answers.age}
            painAreas={answers.painAreas}
            fitnessStandards={data.fitness}
          />
        </CollapsibleSection>
      ) : null}

      {rehabVideos.length ? (
        <CollapsibleSection
          title="🧘 통증 완화 스트레칭"
          subtitle={`${rehabVideos.length}개 영상`}
          defaultOpen // 통증 부위를 직접 선택했을 만큼 관련도가 높아서 기본으로 펼쳐둠
        >
          <div className="facility-list">
            {rehabVideos.map((v, i) => (
              <VideoCard key={i} title={v.n} desc={v.d} tags={[v.part, v.step]} />
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {guideVideos.length ? (
        <CollapsibleSection title="🎯 목적에 맞는 운동 가이드" subtitle={`${guideVideos.length}개 영상`}>
          <div className="facility-list">
            {guideVideos.map((v, i) => (
              <VideoCard key={i} title={v.n} desc={v.d} tags={[v.lv, v.p]} />
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {/* 서비스의 핵심 목적이라 기본으로 펼쳐둠 */}
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
        <CollapsibleSection
          title="♿ 장애인 스포츠강좌 등록시설"
          subtitle={`${disableInfo.list.length}곳`}
          defaultOpen // 사용자가 직접 선택한 옵션이라 기본으로 펼쳐둠
        >
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
        </CollapsibleSection>
      ) : null}
    </>
  );
}

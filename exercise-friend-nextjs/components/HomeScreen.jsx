// ============================================================
// [홈 탭 메인 화면] 이 서비스의 핵심 화면 - 온보딩 결과로 만든 맞춤 추천
// - 렌더링 위치: App.jsx가 screenMode==='results'일 때 렌더링
// - 화면 순서(위→아래): 관심종목 칩 → 캘린더위젯 → 형평성지수(항상 열림)
//   → [장애인이용가능시설: 온보딩에서 선택했으면 최상단 노출]
//   → 아코디언(루틴/체력정보/목표별루틴/가이드영상, 필요시만 펼침)
//   → 우리 동네 프로그램(시설카드 목록, 핵심이라 항상 열림)
// - data prop은 App.jsx가 조립해서 내려주는 통합 객체
//   (data.kspo = 지역+시설, data.fitness/guide/mscl/stdFtns/routineGoal/cert = 나머지 5개 공공데이터)
// ============================================================

"use client";

import {
  findRegionKey,
  findFitnessRef,
  getRehabVideos,
  getGuideVideos,
  getDisableFacilities,
  getRegionEquity,
  getWeeklyRoutine,
  getGoalRoutine,
  sportEmoji,
  facilityKey,
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
  const goalRoutine = data.routineGoal
    ? getGoalRoutine(data.routineGoal, answers.painAreas, answers.age, answers.goals)
    : null;

  // 일반 시설 목록에서 "이 시설도 장애인 이용 가능해요" 배지를 달기 위한 조회용 Set
  const accessibleKeys = new Set(disableInfo.list.map((f) => facilityKey(f)));

  return (
    <>
      <p className="eyebrow">맞춤 추천 결과</p>
      <h1>{answers.region || "입력하신 지역"}에서 찾은 프로그램이에요</h1>
      <div style={{ marginBottom: 16 }}>
        {interests.map((i) => (
          <span className="region-summary-chip" key={i}>
            <span aria-hidden="true">{sportEmoji(i)}</span> {i}
          </span>
        ))}
      </div>

      {/* 항상 바로 보이는 핵심 위젯 (작고 한눈에 들어오는 것들만) */}
      {regionKey ? <CalendarWidget data={data} answers={answers} /> : null}

      {/* 형평성 지수는 서비스 핵심 차별점이라 접지 않고 바로 보여줌 */}
      {equity ? <EquityCard eq={equity} regionName={answers.region || regionKey} /> : null}

      {/* 온보딩에서 장애인 정보를 원한다고 선택했으면, 다른 어떤 정보보다 먼저 상단에 보여줌 */}
      {wantsDisable ? (
        <>
          <p className="section-title">
            <span aria-hidden="true">♿ </span>장애인 이용 가능 시설 안내 ({disableInfo.list.length}곳)
          </p>
          {disableInfo.note ? (
            <p className="hint" style={{ marginBottom: 12 }}>
              {disableInfo.note}
            </p>
          ) : null}
          <div className="facility-list">
            {disableInfo.list.length ? (
              disableInfo.list.map((f, i) => <DisableFacilityCard key={i} f={f} />)
            ) : (
              <p className="hint">이 지역에는 아직 등록된 장애인 이용 가능 시설이 없어요.</p>
            )}
          </div>
        </>
      ) : null}

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

      {goalRoutine ? (
        <CollapsibleSection
          title={`🎯 ${goalRoutine.aim} 맞춤 루틴`}
          subtitle="준비-본-정리 운동 3단계"
          defaultOpen // 통증부위/연령을 근거로 골라준 맞춤 루틴이라 기본으로 펼쳐둠
        >
          <p className="ref-source" style={{ margin: "-4px 0 10px" }}>
            설명 문구는 공공데이터 원본에서 같은 목표의 운동들에 공통으로 제공하는 문구예요.
          </p>
          {Object.entries(goalRoutine.bySeq)
            .slice(0, 4)
            .map(([seq, videos]) => (
              <div key={seq} style={{ marginBottom: 10 }}>
                <p style={{ fontWeight: 700, fontSize: "0.9375rem", margin: "0 0 6px" }}>{seq}</p>
                <div className="facility-list">
                  {videos.slice(0, 3).map((v, i) => (
                    <VideoCard key={i} title={v.n} desc={v.d} tags={[v.part].filter(Boolean)} vid={v.vid} thumb={v.thumb} />
                  ))}
                </div>
              </div>
            ))}
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
              <VideoCard key={i} title={v.n} desc={v.d} tags={[v.part, v.step]} vid={v.vid} thumb={v.thumb} />
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {guideVideos.length ? (
        <CollapsibleSection title="🎯 목적에 맞는 운동 가이드" subtitle={`${guideVideos.length}개 영상`}>
          <div className="facility-list">
            {guideVideos.map((v, i) => (
              <VideoCard key={i} title={v.n} desc={v.d} tags={[v.lv, v.p]} vid={v.vid} thumb={v.thumb} />
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {/* 서비스의 핵심 목적이라 기본으로 펼쳐둠 */}
      <p className="section-title">
        <span aria-hidden="true">🏟️ </span>우리 동네 프로그램 ({matched.length}곳)
      </p>
      {note ? (
        <p className="hint" style={{ marginBottom: 12 }}>
          {note}
        </p>
      ) : null}
      <div className="facility-list">
        {matched.length ? (
          matched.map((f, i) => (
            <FacilityCard key={i} f={f} accessible={wantsDisable && accessibleKeys.has(facilityKey(f))} />
          ))
        ) : (
          <p className="hint">
            아직 등록된 시설 정보를 찾지 못했어요. 이전 단계에서 지역 이름을 목록에 있는 이름으로 다시 선택해보세요.
          </p>
        )}
      </div>
    </>
  );
}

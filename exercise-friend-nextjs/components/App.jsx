"use client";

import { useEffect, useState } from "react";
import { steps } from "../lib/steps";
import { findRegionKey, getRegionSports } from "../lib/logic";
import Header from "./Header";
import A11yBar from "./A11yBar";
import TrackBar from "./TrackBar";
import TabBar from "./TabBar";
import QuizStep from "./QuizStep";
import DoneScreen from "./DoneScreen";
import HomeScreen from "./HomeScreen";
import CalendarScreen from "./CalendarScreen";
import CommunityScreen from "./CommunityScreen";
import MypageScreen from "./MypageScreen";
import SearchScreen from "./SearchScreen";

const DATA_FILES = {
  kspo: "/data/kspo_data.json",
  fitness: "/data/fitness_standards.json",
  guide: "/data/guide_data.json",
  mscl: "/data/mscl_data.json",
  disable: "/data/disable_facilities.json",
  stdFtns: "/data/std_ftns_data.json",
  cert: "/data/cert_data.json",
};

function canProceedForStep(step, answers) {
  const val = answers[step.key];
  if (step.type === "multi" || step.type === "dynamic-multi") {
    return Array.isArray(val) && val.length > 0;
  }
  if (step.type === "text") return !!(val && val.trim().length > 0);
  return !!val;
}

export default function App() {
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [screenMode, setScreenMode] = useState("quiz"); // quiz -> done -> results/calendar/community/mypage
  const [programCache, setProgramCache] = useState({});
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearchChange(value) {
    setSearchQuery(value);
    if (value.trim() && screenMode !== "search") {
      setScreenMode("search");
    }
  }

  // ---- 데이터 로딩 (친구의 백엔드 API 자리를 지금은 정적 JSON으로 대신함) ----
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      Object.entries(DATA_FILES).map(([key, url]) =>
        fetch(url)
          .then((res) => res.json())
          .then((json) => [key, json])
      )
    ).then((entries) => {
      if (cancelled) return;
      const merged = {};
      entries.forEach(([key, json]) => {
        merged[key] = json;
      });
      setData(merged);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- 큰글씨 / 고대비 모드를 body 클래스에 반영 ----
  useEffect(() => {
    document.body.classList.toggle("large-text", largeText);
  }, [largeText]);
  useEffect(() => {
    document.body.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);

  // ---- "해보고 싶은 운동" 단계: 지역 데이터 기반으로 종목 목록 준비 ----
  useEffect(() => {
    const step = steps[current];
    if (!data || !step || step.type !== "dynamic-multi" || screenMode !== "quiz") return;
    const region = answers.region || "";
    if (programCache[region] !== undefined) return;
    const timer = setTimeout(() => {
      const regionKey = findRegionKey(data.kspo, region);
      const options = getRegionSports(data.kspo, regionKey);
      setProgramCache((prev) => ({ ...prev, [region]: options }));
    }, 700);
    return () => clearTimeout(timer);
  }, [current, answers.region, data, programCache, screenMode]);

  function handleSelect(label) {
    const step = steps[current];
    setAnswers((prev) => {
      const next = { ...prev };
      if (step.type === "multi" || step.type === "dynamic-multi") {
        let list = next[step.key] ? [...next[step.key]] : [];
        if (step.exclusive) {
          if (label === step.exclusive) {
            list = list.includes(label) ? [] : [label];
          } else {
            list = list.filter((l) => l !== step.exclusive);
            const pos = list.indexOf(label);
            if (pos === -1) list.push(label);
            else list.splice(pos, 1);
          }
        } else {
          const pos = list.indexOf(label);
          if (pos === -1) list.push(label);
          else list.splice(pos, 1);
        }
        next[step.key] = list;
      } else {
        next[step.key] = label;
      }
      return next;
    });
  }

  function handleTextChange(value) {
    const step = steps[current];
    setAnswers((prev) => ({ ...prev, [step.key]: value }));
  }

  function goNext() {
    const step = steps[current];
    if (!canProceedForStep(step, answers)) return;
    if (current === steps.length - 1) {
      setScreenMode("done");
    } else {
      setCurrent((c) => c + 1);
    }
  }
  function goBack() {
    setCurrent((c) => Math.max(0, c - 1));
  }
  function restart() {
    setCurrent(0);
    setScreenMode("quiz");
    setAnswers({});
    setProgramCache({});
  }
  function goToResults() {
    setScreenMode("results");
  }
  function switchTab(tab) {
    setScreenMode(tab);
  }

  const a11yBar = (
    <A11yBar
      largeText={largeText}
      highContrast={highContrast}
      onToggleLargeText={() => setLargeText((v) => !v)}
      onToggleContrast={() => setHighContrast((v) => !v)}
    />
  );

  if (!data) {
    return (
      <>
        <Header title="운동친구" showSearch={false} />
        <div className="page-shell">
          {a11yBar}
          <div className="card">
            <div className="loading-wrap">
              <div className="spinner" />
              <p>데이터를 불러오고 있어요...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const isTabScreen = ["search", "results", "calendar", "community", "mypage"].includes(screenMode);

  return (
    <>
      <Header
        title="운동친구"
        showSearch={isTabScreen}
        query={searchQuery}
        onQueryChange={handleSearchChange}
      />
      <div className="page-shell">
        {a11yBar}
        {isTabScreen ? (
          <TabBar screenMode={screenMode} onSwitch={switchTab} />
        ) : (
          <TrackBar steps={steps} current={current} />
        )}
        <div className={"card" + (isTabScreen ? "" : " card-narrow")}>
          {screenMode === "quiz" ? (
            <QuizStep
              step={steps[current]}
              stepIndex={current}
              totalSteps={steps.length}
              answers={answers}
              dynamicOptions={
                steps[current].type === "dynamic-multi" ? programCache[answers.region || ""] ?? null : null
              }
              regions={data.kspo.regions}
              onSelect={handleSelect}
              onTextChange={handleTextChange}
              onNext={goNext}
              onBack={goBack}
            />
          ) : null}
          {screenMode === "done" ? (
            <DoneScreen answers={answers} onRestart={restart} onGoToResults={goToResults} />
          ) : null}
          {screenMode === "results" ? <HomeScreen data={data} answers={answers} /> : null}
          {screenMode === "search" ? <SearchScreen data={data} query={searchQuery} /> : null}
          {screenMode === "calendar" ? <CalendarScreen data={data} answers={answers} /> : null}
          {screenMode === "community" ? <CommunityScreen answers={answers} /> : null}
          {screenMode === "mypage" ? (
            <MypageScreen data={data} answers={answers} onRestart={restart} />
          ) : null}
        </div>
      </div>
    </>
  );
}

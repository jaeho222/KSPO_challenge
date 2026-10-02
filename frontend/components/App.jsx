// ============================================================
// [최상위 앱 컴포넌트] 이 프로젝트의 "뇌" 역할
// - 렌더링 위치: app/page.js 에서 <App /> 으로 호출됨 (앱의 시작점)
// - 하는 일:
//   1) 3단계 데이터 로딩 관리 (1단계: 지역/종목 인덱스 → 2단계: 설문 끝나면
//      체력/영상 데이터+내 지역 시설 → 3단계: 검색 탭 열 때 전국 데이터)
//   2) 온보딩 답변(answers), 현재 질문(current), 화면(screenMode: quiz/done/
//      results/search/community/mypage) 상태를 전부 관리
//   3) 온보딩 중간저장/이어하기, 큰글씨 모드 처리
// - 화면 전환 시 각 화면 컴포넌트(QuizStep, DoneScreen, HomeScreen,
//   SearchScreen, CommunityScreen, MypageScreen)를 골라서 렌더링함
// ============================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { steps } from "../lib/steps";
import {
  findRegionKey,
  getRegionSports,
  saveOnboardingProgress,
  loadOnboardingProgress,
  clearOnboardingProgress,
  saveCompletedOnboarding,
  loadCompletedOnboarding,
  clearCompletedOnboarding,
} from "../lib/logic";
import Header from "./Header";
import A11yBar from "./A11yBar";
import TrackBar from "./TrackBar";
import TabBar from "./TabBar";
import QuizStep from "./QuizStep";
import ResumePrompt from "./ResumePrompt";
import DoneScreen from "./DoneScreen";
import HomeScreen from "./HomeScreen";
import CommunityScreen from "./CommunityScreen";
import MypageScreen from "./MypageScreen";
import SearchScreen from "./SearchScreen";

// ---- 3단계 로딩 구조 ----
// 1단계(항상, 빠름): 지역목록+종목목록만 담은 작은 인덱스 파일
// 2단계(설문 끝나고): 체력/영상 데이터 + 내가 고른 지역 하나의 시설 데이터
// 3단계(검색 탭 열 때만): 전국 259개 지역 전체 데이터 (제일 무거움, 검색 안 쓰면 평생 안 받음)
const REGION_INDEX_FILE = "/data/region_index.json";
const BASE_SECONDARY_FILES = {
  fitness: "/data/fitness_standards.json",
  guide: "/data/guide_data.json",
  mscl: "/data/mscl_data.json",
  stdFtns: "/data/std_ftns_data.json",
  cert: "/data/cert_data.json",
  routineGoal: "/data/routine_goal_data.json",
};
const DISABLE_FILE = "/data/disable_facilities.json"; // 장애인 옵션 선택 시에만 로드 (870KB)
const FULL_KSPO_FILE = "/data/kspo_data.json"; // 검색 전용 (지연 로딩)

function regionFileUrl(regionIndex, regionKey) {
  // 한글 파일명은 Windows에서 압축 해제할 때 깨질 수 있어서, 숫자 ID로 매핑해서 사용함
  const fileId = regionIndex.regionFileMap ? regionIndex.regionFileMap[regionKey] : null;
  if (fileId === null || fileId === undefined) return null;
  return `/data/region_facilities/${fileId}.json`;
}

function canProceedForStep(step, answers) {
  const val = answers[step.key];
  if (step.type === "multi" || step.type === "dynamic-multi") {
    return Array.isArray(val) && val.length > 0;
  }
  if (step.type === "text") return !!(val && val.trim().length > 0);
  return !!val;
}

export default function App() {
  const [regionIndex, setRegionIndex] = useState(null); // {regions, regionSports}
  const [secondaryData, setSecondaryData] = useState(null); // {fitness, guide, mscl, disable?, stdFtns, cert}
  const [regionFacilitiesMap, setRegionFacilitiesMap] = useState({}); // regionKey -> facility[]
  const [fullDataLoaded, setFullDataLoaded] = useState(false); // 검색용 전국 데이터 로드 여부

  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [screenMode, setScreenMode] = useState("quiz"); // quiz -> done -> results/search/community/mypage
  const [programCache, setProgramCache] = useState({});
  const [largeText, setLargeText] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasCheckedResume, setHasCheckedResume] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [loadError, setLoadError] = useState(null); // 데이터 로딩 실패 메시지 (있으면 재시도 버튼 표시)
  const [retryTick, setRetryTick] = useState(0); // "다시 시도" 누르면 이 값을 바꿔서 아래 useEffect를 재실행시킴

  // "지금 요청 중"임을 추적하는 ref. state가 아니라 ref를 쓰는 이유:
  // state는 비동기로 갱신돼서, 응답 오기 전에 화면이 여러 번 다시 그려지면
  // "아직 안 왔으니까 또 요청하자"는 중복 요청이 생길 수 있음 (실제로 있었던 버그).
  // ref는 즉시 갱신되니까 같은 요청이 두 번 나가는 걸 확실히 막아줌.
  const secondaryLoadingRef = useRef(false);
  const regionLoadingRef = useRef(new Set());
  const fullDataLoadingRef = useRef(false);

  // ---- 1단계: 지역/종목 인덱스만 빠르게 로드 (온보딩은 이것만 있어도 시작 가능) ----
  useEffect(() => {
    let cancelled = false;
    fetch(REGION_INDEX_FILE)
      .then((res) => {
        if (!res.ok) throw new Error(`지역 인덱스 응답 실패 (${res.status})`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setRegionIndex(json);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError("서비스를 불러오지 못했어요. 네트워크 상태를 확인하고 다시 시도해주세요.");
      });
    return () => {
      cancelled = true;
    };
  }, [retryTick]);

  // ---- 2단계: 설문이 끝나갈 때(done 화면 진입 시점) 체력/영상 데이터 + 내 지역 데이터를 미리 준비 ----
  useEffect(() => {
    if (!regionIndex) return;
    const needsResults = ["done", "results", "mypage"].includes(screenMode);
    if (!needsResults) return;

    if (!secondaryData && !secondaryLoadingRef.current) {
      secondaryLoadingRef.current = true;
      const files = { ...BASE_SECONDARY_FILES };
      if (answers.disabilityInterest === "예") {
        files.disable = DISABLE_FILE; // 장애인 정보를 원한 사람한테만 870KB 추가로 로드
      }
      Promise.all(
        Object.entries(files).map(([key, url]) =>
          fetch(url).then((res) => {
            if (!res.ok) throw new Error(`${url} 응답 실패 (${res.status})`);
            return res.json().then((json) => [key, json]);
          })
        )
      )
        .then((entries) => {
          const merged = {};
          entries.forEach(([key, json]) => {
            merged[key] = json;
          });
          setSecondaryData(merged);
          setLoadError(null);
        })
        .catch((err) => {
          // 실패해도 영원히 멈추지 않게: 재시도 가능하도록 플래그를 풀어줌
          secondaryLoadingRef.current = false;
          setLoadError("데이터를 불러오지 못했어요. 네트워크 상태를 확인하고 다시 시도해주세요.");
        });
    }

    const regionKey = findRegionKey(regionIndex, answers.region || "");
    const fileUrl = regionKey ? regionFileUrl(regionIndex, regionKey) : null;
    if (regionKey && fileUrl && regionFacilitiesMap[regionKey] === undefined && !regionLoadingRef.current.has(regionKey)) {
      regionLoadingRef.current.add(regionKey);
      fetch(fileUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`지역 데이터 응답 실패 (${res.status})`);
          return res.json();
        })
        .then((arr) => {
          setRegionFacilitiesMap((prev) => ({ ...prev, [regionKey]: arr }));
        })
        .catch((err) => {
          regionLoadingRef.current.delete(regionKey); // 재시도 가능하도록 플래그를 풀어줌
          setLoadError("우리 동네 시설 정보를 불러오지 못했어요. 네트워크 상태를 확인하고 다시 시도해주세요.");
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenMode, regionIndex, answers.region, retryTick]);

  function handleRetryLoad() {
    setLoadError(null);
    setRetryTick((t) => t + 1);
  }

  // ---- 3단계: 검색 탭을 처음 열 때만 전국 데이터 전체를 불러옴 ----
  useEffect(() => {
    if (screenMode !== "search" || fullDataLoaded || fullDataLoadingRef.current || !regionIndex) return;
    fullDataLoadingRef.current = true;
    fetch(FULL_KSPO_FILE)
      .then((res) => {
        if (!res.ok) throw new Error(`전국 데이터 응답 실패 (${res.status})`);
        return res.json();
      })
      .then((full) => {
        setRegionFacilitiesMap(full.regionFacilities || {});
        setFullDataLoaded(true);
        setLoadError(null);
      })
      .catch((err) => {
        fullDataLoadingRef.current = false;
        setLoadError("전국 시설 데이터를 불러오지 못했어요. 네트워크 상태를 확인하고 다시 시도해주세요.");
      });
  }, [screenMode, fullDataLoaded, regionIndex, retryTick]);

  // ---- 페이지를 처음 열었을 때, 저장된 온보딩 진행상태가 있는지 딱 한 번 확인 ----
  useEffect(() => {
    // 이전에 설문을 끝까지 마친 브라우저면 설문을 건너뛰고 바로 결과 화면으로
    const completed = loadCompletedOnboarding();
    if (completed) {
      setAnswers(completed);
      setScreenMode("results");
      setHasCheckedResume(true);
      return;
    }
    const saved = loadOnboardingProgress();
    if (saved && ((saved.current || 0) > 0 || Object.keys(saved.answers || {}).length > 0)) {
      setResumeData(saved);
    }
    setHasCheckedResume(true);
  }, []);

  // ---- 설문 진행 중일 때만 자동 저장. 완료했거나 다른 화면으로 넘어가면 저장분 삭제 ----
  useEffect(() => {
    if (!hasCheckedResume || resumeData) return;
    if (screenMode === "quiz") {
      saveOnboardingProgress({ current, answers });
    } else {
      clearOnboardingProgress();
    }
  }, [current, answers, screenMode, hasCheckedResume, resumeData]);

  function handleResume() {
    setCurrent(resumeData.current || 0);
    setAnswers(resumeData.answers || {});
    setResumeData(null);
  }
  function handleRestartFromPrompt() {
    clearOnboardingProgress();
    setResumeData(null);
  }

  function handleSearchChange(value) {
    setSearchQuery(value);
    if (value.trim() && screenMode !== "search") {
      setScreenMode("search");
    }
  }

  // ---- 큰글씨 모드 ----
  useEffect(() => {
    document.documentElement.classList.toggle("large-text", largeText);
  }, [largeText]);

  // ---- "해보고 싶은 운동" 단계: 지역 데이터 기반으로 종목 목록 준비 ----
  useEffect(() => {
    const step = steps[current];
    if (!regionIndex || !step || step.type !== "dynamic-multi" || screenMode !== "quiz") return;
    const region = answers.region || "";
    if (programCache[region] !== undefined) return;
    const timer = setTimeout(() => {
      const regionKey = findRegionKey(regionIndex, region);
      const options = getRegionSports(regionIndex, regionKey);
      setProgramCache((prev) => ({ ...prev, [region]: options }));
    }, 700);
    return () => clearTimeout(timer);
  }, [current, answers.region, regionIndex, programCache, screenMode]);

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
      saveCompletedOnboarding(answers);
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
    clearOnboardingProgress();
    clearCompletedOnboarding();
  }
  function goToResults() {
    setScreenMode("results");
  }
  function switchTab(tab) {
    setScreenMode(tab);
  }

  const a11yBar = (
    <A11yBar largeText={largeText} onToggleLargeText={() => setLargeText((v) => !v)} />
  );

  // 1단계(지역 인덱스)도 아직이면 아예 아무것도 못 보여줌 (몇백 KB라 매우 빠름)
  if (!regionIndex) {
    return (
      <>
        <Header title="김코치" showSearch={false} />
        <div className="page-shell">
          {a11yBar}
          <div className="card">
            {loadError ? (
              <div className="loading-wrap">
                <p>{loadError}</p>
                <button className="btn-outline" type="button" onClick={handleRetryLoad}>
                  다시 시도
                </button>
              </div>
            ) : (
              <div className="loading-wrap">
                <div className="spinner" />
                <p>불러오는 중...</p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  const isTabScreen = ["search", "results", "community", "mypage"].includes(screenMode);

  // 화면에서 쓸 최종 data 객체를 조립 (기존 컴포넌트들이 기대하는 모양 그대로 유지)
  const composedData = {
    kspo: {
      regions: regionIndex.regions,
      regionSports: regionIndex.regionSports,
      regionFacilities: regionFacilitiesMap,
      regionFacilityCounts: regionIndex.regionFacilityCounts,
    },
    ...(secondaryData || {}),
  };

  const regionKeyForAnswers = findRegionKey(regionIndex, answers.region || "");
  const resultsDataReady =
    !!secondaryData && (!regionKeyForAnswers || regionFacilitiesMap[regionKeyForAnswers] !== undefined);
  const searchDataReady = fullDataLoaded;

  function renderLoadingCard(message) {
    if (loadError) {
      return (
        <div className="loading-wrap">
          <p>{loadError}</p>
          <button className="btn-outline" type="button" onClick={handleRetryLoad}>
            다시 시도
          </button>
        </div>
      );
    }
    return (
      <div className="loading-wrap">
        <div className="spinner" />
        <p>{message}</p>
      </div>
    );
  }

  return (
    <>
      <Header
        title="김코치"
        showSearch={isTabScreen}
        query={searchQuery}
        onQueryChange={handleSearchChange}
      />
      <div className="page-shell">
        {a11yBar}
        {resumeData ? null : isTabScreen ? (
          <TabBar screenMode={screenMode} onSwitch={switchTab} />
        ) : (
          <TrackBar steps={steps} current={current} />
        )}
        <div className={"card" + (isTabScreen ? "" : " card-narrow")}>
          {resumeData ? (
            <ResumePrompt
              stepLabel={`${(resumeData.current || 0) + 1} / ${steps.length}`}
              onResume={handleResume}
              onRestart={handleRestartFromPrompt}
            />
          ) : screenMode === "quiz" ? (
            <QuizStep
              step={steps[current]}
              stepIndex={current}
              totalSteps={steps.length}
              answers={answers}
              dynamicOptions={
                steps[current].type === "dynamic-multi" ? programCache[answers.region || ""] ?? null : null
              }
              regions={regionIndex.regions}
              onSelect={handleSelect}
              onTextChange={handleTextChange}
              onNext={goNext}
              onBack={goBack}
            />
          ) : null}
          {screenMode === "done" ? (
            <DoneScreen answers={answers} onRestart={restart} onGoToResults={goToResults} />
          ) : null}
          {screenMode === "results" ? (
            resultsDataReady ? (
              <HomeScreen data={composedData} answers={answers} />
            ) : (
              renderLoadingCard("우리 동네 정보를 불러오고 있어요...")
            )
          ) : null}
          {screenMode === "search" ? (
            searchDataReady ? (
              <SearchScreen data={composedData} query={searchQuery} />
            ) : (
              renderLoadingCard("전국 시설 데이터를 불러오고 있어요... (검색은 처음 한 번만 시간이 걸려요)")
            )
          ) : null}
          {screenMode === "community" ? <CommunityScreen answers={answers} /> : null}
          {screenMode === "mypage" ? (
            secondaryData ? (
              <MypageScreen data={composedData} answers={answers} onRestart={restart} />
            ) : (
              renderLoadingCard("불러오는 중...")
            )
          ) : null}
        </div>
      </div>
    </>
  );
}

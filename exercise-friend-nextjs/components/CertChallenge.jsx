"use client";

import { useEffect, useState } from "react";
import {
  getFitnessItemDetails,
  findCertVideo,
  getCertLevel,
  setCertLevel,
  AGE_TO_FITNESS,
} from "../lib/logic";

export default function CertChallenge({ fitnessStandards, certVideos, gender, age, regionLabel, regionKey }) {
  const items = getFitnessItemDetails(fitnessStandards, gender, age);
  const [levels, setLevels] = useState({});
  const [inputs, setInputs] = useState({});
  const [percentiles, setPercentiles] = useState({});
  const [submitting, setSubmitting] = useState({});

  useEffect(() => {
    const next = {};
    items.forEach((item) => {
      next[item.name] = getCertLevel(item.name);
    });
    setLevels(next);
    setInputs({});
    setPercentiles({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender, age]);

  if (!items.length) return null;

  function handleInputChange(name, value) {
    setInputs((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCheck(item) {
    const raw = inputs[item.name];
    const val = parseFloat(raw);
    if (raw === undefined || raw === "" || Number.isNaN(val)) {
      alert("측정하신 숫자를 입력해주세요.");
      return;
    }

    const bracket = AGE_TO_FITNESS[age];
    const sex = gender === "여성" ? "여" : "남";

    setSubmitting((prev) => ({ ...prev, [item.name]: true }));
    let result = null;
    if (bracket) {
      try {
        const res = await fetch("/api/cert-records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item: item.name,
            stage: bracket.stage,
            range: bracket.range,
            sex,
            region: regionKey || "",
            value: val,
            direction: item.direction,
            thresholds: item.thresholds,
          }),
        });
        if (res.ok) {
          result = await res.json();
        } else {
          const err = await res.json().catch(() => ({}));
          setSubmitting((prev) => ({ ...prev, [item.name]: false }));
          alert(err.error || "기록 제출에 실패했어요.");
          return;
        }
      } catch (e) {
        setSubmitting((prev) => ({ ...prev, [item.name]: false }));
        alert("기록 제출에 실패했어요. 네트워크를 확인해주세요.");
        return;
      }
    }
    setSubmitting((prev) => ({ ...prev, [item.name]: false }));
    if (result) {
      setPercentiles((prev) => ({ ...prev, [item.name]: result }));
    }

    // 등급 달성 여부는 기존처럼 기준표와 직접 비교해서 판단
    const curLevel = levels[item.name] ?? -1;
    const nextIndex = curLevel + 1;
    if (nextIndex >= item.levels.length) return; // 이미 마스터

    const targetGrade = item.levels[nextIndex];
    const threshold = item.thresholds[targetGrade];
    const achieved = item.direction === "higher" ? val >= threshold : val <= threshold;

    if (achieved) {
      setCertLevel(item.name, nextIndex);
      setLevels((prev) => ({ ...prev, [item.name]: nextIndex }));
      const isMastered = nextIndex === item.levels.length - 1;
      alert(
        isMastered
          ? `🎉 ${item.name} 1등급 달성! 이 항목은 마스터했어요.`
          : `🎉 ${targetGrade} 목표를 달성했어요! 다음 목표는 ${item.levels[nextIndex + 1]}이에요.`
      );
    } else {
      alert("아직 목표에 도달하지 못했어요. 다음에 다시 도전해보세요!");
    }
  }

  const masteredCount = items.filter((item) => (levels[item.name] ?? -1) === item.levels.length - 1).length;

  return (
    <>
      <p className="section-title">
        🏅 국민체력100 인증 도전과제 ({masteredCount}/{items.length} 마스터)
      </p>
      <div className="facility-list">
        {items.map((item) => {
          const curLevel = levels[item.name] ?? -1;
          const mastered = curLevel === item.levels.length - 1;
          const nextIndex = curLevel + 1;
          const nextGrade = !mastered ? item.levels[nextIndex] : null;
          const threshold = !mastered ? item.thresholds[nextGrade] : null;
          const video = findCertVideo(certVideos, item.name);
          const pct = percentiles[item.name];

          return (
            <div className="facility-card" key={item.name}>
              <h3 className="facility-name">{item.name}</h3>

              {curLevel >= 0 ? <p className="more-text">현재까지 {item.levels[curLevel]} 달성</p> : null}

              {pct ? (
                <p className="review-snippet" style={{ marginBottom: 8 }}>
                  {pct.national !== null
                    ? `📊 전국 상위 약 ${pct.national}% (${pct.nationalCount}명 중)`
                    : `📊 아직 비교할 기록이 부족해요 (${pct.nationalCount}명 참여)`}
                  {pct.local !== null
                    ? ` · ${regionLabel || "우리 지역"} 상위 약 ${pct.local}% (${pct.localCount}명 중)`
                    : " · 지역 순위는 데이터가 더 모이면 보여드려요."}
                </p>
              ) : null}

              {mastered ? (
                <p className="hint" style={{ marginBottom: 10 }}>
                  🏆 1등급 달성! 이 항목은 마스터 완료했어요.
                </p>
              ) : (
                <>
                  <p className="facility-addr">
                    다음 목표: <b>{nextGrade}</b> ({threshold}
                    {item.direction === "higher" ? " 이상" : " 이하"})
                  </p>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <input
                      className="text-input"
                      style={{ flex: 1 }}
                      type="number"
                      step="0.01"
                      placeholder="측정값 입력"
                      value={inputs[item.name] || ""}
                      onChange={(e) => handleInputChange(item.name, e.target.value)}
                    />
                    <button
                      className="btn-outline"
                      style={{ width: "auto", padding: "11px 16px" }}
                      type="button"
                      disabled={!!submitting[item.name]}
                      onClick={() => handleCheck(item)}
                    >
                      {submitting[item.name] ? "확인 중..." : "확인"}
                    </button>
                  </div>
                </>
              )}

              {video ? (
                <button
                  className="btn-outline"
                  type="button"
                  onClick={() => alert(`측정 방법 영상: ${video.n}`)}
                >
                  측정 방법 보기
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      {masteredCount === items.length ? (
        <p className="hint" style={{ margin: "8px 0 0" }}>
          🎉 모든 항목 1등급 마스터! 국민체력100 센터에서 정식 인증도 받아보세요.
        </p>
      ) : null}
    </>
  );
}

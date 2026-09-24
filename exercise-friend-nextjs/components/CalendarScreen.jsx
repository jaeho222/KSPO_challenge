"use client";

import { findRegionKey, sportEmoji } from "../lib/logic";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

export default function CalendarScreen({ data, answers }) {
  const regionKey = findRegionKey(data.kspo, answers.region || "");
  const allFac = regionKey ? data.kspo.regionFacilities[regionKey] || [] : [];
  const interests = answers.interests || [];

  let pool = allFac.filter((f) => interests.includes(f.m) && f.c && f.c.w);
  if (!pool.length) pool = allFac.filter((f) => f.c && f.c.w);

  return (
    <>
      <p className="eyebrow">이번 주 프로그램</p>
      <h1>요일별로 모아봤어요</h1>
      <p className="sub">지역 · 관심 종목 기준으로 정리했어요.</p>

      {DAYS.map((d) => {
        const dayItems = pool.filter((f) => f.c.w.includes(d)).slice(0, 3);
        return (
          <div key={d}>
            <p className="section-title">{d}요일</p>
            {!dayItems.length ? (
              <p className="hint" style={{ marginBottom: 14 }}>
                등록된 프로그램이 없어요.
              </p>
            ) : (
              <div className="facility-list">
                {dayItems.map((f, i) => (
                  <div className="facility-card" key={i}>
                    <span className="sport-badge">
                      {sportEmoji(f.m)} {f.m}
                    </span>
                    <h3 className="facility-name">{f.c.n}</h3>
                    <p className="facility-addr">
                      {f.n} · {f.c.s}~{f.c.e}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

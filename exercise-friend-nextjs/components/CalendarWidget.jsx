// ============================================================
// [이번 주 일정 위젯] 홈 화면 상단의 작은 캘린더
// - 렌더링 위치: HomeScreen.jsx 맨 위쪽에서 호출
// - 이번 주(월~일) 날짜를 계산하고, 그날 강좌가 있는 종목 아이콘을 표시
// - 토요일/일요일 날짜 숫자는 빨간색(--weekend-red)으로 구분 표시
// - data.kspo.regionFacilities에서 현재 지역 시설의 요일 정보(c.w)를 읽어옴
// ============================================================

"use client";

import { findRegionKey, sportEmoji } from "../lib/logic";

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

function getWeekDates() {
  const today = new Date();
  const day = today.getDay(); // 0=일 ~ 6=토
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function CalendarWidget({ data, answers }) {
  const regionKey = findRegionKey(data.kspo, answers.region || "");
  const allFac = regionKey ? data.kspo.regionFacilities[regionKey] || [] : [];
  const interests = answers.interests || [];

  let pool = allFac.filter((f) => interests.includes(f.m) && f.c && f.c.w);
  if (!pool.length) pool = allFac.filter((f) => f.c && f.c.w);

  const weekDates = getWeekDates();
  const today = new Date();

  return (
    <div className="ref-card">
      <p className="ref-title">
        <span aria-hidden="true">🗓️ </span>이번 주 일정
      </p>
      <p className="ref-sub">날짜 아래 아이콘은 그날 강좌가 있는 종목이에요.</p>
      <div className="calendar-row">
        {weekDates.map((date, i) => {
          const label = WEEKDAY_LABELS[i];
          const isWeekend = i >= 5; // 5=토, 6=일
          const sports = Array.from(new Set(pool.filter((f) => f.c.w.includes(label)).map((f) => f.m)));
          const isToday = isSameDay(date, today);
          return (
            <div className={"calendar-cell" + (isToday ? " today" : "")} key={i}>
              <div className="calendar-weekday">{label}</div>
              <div className={"calendar-date" + (isWeekend ? " weekend" : "")}>{date.getDate()}</div>
              <div className="calendar-tags">
                {sports.length ? (
                  <>
                    {sports.slice(0, 2).map((s) => (
                      <span className="calendar-tag" key={s} title={s} aria-label={s} role="img">
                        <span aria-hidden="true">{sportEmoji(s)}</span>
                      </span>
                    ))}
                    {sports.length > 2 ? <span className="calendar-tag">+{sports.length - 2}</span> : null}
                  </>
                ) : (
                  <span className="calendar-empty">-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

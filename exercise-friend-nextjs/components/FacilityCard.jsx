"use client";

import { useEffect, useState } from "react";
import { sportEmoji, getAccessibilityInfo, submitAccessibility, facilityKey } from "../lib/logic";
import FacilityReviews from "./FacilityReviews";
import BookingRequest from "./BookingRequest";

function AccessibilityBlock({ f }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    setInfo(getAccessibilityInfo(f));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.n, f.a]);

  function handleSubmit() {
    const input = window.prompt(
      "이 시설의 접근성 정보를 알려주세요 (쉼표로 구분)\n예: 휠체어 진입 가능, 경사로 있음, 엘리베이터 있음"
    );
    if (!input) return;
    const updated = submitAccessibility(f, input);
    if (updated) setInfo(updated);
  }

  if (info && info.tags.length) {
    return (
      <div className="review-block">
        <p style={{ margin: "0 0 6px", fontSize: "12.5px", color: "var(--muted)" }}>
          ♿ 접근성 제보 {info.count}건
        </p>
        {info.tags.map((t) => (
          <span className="sport-badge" key={t}>
            {t}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="review-block">
      <p style={{ margin: "0 0 6px", fontSize: "12.5px", color: "var(--muted)" }}>
        아직 등록된 접근성 정보가 없어요.
      </p>
      <button className="btn-outline" type="button" onClick={handleSubmit}>
        ♿ 접근성 정보 제보하기
      </button>
    </div>
  );
}

export default function FacilityCard({ f }) {
  const c = f.c;
  const priceText = c && c.p ? Number(c.p).toLocaleString() + "원" : "";
  const timeText = c && c.s && c.e ? `${c.s}~${c.e}` : "";
  const moreText = f.cnt > 1 ? `외 ${f.cnt - 1}개 강좌 더보기` : "";

  return (
    <div className="facility-card">
      <span className="sport-badge">
        {sportEmoji(f.m)} {f.m}
      </span>
      <h3 className="facility-name">{f.n}</h3>
      <p className="facility-addr">{f.a}</p>
      {c && c.n ? (
        <>
          <div className="course-line">
            <span className="course-name">{c.n}</span>
            <span className="course-meta">
              {c.w ? c.w + " · " : ""}
              {timeText}
            </span>
          </div>
          <div className="course-line">
            <span className="course-meta">{c.i ? "강사 " + c.i : ""}</span>
            <span className="course-price">{priceText}</span>
          </div>
          {moreText ? <p className="more-text">{moreText}</p> : null}
        </>
      ) : (
        <p className="no-course-note">현재 등록된 강좌 신청 정보는 없어요. 시설에 직접 문의해보세요.</p>
      )}
      <FacilityReviews facilityKey={facilityKey(f)} facilityName={f.n} />
      <AccessibilityBlock f={f} />
      <BookingRequest facilityName={f.n} facilityAddr={f.a} courseName={c && c.n ? c.n : ""} />
    </div>
  );
}

export function DisableFacilityCard({ f }) {
  return (
    <div className="facility-card">
      <span className="sport-badge">
        ♿ {sportEmoji(f.m)} {f.m}
      </span>
      <h3 className="facility-name">{f.n}</h3>
      <p className="facility-addr">{f.a}</p>
      <button
        className="btn-outline"
        type="button"
        onClick={() => alert("문의 기능은 다음 단계에서 연결할 예정이에요!")}
      >
        문의하기
      </button>
    </div>
  );
}

"use client";

import { sportEmoji, facilityKey } from "../lib/logic";
import FacilityReviews from "./FacilityReviews";
import BookingRequest from "./BookingRequest";

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
      {/* 접근성 정보는 이제 후기 작성 시 함께 남기는 태그로 통합됨 (FacilityReviews 안에서 처리) */}
      <FacilityReviews facilityKey={facilityKey(f)} facilityName={f.n} />
      <BookingRequest
        facilityKey={facilityKey(f)}
        facilityName={f.n}
        facilityAddr={f.a}
        courseName={c && c.n ? c.n : ""}
      />
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

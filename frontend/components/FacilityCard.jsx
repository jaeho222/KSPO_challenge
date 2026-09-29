// ============================================================
// [시설 카드] 일반 시설용(FacilityCard)과 장애인 이용가능 시설용
//   (DisableFacilityCard) 두 컴포넌트가 이 파일 하나에 들어있음
// - 렌더링 위치: HomeScreen.jsx("우리 동네 프로그램"), SearchScreen.jsx(검색결과)
// - 시설명/주소/강좌정보(있으면)를 보여주고, 그 안에 FacilityReviews(후기)와
//   BookingRequest(예약신청)를 포함함
// - accessible prop이 true면 "♿ 장애인 이용 가능" 배지가 추가로 붙음
//   (disable_facilities.json에 같은 시설이 있는지로 판단, HomeScreen에서 계산)
// - DisableFacilityCard는 강좌 데이터와 조인이 안 되는 원본 데이터 한계 때문에
//   시설명/주소만 보여주고 예약 기능은 없음 (README.md 참고)
// ============================================================

"use client";

import { sportEmoji, facilityKey } from "../lib/logic";
import FacilityReviews from "./FacilityReviews";
import BookingRequest from "./BookingRequest";

export default function FacilityCard({ f, accessible }) {
  const c = f.c;
  const priceText = c && c.p ? Number(c.p).toLocaleString() + "원" : "";
  const timeText = c && c.s && c.e ? `${c.s}~${c.e}` : "";
  const moreText = f.cnt > 1 ? `외 ${f.cnt - 1}개 강좌 더보기` : "";

  return (
    <div className="facility-card">
      <span className="sport-badge">
        <span aria-hidden="true">{sportEmoji(f.m)}</span> {f.m}
      </span>
      {accessible ? (
        <span className="sport-badge access-badge" title="장애인 이용 가능 시설">
          <span aria-hidden="true">♿</span> 장애인 이용 가능
        </span>
      ) : null}
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
      {/* 위쪽 내용(강좌 정보 등) 길이가 카드마다 달라도, 이 영역은 항상 카드 맨 아래로 정렬됨 */}
      <div className="facility-card-bottom">
        <FacilityReviews facilityKey={facilityKey(f)} facilityName={f.n} />
        <BookingRequest
          facilityKey={facilityKey(f)}
          facilityName={f.n}
          facilityAddr={f.a}
          courseName={c && c.n ? c.n : ""}
        />
      </div>
    </div>
  );
}

export function DisableFacilityCard({ f }) {
  return (
    <div className="facility-card">
      <span className="sport-badge">
        <span aria-hidden="true">♿ {sportEmoji(f.m)}</span> {f.m}
      </span>
      <h3 className="facility-name">{f.n}</h3>
      <p className="facility-addr">{f.a}</p>
      <p className="no-course-note">
        강좌·예약 정보는 아직 연결되어 있지 않아요. 이용을 원하시면 시설에 직접 문의해주세요.
      </p>
    </div>
  );
}

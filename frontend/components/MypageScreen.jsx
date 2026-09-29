// ============================================================
// [마이페이지] 북마크한 종목, 문자알림(mock), 체력인증 도전과제
// - 렌더링 위치: App.jsx가 screenMode==='mypage'일 때 렌더링 (탭바의 "마이")
// - 문자(SMS) 알림 부분은 실제 발송 기능 없는 mock(데모)임
// - 체력인증 도전과제 부분은 CertChallenge.jsx를 그대로 불러와서 렌더링
// ============================================================

"use client";

import { sportEmoji, findRegionKey } from "../lib/logic";
import CertChallenge from "./CertChallenge";

export default function MypageScreen({ data, answers, onRestart }) {
  const interests = answers.interests || [];
  const regionKey = findRegionKey(data.kspo, answers.region || "");

  return (
    <>
      <p className="eyebrow">마이페이지</p>
      <h1>내 정보 · 알림 설정</h1>
      <p className="sub">관심 종목 강좌가 열리면 알려드려요.</p>

      <div className="facility-list">
        {interests.length ? (
          interests.map((sport) => (
            <div className="facility-card bookmark-row" key={sport}>
              <span>
                <span aria-hidden="true">{sportEmoji(sport)}</span> {sport}
              </span>
              <label>
                <input
                  type="checkbox"
                  defaultChecked
                  onChange={() => alert("알림 설정은 백엔드 연결 후 저장돼요!")}
                />{" "}
                신청 알림
              </label>
            </div>
          ))
        ) : (
          <p className="hint">아직 북마크한 종목이 없어요.</p>
        )}
      </div>

      <p className="section-title">
        <span aria-hidden="true">📱 </span>문자(SMS) 알림
      </p>
      <div className="facility-card">
        <p className="facility-addr">앱 확인이 어려우신 경우, 문자로도 강좌 신청 알림을 받아보실 수 있어요.</p>
        <input
          className="text-input"
          type="tel"
          placeholder="휴대폰 번호 입력 (예: 010-1234-5678)"
          style={{ marginBottom: 10 }}
        />
        <button
          className="btn-outline"
          type="button"
          onClick={() => alert("문자 알림 기능은 백엔드 연결 후 지원할 예정이에요!")}
        >
          문자로 알림받기
        </button>
      </div>

      <CertChallenge
        fitnessStandards={data.fitness}
        certVideos={data.cert}
        gender={answers.gender}
        age={answers.age}
        regionLabel={answers.region}
        regionKey={regionKey}
      />

      <p className="section-title">👤 내 답변 요약</p>
      <div className="facility-card">
        <p className="facility-addr">
          {answers.gender || "-"} · {answers.age || "-"} · {answers.region || "-"}
        </p>
        <button className="btn-outline" type="button" onClick={onRestart}>
          설문 다시 하기
        </button>
      </div>
    </>
  );
}

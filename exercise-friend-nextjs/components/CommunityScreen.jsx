"use client";

import { sportEmoji } from "../lib/logic";

export default function CommunityScreen({ answers }) {
  const interests = answers.interests && answers.interests.length ? answers.interests : ["걷기", "요가"];
  const region = answers.region || "우리 동네";

  return (
    <>
      <p className="eyebrow">커뮤니티</p>
      <h1>{region} 운동 모임</h1>
      <p className="sub">관심 종목 기반으로 모임을 추천해드려요. (예시 데이터)</p>

      <div className="facility-list">
        {interests.slice(0, 4).map((sport, i) => {
          const members = 3 + ((i * 2) % 7);
          return (
            <div className="facility-card" key={sport}>
              <span className="sport-badge">
                {sportEmoji(sport)} {sport}
              </span>
              <h3 className="facility-name">
                {region} {sport} 모임
              </h3>
              <p className="facility-addr">현재 {members}명 참여 중 · 주말 오전 활동</p>
              <button
                className="btn-outline"
                type="button"
                onClick={() => alert("커뮤니티 가입 기능은 백엔드 연결 후 지원할 예정이에요!")}
              >
                참여 신청하기
              </button>
            </div>
          );
        })}
      </div>

      <p className="section-title">✏️ 내 프로필</p>
      <div className="facility-card">
        <p className="facility-addr">
          닉네임 · 선호 종목 · 실력 수준을 설정하면 비슷한 사람과 매칭돼요. (프로필 설정 화면은 다음 단계에서 제작
          예정)
        </p>
      </div>
    </>
  );
}

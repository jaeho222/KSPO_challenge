// ============================================================
// [운동 영상 카드] 제목+설명+"영상 보기" 버튼으로 구성된 재사용 카드
// - 렌더링 위치: HomeScreen.jsx의 여러 섹션(재활스트레칭/목표별루틴/가이드영상)에서
//   반복 재사용됨
// - "영상 보기"는 아직 실제 영상 재생 연동 전이라 안내 alert만 뜸 (자리표시자)
// - 카드 안 내용(설명) 길이가 달라도 버튼은 항상 카드 맨 아래에 고정됨
//   (.facility-card-bottom 클래스, globals.css 참고)
// ============================================================

"use client";

export default function VideoCard({ title, desc, tags }) {
  return (
    <div className="facility-card">
      {(tags || []).filter(Boolean).map((t, i) => (
        <span className="sport-badge" key={i}>
          {t}
        </span>
      ))}
      <h3 className="facility-name">{title}</h3>
      <p className="facility-addr">{desc}</p>
      <div className="facility-card-bottom">
        <button
          className="btn-outline"
          type="button"
          onClick={() => alert("영상 재생은 실제 서비스 연동 후 지원할 예정이에요!")}
        >
          영상 보기
        </button>
      </div>
    </div>
  );
}

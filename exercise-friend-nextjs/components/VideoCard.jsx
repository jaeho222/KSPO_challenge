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
      <button
        className="btn-outline"
        type="button"
        onClick={() => alert("영상 재생은 실제 서비스 연동 후 지원할 예정이에요!")}
      >
        영상 보기
      </button>
    </div>
  );
}

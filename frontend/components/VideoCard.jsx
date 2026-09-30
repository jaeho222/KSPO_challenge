// ============================================================
// [운동 영상 카드] 제목+설명+실제 영상 재생 기능이 있는 재사용 카드
// - 렌더링 위치: HomeScreen.jsx의 여러 섹션(재활스트레칭/목표별루틴/가이드영상)에서
//   반복 재사용됨
// - "영상 보기" 누르면 카드 안에서 바로 <video>로 재생됨 (vid/thumb prop 필요)
//   ⚠️ 영상 서버 주소가 http(암호화 안 됨)라서, https로 배포된 사이트에서는
//   브라우저가 "혼합 콘텐츠"로 차단할 수 있음. 그 경우를 대비해 재생 실패 시
//   "새 탭에서 열기" 링크로 대체 안내함 (README.md 참고)
// - 카드 안 내용(설명) 길이가 달라도 버튼은 항상 카드 맨 아래에 고정됨
//   (.facility-card-bottom 클래스, globals.css 참고)
// ============================================================

"use client";

import { useState } from "react";

export default function VideoCard({ title, desc, tags, vid, thumb }) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="facility-card">
      {(tags || []).filter(Boolean).map((t, i) => (
        <span className="sport-badge" key={i}>
          {t}
        </span>
      ))}
      <h3 className="facility-name">{title}</h3>
      <p className="facility-addr">{desc}</p>

      {playing && vid ? (
        <div style={{ marginBottom: 10 }}>
          {failed ? (
            <p className="hint" style={{ marginBottom: 8 }}>
              이 브라우저에서는 바로 재생이 안 돼요.{" "}
              <a href={vid} target="_blank" rel="noreferrer">
                새 탭에서 영상 열기
              </a>
            </p>
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              controls
              poster={thumb || undefined}
              style={{ width: "100%", borderRadius: 8, display: "block" }}
              onError={() => setFailed(true)}
            >
              <source src={vid} type="video/mp4" />
            </video>
          )}
        </div>
      ) : null}

      <div className="facility-card-bottom">
        {vid ? (
          <button className="btn-outline" type="button" onClick={() => setPlaying((v) => !v)}>
            {playing ? "영상 닫기" : "영상 보기"}
          </button>
        ) : (
          <button
            className="btn-outline"
            type="button"
            onClick={() => alert("이 영상은 아직 준비되지 않았어요.")}
          >
            영상 보기
          </button>
        )}
      </div>
    </div>
  );
}

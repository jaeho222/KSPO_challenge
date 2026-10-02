// ============================================================
// [후기 + 접근성 정보 + 신고하기] 시설 카드 안에 들어가는 후기 섹션
// - 렌더링 위치: FacilityCard.jsx 안에 포함
// - 별점+텍스트+사진+접근성 체크박스(휠체어 진입 가능 등)로 후기 작성
//   (누구나 작성 가능, 예약 인증 없음 - 과거엔 인증 붙였다가 사용자 요청으로 제거함)
// - 접근성 체크박스는 여러 후기에서 모아서 카드 맨 위에 "한눈에" 요약 배지로 표시
// - 🚩 신고하기: /api/reviews/report 로 실제 전송됨. 서로 다른 참여자 3명이
//   신고하면 서버에서 자동으로 해당 후기를 숨김(hidden=true) 처리함
// - 쓰이는 API: /api/reviews (목록조회/작성), /api/reviews/report (신고)
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { getParticipantId } from "../lib/logic";

const TAG_OPTIONS = ["휠체어 진입 가능", "경사로 있음", "엘리베이터 있음", "장애인 화장실 있음"];

export default function FacilityReviews({ facilityKey, facilityName }) {
  const [reviews, setReviews] = useState([]);
  const [avg, setAvg] = useState(null);
  const [count, setCount] = useState(0);
  const [tagSummary, setTagSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportedIds, setReportedIds] = useState(() => new Set());

  async function loadReviews() {
    try {
      const params = new URLSearchParams({ facilityKey, participantId: getParticipantId() });
      const res = await fetch(`/api/reviews?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setReviews(data.reviews || []);
      setAvg(data.avg);
      setCount(data.count || 0);
      setTagSummary(data.tagSummary || []);
      setReportedIds(new Set((data.reviews || []).filter((r) => r.reported).map((r) => r.id)));
    } catch (e) {
      /* 조용히 무시: 후기 로딩 실패해도 나머지 화면은 정상 동작 */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityKey]);

  async function handleReport(reviewId) {
    if (reportedIds.has(reviewId)) return;
    const ok = window.confirm("이 후기를 신고하시겠어요? 부적절한 내용(욕설, 광고, 사생활 침해 등)일 때 이용해주세요.");
    if (!ok) return;
    try {
      const res = await fetch("/api/reviews/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, participantId: getParticipantId() }),
      });
      if (res.ok) {
        setReportedIds((prev) => new Set(prev).add(reviewId));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "신고 접수에 실패했어요.");
      }
    } catch (e) {
      alert("신고 접수에 실패했어요. 네트워크를 확인해주세요.");
    }
  }

  function toggleTag(tag) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleSubmit() {
    if (!rating) {
      alert("별점을 먼저 선택해주세요.");
      return;
    }
    setSubmitting(true);
    const form = new FormData();
    form.append("facilityKey", facilityKey);
    form.append("facilityName", facilityName);
    form.append("rating", String(rating));
    form.append("text", text);
    selectedTags.forEach((t) => form.append("tags", t));
    if (photoFile) form.append("photo", photoFile);

    try {
      const res = await fetch("/api/reviews", { method: "POST", body: form });
      if (res.ok) {
        setText("");
        setRating(0);
        setSelectedTags([]);
        setPhotoFile(null);
        setShowForm(false);
        await loadReviews();
      } else {
        const err = await res.json().catch(() => ({}));
        // 서버가 보내준 구체적인 이유를 그대로 보여줘서, 문제가 생겨도 바로 원인을 알 수 있게 함
        alert(err.error || "후기 등록에 실패했어요. (알 수 없는 오류)");
      }
    } catch (e) {
      alert("후기 등록에 실패했어요. 네트워크 연결을 확인해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="review-block">
      {/* 접근성 정보: 여러 후기에서 언급된 걸 모아서 맨 위에 한눈에 보이게 표시 */}
      {tagSummary.length ? (
        <div className="access-summary">
          <span aria-hidden="true">♿ </span>
          {tagSummary.map((t, i) => (
            <span key={t.tag}>
              {i > 0 ? " · " : ""}
              {t.tag}
              {t.count > 1 ? `(${t.count}건)` : ""}
            </span>
          ))}
        </div>
      ) : null}

      {loading ? (
        <p className="review-snippet">후기 불러오는 중...</p>
      ) : count > 0 ? (
        <>
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700 }}>
            <span className="stars" aria-hidden="true">
              {"★".repeat(Math.round(avg))}
              {"☆".repeat(5 - Math.round(avg))}
            </span>{" "}
            {avg.toFixed(1)}점 <span className="course-meta">({count}개 후기)</span>
          </p>
          {reviews.slice(0, 3).map((r) => (
            <div key={r.id} style={{ marginBottom: 8 }}>
              <p className="review-snippet" style={{ margin: 0 }}>
                <span className="stars" role="img" aria-label={`${r.rating}점`}>
                  <span aria-hidden="true">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </span>
                </span>{" "}
                {r.text}
              </p>
              {r.tags && r.tags.length ? (
                <div style={{ marginTop: 4 }}>
                  {r.tags.map((t) => (
                    <span className="sport-badge" key={t} style={{ fontSize: 11 }}>
                      <span aria-hidden="true">♿ </span>
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
              {r.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.photoUrl}
                  alt="후기 사진"
                  style={{ maxWidth: "100%", borderRadius: 8, marginTop: 4, display: "block" }}
                />
              ) : null}
              <button
                type="button"
                onClick={() => handleReport(r.id)}
                disabled={reportedIds.has(r.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: 11.5,
                  textDecoration: reportedIds.has(r.id) ? "none" : "underline",
                  cursor: reportedIds.has(r.id) ? "default" : "pointer",
                  padding: 0,
                  marginTop: 4,
                }}
              >
                {reportedIds.has(r.id) ? (
                  "신고 접수됨"
                ) : (
                  <>
                    <span aria-hidden="true">🚩 </span>신고하기
                  </>
                )}
              </button>
            </div>
          ))}
          {count > 3 ? <p className="more-text">외 {count - 3}개 후기 더보기</p> : null}
        </>
      ) : (
        <p className="review-snippet">아직 등록된 후기가 없어요. 첫 후기를 남겨보세요!</p>
      )}

      {showForm ? (
        <div style={{ marginTop: 10 }}>
          <div style={{ marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  padding: 2,
                  color: "var(--accent-text)",
                }}
                aria-label={`${n}점`}
              >
                {n <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>
          <textarea
            className="text-input"
            style={{ width: "100%", minHeight: 70, marginBottom: 8, resize: "vertical" }}
            placeholder="이 시설은 어땠나요?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="hint" style={{ margin: "0 0 6px" }}>
            해당되는 게 있으면 체크해주세요 (선택)
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {TAG_OPTIONS.map((tag) => (
              <label
                key={tag}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12.5,
                  color: "var(--muted)",
                  border: "1px solid var(--line)",
                  borderRadius: 999,
                  padding: "5px 10px",
                  cursor: "pointer",
                }}
              >
                <input type="checkbox" checked={selectedTags.includes(tag)} onChange={() => toggleTag(tag)} />
                {tag}
              </label>
            ))}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            style={{ marginBottom: 8, fontSize: 13 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-outline" type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "등록 중..." : "등록하기"}
            </button>
            <button className="btn-outline" type="button" onClick={() => setShowForm(false)}>
              취소
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-outline" type="button" onClick={() => setShowForm(true)} style={{ marginTop: 8 }}>
          <span aria-hidden="true">✏️ </span>후기 남기기
        </button>
      )}
    </div>
  );
}

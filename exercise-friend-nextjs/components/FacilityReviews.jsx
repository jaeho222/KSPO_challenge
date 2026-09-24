"use client";

import { useEffect, useState } from "react";

export default function FacilityReviews({ facilityKey, facilityName }) {
  const [reviews, setReviews] = useState([]);
  const [avg, setAvg] = useState(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadReviews() {
    try {
      const res = await fetch(`/api/reviews?facilityKey=${encodeURIComponent(facilityKey)}`);
      if (!res.ok) return;
      const data = await res.json();
      setReviews(data.reviews || []);
      setAvg(data.avg);
      setCount(data.count || 0);
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
    if (photoFile) form.append("photo", photoFile);

    try {
      const res = await fetch("/api/reviews", { method: "POST", body: form });
      if (res.ok) {
        setText("");
        setRating(0);
        setPhotoFile(null);
        setShowForm(false);
        await loadReviews();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error === "file too large (max 5MB)" ? "사진 용량이 너무 커요 (5MB 이하로 올려주세요)." : "후기 등록에 실패했어요.");
      }
    } catch (e) {
      alert("후기 등록에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="review-block">
      {loading ? (
        <p className="review-snippet">후기 불러오는 중...</p>
      ) : count > 0 ? (
        <>
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700 }}>
            <span className="stars">
              {"★".repeat(Math.round(avg))}
              {"☆".repeat(5 - Math.round(avg))}
            </span>{" "}
            {avg.toFixed(1)} <span className="course-meta">({count}개 후기)</span>
          </p>
          {reviews.slice(0, 3).map((r) => (
            <div key={r.id} style={{ marginBottom: 8 }}>
              <p className="review-snippet" style={{ margin: 0 }}>
                <span className="stars">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>{" "}
                {r.text}
              </p>
              {r.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.photoUrl}
                  alt="후기 사진"
                  style={{ maxWidth: "100%", borderRadius: 8, marginTop: 4, display: "block" }}
                />
              ) : null}
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
                style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", padding: 2 }}
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
          ✏️ 후기 남기기
        </button>
      )}
    </div>
  );
}

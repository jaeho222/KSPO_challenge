"use client";

import { useEffect, useState } from "react";
import { sportEmoji } from "../lib/logic";

export default function CommunityScreen({ answers }) {
  const region = answers.region || "";
  const defaultSport = (answers.interests && answers.interests[0]) || "";

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [nickname, setNickname] = useState("");
  const [sport, setSport] = useState(defaultSport);
  const [submitting, setSubmitting] = useState(false);
  const [joinedIds, setJoinedIds] = useState(() => new Set());

  async function loadPosts() {
    setLoading(true);
    try {
      const url = region ? `/api/community-posts?region=${encodeURIComponent(region)}` : "/api/community-posts";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (e) {
      /* 조용히 무시 */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  async function handleSubmit() {
    if (!title.trim() || !nickname.trim() || !sport) {
      alert("종목, 제목, 닉네임은 꼭 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/community-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: region || "전체", sport, title, message, nickname }),
      });
      if (res.ok) {
        setTitle("");
        setMessage("");
        setShowForm(false);
        await loadPosts();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "등록에 실패했어요.");
      }
    } catch (e) {
      alert("등록에 실패했어요. 네트워크를 확인해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin(postId) {
    if (joinedIds.has(postId)) return;
    try {
      const res = await fetch("/api/community-posts/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, joinCount: data.joinCount } : p)));
        setJoinedIds((prev) => new Set(prev).add(postId));
      } else {
        alert("참여 신청에 실패했어요.");
      }
    } catch (e) {
      alert("참여 신청에 실패했어요. 네트워크를 확인해주세요.");
    }
  }

  return (
    <>
      <p className="eyebrow">커뮤니티</p>
      <h1>{region || "우리 동네"} 운동 모임</h1>
      <p className="sub">같이 운동할 사람을 찾아보세요. 직접 모임을 만들 수도 있어요.</p>

      {loading ? (
        <p className="hint">불러오는 중...</p>
      ) : posts.length ? (
        <div className="facility-list">
          {posts.map((p) => (
            <div className="facility-card" key={p.id}>
              <span className="sport-badge">
                {sportEmoji(p.sport)} {p.sport}
              </span>
              <h3 className="facility-name">{p.title}</h3>
              <p className="facility-addr">
                {p.nickname} · {p.region}
              </p>
              {p.message ? <p className="more-text" style={{ marginBottom: 10 }}>{p.message}</p> : null}
              <p className="course-meta" style={{ marginBottom: 8 }}>
                현재 {p.joinCount}명 참여 신청
              </p>
              <button
                className="btn-outline"
                type="button"
                onClick={() => handleJoin(p.id)}
                disabled={joinedIds.has(p.id)}
              >
                {joinedIds.has(p.id) ? "참여 신청 완료" : "참여 신청하기"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="hint">아직 등록된 모임이 없어요. 첫 모임을 만들어보세요!</p>
      )}

      {showForm ? (
        <div className="facility-card" style={{ marginTop: 12 }}>
          <p className="facility-name" style={{ marginBottom: 10 }}>
            모임 만들기
          </p>
          <input
            className="text-input"
            style={{ marginBottom: 8 }}
            placeholder="종목 (예: 테니스)"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          />
          <input
            className="text-input"
            style={{ marginBottom: 8 }}
            placeholder="모임 제목 (예: 주말 아침 테니스 같이 쳐요)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="text-input"
            style={{ width: "100%", minHeight: 60, marginBottom: 8, resize: "vertical" }}
            placeholder="한마디 (선택)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <input
            className="text-input"
            style={{ marginBottom: 10 }}
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
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
        <button className="btn-outline" type="button" onClick={() => setShowForm(true)} style={{ marginTop: 12 }}>
          ✏️ 모임 만들기
        </button>
      )}
    </>
  );
}

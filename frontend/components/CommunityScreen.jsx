// ============================================================
// [커뮤니티 탭 화면] 운동 모임 게시판
// - 렌더링 위치: App.jsx가 screenMode==='community'일 때 렌더링 (탭바의 "커뮤니티")
// - 기능: 글 목록 조회, 글쓰기(정원 설정 가능), 내 글 수정/삭제, 댓글,
//   참여 신청(정원 찼으면 막힘)
// - 전부 익명 참여자 ID(getParticipantId) 기준으로 "내 글인지", "내가 이미
//   신청/댓글 작성했는지"를 서버와 대조함
// - 쓰이는 API: /api/community-posts (목록/작성), /api/community-posts/[id]
//   (수정/삭제), /api/community-posts/join (참여신청), /api/community-posts/comments (댓글)
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { sportEmoji, getParticipantId } from "../lib/logic";

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
  const [maxMembers, setMaxMembers] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [joinedIds, setJoinedIds] = useState(() => new Set());
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [openComments, setOpenComments] = useState(() => new Set());
  const [comments, setComments] = useState({}); // postId -> [{id, nickname, message, ts}]
  const [commentDraft, setCommentDraft] = useState({}); // postId -> {nickname, message}
  const [commentSubmitting, setCommentSubmitting] = useState({});

  async function loadPosts() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ participantId: getParticipantId() });
      if (region) params.set("region", region);
      const res = await fetch(`/api/community-posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setJoinedIds(new Set((data.posts || []).filter((p) => p.joined).map((p) => p.id)));
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
        body: JSON.stringify({
          region: region || "전체",
          sport,
          title,
          message,
          nickname,
          maxMembers: maxMembers || null,
          participantId: getParticipantId(),
        }),
      });
      if (res.ok) {
        setTitle("");
        setMessage("");
        setMaxMembers("");
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

  async function handleJoin(post) {
    if (joinedIds.has(post.id)) return;
    try {
      const res = await fetch("/api/community-posts/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, participantId: getParticipantId() }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, joinCount: data.joinCount, full: p.maxMembers ? data.joinCount >= p.maxMembers : false }
              : p
          )
        );
        setJoinedIds((prev) => new Set(prev).add(post.id));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "참여 신청에 실패했어요.");
      }
    } catch (e) {
      alert("참여 신청에 실패했어요. 네트워크를 확인해주세요.");
    }
  }

  function startEdit(post) {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditMessage(post.message || "");
  }

  async function saveEdit(postId) {
    try {
      const res = await fetch(`/api/community-posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, message: editMessage, participantId: getParticipantId() }),
      });
      if (res.ok) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, title: editTitle, message: editMessage } : p)));
        setEditingId(null);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "수정에 실패했어요.");
      }
    } catch (e) {
      alert("수정에 실패했어요. 네트워크를 확인해주세요.");
    }
  }

  async function handleDelete(postId) {
    const ok = window.confirm("이 모임 글을 삭제하시겠어요? 되돌릴 수 없어요.");
    if (!ok) return;
    try {
      const res = await fetch(
        `/api/community-posts/${postId}?participantId=${encodeURIComponent(getParticipantId())}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "삭제에 실패했어요.");
      }
    } catch (e) {
      alert("삭제에 실패했어요. 네트워크를 확인해주세요.");
    }
  }

  async function toggleComments(postId) {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
    if (!comments[postId]) {
      try {
        const res = await fetch(`/api/community-posts/comments?postId=${postId}`);
        if (res.ok) {
          const data = await res.json();
          setComments((prev) => ({ ...prev, [postId]: data.comments || [] }));
        }
      } catch (e) {
        /* 조용히 무시 */
      }
    }
  }

  async function submitComment(postId) {
    const draft = commentDraft[postId] || {};
    if (!draft.nickname?.trim() || !draft.message?.trim()) {
      alert("닉네임과 댓글 내용을 입력해주세요.");
      return;
    }
    setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch("/api/community-posts/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          nickname: draft.nickname,
          message: draft.message,
          participantId: getParticipantId(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), data.comment] }));
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)));
        setCommentDraft((prev) => ({ ...prev, [postId]: { nickname: draft.nickname, message: "" } }));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "댓글 등록에 실패했어요.");
      }
    } catch (e) {
      alert("댓글 등록에 실패했어요. 네트워크를 확인해주세요.");
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
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
                <span aria-hidden="true">{sportEmoji(p.sport)}</span> {p.sport}
              </span>

              {editingId === p.id ? (
                <div style={{ marginBottom: 8 }}>
                  <input
                    className="text-input"
                    style={{ marginBottom: 6 }}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <textarea
                    className="text-input"
                    style={{ width: "100%", minHeight: 50, marginBottom: 6, resize: "vertical" }}
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-outline" type="button" onClick={() => saveEdit(p.id)}>
                      저장
                    </button>
                    <button className="btn-outline" type="button" onClick={() => setEditingId(null)}>
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="facility-name">{p.title}</h3>
                  <p className="facility-addr">
                    {p.nickname} · {p.region}
                  </p>
                  {p.message ? (
                    <p className="more-text" style={{ marginBottom: 10 }}>
                      {p.message}
                    </p>
                  ) : null}
                </>
              )}

              <p className="course-meta" style={{ marginBottom: 8 }}>
                {p.maxMembers ? `${p.joinCount}/${p.maxMembers}명 참여` : `현재 ${p.joinCount}명 참여 신청`}
                {p.full && !joinedIds.has(p.id) ? " · 정원 마감" : ""}
              </p>

              <div className="facility-card-bottom">
                {p.mine ? (
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <button className="btn-outline" type="button" onClick={() => startEdit(p)}>
                      수정
                    </button>
                    <button className="btn-outline" type="button" onClick={() => handleDelete(p.id)}>
                      삭제
                    </button>
                  </div>
                ) : null}

                <button
                  className="btn-outline"
                  type="button"
                  onClick={() => handleJoin(p)}
                  disabled={joinedIds.has(p.id) || (p.full && !joinedIds.has(p.id))}
                  style={{ marginBottom: 8 }}
                >
                  {joinedIds.has(p.id) ? "참여 신청 완료" : p.full ? "정원 마감" : "참여 신청하기"}
                </button>

                <button
                  type="button"
                  onClick={() => toggleComments(p.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    fontSize: 12.5,
                    textDecoration: "underline",
                    cursor: "pointer",
                    padding: 0,
                    marginBottom: openComments.has(p.id) ? 8 : 0,
                  }}
                >
                  댓글 {p.commentCount > 0 ? `${p.commentCount}개` : "달기"}
                </button>

                {openComments.has(p.id) ? (
                  <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 8 }}>
                    {(comments[p.id] || []).map((c) => (
                      <p key={c.id} className="review-snippet" style={{ margin: "0 0 6px" }}>
                        <b>{c.nickname}</b> {c.message}
                      </p>
                    ))}
                    {!comments[p.id] || !comments[p.id].length ? (
                      <p className="hint" style={{ margin: "0 0 8px" }}>
                        아직 댓글이 없어요.
                      </p>
                    ) : null}
                    <input
                      className="text-input"
                      style={{ marginBottom: 6 }}
                      placeholder="닉네임"
                      value={commentDraft[p.id]?.nickname || ""}
                      onChange={(e) =>
                        setCommentDraft((prev) => ({ ...prev, [p.id]: { ...prev[p.id], nickname: e.target.value } }))
                      }
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        className="text-input"
                        style={{ flex: 1 }}
                        placeholder="댓글을 남겨보세요"
                        value={commentDraft[p.id]?.message || ""}
                        onChange={(e) =>
                          setCommentDraft((prev) => ({ ...prev, [p.id]: { ...prev[p.id], message: e.target.value } }))
                        }
                      />
                      <button
                        className="btn-outline"
                        style={{ width: "auto", padding: "11px 16px" }}
                        type="button"
                        disabled={!!commentSubmitting[p.id]}
                        onClick={() => submitComment(p.id)}
                      >
                        등록
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
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
            style={{ marginBottom: 8 }}
            type="number"
            min="1"
            placeholder="정원 (선택, 비워두면 제한 없음)"
            value={maxMembers}
            onChange={(e) => setMaxMembers(e.target.value)}
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
          <span aria-hidden="true">✏️ </span>모임 만들기
        </button>
      )}
    </>
  );
}

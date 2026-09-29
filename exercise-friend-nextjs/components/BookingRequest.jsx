// ============================================================
// [예약/문의 신청 폼] "문의/예약 신청하기" 버튼과 그 아래 입력 폼
// - 렌더링 위치: FacilityCard.jsx 안에 포함되어 시설 카드마다 하나씩 나타남
// - 연락처+메시지를 입력받아 /api/booking-requests 로 전송, Supabase의
//   booking_requests 테이블에 저장됨 (30일 후 pg_cron으로 자동 삭제됨,
//   supabase/migration_004 참고)
// ============================================================

"use client";

import { useState } from "react";

export default function BookingRequest({ facilityKey, facilityName, facilityAddr, courseName }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!/^[0-9-]{9,13}$/.test(phone.trim())) {
      alert("연락처를 정확히 입력해주세요. (예: 010-1234-5678)");
      return;
    }
    if (!agreed) {
      alert("개인정보 수집·이용에 동의해주셔야 신청이 가능해요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityKey, facilityName, facilityAddr, courseName, phone, message }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        alert("신청에 실패했어요. 다시 시도해주세요.");
      }
    } catch (e) {
      alert("신청에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p className="hint" style={{ marginTop: 8 }}>
        <span aria-hidden="true">✅ </span>예약 신청이 접수됐어요! 입력하신 번호로 시설에서 곧 연락드릴 예정이에요.
      </p>
    );
  }

  if (!open) {
    return (
      <button className="btn-outline" type="button" onClick={() => setOpen(true)}>
        문의 / 예약 신청하기
      </button>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <p className="hint" style={{ marginBottom: 8 }}>
        실시간 좌석 확인은 어려워서, 연락처를 남겨주시면 시설에서 직접 확인 후 연락드려요.
      </p>
      <input
        className="text-input"
        style={{ marginBottom: 8 }}
        type="tel"
        placeholder="연락처 (예: 010-1234-5678)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <textarea
        className="text-input"
        style={{ width: "100%", minHeight: 60, marginBottom: 8, resize: "vertical" }}
        placeholder="남기실 말씀 (선택)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <label style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 10, fontSize: 12.5, color: "var(--muted)" }}>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 2 }} />
        <span>
          [필수] 예약 신청 확인 및 시설 연락 목적으로 연락처를 수집하며, 처리 완료 후 30일 이내 파기합니다. 수집한
          정보는 해당 시설과의 예약 확인 외 다른 목적으로 사용하지 않습니다.
        </span>
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-outline" type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "신청 중..." : "신청하기"}
        </button>
        <button className="btn-outline" type="button" onClick={() => setOpen(false)}>
          취소
        </button>
      </div>
    </div>
  );
}

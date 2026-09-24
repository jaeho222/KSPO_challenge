"use client";

import { useState } from "react";

export default function BookingRequest({ facilityName, facilityAddr, courseName }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!/^[0-9-]{9,13}$/.test(phone.trim())) {
      alert("연락처를 정확히 입력해주세요. (예: 010-1234-5678)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityName, facilityAddr, courseName, phone, message }),
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
        ✅ 예약 신청이 접수됐어요! 입력하신 번호로 시설에서 곧 연락드릴 예정이에요.
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

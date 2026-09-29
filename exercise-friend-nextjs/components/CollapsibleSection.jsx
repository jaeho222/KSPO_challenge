// ============================================================
// [아코디언 공용 컴포넌트] 제목을 누르면 펼쳐지는 접었다 폈다 박스
// - 렌더링 위치: HomeScreen.jsx의 여러 섹션(체력정보/루틴/가이드영상 등)에서
//   반복 재사용됨 (한 화면에 정보가 너무 많아 보이는 걸 막기 위해 도입)
// - title 문자열 맨 앞의 이모지를 splitLeadingEmoji()로 자동 분리해서
//   aria-hidden 처리함 (스크린리더가 이모지를 안 읽게)
// ============================================================

"use client";

import { useState } from "react";
import { splitLeadingEmoji } from "../lib/logic";

export default function CollapsibleSection({ title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const { icon, text } = splitLeadingEmoji(title);

  return (
    <div className="collapsible">
      <button type="button" className="collapsible-header" onClick={() => setOpen((v) => !v)}>
        <span>
          <span className="collapsible-title">
            {icon ? <span aria-hidden="true">{icon} </span> : null}
            {text}
          </span>
          {subtitle ? <span className="collapsible-subtitle">{subtitle}</span> : null}
        </span>
        <span className="collapsible-chevron" aria-hidden="true">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open ? <div className="collapsible-body">{children}</div> : null}
    </div>
  );
}

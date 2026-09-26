"use client";

import { useState } from "react";

export default function CollapsibleSection({ title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="collapsible">
      <button type="button" className="collapsible-header" onClick={() => setOpen((v) => !v)}>
        <span>
          <span className="collapsible-title">{title}</span>
          {subtitle ? <span className="collapsible-subtitle">{subtitle}</span> : null}
        </span>
        <span className="collapsible-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open ? <div className="collapsible-body">{children}</div> : null}
    </div>
  );
}

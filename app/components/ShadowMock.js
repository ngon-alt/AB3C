"use client";
import { useEffect, useRef } from "react";

export default function ShadowMock({ html, style }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let root = el.shadowRoot;
    if (!root) {
      root = el.attachShadow({ mode: "open" });
    }
    root.innerHTML = html || "";
  }, [html]);

  return <div ref={hostRef} style={style} />;
}

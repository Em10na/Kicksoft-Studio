"use client";

import { useEffect, useState } from "react";

export default function DroneCurtain() {
  const [phase, setPhase] = useState<"loading" | "opening" | "done">("loading");

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem("curtain-seen");
    if (alreadySeen) {
      setPhase("done");
      return;
    }

    const t1 = setTimeout(() => setPhase("opening"), 1800);
    const t2 = setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem("curtain-seen", "1");
    }, 3600);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex",
        pointerEvents: phase === "opening" ? "none" : "all",
      }}
    >
      {/* Left panel */}
      <div
        style={{
          width: "50%", height: "100%", position: "relative", overflow: "hidden",
          transition: "transform 1.4s cubic-bezier(0.76, 0, 0.24, 1)",
          transform: phase === "opening" ? "translateX(-100%)" : "translateX(0)",
        }}
      >
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
          <img src="https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80&auto=format&fit=crop" alt="" style={{ width: "100%", flex: 1, objectFit: "cover" }} />
          <img src="https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=600&q=80&auto=format&fit=crop" alt="" style={{ width: "100%", flex: 1, objectFit: "cover" }} />
          <img src="https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&q=80&auto=format&fit=crop" alt="" style={{ width: "100%", flex: 1, objectFit: "cover" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "rgba(6,9,24,0.55)", backdropFilter: "blur(2px)" }}></div>
      </div>

      {/* Right panel */}
      <div
        style={{
          width: "50%", height: "100%", position: "relative", overflow: "hidden",
          transition: "transform 1.4s cubic-bezier(0.76, 0, 0.24, 1)",
          transform: phase === "opening" ? "translateX(100%)" : "translateX(0)",
        }}
      >
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
          <img src="https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=600&q=80&auto=format&fit=crop" alt="" style={{ width: "100%", flex: 1, objectFit: "cover" }} />
          <img src="https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=600&q=80&auto=format&fit=crop" alt="" style={{ width: "100%", flex: 1, objectFit: "cover" }} />
          <img src="https://images.unsplash.com/photo-1521405924368-64c5b84bec60?w=600&q=80&auto=format&fit=crop" alt="" style={{ width: "100%", flex: 1, objectFit: "cover" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "rgba(6,9,24,0.55)", backdropFilter: "blur(2px)" }}></div>
      </div>

      {/* Center logo */}
      <div
        style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10, textAlign: "center",
          transition: "opacity 0.6s ease, transform 0.6s ease",
          opacity: phase === "opening" ? 0 : 1,
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "16px",
            background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
            display: "inline-grid", placeItems: "center",
            color: "#fff", fontWeight: 800, fontSize: "26px",
            boxShadow: "0 12px 40px rgba(79,70,229,0.4)",
          }}>K</div>
          <span style={{ fontWeight: 800, fontSize: "36px", letterSpacing: "-0.02em", color: "#fff" }}>DJI STORE TN</span>
        </div>
        <div style={{ fontSize: "13px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "28px" }}>
          Technology Takes Flight
        </div>
        <div style={{ width: "180px", height: "3px", background: "rgba(255,255,255,0.1)", borderRadius: "999px", margin: "0 auto", overflow: "hidden" }}>
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, #4F46E5, #7C3AED, #10B981)", borderRadius: "999px", animation: "curtainLoad 1.7s ease-in-out forwards" }}></div>
        </div>
      </div>
    </div>
  );
}

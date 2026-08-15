"use client";

import Link from "next/link";

// Coque commune connexion / inscription — thème sombre DJI Store TN.
// Vidéo aérienne en fond, carte noire avec animations cinématiques.
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      {/* Fond vidéo */}
      <video
        className="auth-bg"
        autoPlay
        muted
        loop
        playsInline
        poster="https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1920&q=80&auto=format&fit=crop"
      >
        <source src="/front/videos/auth-hero.mp4" type="video/mp4" />
      </video>
      <div className="auth-bg-veil" />

      {/* Halos lumineux ambiants */}
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />

      <div className="auth-card">
        <Link href="/" className="auth-logo">
          <img src="/assets/images/logos/logo-store.png" alt="DJI Store TN" className="auth-logo__img" />
        </Link>
        {children}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Outfit:wght@400;500;600;700&display=swap');

        /* ── Page ─────────────────────────────────────────────────── */
        .auth-page {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Outfit', system-ui, -apple-system, 'Segoe UI', sans-serif;
          background: #030712;
        }

        /* ── Fond vidéo ───────────────────────────────────────────── */
        .auth-bg {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
        }
        .auth-bg-veil {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(3,7,18,0.82) 0%, rgba(15,23,42,0.7) 100%);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }

        /* ── Halos ambiants ───────────────────────────────────────── */
        @keyframes authGlowFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(20px, -25px) scale(1.08); }
        }
        .auth-glow {
          position: fixed; border-radius: 50%;
          filter: blur(90px); opacity: 0.13; pointer-events: none; z-index: 1;
        }
        .auth-glow--1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #4f46e5 0%, transparent 70%);
          top: -150px; right: -100px;
          animation: authGlowFloat 14s ease-in-out infinite;
        }
        .auth-glow--2 {
          width: 450px; height: 450px;
          background: radial-gradient(circle, #0ea5e9 0%, transparent 70%);
          bottom: -120px; left: -80px;
          animation: authGlowFloat 18s ease-in-out infinite reverse;
        }

        /* ── Animations d'entrée ──────────────────────────────────── */
        @keyframes authRise {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes authLogoIn {
          from { opacity: 0; transform: scale(0.8) translateY(-10px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes authShimmer {
          0%       { left: -70%; }
          40%, 100% { left: 130%; }
        }
        @keyframes authPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.1); }
          50%       { box-shadow: 0 0 0 6px rgba(255,255,255,0); }
        }

        /* ── Carte principale ─────────────────────────────────────── */
        .auth-card {
          position: relative;
          z-index: 2;
          width: min(430px, 100%);
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          box-shadow:
            0 40px 100px -20px rgba(0,0,0,0.85),
            0 0 0 1px rgba(255,255,255,0.04),
            inset 0 1px 0 rgba(255,255,255,0.06);
          padding: 42px 38px;
          animation: authRise 0.6s cubic-bezier(0.22,1,0.36,1) both;
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          text-align: center;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .auth-card::-webkit-scrollbar { width: 4px; }
        .auth-card::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

        /* ── Logo DJI Store TN ────────────────────────────────────── */
        .auth-logo {
          display: inline-block;
          text-decoration: none;
          margin-bottom: 22px;
          animation: authLogoIn 0.5s cubic-bezier(0.22,1,0.36,1) 0.2s both;
        }
        .auth-logo__img {
          height: 38px;
          width: auto;
          max-width: 200px;
          object-fit: contain;
          /* Filtre pour rendre le logo blanc sur fond sombre */
          filter: brightness(0) invert(1);
          transition: opacity 0.2s;
        }
        .auth-logo:hover .auth-logo__img { opacity: 0.8; }

        /* ── Textes ───────────────────────────────────────────────── */
        .auth-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #f1f5f9;
          margin: 0 0 6px;
        }
        .auth-sub { font-size: 13.5px; color: #64748b; margin: 0 0 26px; }

        /* ── Champs de saisie ─────────────────────────────────────── */
        .auth-input {
          width: 100%;
          padding: 13px 16px;
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          font-size: 14px;
          font-family: inherit;
          color: #f1f5f9;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
        }
        .auth-input::placeholder { color: #475569; }
        .auth-input:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.06); }
        .auth-input:focus {
          border-color: rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 4px rgba(255,255,255,0.06), 0 0 20px rgba(255,255,255,0.04);
        }
        .auth-input--error { border-color: rgba(248,113,113,0.5); }
        .auth-error { color: #f87171; font-size: 12px; margin: 5px 0 0 4px; }

        .auth-eye {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; color: #475569;
          padding: 0; display: flex;
          transition: color 0.2s;
        }
        .auth-eye:hover { color: #94a3b8; }

        /* ── Liens ────────────────────────────────────────────────── */
        .auth-row {
          display: flex; align-items: center;
          justify-content: space-between;
          margin: 0 2px 18px; font-size: 12.5px;
        }
        .auth-row a { color: #94a3b8; font-weight: 600; text-decoration: none; transition: color 0.2s; }
        .auth-row a:hover { color: #f1f5f9; }

        /* ── Bouton principal ─────────────────────────────────────── */
        .auth-submit {
          position: relative;
          overflow: hidden;
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 24px;
          border: none;
          border-radius: 14px;
          background: #fff;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
          box-shadow: 0 4px 20px rgba(255,255,255,0.15), 0 1px 3px rgba(0,0,0,0.3);
          letter-spacing: -0.01em;
          animation: authPulse 3s ease-in-out infinite 1.5s;
        }
        /* Reflet shimmer automatique */
        .auth-submit::after {
          content: '';
          position: absolute;
          top: -50%; left: -70%;
          width: 40%; height: 200%;
          background: linear-gradient(105deg, transparent, rgba(255,255,255,0.25), transparent);
          transform: skewX(-20deg);
          animation: authShimmer 3.5s ease-in-out infinite 1s;
        }
        .auth-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(255,255,255,0.22), 0 1px 3px rgba(0,0,0,0.4);
          background: #f1f5f9;
        }
        .auth-submit:active { transform: translateY(0); }
        .auth-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; animation: none; }
        .auth-submit:disabled::after { display: none; }

        /* ── Alerte d'erreur ──────────────────────────────────────── */
        .auth-alert {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          color: #fca5a5;
          font-size: 13px;
          border-radius: 12px;
          padding: 11px 14px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: left;
        }

        /* ── Pied de formulaire ───────────────────────────────────── */
        .auth-switch { font-size: 13.5px; color: #475569; margin-top: 22px; }
        .auth-switch a, .auth-switch button {
          color: #94a3b8; font-weight: 700; text-decoration: none;
          transition: color 0.2s;
        }
        .auth-switch a:hover, .auth-switch button:hover { color: #f1f5f9; }

        /* ── Checkbox ─────────────────────────────────────────────── */
        .auth-check {
          display: flex; align-items: center; gap: 9px;
          font-size: 12.5px; color: #64748b;
          margin: 2px 2px 18px; text-align: left;
        }
        .auth-check input { width: 16px; height: 16px; accent-color: #94a3b8; cursor: pointer; flex-shrink: 0; }
        .auth-check a { color: #94a3b8; font-weight: 600; }

        /* ── Responsive ───────────────────────────────────────────── */
        @media (max-width: 520px) {
          .auth-card { padding: 32px 22px; border-radius: 22px; }
          .auth-title { font-size: 20px; }
        }
      `}</style>
    </div>
  );
}

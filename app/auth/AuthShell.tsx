"use client";

import Link from "next/link";

// Coque commune connexion / inscription : simple et épurée.
// Vidéo en fond adoucie, une seule carte blanche centrée.
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Outfit:wght@400;500;600;700&display=swap"
      />

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

      <div className="auth-card">
        <Link href="/" className="auth-logo">
          <span className="auth-logo__mark">K</span>
          <span className="auth-logo__text">kicksoft</span>
        </Link>
        {children}
      </div>

      <style>{`
        .auth-page {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Outfit', system-ui, -apple-system, 'Segoe UI', sans-serif;
          background: #0a0a0a;
        }
        .auth-bg {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
        }
        .auth-bg-veil {
          position: absolute; inset: 0;
          background: rgba(8, 8, 12, 0.55);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
        }

        @keyframes authRise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }

        .auth-card {
          position: relative;
          z-index: 2;
          width: min(420px, 100%);
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 30px 90px -25px rgba(0,0,0,0.6);
          padding: 40px 36px;
          animation: authRise 0.55s cubic-bezier(0.22,1,0.36,1) both;
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          text-align: center;
        }
        .auth-card::-webkit-scrollbar { width: 5px; }
        .auth-card::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }

        .auth-logo {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          text-decoration: none;
          margin-bottom: 18px;
        }
        .auth-logo__mark {
          width: 36px; height: 36px;
          background: #0f172a;
          border-radius: 10px;
          display: grid; place-items: center;
          color: #fff; font-weight: 800; font-size: 16px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .auth-logo__text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 21px; font-weight: 800;
          color: #0f172a; letter-spacing: -0.02em;
        }

        .auth-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #0f172a;
          margin: 0 0 6px;
        }
        .auth-sub { font-size: 14px; color: #64748b; margin: 0 0 26px; }

        .auth-field { margin-bottom: 14px; text-align: left; }
        .auth-field__wrap { position: relative; }
        .auth-field__icon { display: none; }
        .auth-input {
          width: 100%;
          padding: 13px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          background: #fff;
          font-size: 14px;
          font-family: inherit;
          color: #111827;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-input::placeholder { color: #94a3b8; }
        .auth-input:hover { border-color: #cbd5e1; }
        .auth-input:focus {
          border-color: #0f172a;
          box-shadow: 0 0 0 4px rgba(15,23,42,0.08);
        }
        .auth-input--error { border-color: #dc2626; }
        .auth-error { color: #dc2626; font-size: 12px; margin: 5px 0 0 4px; }
        .auth-eye {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; color: #94a3b8;
          padding: 0; display: flex;
        }
        .auth-eye:hover { color: #0f172a; }

        .auth-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0 2px 18px;
          font-size: 12.5px;
        }
        .auth-row a { color: #0f172a; font-weight: 600; text-decoration: none; }
        .auth-row a:hover { text-decoration: underline; }

        .auth-check {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 12.5px;
          color: #475569;
          margin: 2px 2px 18px;
          text-align: left;
        }
        .auth-check input {
          width: 16px; height: 16px;
          accent-color: #0f172a;
          cursor: pointer;
          flex-shrink: 0;
        }
        .auth-check a { color: #0f172a; font-weight: 600; }

        .auth-submit {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          background: #0f172a;
          color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .auth-submit:hover { background: #1e293b; transform: translateY(-1px); }
        .auth-submit:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .auth-alert {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 13px;
          border-radius: 12px;
          padding: 11px 14px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: left;
        }

        .auth-switch { font-size: 13.5px; color: #475569; margin-top: 22px; }
        .auth-switch a { color: #0f172a; font-weight: 700; text-decoration: none; }
        .auth-switch a:hover { text-decoration: underline; }

        .auth-perks { margin-top: 18px; display: flex; flex-direction: column; gap: 6px; text-align: left; }
        .auth-perk { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #475569; }
        .auth-perk span { color: #10b981; font-weight: 700; }

        .auth-strength { margin-top: 8px; display: flex; gap: 4px; }
        .auth-strength div { flex: 1; height: 3px; border-radius: 2px; background: #e5e7eb; }

        @media (max-width: 520px) {
          .auth-card { padding: 32px 22px; border-radius: 20px; }
        }
      `}</style>
    </div>
  );
}

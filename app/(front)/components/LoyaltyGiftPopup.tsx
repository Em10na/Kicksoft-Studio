"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MILESTONE = 100;

// Confetti pieces (color + horizontal position + delay)
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 0.18) % 1.6,
  color: ["#4F46E5", "#7C3AED", "#F59E0B", "#10B981", "#E11D48", "#38BDF8"][i % 6],
  size: 6 + (i % 3) * 3,
}));

export default function LoyaltyGiftPopup() {
  const [show, setShow] = useState(false);
  const [opened, setOpened] = useState(false);
  const [points, setPoints] = useState(0);
  const [storageKey, setStorageKey] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function check() {
      try {
        // getSession() lit depuis localStorage — aucune requête réseau,
        // pas de "Failed to fetch" si le projet Supabase est en veille (free tier).
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        if (!user) return;

        const key = `loyalty-gift-${MILESTONE}-${user.id}`;
        // Already celebrated this milestone on this device
        if (localStorage.getItem(key)) return;

        const { data: txns } = await supabase
          .from("loyalty_transactions")
          .select("points")
          .eq("user_id", user.id);

        const balance = (txns ?? []).reduce((s, t) => s + t.points, 0);
        if (balance >= MILESTONE) {
          setPoints(balance);
          setStorageKey(key);
          setShow(true);
          // Open the gift box after a short delay
          setTimeout(() => setOpened(true), 900);
        }
      } catch {
        // not logged in / table missing — silently skip
      }
    }
    check();
  }, []);

  function close() {
    if (storageKey) {
      try { localStorage.setItem(storageKey, new Date().toISOString()); } catch {}
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="gift-overlay" role="dialog" aria-label="Félicitations fidélité">
      {/* Confetti rain */}
      {opened &&
        CONFETTI.map((c, i) => (
          <span
            key={i}
            className="gift-confetti"
            style={{
              left: `${c.left}%`,
              animationDelay: `${c.delay}s`,
              background: c.color,
              width: c.size,
              height: c.size * 0.6,
            }}
          />
        ))}

      <div className="gift-card">
        <button className="gift-card__close" onClick={close} aria-label="Fermer">✕</button>

        <div className={`gift-box ${opened ? "gift-box--open" : ""}`}>
          <span className="gift-box__glow" />
          <span className="gift-box__emoji">{opened ? "🎉" : "🎁"}</span>
        </div>

        <p className="gift-card__points">{points} points</p>
        <h2 className="gift-card__title">Félicitations !</h2>
        <p className="gift-card__text">
          Vous avez atteint <strong>{MILESTONE} points de fidélité</strong> ! 🏆
          <br />
          Un cadeau vous attend : notre <strong>équipe technique va vous contacter</strong> très
          prochainement pour plus d&apos;informations.
        </p>

        <button className="btn btn--indigo" onClick={close}>
          Super, merci ! 🎊
        </button>
      </div>
    </div>
  );
}

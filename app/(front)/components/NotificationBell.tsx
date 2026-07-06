"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Centre de notifications (style Temu / Shein) :
// cloche + pastille non-lues + panneau listant les annonces,
// avec activation des notifications push en arrière-plan.

const LAST_SEEN_KEY = "kicksoft_notif_seen";

type Notif = {
  id: string; title: string; body: string; url: string;
  image: string | null; tag: string; created_at: string;
};

const TAG_ICONS: Record<string, string> = { nouveau: "🆕", solde: "🏷️", info: "📣" };

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 604800) return `il y a ${Math.floor(s / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Annonces pour la cloche
    const supabase = createClient();
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15)
      .then(({ data }) => {
        const list = (data as Notif[]) ?? [];
        setNotifs(list);
        const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY) ?? 0);
        setUnread(list.filter((n) => new Date(n.created_at).getTime() > lastSeen).length);
      });

    // État du push en arrière-plan
    if ("serviceWorker" in navigator && "PushManager" in window && "Notification" in window) {
      navigator.serviceWorker.register("/sw.js").then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setPushSupported(true);
        setPushOn(!!sub && Notification.permission === "granted");
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      // Ouvrir le panneau marque tout comme lu
      localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
      setUnread(0);
    }
  }

  async function togglePush() {
    if (busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (pushOn) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setPushOn(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (res.ok) setPushOn(true);
    } catch { /* activation refusée ou non disponible */ }
    finally { setBusy(false); }
  }

  return (
    <div className={`notif-center${open ? " is-open" : ""}`} ref={wrapRef}>
      <button
        type="button"
        className="icon-btn"
        onClick={toggleOpen}
        aria-label="Notifications"
        aria-expanded={open}
        title="Notifications"
        style={{ position: "relative" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className="notif-center__badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      <div className="notif-center__panel">
        <div className="notif-center__head">
          <strong>Notifications</strong>
          {pushSupported && (
            <button
              type="button"
              className={`notif-center__push${pushOn ? " is-on" : ""}`}
              onClick={togglePush}
              disabled={busy}
              title={pushOn ? "Notifications téléphone activées" : "Recevoir les notifications sur votre appareil"}
            >
              <span className="notif-center__push-dot" />
              {pushOn ? "Push activé" : "Activer le push"}
            </button>
          )}
        </div>

        <div className="notif-center__list">
          {notifs.length === 0 ? (
            <p className="notif-center__empty">Aucune notification pour le moment.<br />Les nouveautés et soldes apparaîtront ici.</p>
          ) : notifs.map((n) => (
            <Link key={n.id} href={n.url || "/boutique"} className="notif-center__item" onClick={() => setOpen(false)}>
              {n.image ? (
                <img src={n.image} alt="" className="notif-center__thumb" />
              ) : (
                <span className="notif-center__emoji">{TAG_ICONS[n.tag] ?? "📣"}</span>
              )}
              <span className="notif-center__content">
                <span className="notif-center__title">{n.title}</span>
                {n.body && <span className="notif-center__body">{n.body}</span>}
                <span className="notif-center__time">{timeAgo(n.created_at)}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

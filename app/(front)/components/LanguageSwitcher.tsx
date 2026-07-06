"use client";

import { useEffect, useRef, useState } from "react";

// ================================================================
// Language switcher — full-site translation via Google Translate
// FR (original) / EN / AR. Sets the googtrans cookie then reloads;
// the hidden Google widget translates every page automatically.
// UI: a single globe icon that opens a dropdown menu.
// ================================================================

const LANGS = [
  { code: "fr", label: "Français", short: "FR" },
  { code: "en", label: "English", short: "EN" },
  { code: "ar", label: "العربية", short: "ع" },
] as const;

type LangCode = (typeof LANGS)[number]["code"];

function getCurrentLang(): LangCode {
  const m = document.cookie.match(/googtrans=\/fr\/(\w+)/);
  if (m && (m[1] === "en" || m[1] === "ar")) return m[1];
  return "fr";
}

function clearCookie(name: string) {
  const past = "Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `${name}=; path=/; expires=${past}`;
  document.cookie = `${name}=; domain=${location.hostname}; path=/; expires=${past}`;
  document.cookie = `${name}=; domain=.${location.hostname}; path=/; expires=${past}`;
}

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState<LangCode>("fr");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(getCurrentLang());

    // Inject the hidden Google Translate widget (only if a translation is active
    // or will be — cheap enough to always load once)
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const w = window as any;
    if (!w.googleTranslateElementInit) {
      w.googleTranslateElementInit = () => {
        new w.google.translate.TranslateElement(
          { pageLanguage: "fr", autoDisplay: false },
          "google_translate_element"
        );
      };
      const s = document.createElement("script");
      s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      s.async = true;
      document.head.appendChild(s);
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

  function switchTo(lang: LangCode) {
    setOpen(false);
    if (lang === current) return;

    if (lang === "fr") {
      clearCookie("googtrans");
    } else {
      document.cookie = `googtrans=/fr/${lang}; path=/`;
      document.cookie = `googtrans=/fr/${lang}; domain=${location.hostname}; path=/`;
    }
    location.reload();
  }

  return (
    <>
      {/* Hidden container required by the Google widget */}
      <div id="google_translate_element" style={{ display: "none" }} />

      <div className={`lang-switcher${open ? " is-open" : ""}`} ref={wrapRef}>
        <button
          type="button"
          className="icon-btn"
          aria-label="Choisir la langue"
          aria-expanded={open}
          title="Langue"
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </button>

        <div className="lang-switcher__menu" role="menu">
          {LANGS.map((l) => (
            <button
              key={l.code}
              role="menuitem"
              className={`lang-switcher__item ${current === l.code ? "is-active" : ""}`}
              onClick={() => switchTo(l.code)}
            >
              <span className="lang-switcher__short">{l.short}</span>
              <span>{l.label}</span>
              {current === l.code && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

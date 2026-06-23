"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const SLIDES = [
  {
    bg: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1920&q=80&auto=format&fit=crop",
    direction: "left" as const,
    title: "Des questions ? On a les reponses",
    subtitle: "Consultez notre FAQ complete pour trouver rapidement ce que vous cherchez.",
    cta: { label: "Voir la FAQ", href: "/faq" },
    overlay: "rgba(79,70,229,0.55)",
  },
  {
    bg: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1920&q=80&auto=format&fit=crop",
    direction: "right" as const,
    title: "Besoin d'aide ? Notre equipe est la",
    subtitle: "Support reactif et personnalise. Contactez-nous a tout moment.",
    cta: { label: "Contacter le support", href: "/support" },
    overlay: "rgba(16,185,129,0.50)",
  },
];

const SLIDE_DURATION = 10000;
const TRANSITION_DURATION = 2200;

export default function DroneHeroSlider() {
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<"enter" | "stay" | "exit">("enter");

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;

    function runCycle() {
      setPhase("enter");
      t1 = setTimeout(() => setPhase("stay"), TRANSITION_DURATION);
      t2 = setTimeout(() => setPhase("exit"), SLIDE_DURATION - TRANSITION_DURATION);
      t3 = setTimeout(() => {
        setCurrent((prev) => (prev + 1) % SLIDES.length);
        runCycle();
      }, SLIDE_DURATION);
    }

    runCycle();
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const slide = SLIDES[current];
  const fromLeft = slide.direction === "left";

  const droneClass = [
    "drone-slider__drone",
    phase === "enter" ? (fromLeft ? "drone-slider__drone--enter-left" : "drone-slider__drone--enter-right") : "",
    phase === "stay" ? "drone-slider__drone--center" : "",
    phase === "exit" ? (fromLeft ? "drone-slider__drone--exit-right" : "drone-slider__drone--exit-left") : "",
  ].join(" ");

  const bgClass = [
    "drone-slider__bg",
    phase === "enter" ? "drone-slider__bg--enter" : "",
    phase === "stay" ? "drone-slider__bg--visible" : "",
    phase === "exit" ? "drone-slider__bg--exit" : "",
  ].join(" ");

  const textClass = [
    "drone-slider__text",
    phase === "stay" ? "drone-slider__text--visible" : "",
  ].join(" ");

  return (
    <section className="drone-slider">
      {/* Background */}
      <div
        key={`bg-${current}`}
        className={bgClass}
        style={{ backgroundImage: `url(${slide.bg})` }}
      >
        <div className="drone-slider__overlay" style={{ background: slide.overlay }}></div>
      </div>

      {/* Drone */}
      <img
        key={`drone-${current}-${phase}`}
        src="/front/images/drone-hero.png"
        alt=""
        className={droneClass}
      />

      {/* Text + CTA */}
      <div className={textClass}>
        <h1>{slide.title}</h1>
        <p>{slide.subtitle}</p>
        <Link href={slide.cta.href} className="drone-slider__cta">
          {slide.cta.label}
          <svg width="16" height="12" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </div>

      {/* Dots */}
      <div className="drone-slider__dots">
        {SLIDES.map((_, i) => (
          <span key={i} className={`drone-slider__dot ${i === current ? "drone-slider__dot--active" : ""}`}></span>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="drone-slider__scroll">
        <span></span>
      </div>
    </section>
  );
}

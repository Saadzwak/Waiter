"use client";

import { useEffect, useRef, useState } from "react";

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let startTime: number | null = null;

    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed  = ts - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart — fast start, gentle landing
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [active, target, duration]);

  return value;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RetentionStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const [started, setStarted]   = useState(false);
  const [visible, setVisible]   = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          setTimeout(() => setStarted(true), 200);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    if (sectionRef.current) io.observe(sectionRef.current);
    return () => io.disconnect();
  }, []);

  const v1 = useCountUp(40, 1100, started);
  const v2 = useCountUp(42, 1300, started);
  const v3 = useCountUp(70, 1700, started);

  const cards = [
    {
      visit: "1st visit",
      value: v1,
      suffix: "%",
      label: "chance to return",
      delay: "0ms",
      accent: false,
    },
    {
      visit: "2nd visit",
      value: v2,
      suffix: "%",
      label: "chance to return",
      delay: "120ms",
      accent: false,
    },
    {
      visit: "3rd visit",
      value: v3,
      suffix: "%+",
      label: "loyal regular",
      delay: "240ms",
      accent: true,
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative bg-gray-950 px-8 py-20 md:py-28 overflow-hidden"
    >

      {/* ── Animated background glows ─────────────────────────────────────── */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(16,185,129,0.07) 0%, transparent 70%)",
          animation: "glow-pulse 6s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -left-24 bottom-0 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)",
          animation: "glow-pulse 8s ease-in-out infinite 2s",
        }}
      />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="relative max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400 mb-5">
            Customer retention insight
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-white leading-tight max-w-2xl mx-auto">
            Getting them back the third time<br />
            <span className="text-emerald-400">is where loyalty starts.</span>
          </h2>
        </div>

        {/* ── Stats cards ───────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-0">
          {cards.map((card, i) => (
            <div key={card.visit} className="flex items-center gap-3 md:gap-0">

              {/* Card */}
              <div
                className={`
                  relative flex flex-col items-center text-center px-10 py-8 rounded-2xl
                  transition-all duration-700
                  ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                  ${card.accent
                    ? "bg-emerald-500/10 border border-emerald-500/25 shadow-[0_0_40px_rgba(16,185,129,0.12)]"
                    : "bg-white/5 border border-white/8"
                  }
                `}
                style={{ transitionDelay: card.delay }}
              >
                {card.accent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap">
                    Loyalty threshold
                  </div>
                )}

                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.25em] mb-4 ${
                    card.accent ? "text-emerald-300" : "text-gray-500"
                  }`}
                >
                  {card.visit}
                </span>

                {/* Big number */}
                <div
                  className={`text-6xl md:text-7xl font-bold tracking-tight tabular-nums leading-none ${
                    card.accent ? "text-emerald-400" : "text-white"
                  }`}
                >
                  {card.value}
                  <span className="text-4xl md:text-5xl">{card.suffix}</span>
                </div>

                <span
                  className={`text-xs mt-3 ${
                    card.accent ? "text-emerald-400/70 font-medium" : "text-gray-500"
                  }`}
                >
                  {card.label}
                </span>

                {/* Animated bar */}
                <div className="mt-4 w-full h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ease-out ${
                      card.accent ? "bg-emerald-500" : "bg-white/20"
                    }`}
                    style={{
                      width: started ? `${card.value}%` : "0%",
                      transitionDuration: "1.6s",
                      transitionDelay: card.delay,
                    }}
                  />
                </div>
              </div>

              {/* Arrow between cards */}
              {i < cards.length - 1 && (
                <div
                  className={`
                    text-gray-700 text-xl font-light shrink-0 mx-3
                    rotate-90 md:rotate-0
                    transition-opacity duration-700
                    ${visible ? "opacity-100" : "opacity-0"}
                  `}
                  style={{ transitionDelay: `${(i + 1) * 120}ms` }}
                >
                  →
                </div>
              )}

            </div>
          ))}
        </div>

        {/* ── Body text ─────────────────────────────────────────────────── */}
        <div
          className={`
            text-center mt-14 max-w-xl mx-auto
            transition-all duration-700 delay-500
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
        >
          <p className="text-white/80 text-base md:text-lg leading-relaxed font-light">
            The challenge isn&apos;t getting new customers in the door —<br className="hidden md:block" />
            it&apos;s giving them a reason to come back a third time.
          </p>
          <p className="text-gray-400 text-sm mt-4 leading-relaxed">
            A guest who gets a perfect first experience — clear answers, no language barrier,
            the right suggestion at the right moment — is far more likely to return.
            AIWaiter delivers that experience on every table, every service, automatically.
          </p>
        </div>

      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

    </section>
  );
}

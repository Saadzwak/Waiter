"use client";

import { useEffect, useRef } from "react";

export function ParallaxQuote() {
  const bgRef      = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const section = sectionRef.current;
      const bg      = bgRef.current;
      if (!section || !bg) return;

      const rect     = section.getBoundingClientRect();
      const viewH    = window.innerHeight;
      const progress = (viewH - rect.top) / (viewH + rect.height);
      const clamped  = Math.max(0, Math.min(1, progress));
      const ty       = (clamped - 0.5) * 140;
      bg.style.transform = `translateY(${ty}px)`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ minHeight: "520px" }}
    >
      {/* Parallax background */}
      <div
        ref={bgRef}
        className="absolute inset-[-80px] will-change-transform"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gray-950/72" />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/20 via-transparent to-gray-950/40" />

      {/* Accent lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center text-center px-8 py-20 md:py-28">

        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400 mb-10">
          Customer retention insight
        </p>

        {/* 3-step loyalty threshold */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-0 w-full max-w-3xl mb-12">

          {/* Visit 1 */}
          <div className="flex flex-col items-center px-8 py-6">
            <span className="text-5xl md:text-6xl font-bold text-white tracking-tight">40%</span>
            <span className="text-xs text-gray-400 mt-2 uppercase tracking-widest">1st visit</span>
            <span className="text-xs text-gray-500 mt-1">chance to return</span>
          </div>

          {/* Arrow */}
          <div className="text-emerald-500/40 text-2xl font-light rotate-90 md:rotate-0 my-2 md:my-0">
            →
          </div>

          {/* Visit 2 */}
          <div className="flex flex-col items-center px-8 py-6">
            <span className="text-5xl md:text-6xl font-bold text-white tracking-tight">42%</span>
            <span className="text-xs text-gray-400 mt-2 uppercase tracking-widest">2nd visit</span>
            <span className="text-xs text-gray-500 mt-1">chance to return</span>
          </div>

          {/* Arrow */}
          <div className="text-emerald-500/40 text-2xl font-light rotate-90 md:rotate-0 my-2 md:my-0">
            →
          </div>

          {/* Visit 3 — highlighted */}
          <div className="flex flex-col items-center px-8 py-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-5xl md:text-6xl font-bold text-emerald-400 tracking-tight">70%+</span>
            <span className="text-xs text-emerald-300 mt-2 uppercase tracking-widest">3rd visit</span>
            <span className="text-xs text-emerald-400/70 mt-1 font-medium">loyal regular</span>
          </div>

        </div>

        {/* Insight text */}
        <p className="text-white/80 text-base md:text-lg max-w-xl leading-relaxed font-light">
          The challenge isn&apos;t getting new customers —<br className="hidden md:block" />
          it&apos;s getting them back a third time.
        </p>
        <p className="text-gray-400 text-sm mt-3 max-w-lg leading-relaxed">
          A guest who gets a perfect experience — clear menu, no language barrier, the right recommendation —
          is far more likely to return. That&apos;s what AIWaiter does, on every table, every service.
        </p>

      </div>
    </section>
  );
}

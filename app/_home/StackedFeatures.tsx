"use client";

import { useEffect, useRef } from "react";
import {
  Check,
  Globe,
  Shield,
  ChefHat,
  MessageSquare,
  BarChart2,
  Zap,
  LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  tag: string;
  title: string;
  body: string;
  highlight: string;
};

const FEATURES: Feature[] = [
  {
    icon: Globe,
    tag: "Multilingual",
    title: "Speaks every language. Automatically.",
    body: "The AI detects your customer's language from their first message and responds fluently — French, English, Arabic, Japanese, and 100+ more. No setup, no translation team.",
    highlight: "100+ languages supported",
  },
  {
    icon: Shield,
    tag: "Precision",
    title: "Every allergen. Every ingredient. Every time.",
    body: "Your AI waiter knows every dish by heart — ingredients, allergens, preparation methods. It gives consistent, accurate answers every single time, even at peak service.",
    highlight: "Zero inconsistencies",
  },
  {
    icon: ChefHat,
    tag: "Chef's voice",
    title: "Your chef's knowledge, built in.",
    body: "Record voice notes about each dish — the story behind it, how it's made, what makes it special. The AI learns it and shares it with customers like a seasoned maître d'hôtel.",
    highlight: "Voice-to-knowledge in seconds",
  },
  {
    icon: MessageSquare,
    tag: "Soft upsell",
    title: "Suggests pairings without being pushy.",
    body: "When a guest asks about the duck, the AI naturally mentions the Burgundy wine that complements it. One elegant suggestion, perfectly timed — the way a great waiter would do it.",
    highlight: "+18–25% average basket (est.)",
  },
  {
    icon: BarChart2,
    tag: "Analytics",
    title: "Know what your customers really want.",
    body: "See which dishes get asked about most, what languages your customers speak, and how conversations convert. Insights that help you improve your menu and your service.",
    highlight: "Real-time dashboard",
  },
  {
    icon: Zap,
    tag: "Setup",
    title: "Live in 3 minutes. No tech team needed.",
    body: "Upload your menu PDF, get your QR code, place it on your tables. That's it. Your AI waiter is available 24/7 from day one.",
    highlight: "No code. No complexity.",
  },
];

const CARD_SCROLL = 650; // px of scroll per card transition

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-10 shadow-lg">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
          <Icon className="w-7 h-7 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
            {feature.tag}
          </span>
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mt-2 mb-3 leading-snug">
            {feature.title}
          </h3>
          <p className="text-gray-500 leading-relaxed">{feature.body}</p>
          <div className="mt-6 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-emerald-700">{feature.highlight}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StackedFeatures() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRef = useRef<HTMLParagraphElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId = 0;

    const animate = () => {
      const el = sectionRef.current;
      if (!el) return;

      // scrolled = how many px we've scrolled past the section's top edge
      const scrolled = -el.getBoundingClientRect().top;
      const progress = Math.max(0, scrolled) / CARD_SCROLL;
      const n = FEATURES.length;
      const activeIdx = Math.min(Math.floor(progress), n - 1);
      const cp = progress - activeIdx; // 0→1 progress within current transition

      // Counter
      if (counterRef.current) {
        counterRef.current.textContent = `${String(activeIdx + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
      }

      // Progress dots
      dotRefs.current.forEach((dot, i) => {
        if (!dot) return;
        dot.style.width = i === activeIdx ? "24px" : "6px";
        dot.style.background =
          i < activeIdx ? "#10b981" : i === activeIdx ? "#059669" : "#e5e7eb";
      });

      // Scroll hint
      if (scrollHintRef.current) {
        scrollHintRef.current.style.opacity =
          activeIdx === 0 && cp < 0.3 ? "0.6" : "0";
      }

      // Cards
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const diff = i - activeIdx;
        let ty: number, op: number, sc: number;

        if (diff === 0) {
          // Active card: gently rises as next card approaches
          ty = -cp * 6;
          op = 1;
          sc = 1 - cp * 0.015;
        } else if (diff === 1) {
          // Next card: slides up from below
          ty = 72 - cp * 72;
          op = 0.35 + cp * 0.65;
          sc = 0.97 + cp * 0.03;
        } else if (diff === 2) {
          // Barely peeking, gives depth
          ty = 90 - cp * 20;
          op = Math.max(0, 0.12 - cp * 0.05);
          sc = 0.94;
        } else if (diff > 2) {
          // Hidden future cards
          ty = 100;
          op = 0;
          sc = 0.92;
        } else {
          // Past cards: above, fading out
          ty = diff * 6 - cp * 3;
          op = Math.max(0, 0.35 + diff * 0.35);
          sc = 1 + diff * 0.012;
        }

        card.style.transform = `translateY(${ty}px) scale(${sc})`;
        card.style.opacity = String(op);
        card.style.zIndex =
          diff === 0
            ? "20"
            : diff === 1
            ? "19"
            : diff === 2
            ? "18"
            : diff < 0
            ? String(10 + n + diff)
            : "1";
        card.style.pointerEvents = diff === 0 ? "auto" : "none";
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    animate(); // set initial state

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ height: `calc(100vh + ${FEATURES.length * CARD_SCROLL}px)` }}
      className="relative"
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-6">

        {/* Label + progress dots */}
        <div className="w-full max-w-3xl flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
              What you get
            </p>
            <p ref={counterRef} className="text-xs text-gray-400">
              01 / {String(FEATURES.length).padStart(2, "0")}
            </p>
          </div>
          <div className="flex gap-1.5 items-center">
            {FEATURES.map((_, i) => (
              <div
                key={i}
                ref={(el) => { dotRefs.current[i] = el; }}
                className="rounded-full"
                style={{
                  width: i === 0 ? 24 : 6,
                  height: 6,
                  background: i === 0 ? "#059669" : "#e5e7eb",
                  transition: "width 0.3s ease, background 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* Card stack */}
        <div className="relative w-full max-w-3xl">
          {/* Ghost card — sits in the document flow to give the container its natural height */}
          <div className="invisible pointer-events-none select-none" aria-hidden="true">
            <FeatureCard feature={FEATURES[0]} />
          </div>

          {/* Real cards — all absolutely positioned over the ghost */}
          {FEATURES.map((feature, i) => (
            <div
              key={feature.tag}
              ref={(el) => { cardRefs.current[i] = el; }}
              style={{
                position: "absolute",
                inset: 0,
                // Initial state before JS runs
                transform: i === 0 ? "translateY(0px) scale(1)" : "translateY(100px) scale(0.92)",
                opacity: i === 0 ? 1 : 0,
                zIndex: i === 0 ? 20 : 1,
                pointerEvents: i === 0 ? "auto" : "none",
              }}
            >
              <FeatureCard feature={feature} />
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div
          ref={scrollHintRef}
          className="absolute bottom-10 flex flex-col items-center gap-2 pointer-events-none"
          style={{ opacity: 0.6, transition: "opacity 0.4s" }}
        >
          <p className="text-xs text-gray-400">Scroll to explore</p>
          <div className="w-5 h-8 rounded-full border border-gray-300 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-gray-400 animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}

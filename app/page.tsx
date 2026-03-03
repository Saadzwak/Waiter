import Link from "next/link";
import {
  UtensilsCrossed,
  ArrowRight,
  Check,
  Globe,
  Zap,
  Users,
} from "lucide-react";
import { Reveal } from "./_home/Reveal";
import { StackedFeatures } from "./_home/StackedFeatures";
import { RetentionStats } from "./_home/RetentionStats";

// ─── Shared CTA ───────────────────────────────────────────────────────────────

const CONTACT_HREF = "/contact";

// ─── Chat mockup ──────────────────────────────────────────────────────────────

function ChatMockup() {
  return (
    <div className="relative w-[300px] shrink-0">
      <div className="absolute inset-0 -z-10 rounded-[2.5rem] blur-3xl bg-emerald-400/20 scale-110" />
      <div className="rounded-[2.5rem] border-2 border-gray-100 bg-white shadow-2xl overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 leading-none">Le Comptoir</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">● Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="px-3 py-4 space-y-3 bg-gray-50/50 min-h-[300px]">

          {/* Tourist message in German */}
          <div className="flex justify-end">
            <div className="bg-gray-200 rounded-2xl rounded-br-sm px-3 py-2 text-xs text-gray-700 max-w-[180px] leading-relaxed">
              Ist die Bouillabaisse für Schalentier-Allergiker geeignet?
            </div>
          </div>
          <p className="text-[9px] text-gray-400 text-right pr-1">German</p>

          {/* AI responds in German */}
          <div className="flex gap-2 items-end">
            <div className="w-5 h-5 rounded-full bg-emerald-600 shrink-0 flex items-center justify-center">
              <UtensilsCrossed className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-gray-700 shadow-sm max-w-[190px] leading-relaxed">
              ⚠️ Nein — die Bouillabaisse enthält Muscheln.
              <br /><br />
              Ich empfehle den <span className="font-semibold">Wolfsbarsch</span> — keine Meeresfrüchte, sehr delikat. Möchten Sie mehr wissen?
            </div>
          </div>

          <div className="flex justify-end">
            <div className="bg-emerald-600 rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white max-w-[150px] leading-relaxed">
              Ja! Und welcher Wein passt dazu?
            </div>
          </div>

          {/* Typing indicator */}
          <div className="flex gap-2 items-end">
            <div className="w-5 h-5 rounded-full bg-emerald-600 shrink-0 flex items-center justify-center">
              <UtensilsCrossed className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
              <div className="flex gap-1 items-center h-3">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t border-gray-100 bg-white flex items-center gap-2">
          <div className="flex-1 rounded-xl bg-gray-100 px-3 py-2 text-xs text-gray-400">
            Ask anything about the menu…
          </div>
          <div className="w-7 h-7 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ overflowX: "clip" }}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900 tracking-tight">AIWaiter</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            Sign in
          </Link>
          <Link
            href={CONTACT_HREF}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Contact us
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col lg:flex-row items-center justify-center gap-16 px-8 py-16 lg:py-28 max-w-7xl mx-auto w-full">

        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 40% 0%, rgba(16,185,129,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Left: copy */}
        <div className="relative flex-1 text-center lg:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700 mb-6">
            <Globe className="w-3 h-3" />
            AI waiter · 100+ languages · zero extra staff
          </div>

          <h1 className="text-5xl lg:text-[3.6rem] font-semibold tracking-tight text-gray-900 leading-[1.08]">
            Turn every tourist<br />
            into a regular.
          </h1>

          <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-md mx-auto lg:mx-0">
            Tourists who don&apos;t understand the menu stay quiet, order
            something safe, and leave disappointed. AIWaiter gives them
            a perfect experience in their own language — so they order more,
            and come back.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <Link
              href={CONTACT_HREF}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Contact us
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/le-comptoir"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-6 py-3.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              See it live →
            </Link>
          </div>

          {/* Trust signals */}
          <div className="mt-8 flex items-center justify-center lg:justify-start gap-5 flex-wrap">
            {["Every language, instantly", "Live in 3 minutes", "+18–25% avg order"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-gray-400">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right: phone mockup — floats */}
        <div className="relative shrink-0 animate-float">
          <ChatMockup />
        </div>
      </section>

      {/* ── The scene ───────────────────────────────────────────────────────── */}
      <section className="bg-gray-950 px-8 py-16 lg:py-20">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-4 text-center">
              You know this scene
            </p>
            <h2 className="text-3xl lg:text-4xl font-semibold text-white leading-tight text-center max-w-2xl mx-auto">
              A tourist who doesn&apos;t understand the menu<br />
              is a customer you&apos;ve already lost.
            </h2>
          </Reveal>

          {/* Before / After */}
          <div className="mt-12 grid md:grid-cols-2 gap-4">

            {/* Without */}
            <Reveal delay={80}>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-7 h-full">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-5">Without AIWaiter</p>
                <div className="space-y-4">
                  {[
                    "A German couple sits down. They look at the menu — they recognise \"steak\" and \"salad\".",
                    "They're too embarrassed to ask. Your waiter doesn't speak German anyway.",
                    "They point at something. It's fine. They eat, they pay, they leave.",
                    "They had a mediocre experience. They won't be back. And you'll never know what they would have ordered.",
                  ].map((line, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-gray-600 mt-0.5 shrink-0">—</span>
                      <p className="text-sm text-gray-400 leading-relaxed">{line}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* With */}
            <Reveal delay={160}>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-7 h-full">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-5">With AIWaiter</p>
                <div className="space-y-4">
                  {[
                    "The same German couple sits down. They scan a QR code.",
                    "They chat in German. AIWaiter describes every dish, answers their allergen question, explains what makes the lamb special.",
                    "They order the lamb, a wine pairing, and a dessert they hadn't planned on.",
                    "They leave impressed. They tell their friends. They book again for next week.",
                  ].map((line, i) => (
                    <div key={i} className="flex gap-3">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-300 leading-relaxed">{line}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 py-8 px-8 bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-gray-100">
          {[
            { value: "100+", label: "Languages" },
            { value: "+18–25%", label: "Average order" },
            { value: "< 3 min", label: "Setup time" },
            { value: "24 / 7", label: "Always on" },
          ].map(({ value, label }, i) => (
            <Reveal key={label} delay={i * 60}>
              <div className="flex flex-col items-center text-center px-4">
                <span className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">{value}</span>
                <span className="text-xs text-gray-400 mt-1">{label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── What you get ────────────────────────────────────────────────────── */}
      <div className="bg-white">
        <StackedFeatures />
      </div>

      {/* ── Retention insight ────────────────────────────────────────────────── */}
      <RetentionStats />

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="px-8 py-16 lg:py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3 text-center">How it works</p>
            <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 text-center leading-tight">
              Ready in 3 minutes.<br />No tech team needed.
            </h2>
          </Reveal>

          <div className="mt-12 grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[calc(16.7%+1rem)] right-[calc(16.7%+1rem)] h-px bg-gray-200" />
            {[
              { step: "01", icon: Zap, title: "Upload your menu", body: "Drop your PDF or add dishes manually. AIWaiter reads and understands everything in seconds — ingredients, allergens, history." },
              { step: "02", icon: UtensilsCrossed, title: "Get your QR code", body: "A QR code is generated for your restaurant. Print it, place it on tables, and you're done. Guests scan and chat instantly." },
              { step: "03", icon: Users, title: "Tourists chat. You earn more.", body: "Every guest gets a perfect experience in their language. They order more. They come back. You don't hire anyone extra." },
            ].map(({ step, icon: Icon, title, body }, i) => (
              <Reveal key={step} delay={i * 100}>
                <div className="relative text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mx-auto mb-5">
                    <span className="text-2xl font-bold text-emerald-600">{step}</span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4 -mt-2">
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">{title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="bg-gray-950 px-8 py-16 lg:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <Reveal>
            <h2 className="text-3xl lg:text-4xl font-semibold text-white leading-tight mb-4">
              Let&apos;s talk.
            </h2>
            <p className="text-gray-400 leading-relaxed mb-10 text-lg">
              Send us a message and we&apos;ll set up AIWaiter on your real menu
              — live, in 20 minutes — so you see exactly what your tourists
              will experience before you commit to anything.
            </p>
            <Link
              href={CONTACT_HREF}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-gray-900 hover:bg-gray-100 transition-colors shadow-sm"
            >
              Contact us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 border-t border-white/5 px-8 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center">
              <UtensilsCrossed className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">AIWaiter</span>
          </div>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} AIWaiter. All rights reserved.
          </p>
          <a
            href="mailto:contact@aiwaiter.com"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            contact@aiwaiter.com
          </a>
        </div>
      </footer>

    </div>
  );
}

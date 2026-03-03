import Link from "next/link";
import {
  UtensilsCrossed,
  Globe,
  TrendingUp,
  ArrowRight,
  Check,
  Clock,
  Users,
} from "lucide-react";
import { Reveal } from "./_home/Reveal";
import { WaitlistForm } from "./_home/WaitlistForm";
import { StackedFeatures } from "./_home/StackedFeatures";

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROBLEMS = [
  {
    icon: Clock,
    title: '"Is this gluten-free?"',
    body: "Your staff answers the same 10 questions 40 times a day. Every interruption is a table left waiting.",
  },
  {
    icon: Globe,
    title: "Lost tourists, lost revenue",
    body: "International guests stare at the menu, guess, or leave. You'll never know what they would have ordered.",
  },
  {
    icon: TrendingUp,
    title: "Upsells that never happen",
    body: "Nobody recommends the wine pairing at rush hour. The dessert menu gets forgotten. Revenue stays on the table.",
  },
  {
    icon: Users,
    title: "Inconsistent answers",
    body: "Three staff members, three different answers about the same dish. One mistake with an allergen is one too many.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Upload your menu",
    body: "Drop a PDF or add dishes manually. Our AI reads and understands your entire menu in seconds.",
  },
  {
    step: "02",
    title: "Get your QR code",
    body: "A unique QR code is generated for your restaurant. Print it, place it on tables, and you're done.",
  },
  {
    step: "03",
    title: "Customers chat. You earn more.",
    body: "Guests scan, ask questions in their language, get perfect answers — and the right suggestions at the right moment.",
  },
];

// ─── Chat mockup ──────────────────────────────────────────────────────────────

function ChatMockup() {
  return (
    <div className="relative w-[300px] shrink-0">
      {/* Glow behind phone */}
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
          <div className="flex gap-2 items-end">
            <div className="w-5 h-5 rounded-full bg-emerald-600 shrink-0 flex items-center justify-center">
              <UtensilsCrossed className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-gray-700 shadow-sm max-w-[190px] leading-relaxed">
              Bonjour ! I&apos;m your AI waiter. What can I help you with today? 😊
            </div>
          </div>

          <div className="flex justify-end">
            <div className="bg-emerald-600 rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white max-w-[170px] leading-relaxed">
              What&apos;s in the bouillabaisse? I&apos;m allergic to shellfish.
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <div className="w-5 h-5 rounded-full bg-emerald-600 shrink-0 flex items-center justify-center">
              <UtensilsCrossed className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-gray-700 shadow-sm max-w-[190px] leading-relaxed">
              ⚠️ Important — our bouillabaisse contains mussels and prawns. <span className="font-semibold">Not safe for you.</span>
              <br /><br />
              I&apos;d suggest the sea bass instead — no shellfish, equally wonderful. Shall I tell you more?
            </div>
          </div>

          <div className="flex justify-end">
            <div className="bg-emerald-600 rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white max-w-[150px] leading-relaxed">
              Yes! And what wine goes with it?
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

        {/* Input bar */}
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
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900 tracking-tight">AIWaiter</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            Sign in
          </Link>
          <a
            href="mailto:contact@aiwaiter.com?subject=Demo request"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Book a demo
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
          {/* Testing only — remove before public launch */}
          <Link href="/signup" className="text-xs text-gray-300 hover:text-gray-500 transition-colors">
            ↗
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col lg:flex-row items-center justify-center gap-12 px-8 py-16 lg:py-24 max-w-7xl mx-auto w-full">
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 40% 0%, rgba(16,185,129,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Left: copy */}
        <div className="relative flex-1 text-center lg:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Private beta — accepting restaurants by invitation
          </div>

          <h1 className="text-5xl lg:text-6xl font-semibold tracking-tight text-gray-900 leading-[1.08]">
            Every guest<br />
            orders more.<br />
            <span className="text-emerald-600">In any language.</span>
          </h1>

          <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-md mx-auto lg:mx-0">
            An AI waiter trained on your menu answers every question, recommends the right pairing, and serves 100+ languages — adding 18–25% to the average bill, automatically.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <a
              href="mailto:contact@aiwaiter.com?subject=Demo request"
              className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors shadow-sm"
            >
              Book a demo
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/le-comptoir"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-6 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              See it live →
            </Link>
          </div>

          {/* Trust signals */}
          <div className="mt-8 flex items-center justify-center lg:justify-start gap-5 flex-wrap">
            {["+18–25% avg basket", "100+ languages", "Live in 3 min"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-gray-400">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right: chat mockup */}
        <div className="relative shrink-0">
          <ChatMockup />
        </div>
      </section>

      {/* ── Problem ─────────────────────────────────────────────────────────── */}
      <section className="bg-gray-950 px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-3">The problem</p>
            <h2 className="text-3xl lg:text-4xl font-semibold text-white leading-tight max-w-2xl">
              Every day, your staff answers the same questions. And it&apos;s costing you.
            </h2>
            <p className="mt-3 text-gray-400 max-w-xl leading-relaxed">
              For tourist restaurants, language barriers and staff overload are silent revenue killers. Most owners never see the full cost.
            </p>
          </Reveal>

          <div className="mt-10 grid md:grid-cols-2 gap-4">
            {PROBLEMS.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 80}>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/8 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-white mb-2">{title}</p>
                  <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features (stacked scroll cards) ─────────────────────────────────── */}
      <div className="bg-white">
        <StackedFeatures />
      </div>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="px-8 py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3 text-center">How it works</p>
            <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 text-center leading-tight">
              Set up in 3 minutes.<br />Works forever.
            </h2>
          </Reveal>

          <div className="mt-12 grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.7%+1rem)] right-[calc(16.7%+1rem)] h-px bg-gray-200" />

            {HOW_IT_WORKS.map(({ step, title, body }, i) => (
              <Reveal key={step} delay={i * 100}>
                <div className="relative text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mx-auto mb-5">
                    <span className="text-2xl font-bold text-emerald-600">{step}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">{title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="bg-gray-950 px-8 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-medium text-emerald-400 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Currently onboarding restaurants by invitation
            </div>
            <h2 className="text-3xl lg:text-4xl font-semibold text-white leading-tight mb-4">
              Ready to earn more from every table?
            </h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Book a 20-minute demo — we&apos;ll show you AIWaiter live on a real menu and answer every question.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <a
                href="mailto:contact@aiwaiter.com?subject=Demo request"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors shadow-sm"
              >
                Book a demo
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <p className="text-xs text-gray-500 mb-4">Or drop your email to join the waitlist:</p>
            <WaitlistForm />
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

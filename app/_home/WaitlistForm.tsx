"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // TODO: wire to real waitlist (Supabase table or email service)
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 py-4">
        <div className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center shrink-0">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
        <p className="text-white text-sm font-medium">
          You&apos;re on the list — we&apos;ll be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@restaurant.com"
        className="flex-1 rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors shrink-0"
      >
        Join waitlist
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { UtensilsCrossed, ArrowRight, Check } from "lucide-react";
import { submitContact, type ContactState } from "../actions/contact";

export default function ContactPage() {
  const [state, action, pending] = useActionState<ContactState, FormData>(
    submitContact,
    null
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900 tracking-tight">AIWaiter</span>
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 py-16 lg:py-24">
        <div className="w-full max-w-md">

          {state && "success" in state ? (

            /* ── Success ── */
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6">
                <Check className="w-7 h-7 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-3">
                Message received.
              </h1>
              <p className="text-gray-500 leading-relaxed mb-8">
                We&apos;ll get back to you very soon. Looking forward to the conversation.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                ← Back to home
              </Link>
            </div>

          ) : (

            /* ── Form ── */
            <>
              <div className="mb-10">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">
                  Contact
                </p>
                <h1 className="text-3xl font-semibold text-gray-900 leading-tight mb-3">
                  How can we help you?
                </h1>
                <p className="text-gray-500 leading-relaxed">
                  We&apos;ll be happy to chat. Drop us a message and we&apos;ll
                  get back to you quickly.
                </p>
              </div>

              <form action={action} className="space-y-4">

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="Jean Martin"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">
                    Email address <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="jean@lecomptoir.fr"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">
                    Message{" "}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    name="message"
                    rows={4}
                    placeholder="Tell us about your restaurant — we'll be happy to help."
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
                  />
                </div>

                {state && "error" in state && (
                  <p className="text-sm text-red-500 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                    {state.error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm mt-2"
                >
                  {pending ? "Sending…" : "Send message"}
                  {!pending && <ArrowRight className="w-4 h-4" />}
                </button>

                <p className="text-center text-xs text-gray-400 pt-1">
                  We usually reply within a few hours.
                </p>

              </form>
            </>

          )}
        </div>
      </div>
    </div>
  );
}

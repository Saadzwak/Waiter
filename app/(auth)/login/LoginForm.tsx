"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { login, type AuthState } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      Sign in
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(login, {});
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) formRef.current?.querySelector("input")?.focus();
  }, [state.error]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-colors"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-colors"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-500 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

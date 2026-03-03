"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { signup, type AuthState } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      Create account
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(signup, {});
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [password, setPassword] = useState("");
  const [clientError, setClientError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (password !== confirmPassword) {
      e.preventDefault();
      setClientError("Passwords do not match.");
    } else {
      setClientError("");
    }
  }

  const error = clientError || state.error;

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-colors"
            placeholder="Min. 8 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
          Confirm password
        </label>
        <input
          id="confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-colors"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

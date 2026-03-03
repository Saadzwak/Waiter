import { UtensilsCrossed } from "lucide-react";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in — AIWaiter" };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-600 mb-4">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">AIWaiter</h1>
          <p className="mt-1.5 text-sm text-gray-500">Sign in to your account</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-sm text-gray-500">
          No account?{" "}
          <a href="/signup" className="font-medium text-emerald-600 hover:text-emerald-700">
            Get started
          </a>
        </p>
      </div>
    </div>
  );
}

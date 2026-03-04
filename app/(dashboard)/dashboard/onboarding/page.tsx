import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata = { title: "Set up your restaurant — AIWaiter" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Always force step 1 — each onboarding session creates a new restaurant
  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 pt-16 pb-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">
            Setup
          </span>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 tracking-tight">
            Let&apos;s set up your restaurant
          </h1>
        </div>
        <OnboardingWizard initialRestaurant={null} />
      </div>
    </div>
  );
}

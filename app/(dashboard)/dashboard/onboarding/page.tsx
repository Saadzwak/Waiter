import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRestaurantByOwner } from "@/modules/dashboard/queries";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata = { title: "Set up your restaurant — AIWaiter" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // If they already have a restaurant, skip to step 2
  const restaurant = await getRestaurantByOwner(user.id);

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
        <OnboardingWizard initialRestaurant={restaurant} />
      </div>
    </div>
  );
}

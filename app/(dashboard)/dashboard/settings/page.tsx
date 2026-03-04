import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSelectedRestaurant } from "@/modules/dashboard/queries";
import { SettingsForms } from "./SettingsForms";

export const metadata = { title: "Settings — AIWaiter" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const restaurant = await getSelectedRestaurant(user.id);
  if (!restaurant) redirect("/dashboard/onboarding");

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-8">Settings</h1>
      <SettingsForms restaurant={restaurant} />
    </div>
  );
}

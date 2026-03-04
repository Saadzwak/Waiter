import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getRestaurantsByOwner,
  getSelectedRestaurant,
} from "@/modules/dashboard/queries";
import { Sidebar } from "./Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [restaurants, restaurant] = await Promise.all([
    getRestaurantsByOwner(user.id),
    getSelectedRestaurant(user.id),
  ]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar restaurants={restaurants} restaurant={restaurant} />
      {/* Offset for mobile bottom nav */}
      <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRestaurantByOwner } from "@/modules/dashboard/queries";
import { Sidebar } from "./Sidebar";
import type { Restaurant } from "@/types";

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

  const restaurant = await getRestaurantByOwner(user.id);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar restaurant={restaurant} />
      {/* Offset for mobile bottom nav */}
      <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
    </div>
  );
}

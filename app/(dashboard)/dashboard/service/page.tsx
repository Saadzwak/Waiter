import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRestaurantByOwner, getMenuWithCategories } from "@/modules/dashboard/queries";
import { ServiceMode } from "./ServiceMode";

export const metadata = { title: "Service — AIWaiter" };

export default async function ServicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const restaurant = await getRestaurantByOwner(user.id);
  if (!restaurant) redirect("/dashboard/onboarding");

  const { categories, items } = await getMenuWithCategories(restaurant.id);

  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen">
      <ServiceMode
        restaurantName={restaurant.name}
        initialItems={items}
        categories={categories}
      />
    </div>
  );
}

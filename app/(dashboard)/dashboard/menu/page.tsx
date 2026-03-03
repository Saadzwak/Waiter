import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRestaurantByOwner, getMenuWithCategories } from "@/modules/dashboard/queries";
import { MenuUploader } from "./MenuUploader";
import { MenuEditor } from "./MenuEditor";

export const metadata = { title: "Menu — AIWaiter" };

export default async function MenuPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const restaurant = await getRestaurantByOwner(user.id);
  if (!restaurant) redirect("/dashboard/onboarding");

  const { categories, items } = await getMenuWithCategories(restaurant.id);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Menu</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {items.length > 0
            ? `${items.length} item${items.length !== 1 ? "s" : ""} across ${categories.length} categor${categories.length !== 1 ? "ies" : "y"}`
            : "No items yet — import a menu or add manually"}
        </p>
      </div>

      {/* AI import — always visible */}
      <MenuUploader restaurantId={restaurant.id} />

      {/* Manual editor */}
      <MenuEditor
        restaurantId={restaurant.id}
        initialCategories={categories}
        initialItems={items}
      />
    </div>
  );
}

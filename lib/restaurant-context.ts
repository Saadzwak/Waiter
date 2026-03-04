import { cookies } from "next/headers";

export async function getSelectedRestaurantId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("selected_restaurant")?.value ?? null;
}

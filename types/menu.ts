export type MenuTag =
  | "vegan"
  | "vegetarian"
  | "gluten-free"
  | "spicy"
  | "nuts"
  | "dairy-free"
  | "halal"
  | "kosher"
  | "seafood"
  | "popular";

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  position: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  tags: MenuTag[];
  allergens: string[];
  pairing_suggestions: string[];
  image_url: string | null;
  available: boolean;
  chef_notes: string | null;
  embedding?: number[];
  created_at: string;
}

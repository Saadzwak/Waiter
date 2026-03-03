export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  language_default: string;
  created_at: string;
  owner_id: string;
}

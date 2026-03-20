export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface Professional {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  google_rating: number | null;
  google_review_count: number;
  platform_rating: number | null;
  platform_review_count: number;
  source: "google_maps" | "manual" | "claimed";
  is_claimed: boolean;
  is_verified: boolean;
  tier: "imported" | "claimed" | "verified" | "expert" | "master";
  description: string | null;
  hours: string | null;
  profile_photo_url: string | null;
  photo_url: string | null;
  created_at: string;
  categories?: Category;
  reviews_imported?: ReviewImported[];
}

export interface ReviewImported {
  id: string;
  professional_id: string;
  source: string;
  author_name: string | null;
  rating: number | null;
  text: string | null;
  review_date: string | null;
}

export const CATEGORIES = [
  "Vehicles",
  "Electronics",
  "Home & Garden",
  "Clothing",
  "Sports",
  "Toys & Games",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  email: string;
  category: string;
  image_url: string | null;
  sold: boolean;
  created_at: string;
};

export function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

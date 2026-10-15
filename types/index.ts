/* ── User ─────────────────────────────────────────────────────── */

export type UserRole = "USER" | "ADMIN";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active?: boolean;
  is_staff?: boolean;
  created_at?: string;
  updated_at?: string;
}

/* ── Category ─────────────────────────────────────────────────── */

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  products_count?: number;
  created_at?: string;
}

/* ── Product ──────────────────────────────────────────────────── */

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string | number;
  stock: number;
  images: string[] | string | null;
  category: number;
  category_name?: string;
  reviews_count?: number;
  in_stock?: boolean;
  created_at?: string;
  updated_at?: string;
  is_featured?: boolean;
}

/* ── Product with Category ────────────────────────────────────── */

export type ProductWithCategory = Product & {
  category_detail?: Category;
  category_object?: Category;
  _count?: {
    reviews: number;
  };
};

/* ── Product Variant ──────────────────────────────────────────── */

export interface ProductVariant {
  id: number;
  product: number;
  product_name?: string;
  size: string | null;
  color: string | null;
  color_hex?: string | null;
  stock: number;
  price: string | number | null;
  created_at?: string;
  updated_at?: string;
}

/* ── Filters ──────────────────────────────────────────────────── */

export type FilterParams = {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price-asc" | "price-desc" | "newest" | "popular";
  page?: number;
  limit?: number;
  search?: string;
  featured?: boolean;
};

/* ── Order ────────────────────────────────────────────────────── */

export interface OrderItem {
  id?: number;
  product: number;
  variant?: number | null;
  quantity: number;
  price?: string | number;
  product_name?: string;
}

export interface Order {
  id: number;
  user?: number;
  status: string;
  total: string | number;
  coupon?: number | null;
  payment_id?: string | null;
  order_items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
}

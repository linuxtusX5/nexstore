import type { Category, FilterParams, ProductWithCategory } from "@/types";
import { stringify } from "querystring";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ApiList<T> =
  | T[]
  | {
      count?: number;
      results: T[];
      next?: string | null;
      previous?: string | null;
    };

async function fetchApi<T>(endpoint: string): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${endpoint} (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function getCategories(): Promise<Category[]> {
  const data = await fetchApi<ApiList<Category>>("/categories/");

  return Array.isArray(data) ? data : data.results;
}

export async function getProducts(filters: FilterParams = {}) {
  const {
    category,
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    limit = 12,
    search,
    featured,
  } = filters;

  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("page_size", String(limit));

  const ordering: Record<string, string> = {
    "price-asc": "price",
    "price-desc": "-price",
    newest: "-created_at",
    popular: "-created_at",
  };

  params.set("ordering", ordering[sort] ?? "-created_at");

  if (search) params.set("search", search);
  if (minPrice !== undefined) params.set("min_price", String(minPrice));
  if (maxPrice !== undefined) params.set("max_price", String(maxPrice));
  if (featured) params.set("is_featured", "true");

  if (category) {
    // The UI supplies a category slug. Resolve it to the Django category ID.
    const categories = await getCategories();
    const selectedCategory = categories.find((item) => item.slug === category);

    if (!selectedCategory) {
      return { products: [], total: 0, pages: 0, page };
    }

    params.set("category", String(selectedCategory.id));
  }

  const data = await fetchApi<ApiList<ProductWithCategory>>(
    `/products/?${params.toString()}`,
  );

  if (Array.isArray(data)) {
    return {
      products: data,
      total: data.length,
      pages: data.length ? 1 : 0,
      page,
    };
  }

  return {
    products: data.results,
    total: data.count ?? data.results.length,
    pages: Math.ceil((data.count ?? data.results.length) / limit),
    page,
  };
}

export async function getRelatedProducts(
  categoryId: number | string,
  excludeId: number | string,
  limit = 4,
): Promise<ProductWithCategory[]> {
  const params = new URLSearchParams({
    category: String(categoryId),
    page_size: String(limit + 1),
  });

  const data = await fetchApi<ApiList<ProductWithCategory>>(
    `/products/?${params.toString()}`,
  );

  const products = Array.isArray(data) ? data : data.results;

  return products
    .filter((product) => String(product.id) !== excludeId)
    .slice(0, limit);
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithCategory | null> {
  const data = await fetchApi<ApiList<ProductWithCategory>>(
    `/products/?slug=${encodeURIComponent(slug)}`,
  );

  const products = Array.isArray(data) ? data : data.results;

  return products.find((product) => product.slug === slug) ?? null;
}

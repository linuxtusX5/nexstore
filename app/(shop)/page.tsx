import { Suspense } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import {
  TrustBar,
  CategoryStrip,
  Promobanner,
  NewsletterSection,
} from "@/components/home/sections";
import {
  FeaturedProducts,
  NewArrivals,
  ProductGridSkeleton,
} from "@/components/home/products";
import type { Category, ProductWithCategory } from "@/types";

export const revalidate = 60;

export const metadata = {
  title: "Shopora — Shop the Latest",
  description: "Discover curated collections of fashion, accessories and more.",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ApiList<T> = T[] | { results: T[] };

async function fetchApiList<T>(endpoint: string): Promise<T[]> {
  if (!API_URL) {
    console.error("NEXT_PUBLIC_API_URL is not configured.");
    return [];
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`API request failed: ${endpoint}`, response.status);
      return [];
    }

    const data: ApiList<T> = await response.json();

    // Supports both normal DRF lists and paginated responses.
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return [];
  }
}

async function getHomeData() {
  const [categories, featuredProducts, newArrivals] = await Promise.all([
    fetchApiList<Category>("/categories/"),
    fetchApiList<ProductWithCategory>("/products/featured/"),
    fetchApiList<ProductWithCategory>(
      "/products/?ordering=-created_at&page_size=8",
    ),
  ]);

  return {
    categories,
    featuredProducts: featuredProducts.slice(0, 4),
    newArrivals: newArrivals.slice(0, 8),
  };
}

export default async function HomePage() {
  const { categories, featuredProducts, newArrivals } = await getHomeData();

  return (
    <div style={{ overflowX: "hidden" }}>
      <HeroSection />

      <TrustBar />

      <CategoryStrip categories={categories} />

      <Suspense fallback={<ProductGridSkeleton count={4} />}>
        <FeaturedProducts products={featuredProducts} />
      </Suspense>

      <Promobanner />

      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <NewArrivals products={newArrivals} />
      </Suspense>

      <NewsletterSection />
    </div>
  );
}

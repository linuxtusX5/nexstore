import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  try {
    if (!API_URL) {
      throw new Error("NEXT_PUBLIC_API_URL is not configured.");
    }

    const response = await fetch(`${API_URL}/categories/`, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Django API error: ${response.status}`);
    }

    const data = await response.json();

    const categories = Array.isArray(data) ? data : data.results;

    const sortedCategories = categories
      .map((category: { id: number; name: string; slug: string }) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
      }))
      .sort((a: { name: string }, b: { name: string }) =>
        a.name.localeCompare(b.name),
      );

    return NextResponse.json({ categories: sortedCategories });
  } catch (error) {
    console.error("Failed to fetch categories:", error);

    return NextResponse.json(
      { error: "Failed to fetch categories." },
      { status: 500 },
    );
  }
}

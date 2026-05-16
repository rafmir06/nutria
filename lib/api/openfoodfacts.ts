import type { FoodProduct, OpenFoodFactsProduct } from "@/types";

const OFF_BASE = "https://world.openfoodfacts.org/api/v2";

export async function fetchProductByBarcode(barcode: string): Promise<FoodProduct | null> {
  try {
    const res = await fetch(`${OFF_BASE}/product/${barcode}?fields=product_name,brands,image_url,image_front_url,nutriments,serving_size`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;

    const data: OpenFoodFactsProduct = await res.json();

    if (data.status !== 1 || !data.product) return null;

    const { product } = data;
    const n = product.nutriments;

    return {
      id: "",
      barcode,
      name: product.product_name || "Produit inconnu",
      brand: product.brands || null,
      image_url: product.image_front_url || product.image_url || null,
      calories_per_100g: n["energy-kcal_100g"] ?? 0,
      protein_per_100g: n.proteins_100g ?? 0,
      carbs_per_100g: n.carbohydrates_100g ?? 0,
      fat_per_100g: n.fat_100g ?? 0,
      fiber_per_100g: n.fiber_100g ?? null,
      sugar_per_100g: n.sugars_100g ?? null,
      sodium_per_100mg: n.sodium_100g ?? null,
      serving_size_g: parseFloat(product.serving_size) || null,
      created_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function searchProducts(query: string): Promise<FoodProduct[]> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&action=process&json=1&page_size=20&fields=code,product_name,brands,image_front_url,nutriments,serving_size&sort_by=unique_scans_n`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const products = data.products ?? [];

    return products
      .filter((p: Record<string, unknown>) => p.product_name && p.nutriments)
      .map((p: Record<string, unknown>) => {
        const n = (p.nutriments as Record<string, number>) ?? {};
        return {
          id: "",
          barcode: (p.code as string) || null,
          name: (p.product_name as string) || "Produit inconnu",
          brand: (p.brands as string) || null,
          image_url: (p.image_front_url as string) || null,
          calories_per_100g: n["energy-kcal_100g"] ?? 0,
          protein_per_100g: n.proteins_100g ?? 0,
          carbs_per_100g: n.carbohydrates_100g ?? 0,
          fat_per_100g: n.fat_100g ?? 0,
          fiber_per_100g: n.fiber_100g ?? null,
          sugar_per_100g: n.sugars_100g ?? null,
          sodium_per_100mg: n.sodium_100g ?? null,
          serving_size_g: parseFloat(p.serving_size as string) || null,
          created_at: new Date().toISOString(),
        } as FoodProduct;
      });
  } catch {
    return [];
  }
}

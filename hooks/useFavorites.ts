"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FavoriteFood } from "@/types";

export function useFavorites(userId: string | undefined) {
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchFavorites = useCallback(async () => {
    if (!userId) { setLoading(false); return; }

    const { data } = await supabase
      .from("favorite_foods")
      .select("*, food_product:food_products(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setFavorites(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const addFavorite = async (foodProductId: string, defaultQuantityG = 100) => {
    const { data } = await supabase
      .from("favorite_foods")
      .insert({ user_id: userId!, food_product_id: foodProductId, default_quantity_g: defaultQuantityG })
      .select("*, food_product:food_products(*)")
      .single();

    if (data) setFavorites(prev => [data, ...prev]);
    return data;
  };

  const removeFavorite = async (id: string) => {
    await supabase.from("favorite_foods").delete().eq("id", id);
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const isFavorite = (foodProductId: string) =>
    favorites.some(f => f.food_product_id === foodProductId);

  return { favorites, loading, addFavorite, removeFavorite, isFavorite, refetch: fetchFavorites };
}

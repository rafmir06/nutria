"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DailyLog, MealEntry, NutritionSummary } from "@/types";
import { todayISO } from "@/lib/utils";

export function useDailyLog(userId: string | undefined, date: string = todayISO()) {
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchLog = useCallback(async () => {
    if (!userId) return; // Stay loading until userId is known
    setLoading(true);

    const { data: log } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    setDailyLog(log);

    const { data: mealEntries } = await supabase
      .from("meal_entries")
      .select("*, food_product:food_products(*)")
      .eq("user_id", userId)
      .eq("date", date)
      .order("logged_at", { ascending: true });

    setEntries(mealEntries ?? []);
    setLoading(false);
  }, [userId, date]);

  useEffect(() => { fetchLog(); }, [fetchLog]);

  const addEntry = async (entry: Omit<MealEntry, "id" | "created_at" | "daily_log_id" | "food_product">) => {
    const { data } = await supabase
      .from("meal_entries")
      .insert(entry)
      .select("*, food_product:food_products(*)")
      .single();

    if (data) {
      setEntries(prev => [...prev, data]);
      await updateDailyTotals(userId!, date);
    }
    return data;
  };

  const removeEntry = async (entryId: string) => {
    await supabase.from("meal_entries").delete().eq("id", entryId);
    setEntries(prev => prev.filter(e => e.id !== entryId));
    await updateDailyTotals(userId!, date);
  };

  const updateEntry = async (entryId: string, updates: Partial<MealEntry>) => {
    const { data } = await supabase
      .from("meal_entries")
      .update(updates)
      .eq("id", entryId)
      .select("*, food_product:food_products(*)")
      .single();

    if (data) {
      setEntries(prev => prev.map(e => e.id === entryId ? data : e));
      await updateDailyTotals(userId!, date);
    }
  };

  const updateDailyTotals = async (uid: string, d: string) => {
    const { data: allEntries } = await supabase
      .from("meal_entries")
      .select("calories, protein_g, carbs_g, fat_g")
      .eq("user_id", uid)
      .eq("date", d);

    if (!allEntries) return;

    const totals = allEntries.reduce(
      (acc, e) => ({
        total_calories: acc.total_calories + (e.calories ?? 0),
        total_protein_g: acc.total_protein_g + (e.protein_g ?? 0),
        total_carbs_g: acc.total_carbs_g + (e.carbs_g ?? 0),
        total_fat_g: acc.total_fat_g + (e.fat_g ?? 0),
      }),
      { total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0 }
    );

    const { data: updated } = await supabase
      .from("daily_logs")
      .upsert({ user_id: uid, date: d, ...totals, updated_at: new Date().toISOString() }, { onConflict: "user_id,date" })
      .select()
      .single();

    if (updated) setDailyLog(updated);
  };

  const consumed: NutritionSummary = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories ?? 0),
      protein_g: acc.protein_g + (e.protein_g ?? 0),
      carbs_g: acc.carbs_g + (e.carbs_g ?? 0),
      fat_g: acc.fat_g + (e.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  return { dailyLog, entries, loading, consumed, addEntry, removeEntry, updateEntry, refetch: fetchLog };
}

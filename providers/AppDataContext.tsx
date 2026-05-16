"use client";

import { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils";
import type { Profile, MealEntry, WeightLog, NutritionSummary, MealType } from "@/types";

interface AppDataContextValue {
  // Profile
  profile: Profile | null;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile | null>;

  // Today's entries
  entries: MealEntry[];
  consumed: NutritionSummary;
  addEntry: (entry: Omit<MealEntry, "id" | "created_at" | "daily_log_id" | "food_product">) => Promise<MealEntry | null>;
  removeEntry: (entryId: string) => Promise<void>;

  // Weight logs
  weightLogs: WeightLog[];
  latestWeight: number | null;
  weightDiff: number | null;
  addLog: (weight_kg: number, note?: string) => Promise<WeightLog | null>;
  removeLog: (id: string) => Promise<void>;

  loading: boolean;
  refetchEntries: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

export function AppDataProvider({
  userId,
  children,
}: {
  userId: string | undefined;
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const today = todayISO();
      const [profileRes, entriesRes, weightRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("meal_entries").select("*, food_product:food_products(*)").eq("user_id", userId).eq("date", today).order("logged_at", { ascending: true }),
        supabase.from("weight_logs").select("*").eq("user_id", userId).order("logged_at", { ascending: false }).limit(90),
      ]);
      setProfile(profileRes.data ?? null);
      setEntries(entriesRes.data ?? []);
      setWeightLogs(weightRes.data ?? []);
      initialLoadDone.current = true;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refetchEntries = useCallback(async () => {
    if (!userId || !initialLoadDone.current) return;
    try {
      const today = todayISO();
      const { data } = await supabase.from("meal_entries").select("*, food_product:food_products(*)").eq("user_id", userId).eq("date", today).order("logged_at", { ascending: true });
      setEntries(data ?? []);
    } catch {
      // silently ignore refetch errors
    }
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateDailyTotals = async (uid: string, date: string) => {
    const { data: all } = await supabase.from("meal_entries").select("calories, protein_g, carbs_g, fat_g").eq("user_id", uid).eq("date", date);
    if (!all) return;
    const totals = all.reduce(
      (acc, e) => ({
        total_calories: acc.total_calories + (e.calories ?? 0),
        total_protein_g: acc.total_protein_g + (e.protein_g ?? 0),
        total_carbs_g: acc.total_carbs_g + (e.carbs_g ?? 0),
        total_fat_g: acc.total_fat_g + (e.fat_g ?? 0),
      }),
      { total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0 }
    );
    await supabase.from("daily_logs").upsert({ user_id: uid, date, ...totals, updated_at: new Date().toISOString() }, { onConflict: "user_id,date" });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId) return null;
    const { data } = await supabase.from("profiles").update({ ...updates, updated_at: new Date().toISOString() }).eq("user_id", userId).select().maybeSingle();
    if (data) setProfile(data);
    return data ?? null;
  };

  const addEntry = async (entry: Omit<MealEntry, "id" | "created_at" | "daily_log_id" | "food_product">) => {
    const { data } = await supabase.from("meal_entries").insert(entry).select("*, food_product:food_products(*)").single();
    if (data) {
      setEntries(prev => [...prev, data]);
      await updateDailyTotals(userId!, entry.date);
    }
    return data ?? null;
  };

  const removeEntry = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    await supabase.from("meal_entries").delete().eq("id", entryId);
    setEntries(prev => prev.filter(e => e.id !== entryId));
    if (entry) await updateDailyTotals(userId!, entry.date);
  };

  const addLog = async (weight_kg: number, note?: string) => {
    const entry = { user_id: userId!, weight_kg, note: note ?? null, logged_at: new Date().toISOString() };
    const { data } = await supabase.from("weight_logs").insert(entry).select().single();
    if (data) setWeightLogs(prev => [data, ...prev]);
    return data ?? null;
  };

  const removeLog = async (id: string) => {
    await supabase.from("weight_logs").delete().eq("id", id);
    setWeightLogs(prev => prev.filter(l => l.id !== id));
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

  const latestWeight = weightLogs[0]?.weight_kg ?? null;
  const previousWeight = weightLogs[1]?.weight_kg ?? null;
  const weightDiff = latestWeight && previousWeight ? latestWeight - previousWeight : null;

  return (
    <AppDataContext.Provider value={{
      profile, updateProfile,
      entries, consumed, addEntry, removeEntry,
      weightLogs, latestWeight, weightDiff, addLog, removeLog,
      loading, refetchEntries,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

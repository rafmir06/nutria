"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WeightLog } from "@/types";

export function useWeightLog(userId: string | undefined) {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchLogs = useCallback(async () => {
    if (!userId) return; // Stay loading until userId is known
    setLoading(true);

    const { data } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(90);

    setWeightLogs(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const addLog = async (weight_kg: number, note?: string) => {
    const entry = {
      user_id: userId!,
      weight_kg,
      note: note ?? null,
      logged_at: new Date().toISOString(),
    };

    const { data } = await supabase
      .from("weight_logs")
      .insert(entry)
      .select()
      .single();

    if (data) setWeightLogs(prev => [data, ...prev]);
    return data;
  };

  const removeLog = async (id: string) => {
    await supabase.from("weight_logs").delete().eq("id", id);
    setWeightLogs(prev => prev.filter(l => l.id !== id));
  };

  const latestWeight = weightLogs[0]?.weight_kg ?? null;
  const previousWeight = weightLogs[1]?.weight_kg ?? null;
  const weightDiff = latestWeight && previousWeight ? latestWeight - previousWeight : null;

  return { weightLogs, loading, latestWeight, previousWeight, weightDiff, addLog, removeLog, refetch: fetchLogs };
}

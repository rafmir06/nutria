"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

setProfile(data ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select()
      .maybeSingle();
    if (error) console.error("Profile update error:", error);
    if (data) setProfile(data);
    return data;
  };

  return { profile, loading, updateProfile, refetch: fetchProfile };
}

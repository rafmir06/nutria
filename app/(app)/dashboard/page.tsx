"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useWeightLog } from "@/hooks/useWeightLog";
import { DashboardSkeleton } from "@/components/ui/SkeletonCard";
import { MacroRing } from "@/components/ui/MacroRing";
import { MacroBar } from "@/components/ui/MacroBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { MealEntryCard } from "@/components/ui/FoodCard";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { clampPercent, formatWeight, getMealLabel, getMealEmoji } from "@/lib/utils";
import { Flame, TrendingUp, Plus, ChevronRight, Droplets } from "lucide-react";
import Link from "next/link";
import type { MealType } from "@/types";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { profile, loading: pLoading, refetch: refetchProfile } = useProfile(user?.id);
  const { entries, consumed, removeEntry, loading: logLoading, refetch: refetchLog } = useDailyLog(user?.id);
  const { latestWeight, weightDiff, refetch: refetchWeight } = useWeightLog(user?.id);

  useEffect(() => {
    const onFocus = () => {
      refetchProfile();
      refetchLog();
      refetchWeight();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") onFocus();
    });
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [refetchProfile, refetchLog, refetchWeight]);

  if (authLoading || pLoading || logLoading) return <DashboardSkeleton />;
  if (!profile) return null;

  const remaining = {
    calories: Math.max(0, profile.target_calories - consumed.calories),
    protein_g: Math.max(0, profile.target_protein_g - consumed.protein_g),
    carbs_g: Math.max(0, profile.target_carbs_g - consumed.carbs_g),
    fat_g: Math.max(0, profile.target_fat_g - consumed.fat_g),
  };

  const today = format(new Date(), "EEEE d MMMM", { locale: fr });
  const firstName = profile.full_name?.split(" ")[0] ?? "Toi";

  const mealsByType = MEAL_ORDER.map(mealType => ({
    mealType,
    items: entries.filter(e => e.meal_type === mealType),
  })).filter(m => m.items.length > 0);

  return (
    <div className="min-h-dvh px-4 pb-8 pt-14">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-nutrigreen/8 blur-3xl" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="text-sm text-white/40 capitalize">{today}</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">
          Bonjour, {firstName} 👋
        </h1>
      </motion.div>

      {/* Main calorie ring */}
      <GlassCard delay={0.1} className="mb-4">
        <div className="flex flex-col items-center py-2">
          <MacroRing
            calories={consumed.calories}
            target={profile.target_calories}
            size={180}
          />
          <div className="mt-4 grid grid-cols-3 gap-4 w-full">
            <div className="text-center">
              <p className="text-lg font-bold text-white">{Math.round(consumed.calories)}</p>
              <p className="text-xs text-white/40">Consommé</p>
            </div>
            <div className="text-center border-x border-white/10">
              <p className="text-lg font-bold text-nutrigreen">{Math.round(remaining.calories)}</p>
              <p className="text-xs text-white/40">Restant</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{profile.target_calories}</p>
              <p className="text-xs text-white/40">Objectif</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Macros */}
      <GlassCard delay={0.2} className="mb-4 space-y-4">
        <h3 className="font-semibold text-white/80 text-sm">Macronutriments</h3>
        <MacroBar
          label="Protéines"
          value={consumed.protein_g}
          target={profile.target_protein_g}
          color="#0A84FF"
          glowColor="rgba(10,132,255,0.4)"
        />
        <MacroBar
          label="Glucides"
          value={consumed.carbs_g}
          target={profile.target_carbs_g}
          color="#BF5AF2"
          glowColor="rgba(191,90,242,0.4)"
        />
        <MacroBar
          label="Lipides"
          value={consumed.fat_g}
          target={profile.target_fat_g}
          color="#FF9F0A"
          glowColor="rgba(255,159,10,0.4)"
        />
      </GlassCard>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Weight */}
        <GlassCard delay={0.3} className="!p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl bg-nutriblue/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-nutriblue" />
            </div>
            <span className="text-xs text-white/50">Poids</span>
          </div>
          <p className="text-xl font-bold text-white">
            {latestWeight ? formatWeight(latestWeight) : "—"}
          </p>
          {weightDiff !== null && (
            <p className={`text-xs mt-1 ${weightDiff <= 0 ? "text-nutrigreen" : "text-nutriorange"}`}>
              {weightDiff > 0 ? "+" : ""}{weightDiff.toFixed(1)} kg
            </p>
          )}
        </GlassCard>

        {/* Calories brûlées estimées */}
        <GlassCard delay={0.35} className="!p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl bg-nutriorange/20 flex items-center justify-center">
              <Flame className="h-4 w-4 text-nutriorange" />
            </div>
            <span className="text-xs text-white/50">Objectif</span>
          </div>
          <p className="text-xl font-bold text-white capitalize">{
            profile.goal === "bulk" ? "Masse" : profile.goal === "cut" ? "Sèche" : "Maintien"
          }</p>
          <p className="text-xs text-white/40 mt-1">{profile.target_calories} kcal / jour</p>
        </GlassCard>
      </div>

      {/* Journal today */}
      <GlassCard delay={0.4} className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Repas du jour</h3>
          <Link href="/journal" className="flex items-center gap-1 text-xs text-nutrigreen">
            Voir tout <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {mealsByType.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-white/40 text-sm">Aucun repas enregistré</p>
            <Link href="/scanner" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-nutrigreen/20 px-4 py-2.5 text-sm font-medium text-nutrigreen press-effect">
              <Plus className="h-4 w-4" />
              Ajouter un repas
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {mealsByType.slice(0, 2).map(({ mealType, items }) => (
              <div key={mealType}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{getMealEmoji(mealType)}</span>
                  <span className="text-sm font-medium text-white/70">{getMealLabel(mealType)}</span>
                  <span className="text-xs text-white/30 ml-auto">
                    {Math.round(items.reduce((s, e) => s + e.calories, 0))} kcal
                  </span>
                </div>
                <div className="divide-y divide-white/5">
                  {items.slice(0, 2).map((entry, i) => (
                    <MealEntryCard
                      key={entry.id}
                      entry={entry}
                      index={i}
                      onDelete={() => removeEntry(entry.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Quick action */}
      <Link href="/scanner">
        <motion.div
          whileTap={{ scale: 0.97 }}
          className="glass-card p-4 flex items-center gap-4"
        >
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-nutrigreen to-nutrigreen/60 flex items-center justify-center shadow-neon-green">
            <Plus className="h-6 w-6 text-black" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-semibold text-white">Ajouter un aliment</p>
            <p className="text-xs text-white/40">Scanner ou rechercher</p>
          </div>
          <ChevronRight className="h-5 w-5 text-white/30 ml-auto" />
        </motion.div>
      </Link>
    </div>
  );
}

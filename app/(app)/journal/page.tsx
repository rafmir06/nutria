"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Flame } from "lucide-react";
import { useAuthContext } from "@/providers/AuthProvider";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useAppData } from "@/providers/AppDataContext";
import { MealEntryCard } from "@/components/ui/FoodCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { getMealLabel, getMealEmoji } from "@/lib/utils";
import Link from "next/link";
import type { MealType } from "@/types";
import { cn } from "@/lib/utils";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function JournalPage() {
  const { user } = useAuthContext();
  const { profile } = useAppData();
  const [date, setDate] = useState(new Date());
  const dateStr = format(date, "yyyy-MM-dd");
  const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;

  const { entries, consumed, removeEntry, loading } = useDailyLog(user?.id, dateStr);

  const mealsByType = MEAL_ORDER.map(mealType => ({
    mealType,
    items: entries.filter(e => e.meal_type === mealType),
    calories: entries.filter(e => e.meal_type === mealType).reduce((s, e) => s + e.calories, 0),
  }));

  const totalCal = consumed.calories;
  const targetCal = profile?.target_calories ?? 2000;

  return (
    <div className="min-h-dvh px-4 pt-14 pb-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-nutripurple/8 blur-3xl" />
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Journal</h1>

        {/* Date selector */}
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={() => setDate(d => subDays(d, 1))}
            className="h-9 w-9 rounded-xl glass flex items-center justify-center press-effect"
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>

          <div className="flex-1 text-center">
            <p className="font-semibold text-white capitalize">
              {isToday ? "Aujourd'hui" : format(date, "EEEE d MMMM", { locale: fr })}
            </p>
          </div>

          <button
            onClick={() => setDate(d => addDays(d, 1))}
            disabled={isToday}
            className="h-9 w-9 rounded-xl glass flex items-center justify-center press-effect disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Daily total */}
      <GlassCard className="mb-4 !p-4" animate={false}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-nutriorange/20 flex items-center justify-center">
              <Flame className="h-5 w-5 text-nutriorange" />
            </div>
            <div>
              <p className="font-bold text-white">{Math.round(totalCal)} kcal</p>
              <p className="text-xs text-white/40">/ {targetCal} kcal objectif</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-white/60">
              P {Math.round(consumed.protein_g)}g
            </p>
            <p className="text-xs text-white/30">
              G {Math.round(consumed.carbs_g)}g · L {Math.round(consumed.fat_g)}g
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((totalCal / targetCal) * 100, 100)}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full bg-nutriorange"
            style={{ boxShadow: "0 0 8px rgba(255,159,10,0.4)" }}
          />
        </div>
      </GlassCard>

      {/* Meal sections */}
      {loading ? (
        <div className="space-y-3">
          <SkeletonCard height="h-32" />
          <SkeletonCard height="h-32" />
          <SkeletonCard height="h-32" />
        </div>
      ) : (
        <div className="space-y-3">
          {mealsByType.map(({ mealType, items, calories }) => (
            <motion.div
              key={mealType}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              {/* Meal header */}
              <div className="flex items-center justify-between p-4 pb-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getMealEmoji(mealType)}</span>
                  <span className="font-semibold text-white">{getMealLabel(mealType)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {calories > 0 && (
                    <span className="text-xs text-white/40">{Math.round(calories)} kcal</span>
                  )}
                  <Link href={`/scanner?meal=${mealType}`}>
                    <div className="h-7 w-7 rounded-xl bg-nutrigreen/20 flex items-center justify-center press-effect">
                      <Plus className="h-3.5 w-3.5 text-nutrigreen" />
                    </div>
                  </Link>
                </div>
              </div>

              {/* Entries */}
              <div className="px-4">
                {items.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-xs text-white/20">Aucun aliment</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="divide-y divide-white/5">
                      {items.map((entry, i) => (
                        <MealEntryCard
                          key={entry.id}
                          entry={entry}
                          index={i}
                          onDelete={() => removeEntry(entry.id)}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add FAB */}
      <Link href="/scanner">
        <motion.div
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-28 right-5 h-14 w-14 rounded-2xl bg-nutrigreen flex items-center justify-center shadow-neon-green"
        >
          <Plus className="h-7 w-7 text-black" strokeWidth={2.5} />
        </motion.div>
      </Link>
    </div>
  );
}

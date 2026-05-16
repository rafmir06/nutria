"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Target, Activity, Scale, Ruler, Calendar, User2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NutriInput } from "@/components/ui/NutriInput";
import { calculateTDEE, calculateMacroTargets, getGoalCalories } from "@/lib/utils";
import { toast } from "sonner";
import type { GoalType, Gender, ActivityLevel } from "@/types";
import { cn } from "@/lib/utils";

const STEPS = 5;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    gender: "" as Gender,
    age: "",
    height_cm: "",
    weight_kg: "",
    goal: "" as GoalType,
    activity_level: "moderate" as ActivityLevel,
  });

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleFinish = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const tdee = calculateTDEE(
      parseFloat(form.weight_kg),
      parseFloat(form.height_cm),
      parseInt(form.age),
      form.gender,
      form.activity_level
    );

    const targetCal = getGoalCalories(tdee, form.goal);
    const macros = calculateMacroTargets(targetCal, form.goal);

    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      full_name: user.user_metadata?.full_name ?? null,
      gender: form.gender,
      age: parseInt(form.age),
      height_cm: parseFloat(form.height_cm),
      weight_kg: parseFloat(form.weight_kg),
      goal: form.goal,
      activity_level: form.activity_level,
      target_calories: targetCal,
      target_protein_g: macros.protein_g,
      target_carbs_g: macros.carbs_g,
      target_fat_g: macros.fat_g,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    if (error) { toast.error("Erreur lors de la sauvegarde"); setLoading(false); return; }

    // Log starting weight
    if (form.weight_kg) {
      await supabase.from("weight_logs").insert({
        user_id: user.id,
        weight_kg: parseFloat(form.weight_kg),
        logged_at: new Date().toISOString(),
      });
    }

    router.push("/dashboard");
  };

  const steps = [
    // Step 0 - Welcome
    <motion.div key="welcome" className="text-center space-y-6">
      <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-nutrigreen to-nutriblue flex items-center justify-center shadow-neon-green">
        <Target className="h-12 w-12 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white">Configuration du profil</h2>
        <p className="mt-2 text-white/50 text-sm">3 min pour personnaliser ton expérience</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-8">
        {[
          { icon: "🎯", text: "Objectifs personnalisés" },
          { icon: "📊", text: "Macros calculées" },
          { icon: "⚡️", text: "Suivi en temps réel" },
          { icon: "🔥", text: "Calories adaptées" },
        ].map((item, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <div className="text-2xl mb-1">{item.icon}</div>
            <p className="text-xs text-white/60">{item.text}</p>
          </div>
        ))}
      </div>
    </motion.div>,

    // Step 1 - Gender + Age
    <motion.div key="bio" className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Dis-moi qui tu es</h2>
      <div>
        <p className="text-sm text-white/50 mb-3">Sexe</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "male", label: "Homme", icon: "👨" },
            { value: "female", label: "Femme", icon: "👩" },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => update("gender", opt.value)}
              className={cn(
                "glass-card p-5 text-center press-effect transition-all",
                form.gender === opt.value && "border-nutrigreen/50 bg-nutrigreen/10"
              )}
            >
              <div className="text-3xl mb-2">{opt.icon}</div>
              <p className="font-medium text-white">{opt.label}</p>
            </button>
          ))}
        </div>
      </div>
      <NutriInput
        label="Âge"
        type="number"
        placeholder="25"
        value={form.age}
        onChange={e => update("age", e.target.value)}
        icon={<Calendar className="h-4 w-4" />}
        suffix="ans"
        min="10"
        max="100"
      />
    </motion.div>,

    // Step 2 - Height + Weight
    <motion.div key="measurements" className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Tes mensurations</h2>
      <NutriInput
        label="Taille"
        type="number"
        placeholder="175"
        value={form.height_cm}
        onChange={e => update("height_cm", e.target.value)}
        icon={<Ruler className="h-4 w-4" />}
        suffix="cm"
        min="100"
        max="250"
      />
      <NutriInput
        label="Poids actuel"
        type="number"
        placeholder="70"
        value={form.weight_kg}
        onChange={e => update("weight_kg", e.target.value)}
        icon={<Scale className="h-4 w-4" />}
        suffix="kg"
        min="30"
        max="300"
        step="0.1"
      />
    </motion.div>,

    // Step 3 - Goal
    <motion.div key="goal" className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Ton objectif</h2>
      <div className="space-y-3">
        {[
          { value: "bulk", label: "Prise de masse", desc: "+300 kcal / protéines élevées", icon: "💪", color: "nutriblue" },
          { value: "maintain", label: "Maintien", desc: "Balance calorique neutre", icon: "⚖️", color: "nutrigreen" },
          { value: "cut", label: "Sèche / Perte de poids", desc: "-500 kcal / protéines très élevées", icon: "🔥", color: "nutriorange" },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => update("goal", opt.value)}
            className={cn(
              "glass-card w-full p-4 flex items-center gap-4 press-effect transition-all",
              form.goal === opt.value && "border-nutrigreen/50 bg-nutrigreen/10"
            )}
          >
            <span className="text-3xl">{opt.icon}</span>
            <div className="text-left">
              <p className="font-semibold text-white">{opt.label}</p>
              <p className="text-xs text-white/40 mt-0.5">{opt.desc}</p>
            </div>
            {form.goal === opt.value && (
              <div className="ml-auto h-5 w-5 rounded-full bg-nutrigreen flex items-center justify-center">
                <svg className="h-3 w-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 4 - Activity
    <motion.div key="activity" className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Niveau d&apos;activité</h2>
      <div className="space-y-3">
        {[
          { value: "sedentary", label: "Sédentaire", desc: "Peu ou pas de sport" },
          { value: "light", label: "Légèrement actif", desc: "1-3 séances / semaine" },
          { value: "moderate", label: "Modérément actif", desc: "3-5 séances / semaine" },
          { value: "active", label: "Très actif", desc: "6-7 séances / semaine" },
          { value: "very_active", label: "Extrêmement actif", desc: "Sport + travail physique" },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => update("activity_level", opt.value)}
            className={cn(
              "glass-card w-full p-4 flex items-center justify-between press-effect transition-all",
              form.activity_level === opt.value && "border-nutrigreen/50 bg-nutrigreen/10"
            )}
          >
            <div className="text-left">
              <p className="font-medium text-white">{opt.label}</p>
              <p className="text-xs text-white/40">{opt.desc}</p>
            </div>
            {form.activity_level === opt.value && (
              <Activity className="h-5 w-5 text-nutrigreen" />
            )}
          </button>
        ))}
      </div>
    </motion.div>,
  ];

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return !!form.gender && !!form.age;
    if (step === 2) return !!form.height_cm && !!form.weight_kg;
    if (step === 3) return !!form.goal;
    if (step === 4) return !!form.activity_level;
    return true;
  };

  return (
    <div className="flex min-h-dvh flex-col px-6 pt-16 pb-10">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-nutrigreen/8 blur-3xl" />
      </div>

      {/* Progress */}
      <div className="mb-8 flex gap-1.5">
        {Array.from({ length: STEPS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-500",
              i <= step ? "bg-nutrigreen" : "bg-white/10"
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="btn-glass flex items-center gap-2 text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour
          </button>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!canNext() || loading}
          onClick={() => {
            if (step < STEPS - 1) setStep(s => s + 1);
            else handleFinish();
          }}
          className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          ) : step === STEPS - 1 ? (
            "Commencer !"
          ) : (
            <>Continuer <ChevronRight className="h-4 w-4" /></>
          )}
        </motion.button>
      </div>
    </div>
  );
}

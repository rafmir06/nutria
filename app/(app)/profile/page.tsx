"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthContext } from "@/providers/AuthProvider";
import { useAppData } from "@/providers/AppDataContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { NutriInput } from "@/components/ui/NutriInput";
import { calculateTDEE, calculateMacroTargets, getGoalCalories } from "@/lib/utils";
import { toast } from "sonner";
import { LogOut, User, Target, Activity, ChevronRight, Save } from "lucide-react";
import Link from "next/link";
import type { GoalType, ActivityLevel, Gender } from "@/types";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, signOut } = useAuthContext();
  const { profile, updateProfile, loading: pLoading } = useAppData();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    age: "",
    height_cm: "",
    weight_kg: "",
    gender: "male" as Gender,
    goal: "maintain" as GoalType,
    activity_level: "moderate" as ActivityLevel,
    target_calories: "",
    target_protein_g: "",
    target_carbs_g: "",
    target_fat_g: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        age: String(profile.age ?? ""),
        height_cm: String(profile.height_cm ?? ""),
        weight_kg: String(profile.weight_kg ?? ""),
        gender: profile.gender ?? "male",
        goal: profile.goal ?? "maintain",
        activity_level: profile.activity_level ?? "moderate",
        target_calories: String(profile.target_calories),
        target_protein_g: String(profile.target_protein_g),
        target_carbs_g: String(profile.target_carbs_g),
        target_fat_g: String(profile.target_fat_g),
      });
    }
  }, [profile]);

  const recalculate = () => {
    const w = parseFloat(form.weight_kg);
    const h = parseFloat(form.height_cm);
    const a = parseInt(form.age);
    if (!w || !h || !a) return;
    const tdee = calculateTDEE(w, h, a, form.gender, form.activity_level);
    const targetCal = getGoalCalories(tdee, form.goal);
    const macros = calculateMacroTargets(targetCal, form.goal);
    setForm(f => ({
      ...f,
      target_calories: String(targetCal),
      target_protein_g: String(macros.protein_g),
      target_carbs_g: String(macros.carbs_g),
      target_fat_g: String(macros.fat_g),
    }));
    toast.success("Objectifs recalculés !");
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      full_name: form.full_name,
      age: parseInt(form.age) || null,
      height_cm: parseFloat(form.height_cm) || null,
      weight_kg: parseFloat(form.weight_kg) || null,
      gender: form.gender,
      goal: form.goal,
      activity_level: form.activity_level,
      target_calories: parseInt(form.target_calories),
      target_protein_g: parseInt(form.target_protein_g),
      target_carbs_g: parseInt(form.target_carbs_g),
      target_fat_g: parseInt(form.target_fat_g),
    });
    toast.success("Profil sauvegardé !");
    setSaving(false);
    setEditing(false);
  };

  if (pLoading) return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-nutrigreen" />
    </div>
  );
  if (!profile) return null;

  return (
    <div className="min-h-dvh px-4 pt-14 pb-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-nutripurple/8 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Profil</h1>
        <button
          onClick={() => setEditing(e => !e)}
          className="btn-glass text-sm font-medium text-white px-4 py-2"
        >
          {editing ? "Annuler" : "Modifier"}
        </button>
      </div>

      {/* Avatar */}
      <GlassCard animate={false} className="mb-4 !p-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-nutrigreen to-nutriblue flex items-center justify-center text-2xl font-bold text-white">
            {(profile.full_name ?? user?.email ?? "U")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-white text-lg">{profile.full_name ?? "Utilisateur"}</p>
            <p className="text-sm text-white/40">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-nutrigreen/20 text-nutrigreen px-2 py-0.5 rounded-full">
                {profile.goal === "bulk" ? "💪 Masse" : profile.goal === "cut" ? "🔥 Sèche" : "⚖️ Maintien"}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Targets summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Calories", value: profile.target_calories, unit: "kcal", color: "text-nutriorange" },
          { label: "Protéines", value: profile.target_protein_g, unit: "g", color: "text-nutriblue" },
          { label: "Glucides", value: profile.target_carbs_g, unit: "g", color: "text-nutripurple" },
          { label: "Lipides", value: profile.target_fat_g, unit: "g", color: "text-nutrigreen" },
        ].map(t => (
          <div key={t.label} className="macro-badge">
            <span className={cn("text-base font-bold", t.color)}>{t.value}</span>
            <span className="text-[10px] text-white/30">{t.unit}</span>
            <span className="text-[10px] text-white/50">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Edit form */}
      {editing ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <GlassCard animate={false}>
            <h3 className="font-semibold text-white mb-4">Informations personnelles</h3>
            <div className="space-y-3">
              <NutriInput label="Nom" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Ton prénom" icon={<User className="h-4 w-4" />} />
              <div className="grid grid-cols-3 gap-3">
                <NutriInput label="Âge" type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} suffix="ans" />
                <NutriInput label="Taille" type="number" value={form.height_cm} onChange={e => setForm(f => ({ ...f, height_cm: e.target.value }))} suffix="cm" />
                <NutriInput label="Poids" type="number" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} suffix="kg" step="0.1" />
              </div>

              <div>
                <p className="text-sm text-white/60 mb-2">Sexe</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["male", "female"] as Gender[]).map(g => (
                    <button key={g} onClick={() => setForm(f => ({ ...f, gender: g }))}
                      className={cn("rounded-2xl py-2.5 text-sm font-medium press-effect transition-all", form.gender === g ? "bg-nutrigreen text-black" : "bg-white/5 text-white/50")}>
                      {g === "male" ? "Homme" : "Femme"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard animate={false}>
            <h3 className="font-semibold text-white mb-4">Objectif</h3>
            <div className="space-y-2">
              {([
                { v: "bulk", l: "💪 Prise de masse" },
                { v: "maintain", l: "⚖️ Maintien" },
                { v: "cut", l: "🔥 Sèche" },
              ] as { v: GoalType; l: string }[]).map(opt => (
                <button key={opt.v} onClick={() => setForm(f => ({ ...f, goal: opt.v }))}
                  className={cn("w-full rounded-2xl py-3 px-4 text-left text-sm font-medium press-effect transition-all", form.goal === opt.v ? "bg-nutrigreen/20 text-nutrigreen border border-nutrigreen/30" : "bg-white/5 text-white/60")}>
                  {opt.l}
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard animate={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Objectifs nutritionnels</h3>
              <button onClick={recalculate} className="text-xs text-nutrigreen bg-nutrigreen/10 px-3 py-1.5 rounded-xl press-effect">
                Recalculer
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NutriInput label="Calories" type="number" value={form.target_calories} onChange={e => setForm(f => ({ ...f, target_calories: e.target.value }))} suffix="kcal" />
              <NutriInput label="Protéines" type="number" value={form.target_protein_g} onChange={e => setForm(f => ({ ...f, target_protein_g: e.target.value }))} suffix="g" />
              <NutriInput label="Glucides" type="number" value={form.target_carbs_g} onChange={e => setForm(f => ({ ...f, target_carbs_g: e.target.value }))} suffix="g" />
              <NutriInput label="Lipides" type="number" value={form.target_fat_g} onChange={e => setForm(f => ({ ...f, target_fat_g: e.target.value }))} suffix="g" />
            </div>
          </GlassCard>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {saving ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" /> : <><Save className="h-5 w-5" />Sauvegarder</>}
          </motion.button>
        </motion.div>
      ) : (
        /* Read-only info */
        <GlassCard animate={false} className="mb-4">
          <div className="space-y-4">
            {[
              { label: "Âge", value: profile.age ? `${profile.age} ans` : "—" },
              { label: "Taille", value: profile.height_cm ? `${profile.height_cm} cm` : "—" },
              { label: "Poids", value: profile.weight_kg ? `${profile.weight_kg} kg` : "—" },
              { label: "Genre", value: profile.gender === "male" ? "Homme" : profile.gender === "female" ? "Femme" : "—" },
              { label: "Activité", value: {
                sedentary: "Sédentaire", light: "Légèrement actif", moderate: "Modérément actif",
                active: "Très actif", very_active: "Extrêmement actif"
              }[profile.activity_level] ?? "—" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1 border-b border-white/[0.05] last:border-0">
                <span className="text-sm text-white/50">{item.label}</span>
                <span className="text-sm font-medium text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Links */}
      <div className="space-y-2 mt-4">
        <Link href="/family">
          <div className="glass-card p-4 flex items-center gap-3 press-effect">
            <div className="h-9 w-9 rounded-xl bg-nutriblue/20 flex items-center justify-center">
              <span className="text-lg">👨‍👩‍👧</span>
            </div>
            <span className="text-sm font-medium text-white">Gestion famille</span>
            <ChevronRight className="h-4 w-4 text-white/30 ml-auto" />
          </div>
        </Link>

        <button
          onClick={signOut}
          className="glass-card w-full p-4 flex items-center gap-3 press-effect text-left"
        >
          <div className="h-9 w-9 rounded-xl bg-red-500/20 flex items-center justify-center">
            <LogOut className="h-4 w-4 text-red-400" />
          </div>
          <span className="text-sm font-medium text-red-400">Se déconnecter</span>
        </button>
      </div>
    </div>
  );
}

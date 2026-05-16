import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Aujourd'hui";
  if (isYesterday(date)) return "Hier";
  return format(date, "EEEE d MMMM", { locale: fr });
}

export function formatWeight(weight: number): string {
  return `${weight.toFixed(1)} kg`;
}

export function formatCalories(cal: number): string {
  return Math.round(cal).toLocaleString("fr-FR");
}

export function formatMacro(g: number): string {
  return `${Math.round(g)}g`;
}

export function calculateNutrition(
  per100g: { calories: number; protein: number; carbs: number; fat: number },
  quantityG: number
) {
  const ratio = quantityG / 100;
  return {
    calories: per100g.calories * ratio,
    protein_g: per100g.protein * ratio,
    carbs_g: per100g.carbs * ratio,
    fat_g: per100g.fat * ratio,
  };
}

export function calculateTDEE(
  weight: number,
  height: number,
  age: number,
  gender: string,
  activityLevel: string
): number {
  // Mifflin-St Jeor
  let bmr: number;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return Math.round(bmr * (multipliers[activityLevel] ?? 1.55));
}

export function calculateMacroTargets(
  calories: number,
  goal: string
): { protein_g: number; carbs_g: number; fat_g: number } {
  // Macro ratios by goal
  const ratios: Record<string, { p: number; c: number; f: number }> = {
    bulk: { p: 0.3, c: 0.45, f: 0.25 },
    cut: { p: 0.4, c: 0.35, f: 0.25 },
    maintain: { p: 0.3, c: 0.4, f: 0.3 },
  };

  const r = ratios[goal] ?? ratios.maintain;

  return {
    protein_g: Math.round((calories * r.p) / 4),
    carbs_g: Math.round((calories * r.c) / 4),
    fat_g: Math.round((calories * r.f) / 9),
  };
}

export function getGoalCalories(tdee: number, goal: string): number {
  if (goal === "bulk") return Math.round(tdee + 300);
  if (goal === "cut") return Math.round(tdee - 500);
  return tdee;
}

export function clampPercent(value: number, max = 100): number {
  return Math.min(Math.max(value, 0), max);
}

export function getMealLabel(mealType: string): string {
  const labels: Record<string, string> = {
    breakfast: "Petit-déjeuner",
    lunch: "Déjeuner",
    dinner: "Dîner",
    snack: "Collation",
  };
  return labels[mealType] ?? mealType;
}

export function getMealEmoji(mealType: string): string {
  const emojis: Record<string, string> = {
    breakfast: "🌅",
    lunch: "☀️",
    dinner: "🌙",
    snack: "🍎",
  };
  return emojis[mealType] ?? "🍽️";
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

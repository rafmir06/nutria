export type GoalType = "bulk" | "cut" | "maintain";
export type Gender = "male" | "female" | "other";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  gender: Gender | null;
  goal: GoalType;
  activity_level: ActivityLevel;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  family_group_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_at: string;
  note: string | null;
  created_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  water_ml: number;
  created_at: string;
  updated_at: string;
}

export interface FoodProduct {
  id: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  image_url: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number | null;
  sugar_per_100g: number | null;
  sodium_per_100mg: number | null;
  serving_size_g: number | null;
  created_at: string;
}

export interface MealEntry {
  id: string;
  user_id: string;
  daily_log_id: string | null;
  food_product_id: string | null;
  food_product: FoodProduct | null;
  custom_food_name: string | null;
  meal_type: MealType;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  date: string;
  logged_at: string;
  created_at: string;
}

export interface FavoriteFood {
  id: string;
  user_id: string;
  food_product_id: string;
  food_product: FoodProduct;
  default_quantity_g: number;
  created_at: string;
}

export interface FamilyGroup {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_group_id: string;
  user_id: string;
  role: "owner" | "member";
  profile: Profile;
  joined_at: string;
}

export interface OpenFoodFactsProduct {
  code: string;
  product: {
    product_name: string;
    brands: string;
    image_url: string;
    image_front_url: string;
    nutriments: {
      "energy-kcal_100g": number;
      proteins_100g: number;
      carbohydrates_100g: number;
      fat_100g: number;
      fiber_100g: number;
      sugars_100g: number;
      sodium_100g: number;
    };
    serving_size: string;
    quantity: string;
  };
  status: number;
  status_verbose: string;
}

export interface NutritionSummary {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DashboardData {
  profile: Profile;
  todayLog: DailyLog | null;
  todayEntries: MealEntry[];
  weightLogs: WeightLog[];
  consumed: NutritionSummary;
  remaining: NutritionSummary;
  percentages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

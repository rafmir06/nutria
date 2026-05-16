-- ============================================================
-- NutriTrack - Supabase Schema complet
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE goal_type AS ENUM ('bulk', 'cut', 'maintain');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE activity_level AS ENUM ('sedentary', 'light', 'moderate', 'active', 'very_active');
CREATE TYPE family_role AS ENUM ('owner', 'member');

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  height_cm NUMERIC(5,1),
  weight_kg NUMERIC(5,2),
  age INTEGER CHECK (age > 0 AND age < 150),
  gender gender_type,
  goal goal_type NOT NULL DEFAULT 'maintain',
  activity_level activity_level NOT NULL DEFAULT 'moderate',
  target_calories INTEGER NOT NULL DEFAULT 2000 CHECK (target_calories > 0),
  target_protein_g INTEGER NOT NULL DEFAULT 150 CHECK (target_protein_g >= 0),
  target_carbs_g INTEGER NOT NULL DEFAULT 200 CHECK (target_carbs_g >= 0),
  target_fat_g INTEGER NOT NULL DEFAULT 65 CHECK (target_fat_g >= 0),
  family_group_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- WEIGHT LOGS
-- ============================================================

CREATE TABLE weight_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 1000),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, logged_at DESC);

-- ============================================================
-- FOOD PRODUCTS (cache Open Food Facts)
-- ============================================================

CREATE TABLE food_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  brand TEXT,
  image_url TEXT,
  calories_per_100g NUMERIC(7,2) NOT NULL DEFAULT 0,
  protein_per_100g NUMERIC(7,2) NOT NULL DEFAULT 0,
  carbs_per_100g NUMERIC(7,2) NOT NULL DEFAULT 0,
  fat_per_100g NUMERIC(7,2) NOT NULL DEFAULT 0,
  fiber_per_100g NUMERIC(7,2),
  sugar_per_100g NUMERIC(7,2),
  sodium_per_100mg NUMERIC(7,2),
  serving_size_g NUMERIC(7,2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_food_products_barcode ON food_products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_food_products_name ON food_products USING gin(name gin_trgm_ops);

-- ============================================================
-- DAILY LOGS (résumé par jour)
-- ============================================================

CREATE TABLE daily_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_calories NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_protein_g NUMERIC(7,2) NOT NULL DEFAULT 0,
  total_carbs_g NUMERIC(7,2) NOT NULL DEFAULT 0,
  total_fat_g NUMERIC(7,2) NOT NULL DEFAULT 0,
  water_ml INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, date DESC);

-- ============================================================
-- MEAL ENTRIES
-- ============================================================

CREATE TABLE meal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  daily_log_id UUID REFERENCES daily_logs(id) ON DELETE SET NULL,
  food_product_id UUID REFERENCES food_products(id) ON DELETE SET NULL,
  custom_food_name TEXT,
  meal_type meal_type NOT NULL DEFAULT 'lunch',
  quantity_g NUMERIC(7,2) NOT NULL DEFAULT 100 CHECK (quantity_g > 0),
  calories NUMERIC(8,2) NOT NULL DEFAULT 0,
  protein_g NUMERIC(7,2) NOT NULL DEFAULT 0,
  carbs_g NUMERIC(7,2) NOT NULL DEFAULT 0,
  fat_g NUMERIC(7,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT food_or_custom CHECK (food_product_id IS NOT NULL OR custom_food_name IS NOT NULL)
);

CREATE INDEX idx_meal_entries_user_date ON meal_entries(user_id, date DESC);
CREATE INDEX idx_meal_entries_daily_log ON meal_entries(daily_log_id);

-- ============================================================
-- FAVORITE FOODS
-- ============================================================

CREATE TABLE favorite_foods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_product_id UUID REFERENCES food_products(id) ON DELETE CASCADE NOT NULL,
  default_quantity_g NUMERIC(7,2) NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, food_product_id)
);

CREATE INDEX idx_favorite_foods_user ON favorite_foods(user_id);

-- ============================================================
-- FAMILY GROUPS
-- ============================================================

CREATE TABLE family_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX idx_family_groups_invite ON family_groups(invite_code);

-- ============================================================
-- FAMILY MEMBERS
-- ============================================================

CREATE TABLE family_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role family_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(family_group_id, user_id)
);

CREATE INDEX idx_family_members_group ON family_members(family_group_id);
CREATE INDEX idx_family_members_user ON family_members(user_id);

-- ============================================================
-- FK: profiles.family_group_id
-- ============================================================

ALTER TABLE profiles ADD CONSTRAINT fk_profiles_family_group
  FOREIGN KEY (family_group_id) REFERENCES family_groups(id) ON DELETE SET NULL;

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_products ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "profiles_family_read" ON profiles
  FOR SELECT USING (
    family_group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_group_id = profiles.family_group_id
        AND fm.user_id = auth.uid()
    )
  );

-- Weight logs
CREATE POLICY "weight_own" ON weight_logs
  FOR ALL USING (auth.uid() = user_id);

-- Daily logs
CREATE POLICY "daily_own" ON daily_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "daily_family_read" ON daily_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN family_members fm ON fm.family_group_id = p.family_group_id
      WHERE p.user_id = daily_logs.user_id
        AND fm.user_id = auth.uid()
    )
  );

-- Meal entries
CREATE POLICY "meals_own" ON meal_entries
  FOR ALL USING (auth.uid() = user_id);

-- Favorite foods
CREATE POLICY "favorites_own" ON favorite_foods
  FOR ALL USING (auth.uid() = user_id);

-- Food products: everyone can read, authenticated can insert
CREATE POLICY "food_read" ON food_products
  FOR SELECT USING (true);

CREATE POLICY "food_insert" ON food_products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "food_update" ON food_products
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Family groups
CREATE POLICY "family_group_read" ON family_groups
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM family_members WHERE family_group_id = id AND user_id = auth.uid())
  );

CREATE POLICY "family_group_create" ON family_groups
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "family_group_update" ON family_groups
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "family_group_delete" ON family_groups
  FOR DELETE USING (owner_id = auth.uid());

-- Family members
CREATE POLICY "family_members_read" ON family_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM family_members fm2
      WHERE fm2.family_group_id = family_members.family_group_id
        AND fm2.user_id = auth.uid()
    )
  );

CREATE POLICY "family_members_insert" ON family_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "family_members_delete" ON family_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM family_groups fg
      WHERE fg.id = family_group_id AND fg.owner_id = auth.uid()
    )
  );

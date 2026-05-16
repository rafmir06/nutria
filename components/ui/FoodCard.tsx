"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Flame, Heart, Trash2, ChevronRight } from "lucide-react";
import type { FoodProduct, MealEntry } from "@/types";
import { cn } from "@/lib/utils";

interface FoodProductCardProps {
  product: FoodProduct;
  onAdd?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  quantity?: number;
  className?: string;
}

export function FoodProductCard({
  product,
  onAdd,
  onFavorite,
  isFavorite,
  quantity = 100,
  className,
}: FoodProductCardProps) {
  const ratio = quantity / 100;
  const cal = Math.round(product.calories_per_100g * ratio);
  const protein = Math.round(product.protein_per_100g * ratio);
  const carbs = Math.round(product.carbs_per_100g * ratio);
  const fat = Math.round(product.fat_per_100g * ratio);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass-card p-4 flex gap-4 items-center", className)}
    >
      {product.image_url ? (
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white/5">
          <Image
            src={product.image_url}
            alt={product.name}
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-2xl">
          🍽️
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{product.name}</p>
        {product.brand && (
          <p className="text-xs text-white/40 mt-0.5">{product.brand}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-nutriorange" />
            <span className="text-xs font-semibold text-white">{cal}</span>
          </div>
          <span className="text-[10px] text-white/30">P {protein}g</span>
          <span className="text-[10px] text-white/30">G {carbs}g</span>
          <span className="text-[10px] text-white/30">L {fat}g</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onFavorite && (
          <button onClick={onFavorite} className="p-2 press-effect">
            <Heart
              className={cn("h-4 w-4", isFavorite ? "fill-red-400 text-red-400" : "text-white/30")}
            />
          </button>
        )}
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-nutrigreen/20 text-nutrigreen press-effect"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

interface MealEntryCardProps {
  entry: MealEntry;
  onDelete?: () => void;
  onEdit?: () => void;
  index?: number;
}

export function MealEntryCard({ entry, onDelete, onEdit, index = 0 }: MealEntryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, height: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 py-3"
    >
      <div
        onClick={onEdit}
        className="flex-1 min-w-0 cursor-pointer"
      >
        <p className="text-sm font-medium text-white truncate">
          {entry.food_product?.name ?? entry.custom_food_name ?? "Aliment"}
        </p>
        <p className="text-xs text-white/40 mt-0.5">
          {entry.quantity_g}g · {Math.round(entry.calories)} kcal
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <div className="text-right">
          <span className="text-sm font-semibold text-white">{Math.round(entry.calories)}</span>
          <span className="text-xs text-white/30"> kcal</span>
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="ml-2 p-1.5 rounded-xl text-white/20 hover:text-red-400 press-effect transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

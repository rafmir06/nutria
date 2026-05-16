"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MacroBarProps {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color: string;
  glowColor: string;
  className?: string;
}

export function MacroBar({ label, value, target, unit = "g", color, glowColor, className }: MacroBarProps) {
  const percent = Math.min((value / target) * 100, 100);
  const isOver = value > target;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/60">{label}</span>
        <span className={cn("text-xs font-semibold", isOver ? "text-red-400" : "text-white/80")}>
          {Math.round(value)}{unit}
          <span className="text-white/30 font-normal"> / {Math.round(target)}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
          className="h-full rounded-full"
          style={{
            background: color,
            boxShadow: isOver ? "none" : `0 0 8px ${glowColor}`,
          }}
        />
      </div>
    </div>
  );
}

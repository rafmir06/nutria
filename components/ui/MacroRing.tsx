"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MacroRingProps {
  calories: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function MacroRing({ calories, target, size = 180, strokeWidth = 12, className }: MacroRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(calories / target, 1);
  const offset = circumference - percent * circumference;

  const color = percent > 1 ? "#FF453A" : percent > 0.85 ? "#FF9F0A" : "#30D158";

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="progress-ring">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="text-3xl font-bold text-white"
        >
          {Math.round(calories)}
        </motion.span>
        <span className="text-xs text-white/40 mt-0.5">/ {Math.round(target)} kcal</span>
      </div>
    </div>
  );
}

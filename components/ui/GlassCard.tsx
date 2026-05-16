"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
  animate?: boolean;
}

export function GlassCard({ children, className, onClick, delay = 0, animate = true }: GlassCardProps) {
  const content = (
    <div
      onClick={onClick}
      className={cn(
        "glass-card p-5",
        onClick && "cursor-pointer press-effect",
        className
      )}
    >
      {children}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
    >
      {content}
    </motion.div>
  );
}

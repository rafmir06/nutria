"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, ScanLine, BookOpen, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Accueil" },
  { href: "/journal", icon: BookOpen, label: "Journal" },
  { href: "/scanner", icon: ScanLine, label: "Scanner" },
  { href: "/weight", icon: TrendingUp, label: "Poids" },
  { href: "/profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          const isScanner = href === "/scanner";

          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center"
              onClick={() => router.refresh()}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300",
                  isScanner && "relative",
                )}
              >
                {isScanner ? (
                  <div className={cn(
                    "relative flex h-12 w-12 items-center justify-center rounded-2xl",
                    "bg-gradient-to-br from-nutrigreen to-nutrigreen/70",
                    "shadow-neon-green -translate-y-2",
                    isActive && "shadow-[0_0_25px_rgba(48,209,88,0.5)]"
                  )}>
                    <Icon className="h-6 w-6 text-black" strokeWidth={2.5} />
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "relative flex h-7 w-7 items-center justify-center transition-all duration-300",
                      isActive && "nav-item-active"
                    )}>
                      <Icon
                        className={cn(
                          "h-6 w-6 transition-all duration-300",
                          isActive ? "text-nutrigreen" : "text-white/40"
                        )}
                        strokeWidth={isActive ? 2.5 : 1.8}
                      />
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute -bottom-1.5 h-1 w-1 rounded-full bg-nutrigreen"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium transition-colors duration-300",
                      isActive ? "text-nutrigreen" : "text-white/30"
                    )}>
                      {label}
                    </span>
                  </>
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

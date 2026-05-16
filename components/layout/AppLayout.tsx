"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { AppDataProvider, useAppData } from "@/providers/AppDataContext";
import { useAuthContext } from "@/providers/AuthProvider";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { refetchEntries } = useAppData();

  useEffect(() => {
    refetchEntries();
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex-1 pb-24"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthContext();

  // Wait for auth to resolve before mounting the data provider,
  // otherwise AppDataContext starts with loading=true and userId=undefined,
  // causing fetchAll to return early and never unblock the UI.
  if (authLoading) return null;

  return (
    <AppDataProvider userId={user?.id}>
      <AppLayoutInner>{children}</AppLayoutInner>
    </AppDataProvider>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ScanLine, Loader2, Plus, Minus, Check } from "lucide-react";
import Image from "next/image";
import { fetchProductByBarcode, searchProducts } from "@/lib/api/openfoodfacts";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { calculateNutrition, getMealLabel, todayISO } from "@/lib/utils";
import { FoodProductCard } from "@/components/ui/FoodCard";
import { NutriInput } from "@/components/ui/NutriInput";
import { toast } from "sonner";
import type { FoodProduct, MealType } from "@/types";
import { cn } from "@/lib/utils";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function ScannerPage() {
  const { user } = useAuthContext();
  const { profile } = useProfile(user?.id);
  const supabase = createClient();

  const [mode, setMode] = useState<"idle" | "scanning" | "search" | "result">("idle");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodProduct[]>([]);
  const [selected, setSelected] = useState<FoodProduct | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [loading, setLoading] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const stopScanner = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scanner = html5QrCodeRef.current as any;
    if (scanner?.isScanning) {
      try { await scanner.stop(); } catch { /* ignore */ }
    }
    html5QrCodeRef.current = null;
    setScannerReady(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = scanner;

    const onScan = async (decodedText: string) => {
      await stopScanner();
      setMode("result");
      setLoading(true);
      const product = await fetchProductByBarcode(decodedText);
      setLoading(false);
      if (product) {
        setSelected(product);
      } else {
        toast.error("Produit non trouvé dans Open Food Facts");
        setMode("idle");
      }
    };

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        onScan,
        () => {}
      );
      setScannerReady(true);
    } catch {
      // Fallback: try any available camera
      try {
        await scanner.start(
          { facingMode: "user" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          onScan,
          () => {}
        );
        setScannerReady(true);
      } catch {
        toast.error("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        setMode("idle");
      }
    }
  }, [stopScanner]);

  useEffect(() => {
    if (mode === "scanning") {
      startScanner();
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
  }, [mode]);

  const handleSearch = (q: string) => {
    setQuery(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      const res = await searchProducts(q);
      setResults(res);
      setLoading(false);
    }, 400);
  };

  const handleAdd = async () => {
    if (!selected || !user) return;
    setLoading(true);

    // Upsert food product
    const { data: food } = await supabase
      .from("food_products")
      .upsert({
        barcode: selected.barcode,
        name: selected.name,
        brand: selected.brand,
        image_url: selected.image_url,
        calories_per_100g: selected.calories_per_100g,
        protein_per_100g: selected.protein_per_100g,
        carbs_per_100g: selected.carbs_per_100g,
        fat_per_100g: selected.fat_per_100g,
        fiber_per_100g: selected.fiber_per_100g,
        sugar_per_100g: selected.sugar_per_100g,
      }, { onConflict: selected.barcode ? "barcode" : "name", ignoreDuplicates: false })
      .select()
      .single();

    const qty = parseFloat(quantity) || 100;
    const nutrition = calculateNutrition(
      {
        calories: selected.calories_per_100g,
        protein: selected.protein_per_100g,
        carbs: selected.carbs_per_100g,
        fat: selected.fat_per_100g,
      },
      qty
    );

    await supabase.from("meal_entries").insert({
      user_id: user.id,
      food_product_id: food?.id ?? null,
      meal_type: mealType,
      quantity_g: qty,
      calories: nutrition.calories,
      protein_g: nutrition.protein_g,
      carbs_g: nutrition.carbs_g,
      fat_g: nutrition.fat_g,
      date: todayISO(),
      logged_at: new Date().toISOString(),
    });

    toast.success(`${selected.name} ajouté !`);
    setLoading(false);
    setSelected(null);
    setMode("idle");
    setQuery("");
    setResults([]);
  };

  const qty = parseFloat(quantity) || 100;
  const nutrition = selected
    ? calculateNutrition({ calories: selected.calories_per_100g, protein: selected.protein_per_100g, carbs: selected.carbs_per_100g, fat: selected.fat_per_100g }, qty)
    : null;

  return (
    <div className="min-h-dvh">
      {/* Scanner mode */}
      <AnimatePresence>
        {mode === "scanning" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
          >
            <div id="qr-reader" ref={scannerRef} className="w-full h-full" />

            {/* Overlay UI */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Dark corners */}
              <div className="absolute inset-0 bg-black/60" />
              {/* Scan frame */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-40">
                <div className="absolute inset-0 rounded-2xl border-2 border-white/30" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-nutrigreen rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-nutrigreen rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-nutrigreen rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-nutrigreen rounded-br-2xl" />
                {/* Scan line */}
                <motion.div
                  className="absolute left-2 right-2 h-0.5 bg-nutrigreen shadow-neon-green"
                  animate={{ top: ["10%", "90%", "10%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <p className="absolute top-[60%] left-0 right-0 text-center text-white/70 text-sm mt-8">
                Pointez vers le code-barres
              </p>
            </div>

            <button
              onClick={() => setMode("idle")}
              className="pointer-events-auto absolute top-14 right-5 h-11 w-11 rounded-2xl glass flex items-center justify-center"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product result modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => { if (info.offset.y > 100) setSelected(null); }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="glass-dark rounded-t-3xl overflow-y-auto"
              style={{ maxHeight: "92dvh" }}
            >
              {/* Handle — tap or swipe down to close */}
              <div
                className="flex justify-center pt-3 pb-2 cursor-pointer sticky top-0 z-10"
                style={{ background: "inherit" }}
                onClick={() => setSelected(null)}
              >
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="px-6 pt-2">
                {/* Product info */}
                <div className="flex gap-4 mb-6">
                  {selected.image_url ? (
                    <Image src={selected.image_url} alt={selected.name} width={72} height={72}
                      className="h-18 w-18 rounded-2xl object-cover bg-white/5" />
                  ) : (
                    <div className="h-18 w-18 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">🍽️</div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-white text-lg leading-tight">{selected.name}</p>
                    {selected.brand && <p className="text-sm text-white/40 mt-0.5">{selected.brand}</p>}
                    <p className="text-xs text-white/30 mt-1">Pour {qty}g</p>
                  </div>
                </div>

                {/* Nutrition grid */}
                {nutrition && (
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {[
                      { label: "Calories", value: Math.round(nutrition.calories), unit: "kcal", color: "text-nutriorange" },
                      { label: "Protéines", value: Math.round(nutrition.protein_g), unit: "g", color: "text-nutriblue" },
                      { label: "Glucides", value: Math.round(nutrition.carbs_g), unit: "g", color: "text-nutripurple" },
                      { label: "Lipides", value: Math.round(nutrition.fat_g), unit: "g", color: "text-nutrigreen" },
                    ].map(n => (
                      <div key={n.label} className="macro-badge">
                        <span className={cn("text-lg font-bold", n.color)}>{n.value}</span>
                        <span className="text-[10px] text-white/30">{n.unit}</span>
                        <span className="text-[10px] text-white/50">{n.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-4">
                  <p className="text-sm text-white/60 mb-2">Quantité</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(q => String(Math.max(10, (parseFloat(q) || 100) - 10)))}
                      className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center press-effect"
                    >
                      <Minus className="h-4 w-4 text-white" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      className="flex-1 input-glass text-center text-lg font-bold"
                      min="1"
                    />
                    <span className="text-white/40 text-sm w-6">g</span>
                    <button
                      onClick={() => setQuantity(q => String((parseFloat(q) || 100) + 10))}
                      className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center press-effect"
                    >
                      <Plus className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Meal type */}
                <div className="mb-2">
                  <p className="text-sm text-white/60 mb-2">Repas</p>
                  <div className="grid grid-cols-4 gap-2">
                    {MEAL_TYPES.map(mt => (
                      <button
                        key={mt}
                        onClick={() => setMealType(mt)}
                        className={cn(
                          "rounded-2xl py-2.5 text-xs font-medium press-effect transition-all",
                          mealType === mt ? "bg-nutrigreen text-black" : "bg-white/5 text-white/50"
                        )}
                      >
                        {getMealLabel(mt).split("-")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              {/* Add button */}
              <div className="pt-3 pb-32">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAdd}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="h-5 w-5" />
                      Ajouter au journal
                    </span>
                  )}
                </motion.button>
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main UI */}
      <div className="px-4 pt-14 pb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white">Ajouter un aliment</h1>
          <p className="text-white/40 text-sm mt-1">Scannez ou recherchez</p>
        </motion.div>

        {/* Scan button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => setMode("scanning")}
          whileTap={{ scale: 0.97 }}
          className="w-full mb-4 glass-card p-6 flex flex-col items-center gap-3"
        >
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-nutrigreen to-nutrigreen/60 flex items-center justify-center shadow-neon-green">
            <ScanLine className="h-8 w-8 text-black" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-white">Scanner un code-barres</p>
            <p className="text-xs text-white/40 mt-0.5">EAN-8, EAN-13, QR Code</p>
          </div>
        </motion.button>

        {/* Search */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="search"
              placeholder="Rechercher un aliment..."
              value={query}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => setMode("search")}
              className="input-glass pl-11 pr-4"
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-nutrigreen" />
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-2">
              {results.map((product, i) => (
                <FoodProductCard
                  key={product.barcode ?? i}
                  product={product}
                  onAdd={() => { setSelected(product); setMode("result"); }}
                />
              ))}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-white/30 text-sm">Aucun résultat pour &quot;{query}&quot;</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, TrendingDown, TrendingUp, Minus, Trash2, X } from "lucide-react";
import { useAppData } from "@/providers/AppDataContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { NutriInput } from "@/components/ui/NutriInput";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function WeightPage() {
  const { profile, weightLogs, loading, latestWeight, weightDiff, addLog, removeLog } = useAppData();

  const [showModal, setShowModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    const w = parseFloat(newWeight);
    if (!w || w < 20 || w > 500) {
      toast.error("Poids invalide");
      return;
    }
    setSubmitting(true);
    await addLog(w, note || undefined);
    toast.success(`${w} kg enregistré !`);
    setSubmitting(false);
    setShowModal(false);
    setNewWeight("");
    setNote("");
  };

  // Chart data (last 30 entries, ascending)
  const chartData = [...weightLogs].reverse().slice(-30).map(log => ({
    date: format(parseISO(log.logged_at), "dd/MM"),
    weight: log.weight_kg,
    full: log,
  }));

  const minW = Math.min(...chartData.map(d => d.weight)) - 2;
  const maxW = Math.max(...chartData.map(d => d.weight)) + 2;

  const trend = weightLogs.length >= 2
    ? weightLogs[0].weight_kg - weightLogs[Math.min(6, weightLogs.length - 1)].weight_kg
    : null;

  return (
    <div className="min-h-dvh px-4 pt-14 pb-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-10 right-0 h-72 w-72 rounded-full bg-nutriblue/8 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Suivi poids</h1>
          <p className="text-white/40 text-sm mt-0.5">Progression et historique</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowModal(true)}
          className="h-11 w-11 rounded-2xl bg-nutrigreen flex items-center justify-center shadow-neon-green"
        >
          <Plus className="h-5 w-5 text-black" strokeWidth={2.5} />
        </motion.button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard height="h-28" />
          <SkeletonCard height="h-64" />
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <GlassCard animate={false} className="!p-4 col-span-1">
              <p className="text-xs text-white/40 mb-1">Actuel</p>
              <p className="text-xl font-bold text-white">
                {latestWeight ? `${latestWeight}` : "—"}
              </p>
              <p className="text-xs text-white/30">kg</p>
            </GlassCard>

            <GlassCard animate={false} className="!p-4 col-span-1">
              <p className="text-xs text-white/40 mb-1">Évolution</p>
              {weightDiff !== null ? (
                <div className={cn("flex items-center gap-1", weightDiff <= 0 ? "text-nutrigreen" : "text-nutriorange")}>
                  {weightDiff < 0 ? <TrendingDown className="h-4 w-4" /> : weightDiff > 0 ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  <span className="text-lg font-bold">{Math.abs(weightDiff).toFixed(1)}</span>
                </div>
              ) : (
                <p className="text-xl font-bold text-white/30">—</p>
              )}
              <p className="text-xs text-white/30">kg / pesée</p>
            </GlassCard>

            <GlassCard animate={false} className="!p-4 col-span-1">
              <p className="text-xs text-white/40 mb-1">7j tendance</p>
              {trend !== null ? (
                <div className={cn("flex items-center gap-1", trend <= 0 ? "text-nutrigreen" : "text-nutriorange")}>
                  {trend < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                  <span className="text-lg font-bold">{Math.abs(trend).toFixed(1)}</span>
                </div>
              ) : (
                <p className="text-xl font-bold text-white/30">—</p>
              )}
              <p className="text-xs text-white/30">kg / 7j</p>
            </GlassCard>
          </div>

          {/* Chart */}
          {chartData.length > 1 ? (
            <GlassCard animate={false} className="mb-4 !p-4">
              <h3 className="text-sm font-semibold text-white/70 mb-4">Évolution du poids</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[minW, maxW]}
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(20,20,20,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    formatter={(v: number) => [`${v} kg`, "Poids"]}
                  />
                  {profile?.weight_kg && (
                    <ReferenceLine
                      y={profile.weight_kg}
                      stroke="rgba(255,255,255,0.1)"
                      strokeDasharray="4 4"
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#0A84FF"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#0A84FF", strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#0A84FF", stroke: "rgba(10,132,255,0.3)", strokeWidth: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          ) : (
            <GlassCard animate={false} className="mb-4">
              <div className="py-8 text-center">
                <p className="text-3xl mb-3">📊</p>
                <p className="text-white/40 text-sm">Ajoute 2+ pesées pour voir le graphique</p>
              </div>
            </GlassCard>
          )}

          {/* History */}
          <GlassCard animate={false}>
            <h3 className="text-sm font-semibold text-white/70 mb-4">Historique</h3>
            {weightLogs.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-white/30 text-sm">Aucune pesée enregistrée</p>
              </div>
            ) : (
              <div className="space-y-1">
                <AnimatePresence>
                  {weightLogs.slice(0, 20).map((log, i) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0"
                    >
                      <div>
                        <p className="font-semibold text-white">{log.weight_kg} kg</p>
                        <p className="text-xs text-white/40">
                          {format(parseISO(log.logged_at), "EEEE d MMM à HH:mm", { locale: fr })}
                        </p>
                        {log.note && <p className="text-xs text-white/30 mt-0.5">{log.note}</p>}
                      </div>
                      {i > 0 && weightLogs[i - 1] && (
                        <div className={cn("text-sm font-medium mr-4", log.weight_kg < weightLogs[i - 1].weight_kg ? "text-nutrigreen" : "text-nutriorange")}>
                          {log.weight_kg < weightLogs[i - 1].weight_kg ? "-" : "+"}
                          {Math.abs(log.weight_kg - weightLogs[i - 1].weight_kg).toFixed(1)}
                        </div>
                      )}
                      <button
                        onClick={() => removeLog(log.id)}
                        className="p-2 text-white/20 hover:text-red-400 press-effect transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </GlassCard>
        </>
      )}

      {/* Add weight modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => { if (info.offset.y > 100) setShowModal(false); }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="glass-dark w-full rounded-t-3xl overflow-y-auto"
              style={{ maxHeight: "92dvh" }}
            >
              <div className="flex justify-center pt-3 pb-1 cursor-grab">
                <div className="h-1 w-10 rounded-full bg-white/20" />
              </div>
              <div className="px-6 pb-10">
              <div className="flex items-center justify-between mb-6 mt-2">
                <h3 className="text-lg font-bold text-white">Nouvelle pesée</h3>
                <button onClick={() => setShowModal(false)} className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              <NutriInput
                label="Poids"
                type="number"
                placeholder="70.5"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                suffix="kg"
                step="0.1"
                min="20"
                max="500"
                autoFocus
              />

              <div className="mt-3">
                <NutriInput
                  label="Note (optionnel)"
                  type="text"
                  placeholder="Après le sport, à jeun..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                disabled={submitting || !newWeight}
                className="btn-primary mt-6 disabled:opacity-40"
              >
                {submitting ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black mx-auto block" />
                ) : "Enregistrer"}
              </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

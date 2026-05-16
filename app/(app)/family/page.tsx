"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Copy, X, Loader2, Check, LogOut } from "lucide-react";
import { useAuthContext } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { NutriInput } from "@/components/ui/NutriInput";
import { toast } from "sonner";
import { generateInviteCode } from "@/lib/utils";
import type { FamilyGroup, FamilyMember } from "@/types";

export default function FamilyPage() {
  const { user } = useAuthContext();
  const { profile, updateProfile } = useProfile(user?.id);
  const supabase = createClient();

  const [group, setGroup] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!profile?.family_group_id) { setLoading(false); return; }
    fetchGroup(profile.family_group_id);
  }, [profile?.family_group_id]);

  const fetchGroup = async (id: string) => {
    const { data: g } = await supabase.from("family_groups").select("*").eq("id", id).single();
    setGroup(g);

    const { data: m } = await supabase
      .from("family_members")
      .select("*, profile:profiles(*)")
      .eq("family_group_id", id);
    setMembers(m ?? []);
    setLoading(false);
  };

  const createGroup = async () => {
    if (!groupName.trim() || !user) return;
    setSubmitting(true);

    const { data: g, error } = await supabase
      .from("family_groups")
      .insert({ name: groupName.trim(), owner_id: user.id, invite_code: generateInviteCode() })
      .select()
      .single();

    if (error || !g) { toast.error("Erreur lors de la création"); setSubmitting(false); return; }

    await supabase.from("family_members").insert({ family_group_id: g.id, user_id: user.id, role: "owner" });
    await updateProfile({ family_group_id: g.id });

    setGroup(g);
    setMembers([{ id: "", family_group_id: g.id, user_id: user.id, role: "owner", profile: profile!, joined_at: new Date().toISOString() }]);
    setShowCreate(false);
    setSubmitting(false);
    toast.success("Groupe créé !");
  };

  const joinGroup = async () => {
    if (!inviteCode.trim() || !user) return;
    setSubmitting(true);

    const { data: g } = await supabase
      .from("family_groups")
      .select("*")
      .eq("invite_code", inviteCode.trim().toUpperCase())
      .single();

    if (!g) { toast.error("Code invalide"); setSubmitting(false); return; }

    await supabase.from("family_members").upsert({ family_group_id: g.id, user_id: user.id, role: "member" }, { onConflict: "family_group_id,user_id" });
    await updateProfile({ family_group_id: g.id });

    fetchGroup(g.id);
    setShowJoin(false);
    setSubmitting(false);
    toast.success(`Vous avez rejoint "${g.name}" !`);
  };

  const leaveGroup = async () => {
    if (!group || !user) return;
    await supabase.from("family_members").delete().eq("family_group_id", group.id).eq("user_id", user.id);
    await updateProfile({ family_group_id: null });
    setGroup(null);
    setMembers([]);
    toast.success("Groupe quitté");
  };

  const copyCode = async () => {
    if (!group) return;
    await navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Code copié !");
  };

  if (loading) return <div className="flex items-center justify-center h-dvh"><Loader2 className="h-8 w-8 animate-spin text-nutrigreen" /></div>;

  return (
    <div className="min-h-dvh px-4 pt-14 pb-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-10 left-0 h-72 w-72 rounded-full bg-nutriblue/8 blur-3xl" />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Famille</h1>
        <p className="text-white/40 text-sm mt-0.5">Suivez votre progression ensemble</p>
      </div>

      {!group ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <GlassCard animate={false} className="text-center py-10">
            <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
            <h2 className="text-lg font-bold text-white mb-2">Pas encore dans un groupe</h2>
            <p className="text-sm text-white/40 mb-6">Créez ou rejoignez un groupe familial</p>

            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowCreate(true)} className="btn-glass flex items-center gap-2 text-white">
                <Plus className="h-4 w-4" />
                Créer
              </button>
              <button onClick={() => setShowJoin(true)} className="btn-glass flex items-center gap-2 text-white">
                <Users className="h-4 w-4" />
                Rejoindre
              </button>
            </div>
          </GlassCard>

          {/* Create modal */}
          <AnimatePresence>
            {showCreate && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
                onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}
              >
                <motion.div
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  className="glass-dark w-full rounded-t-3xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Créer un groupe</h3>
                    <button onClick={() => setShowCreate(false)} className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center">
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <NutriInput label="Nom du groupe" placeholder="Ma famille" value={groupName} onChange={e => setGroupName(e.target.value)} autoFocus />
                  <button onClick={createGroup} disabled={!groupName || submitting} className="btn-primary mt-4 disabled:opacity-40">
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Créer"}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Join modal */}
          <AnimatePresence>
            {showJoin && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
                onClick={e => { if (e.target === e.currentTarget) setShowJoin(false); }}
              >
                <motion.div
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  className="glass-dark w-full rounded-t-3xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Rejoindre un groupe</h3>
                    <button onClick={() => setShowJoin(false)} className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center">
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <NutriInput label="Code d'invitation" placeholder="ABC123" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} autoFocus />
                  <button onClick={joinGroup} disabled={!inviteCode || submitting} className="btn-primary mt-4 disabled:opacity-40">
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Rejoindre"}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Group info */}
          <GlassCard animate={false}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{group.name}</h2>
              <button onClick={leaveGroup} className="text-red-400 text-sm flex items-center gap-1 press-effect">
                <LogOut className="h-4 w-4" />
                Quitter
              </button>
            </div>

            {/* Invite code */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5">
              <div>
                <p className="text-xs text-white/40">Code d&apos;invitation</p>
                <p className="text-lg font-mono font-bold text-nutrigreen tracking-widest">{group.invite_code}</p>
              </div>
              <button onClick={copyCode} className="ml-auto h-9 w-9 rounded-xl bg-nutrigreen/20 flex items-center justify-center press-effect">
                {copied ? <Check className="h-4 w-4 text-nutrigreen" /> : <Copy className="h-4 w-4 text-nutrigreen" />}
              </button>
            </div>
          </GlassCard>

          {/* Members */}
          <GlassCard animate={false}>
            <h3 className="text-sm font-semibold text-white/70 mb-4">Membres ({members.length})</h3>
            <div className="space-y-3">
              {members.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-nutrigreen/60 to-nutriblue/60 flex items-center justify-center text-white font-bold">
                    {(member.profile?.full_name ?? "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{member.profile?.full_name ?? "Membre"}</p>
                    <p className="text-xs text-white/30">{member.role === "owner" ? "Propriétaire" : "Membre"}</p>
                  </div>
                  {member.role === "owner" && (
                    <span className="ml-auto text-xs bg-nutrigreen/20 text-nutrigreen px-2 py-0.5 rounded-full">Admin</span>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}

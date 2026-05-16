"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NutriInput } from "@/components/ui/NutriInput";
import { toast } from "sonner";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Le mot de passe doit faire au moins 6 caractères");
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Compte créé ! Vérifie ton email.");
    router.push("/onboarding");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-nutripurple/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-nutrigreen/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-nutrigreen to-nutrigreen/60 shadow-neon-green"
          >
            <Zap className="h-8 w-8 text-black" strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">Créer un compte</h1>
          <p className="mt-2 text-white/40">Commence ton suivi nutritionnel</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <NutriInput
            label="Nom complet"
            type="text"
            placeholder="Rafael Morais"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            icon={<User className="h-4 w-4" />}
            required
            autoComplete="name"
          />

          <NutriInput
            label="Email"
            type="email"
            placeholder="ton@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            icon={<Mail className="h-4 w-4" />}
            required
            autoComplete="email"
          />

          <NutriInput
            label="Mot de passe"
            type={showPass ? "text" : "password"}
            placeholder="Min. 6 caractères"
            value={password}
            onChange={e => setPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            suffix={
              <button type="button" onClick={() => setShowPass(p => !p)} className="text-white/30">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            required
            autoComplete="new-password"
          />

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="btn-primary mt-6 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                Création...
              </span>
            ) : (
              "Créer mon compte"
            )}
          </motion.button>
        </form>

        <p className="mt-8 text-center text-sm text-white/40">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-nutrigreen font-medium">
            Se connecter
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

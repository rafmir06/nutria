"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NutriInput } from "@/components/ui/NutriInput";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error("Email ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error("Erreur de connexion Google");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 pb-safe-bottom">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-nutrigreen/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-nutriblue/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-nutrigreen to-nutrigreen/60 shadow-neon-green"
          >
            <Zap className="h-8 w-8 text-black" strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">Bienvenue</h1>
          <p className="mt-2 text-white/40">Connecte-toi pour continuer</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
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
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            suffix={
              <button type="button" onClick={() => setShowPass(p => !p)} className="text-white/30">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            required
            autoComplete="current-password"
          />

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                Connexion...
              </span>
            ) : (
              "Se connecter"
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/30">ou</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Google */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleGoogle}
          className="btn-glass w-full flex items-center justify-center gap-3 text-white font-medium"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuer avec Google
        </motion.button>

        {/* Register link */}
        <p className="mt-8 text-center text-sm text-white/40">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-nutrigreen font-medium">
            Créer un compte
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

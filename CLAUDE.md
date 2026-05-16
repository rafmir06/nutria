# NutriTrack — Contexte projet pour Claude

## Stack
- Next.js 16, TypeScript, TailwindCSS, Framer Motion
- Supabase (Auth + PostgreSQL + RLS désactivé pour l'instant)
- Open Food Facts API (gratuite, pas de clé requise)
- html5-qrcode (scan barcode), Recharts (graphiques), Sonner (toasts)

## Supabase
- URL : `https://jsuwavvswjhddrrtwmps.supabase.co`
- Clés dans `.env.local` (legacy JWT format — les nouvelles clés `sb_publishable_` ne fonctionnent pas avec `@supabase/ssr`)
- **RLS désactivé** sur toutes les tables (à réactiver + corriger les policies avant mise en prod)
- SQL du schema complet dans `supabase/schema.sql`
- Trigger `handle_new_user` crée automatiquement un profil vide à l'inscription

## Architecture
```
app/
  (auth)/         login, register, onboarding — layout force-dynamic
  (app)/          dashboard, scanner, journal, weight, profile, family — layout force-dynamic
  auth/callback/  OAuth callback
components/
  layout/         BottomNav, AppLayout
  ui/             GlassCard, MacroRing, MacroBar, NutriInput, FoodCard, SkeletonCard
hooks/            useProfile, useDailyLog, useWeightLog, useFavorites
providers/        AuthProvider (createClient au module level, getUser pas getSession)
lib/supabase/     client.ts, server.ts, middleware.ts (maintenant proxy.ts pour Next.js 16)
```

## Points importants
- `middleware.ts` → renommé en `proxy.ts` (convention Next.js 16)
- Tous les hooks utilisent `.maybeSingle()` pas `.single()` (évite les 406)
- Les hooks ne setent pas `loading: false` si `userId` est undefined — ils attendent
- `AuthProvider` utilise `getUser()` (pas `getSession()`) pour fiabilité
- Les pages app vérifient `authLoading` en plus de leur propre loading
- Onboarding utilise `.update()` pas `.upsert()` (le trigger a déjà créé le profil)

## Design system
- Dark mode uniquement, fond `#0a0a0a`
- Classes custom dans `globals.css` : `.glass`, `.glass-card`, `.glass-dark`, `.glass-nav`, `.btn-primary`, `.btn-glass`, `.press-effect`, `.input-glass`, `.macro-badge`
- Couleurs : `nutrigreen` (#30D158), `nutriblue` (#0A84FF), `nutripurple` (#BF5AF2), `nutriorange` (#FF9F0A)
- Éviter les opacités non-standard Tailwind (`/8`, `/5`) — utiliser `[0.08]` ou `/10`

## Lancer le projet
```bash
npm run dev
```

## Ce qui reste à faire
- Réactiver et corriger les RLS policies (désactivées pour débug)
- Icônes PWA dans `public/icons/` (icon-192.png, icon-512.png, apple-touch-icon.png)
- Connexion Google OAuth (Supabase + Google Cloud Console)
- Tester le scanner barcode sur mobile
- Déploiement Vercel (ajouter les 3 env vars)

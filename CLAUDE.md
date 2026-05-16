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
- Trigger `handle_new_user` est désactivé (`tgenabled = 0`) — le profil est créé via `upsert` dans l'onboarding

## Déploiement
- Production : `mon-nutria.vercel.app`
- Repo GitHub : `rafmir06/nutria` (branch `main` = production)
- Push : `git push origin master:main` (forcer si besoin : `--force`)
- 3 env vars sur Vercel : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Framework preset Vercel : **Next.js** (important — ne pas laisser sur "Other")

## Architecture
```
app/
  (auth)/         login, register, onboarding — layout force-dynamic
  (app)/          dashboard, scanner, journal, weight, profile, family — layout force-dynamic
  auth/callback/  OAuth callback
  icon.tsx        favicon généré dynamiquement via ImageResponse
components/
  layout/         BottomNav, AppLayout
  ui/             GlassCard, MacroRing, MacroBar, NutriInput, FoodCard, SkeletonCard
hooks/            useProfile, useDailyLog, useWeightLog, useFavorites (directs — utilisés uniquement en dehors du layout app)
providers/        AuthProvider (createClient au module level, getUser pas getSession)
                  AppDataContext (profil + entries aujourd'hui + weight logs — partagé dans tout le layout app)
lib/supabase/     client.ts, server.ts
public/icons/     icon-192.png, icon-512.png, apple-touch-icon.png (générés par scripts/generate-icons.mjs)
scripts/          generate-icons.mjs (utilise sharp)
```

## Points importants
- `middleware.ts` → renommé en `proxy.ts` (convention Next.js 16)
- Tous les hooks utilisent `.maybeSingle()` pas `.single()` (évite les 406)
- Les hooks ne setent pas `loading: false` si `userId` est undefined — ils attendent
- `AuthProvider` utilise `getUser()` (pas `getSession()`) pour fiabilité
- Les pages app vérifient `authLoading` en plus de leur propre loading
- Onboarding utilise `.upsert({ onConflict: "user_id" })` pour créer le profil même si le trigger n'a pas fonctionné
- `experimental.optimizeCss` retiré de next.config.ts (nécessite `critters` non installé → crash Vercel)
- `staleTimes: { dynamic: 0 }` dans next.config.ts pour désactiver le cache router côté client
- **AppDataContext** : chargement global dans `AppLayout` — profile, entries du jour, weight logs. Refetch des entries à chaque changement de route (via `useEffect` sur `pathname` dans `AppLayoutInner`). Plus de hack `window.location.href`.
- Journal garde son propre `useDailyLog` (navigation entre dates) mais prend `profile` du contexte.

## Scanner (page /scanner)
- Bottom sheet : `overflow-y-auto` + `max-h-[92dvh]` + `pb-32` pour dégager la bottom nav et la safe area iPhone
- Swipe down to dismiss : `drag="y"` Framer Motion, se ferme si `offset.y > 100`
- Recherche Open Food Facts : sans `search_simple=1`, triée par `unique_scans_n`
- Scanner caméra : fallback sur `facingMode: "user"` si `"environment"` échoue

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
- Réactiver et corriger les RLS policies (désactivées pour débug — risque sécurité en prod)
- Connexion Google OAuth (Supabase + Google Cloud Console)
- Tester le scanner barcode sur mobile (vérifier permissions caméra)
- Page famille (`/family`) actuellement vide

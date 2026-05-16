# NutriTrack — Application Nutrition & Fitness Premium

Application mobile-first de suivi nutritionnel avec design Apple/glassmorphism.

---

## Stack

- **Next.js 15** App Router
- **TypeScript**
- **TailwindCSS** + glassmorphism custom
- **Framer Motion** animations
- **Supabase** (Auth + PostgreSQL + RLS)
- **Open Food Facts** API (gratuite)
- **html5-qrcode** scan code-barres
- **Recharts** graphiques
- **Zustand** state management
- **PWA** installable

---

## Installation locale

### 1. Cloner et installer

```bash
cd Nutria
npm install
```

### 2. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com)
2. Crée un nouveau projet
3. Copie l'URL et les clés API

### 3. Variables d'environnement

Édite `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 4. Initialiser la base de données

Dans Supabase > SQL Editor, colle et exécute le contenu de `supabase/schema.sql`.

### 5. Configurer l'authentification Google (optionnel)

Dans Supabase > Authentication > Providers > Google :
- Active Google
- Configure les credentials OAuth Google Cloud Console
- Ajoute l'URL de callback : `https://ton-projet.supabase.co/auth/v1/callback`

### 6. Lancer en développement

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

---

## Structure du projet

```
nutritrack/
├── app/
│   ├── (auth)/              # Pages login/register/onboarding
│   │   ├── login/
│   │   ├── register/
│   │   └── onboarding/
│   ├── (app)/               # Pages protégées avec navigation
│   │   ├── dashboard/       # Tableau de bord principal
│   │   ├── scanner/         # Scanner code-barres + recherche
│   │   ├── journal/         # Journal alimentaire
│   │   ├── weight/          # Suivi poids + graphique
│   │   ├── profile/         # Profil et paramètres
│   │   └── family/          # Gestion groupe familial
│   └── auth/callback/       # OAuth callback
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx    # Navigation bottom bar iOS-like
│   │   └── AppLayout.tsx    # Layout avec animations de page
│   └── ui/
│       ├── GlassCard.tsx    # Carte glassmorphism animée
│       ├── MacroRing.tsx    # Anneau de progression calories
│       ├── MacroBar.tsx     # Barre progression macros
│       ├── NutriInput.tsx   # Input dark glass style
│       ├── FoodCard.tsx     # Cartes aliments/repas
│       └── SkeletonCard.tsx # Squelettes de chargement
├── hooks/
│   ├── useAuth.ts           # Hook authentification
│   ├── useProfile.ts        # Profil utilisateur
│   ├── useDailyLog.ts       # Journal + entrées repas
│   ├── useWeightLog.ts      # Historique poids
│   └── useFavorites.ts      # Aliments favoris
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Client navigateur
│   │   ├── server.ts        # Client serveur
│   │   └── middleware.ts    # Session middleware
│   ├── api/
│   │   └── openfoodfacts.ts # API Open Food Facts
│   └── utils.ts             # Utilitaires
├── providers/
│   └── AuthProvider.tsx     # Context authentification
├── types/
│   └── index.ts             # Types TypeScript complets
└── supabase/
    └── schema.sql           # SQL complet + RLS policies
```

---

## Déploiement Vercel

### 1. Push sur GitHub

```bash
git init
git add .
git commit -m "Initial NutriTrack"
git remote add origin https://github.com/ton-user/nutritrack.git
git push -u origin main
```

### 2. Importer sur Vercel

1. [vercel.com/new](https://vercel.com/new)
2. Importe depuis GitHub
3. Configure les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configurer Supabase pour la prod

Dans Supabase > Authentication > URL Configuration :
- Site URL : `https://ton-app.vercel.app`
- Redirect URLs : `https://ton-app.vercel.app/**`

---

## Fonctionnalités

### Dashboard
- Anneau de progression calories animé
- Barres de macros (protéines, glucides, lipides)
- Poids actuel + évolution
- Résumé repas du jour

### Scanner
- Scan EAN-8 / EAN-13 via caméra
- Recherche textuelle Open Food Facts
- Ajustement quantité avec stepper
- Sélection repas (breakfast/lunch/dinner/snack)
- Ajout au journal instantané

### Journal alimentaire
- Navigation par date
- Organisation par repas
- Total calories du jour
- Suppression des entrées

### Suivi poids
- Ajout pesée avec note
- Graphique LineChart 30 derniers jours
- Tendance 7 jours
- Historique avec déltas

### Profil
- Modification toutes infos
- Recalcul objectifs automatique (Mifflin-St Jeor)
- Adapté par objectif (masse/sèche/maintien)

### Famille
- Création groupe avec code d'invitation
- Rejoindre par code
- Voir les membres

---

## Design System

Le design utilise :
- **Fond** : #0a0a0a (noir profond)
- **Glass cards** : `backdrop-blur-xl` + `rgba(255,255,255,0.05)`
- **Accent** : `#30D158` (Apple green)
- **Protéines** : `#0A84FF` (Apple blue)
- **Glucides** : `#BF5AF2` (Apple purple)
- **Lipides** : `#FF9F0A` (Apple orange)
- **Font** : SF Pro Display / system-ui
- **Radius** : 24px (cartes), 16px (inputs)
- **Animations** : Framer Motion spring

---

## Icônes PWA

Crée les icônes dans `public/icons/` :
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `apple-touch-icon.png` (180×180)

Tu peux utiliser [pwa-asset-generator](https://github.com/elegantapp/pwa-asset-generator).

---

## Licence

MIT

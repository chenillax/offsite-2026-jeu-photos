# ☀️ Le jeu du Voyage 2026

Web app (mobile) du jeu des invités pour le mariage du 27 juin 2026.

Les invités se sélectionnent dans une liste, réalisent 5-6 défis en
prenant des photos, suivent le **classement** en temps réel et un **feed live**
des dernières photos (façon Flash Invaders). Gagnant = le premier à finir tous
les défis.

**Stack** : Next.js 16 · React 19 · Tailwind CSS v4 · Supabase (base + temps réel
+ stockage) · déploiement Vercel.

---

## 🚀 Mise en route (à faire dans l'ordre)

### 1. Créer le projet Supabase (gratuit)

1. Va sur https://supabase.com → crée un compte → **New project**.
2. Note le mot de passe de la base (tu n'en auras pas besoin pour l'app).
3. Une fois le projet prêt : menu **SQL Editor** → **New query**.
4. Copie-colle **tout** le contenu de [`supabase/schema.sql`](supabase/schema.sql)
   → clique **Run**. (Crée les tables, la sécurité et le bucket photos.)
5. Ouvre [`supabase/seed.sql`](supabase/seed.sql), **remplace les exemples** par
   tes vrais invités / défis, puis colle-le dans une nouvelle query
   → **Run**.

### 2. Récupérer les clés

Dans Supabase : **Project Settings → API**. Tu as besoin de :

- **Project URL**
- clé **anon / public**
- clé **service_role** (secrète !)

### 3. Configurer l'app en local

```bash
cp .env.local.example .env.local
```

Ouvre `.env.local` et colle tes 3 valeurs. (Ce fichier n'est jamais commité.)

### 4. Lancer en local

```bash
npm run dev
```

Ouvre http://localhost:3000.

**Tester sur ton téléphone** (même WiFi) : lance `npm run dev`, repère ton IP
locale (ex. `192.168.1.20`) et ouvre `http://192.168.1.20:3000` sur le mobile.

---

## ☁️ Déploiement sur Vercel (pour le jour J)

1. Crée un dépôt sur GitHub et pousse ce projet.
2. Va sur https://vercel.com → **Add New → Project** → importe le dépôt.
3. Dans **Settings → Environment Variables**, ajoute les **3 mêmes variables**
   que dans `.env.local`.
4. **Deploy**. Vercel te donne une URL publique à partager aux invités
   (idéalement via un QR code sur les tables).

---

## 🗂️ Structure du projet

```
app/            pages + routes API (start, complete)
components/     écrans et composants (AuthFlow, GameShell, panneaux…)
lib/            clients Supabase, session, compression photo, helpers
supabase/       schema.sql (structure) + seed.sql (données à remplir)
```

## 🔒 Sécurité (en bref)

- Le navigateur ne peut que **lire** ; il ne reçoit jamais les réponses secrètes.
- Toutes les écritures (arrivée dans le jeu, validation de défi) passent par des **routes API
  serveur**. Voir les commentaires dans `supabase/schema.sql`.

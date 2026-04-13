
---
<!-- source: stack-ref/ai/openrouter.md -->
---

# OpenRouter

> _Routeur multi-modèles LLM — une API, tous les providers._

> ⭐ **Choix actuel** pour tout ce qui est LLM text/chat.

## Ce que c'est

API unifiée qui route vers 200+ modèles LLM (Anthropic Claude, OpenAI GPT, Google Gemini, Meta Llama, Mistral, DeepSeek...). Une seule clé API, un seul format (OpenAI-compatible), tous les providers. Permet de switcher de modèle sans changer le code.

## Pricing

Pay-as-you-go, prix par token selon le modèle. OpenRouter prend une petite marge sur certains providers.

### Exemples de prix (input/output per 1M tokens)
| Modèle | Input | Output |
|--------|-------|--------|
| Claude Sonnet 4.5 | ~$3 | ~$15 |
| GPT-4o | ~$2.50 | ~$10 |
| Llama 3.3 70B | ~$0.40 | ~$0.40 |
| DeepSeek V3 | ~$0.14 | ~$0.28 |
| Gemini 2.0 Flash | ~$0.10 | ~$0.40 |

> Vérifier [openrouter.ai/models](https://openrouter.ai/models) pour les prix à jour.

## Features clés

- API OpenAI-compatible (`/chat/completions`)
- **Fallback automatique** entre modèles (si un provider est down)
- **Load balancing** entre providers
- Routing conditionnel (prix max, latence, contexte)
- Dashboard usage par modèle
- Clé API unique pour tous les providers
- Streaming SSE

## ✅ Quand utiliser

- Besoin d'accéder à plusieurs modèles sans gérer N clés API
- Flexibilité : tester différents modèles, switcher selon le coût
- Fallback résilience en production
- Accès aux modèles open-source (Llama, Mistral, DeepSeek)

## ❌ Quand ne PAS utiliser

- Besoin de features spécifiques providers (Anthropic computer use direct, OpenAI Realtime Audio) → API directe
- SLA enterprise garanti → API directe du provider

## Combinaisons stack
- `OpenRouter + Vercel AI SDK` → abstraction complète multi-modèle
- `OpenRouter + cc-hub` → routing LLM centralisé dans l'écosystème

## Ressources
- [openrouter.ai](https://openrouter.ai)
- [openrouter.ai/models](https://openrouter.ai/models)

---
<!-- source: stack-ref/ai/pyo.md -->
---

# Pyo (Génération image/vidéo)

> _Service de génération d'images et vidéos par IA — utilisé en production dans l'écosystème Julien._

## Ce que c'est

Pyo est un service de génération de médias par IA (images, vidéos). Utilisé comme couche de génération visuelle dans les workflows AI-assisted, complémentaire à OpenRouter pour le texte.

## Cas d'usage typiques

- Génération d'images pour des apps ou des contenus
- Génération vidéo à partir de prompts
- Intégration dans des pipelines automatisés (n8n, cc-hub)

## ✅ Quand utiliser

- Besoin de génération d'images dans un workflow automatisé
- Intégration via API dans une app ou un pipeline

## ❌ Quand ne pas utiliser

- Génération de texte / code → OpenRouter
- Besoin de modèles d'images très spécialisés → Replicate

## Alternatives

| Service | Note |
|---------|------|
| Replicate | Accès à des centaines de modèles spécialisés image/vidéo/audio |
| Fal.ai | Génération rapide, bonne API, modèles Flux/SD |
| OpenAI DALL-E | Images uniquement, qualité élevée |
| Stability AI | Stable Diffusion managé |

## Ressources

- Documentation Pyo : à référencer lors de l'analyse du service

---
<!-- source: stack-ref/databases/turso.md -->
---

# Turso (libSQL)

> _SQLite à l'edge — latence microseconde, multi-tenant, réplication globale._

## Ce que c'est

Turso est un service de base de données managé basé sur **libSQL** (fork open-source de SQLite par Turso). Architecture diskless sur S3 Express + multi-tenant massif. Idéal pour le pattern "1 DB par tenant". Fondé par Glauber Costa (ex-ScyllaDB). Infrastructure basée sur AWS, migré depuis Fly.io en 2024.

**libSQL** est un fork compatible SQLite avec extensions : writes concurrents, HTTP API, réplication.

## Free Tier

| Métrique | Limite |
|---|---|
| Databases | 100 (actives) |
| Monthly Active Databases | 100 |
| Stockage total | 5 GB |
| Rows lus/mois | 500 millions |
| Rows écrits/mois | 10 millions |
| Syncs embarqués | 3 GB/mois |
| PITR (restauration) | 1 jour |

> Pas de carte bancaire requise pour le free tier.

## Pricing

### Free — $0/mois

### Developer — $4.99/mois _(ou $3.99/mois annuel)_

| Métrique | Inclus | Overage |
|---|---|---|
| Active DBs | 500 | +$0.20/DB/mois |
| Stockage | 9 GB | +$0.75/GB |
| Rows lus | 2.5 milliards | +$1/milliard |
| Rows écrits | 25 millions | +$1/million |
| Syncs | 10 GB | +$0.35/GB |
| PITR | 10 jours | — |

### Scaler — $24.92/mois _(ou ~$19.99/mois annuel)_

| Métrique | Inclus | Overage |
|---|---|---|
| Active DBs | 2 500 | +$0.05/DB/mois |
| Stockage | 24 GB | +$0.50/GB |
| Rows lus | 100 milliards | +$0.80/milliard |
| Rows écrits | 100 millions | +$0.80/million |
| Syncs | 24 GB | +$0.25/GB |
| PITR | 30 jours | — |

### Pro — $416.58/mois

Pour les workloads massifs : 250B rows lus inclus, SSO, BYOK, HIPAA, SOC2.

### 💡 Exemples de calcul

- **Side-project, 10 users, DB active 3h/jour** → Free tier suffit
- **App multi-tenant 200 tenants, ~1GB data** → Developer $4.99/mo
- **SaaS 2000 tenants, 10GB data, usage modéré** → Scaler ~$25/mo

## 📊 Coût estimé par palier d'utilisateurs

> **Hypothèses** : app SaaS · 20% MAU · ~100 req DB/utilisateur actif/jour · 80% lectures / 20% écritures

| Palier | MAU | Req/mois | Coût estimé | Plan | Notes |
|--------|-----|----------|-------------|------|-------|
| **5k users** | 1k | ~3M | **$0–5/mo** | Free / Developer | Très largement dans le free tier |
| **15k users** | 3k | ~9M | **$5/mo** | Developer | 9M lus << 2.5B inclus |
| **50k users** | 10k | ~30M | **$5/mo** | Developer | 30M lus << 2.5B inclus |
| **100k users** | 20k | ~60M | **$5/mo** | Developer | 60M lus << 2.5B inclus |
| **300k users** | 60k | ~180M | **$25/mo** | Scaler | Écrits (36M) couverts par Scaler (100M inclus) |
| **1M users** | 200k | ~600M | **$25–40/mo** | Scaler | 600M lus << 100B inclus · écrits overage ~$16 |

> 🏆 **Rapport qualité/prix exceptionnel** : Turso est l'option SQL la moins chère à toutes les échelles grâce au billing par rows et non par compute. À 1M users, ~$40/mo là où Neon ou Supabase dépassent $300-500/mo.

## Performances

| Métrique | Valeur |
|---|---|
| Latence (même région) | < 1ms |
| Latence (replica edge) | 1–10ms |
| Pas de cold start | ✅ (architecture multi-tenant) |
| Réplication | 3 à 6+ régions selon plan |

## ✅ Quand utiliser

- Architecture **database-per-tenant** (1 SQLite = 1 client)
- App mobile avec embedded replica (offline writes)
- Edge computing nécessitant du SQL
- Prototype nécessitant SQLite en prod managée
- Données géographiquement distribuées (faible latence par région)

## ❌ Quand ne PAS utiliser

- Workloads PostgreSQL complexes (pas de full SQL compatibility)
- Requêtes analytiques lourdes / JOIN complexes
- Besoin de Postgres extensions (pgvector, PostGIS, etc.)
- Équipe déjà experte en Postgres → préférer Neon/Supabase

## Combinaisons stack optimales

- **SaaS multi-tenant edge** → `Turso + Cloudflare Workers + Drizzle ORM`
- **App mobile local-first** → `Turso embedded replica + libSQL`
- **Side-project solo** → `Turso free + Bun + Hono`

## Alternatives directes

| Alternative | Différence clé |
|---|---|
| Cloudflare D1 | SQLite dans Workers, mais lié à Cloudflare |
| SQLite self-hosted | Gratuit mais pas de réplication managée |
| Neon | PostgreSQL, plus de features SQL, scale-to-zero |
| Supabase | BaaS complet, Postgres, plus cher |

## Ressources

- [Documentation](https://docs.turso.tech)
- [Pricing officiel](https://turso.tech/pricing)
- [libSQL GitHub](https://github.com/tursodatabase/libsql)

---
<!-- source: stack-ref/frontend/cli.md -->
---

# CLI Tools

## Go — Recommandation principale

**Le meilleur choix pour un CLI qui fait des requêtes HTTP, de l'orchestration, ou de la manipulation de fichiers.**

- Compile en binaire statique sans dépendances (`CGO_ENABLED=0`)
- Cross-compilation triviale : `GOOS=windows GOARCH=amd64 go build` depuis macOS
- Temps de compilation rapide (secondes)
- Écosystème CLI excellent :
  - `cobra` — framework de commandes (sous-commandes, flags, autocomplete)
  - `bubbletea` — TUI interactifs (listes, spinners, formulaires terminal)
  - `lipgloss` — styling terminal (couleurs, borders, layout)
  - `viper` — gestion de config (yaml/env/flags)
- Concurrence native (goroutines) — parfait pour du parallélisme dans un CLI

**Cas d'usage typiques** : CLI qui interroge des APIs, outil de déploiement, CLI de gestion de ressources cloud, outil d'automatisation.

### Exemple coût binaire final
| OS | Taille typique |
|----|---------------|
| macOS arm64 | ~8–12 MB |
| Linux amd64 | ~8–12 MB |
| Windows amd64 | ~9–13 MB |

---

## Bun / TypeScript — Recommandation si interne ou rapidité

Pertinent quand **le CLI est interne** (pas distribué) ou qu'on veut aller vite dans l'écosystème TypeScript.

- `bun build --compile` → binaire autonome (~60–80 MB, inclut le runtime Bun)
- Partage de code avec le reste du projet (libs TS, types, utils)
- Zéro nouvelle langue à apprendre
- `bun shell` (`$`) pour les opérations système — remplace bash

**Limite pour distribution** : binaire plus lourd, peut dépendre de glibc sur Linux selon la cible. Préférer Go pour une vraie distribution multiplateforme publique.

---

## Rust — Pour les cas extrêmes

Pertinent si le CLI fait du **parsing binaire, manipulation système bas niveau, ou que les performances à l'extrême comptent**.

- Performances maximales, zéro runtime
- `clap` — parsing d'arguments excellent
- Binaire statique possible avec `musl`
- Overkill pour un CLI qui fait des requêtes HTTP
- Courbe d'apprentissage élevée, temps de compilation long

**Quand vraiment utiliser** : CLI qui traite de gros volumes de données locales (parsing logs, compression, cryptographie), ou quand Go ne suffit pas (rare).

---

## Arbre de décision

```
CLI ?
├── Distribution publique multiplateforme → Go
├── Usage interne / même projet TS → Bun/TypeScript
└── Parsing binaire / perf extrême / système bas niveau → Rust
```

## Comparatif

| Critère | Go | Bun/TS | Rust |
|---------|----|----|------|
| Binaire multiplateforme | ✅ trivial | ⚠️ lourd | ✅ possible |
| Vitesse dev | ✅ rapide | ✅ très rapide | ❌ lent |
| Perf runtime | ✅ excellente | ✅ bonne | ✅ maximale |
| Partage code projet TS | ❌ | ✅ | ❌ |
| TUI interactif | ✅ bubbletea | ⚠️ libs tierces | ✅ ratatui |
| Courbe apprentissage | ✅ faible | ✅ nulle | ❌ élevée |

## Combinaisons stack
- `Go + cobra + bubbletea` → CLI public distribué avec TUI
- `Go + cobra + viper` → CLI avec config fichier + env
- `Bun + TypeScript + $shell` → outil interne dev, même repo que l'app
- `Rust + clap` → CLI de traitement de données intensif

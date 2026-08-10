# Administral

Un portail citoyen unifié pour accéder à plusieurs services publics avec un seul compte — interface agent et interface citoyen, assistant IA (RAG APL), et passerelle voix.

- Frontend: React + Vite + Tailwind + shadcn/ui
- Backend: FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL
- Vision (optionnel): microservice de détection de fraude/document

## Monorepo

```
frontend/         # App React (Vite, TS, Tailwind)
backend/          # API FastAPI (routes / services / repository)
vision_service/   # Service optionnel de vision (port 8011 par défaut)
docs/             # Notes d’architecture et de design
```

## Contexte du projet

Administral est un portail citoyen unifié pour accéder à plusieurs services publics avec un seul compte. Il propose deux espaces cohérents mais distincts:
- Espace citoyen (Administral): dépôt de pièces, suivi de dossier, assistant conversationnel (RAG APL) et panneau vocal.
- Espace agent (back‑office): validation des dossiers, contestations, contrôle documentaire (vision, optionnel).

Objectifs principaux:
- Réduire les frictions d’accès aux droits (APL en priorité) avec une expérience moderne et accessible.
- Offrir aux agents des outils de revue homogènes et traçables.
- Expérimenter des assistants IA transparents (sources citées) et sûrs.

## Assistants IA et agents

- Assistant conversationnel (RAG APL)
  - Sources officielles (service‑public.fr, caf.fr), citations intégrées.
  - Recherche hybride (BM25 + vecteurs) si activée; LLM Mistral pour la génération.
  - Surfaces: widget flottant (FloatingChatbot), page dédiée /chat, centre de documentation.

- Assistant vocal
  - Panneau flottant « Assistant vocal » (visiteurs et connectés), push‑to‑talk, arrêt de la synthèse.
  - Affiche le statut et le texte transcrit en direct.
  - Basé sur VoiceAssistantProvider (STT/TTS configurés via VOICE_* dans backend/.env).

- Assistant de profilage APL
  - Overlay plein écran guidé par règles déterministes; fallback LLM si nécessaire.
  - Écrit les réponses dans le profil citoyen.

- Vision (optionnel)
  - Microservice de détection de falsification/document (TruFor), exposé sur 8011.

## Architecture applicative (vue d’ensemble)

Frontend (frontend/)
- React + Vite + TypeScript + Tailwind + shadcn/ui; structure par features/.
- Design tokens et thèmes dans src/index.css, variantes citizen/agent.
- Chatbot: FloatingChatbot, ChatWindow, MessageBubble, SourceCitation.
- Voix: VoiceAssistantProvider, VoiceAssistantPanel, VoiceStatusStrip, VoicePageContext, voiceUiStore; lancement depuis FloatingActionBubbles (bulle « Assistant vocal »).

Backend (backend/)
- FastAPI: couches router → service → repository, schemas Pydantic v2, SQLAlchemy 2.
- Endpoints APL/RAG, documents, contestations; configuration via backend/.env (DB, Mistral, Voix, CORS, etc.).

Vision (backend/vision_service/)
- Service FastAPI indépendant (port 8011), requirements dédiés (CUDA/CPU selon l’hôte).

Données et index
- PostgreSQL comme source de vérité transactionnelle.
- Recherche: BM25 et/ou vecteurs (Qdrant) si activée; préchauffage possible.

Observabilité et qualité
- Lint/Typecheck front, tests backend (pytest). Hooks de design disponibles.

## Prérequis

- Node.js ≥ 18
- Python ≥ 3.11
- PostgreSQL ≥ 14
- (Recommandé) ffmpeg pour la passerelle voix
- (Optionnel) CUDA/cuDNN si vous utilisez la vision accélérée

## Démarrage rapide (dev)

Deux terminaux.

Backend:
```bash
cd backend
python -m venv .venv
.venv/Scripts/activate           # Windows
# source .venv/bin/activate      # macOS/Linux
pip install -r requirements.txt

cp .env.example .env             # renseigner DATABASE_PASSWORD, MISTRAL_API_KEY si dispo
psql -U postgres -c "CREATE DATABASE administral;"
alembic upgrade head

uvicorn app.main:app --reload
# API:    http://localhost:8000/api
# Docs:   http://localhost:8000/docs
# Health: http://localhost:8000/api/health
```

Frontend:
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173 (Vite)
```

Le proxy de dev Vite redirige automatiquement `/api/*` vers `http://localhost:8000` (voir `frontend/vite.config.ts`).

### Service vision (optionnel)

```bash
cd backend/vision_service
# Installez selon requirements-cuda.txt si GPU, sinon fallback CPU si prévu
python -m venv .venv && .venv/Scripts/activate
pip install -r requirements-cuda.txt
python app.py  # écoute sur 8011 (voir BACKEND .env FRAUD_VISION_ENDPOINT)
```

## Configuration

Copiez `backend/.env.example` vers `.env`. Variables importantes:

- Base de données: `DATABASE_HOST/PORT/NAME/USER/PASSWORD`
- CORS: `CORS_ORIGINS` (par défaut `http://localhost:5173`)
- Assistant IA (RAG APL):
  - `MISTRAL_API_KEY` (clé réelle non commitée)
  - `CHATBOT_BUDGET_JETONS_PAR_JOUR` — plafond global (par défaut OFF, mettez une valeur en prod)
  - `TRUST_PROXY_HEADERS` — 0 sans proxy, 1 derrière proxy (très important)
  - `CHATBOT_WARMUP` — 1 pour précharger les index (recommandé)
- Voix (passerelle):
  - `VOICE_API_KEY`, `VOICE_BASE_URL`, `VOICE_STT_MODEL`, `VOICE_TTS_MODEL`, `VOICE_TTS_VOICE`
- Frontend:
  - Dev: proxy Vite → aucune config
  - Prod: définissez `VITE_API_BASE_URL` si l’API est sur un autre domaine

## Architecture

Backend (FastAPI) suit une séparation stricte:
- router.py — E/S HTTP, pas de règles métier
- service.py — logique métier, orchestration
- repository.py — SQL uniquement
- models.py — entités SQLAlchemy; schemas.py — Pydantic v2

Les routeurs sont montés dans `app.main` (voir `backend/app/main.py`).

Frontend:
- Structure par “features/” avec composants UI (shadcn/ui) et Tailwind.
- Vite + TS + alias `@` → `src/`.

Contrat API:
- Réponses en camelCase, types alignés côté frontend (cf. backend/README.md).

## Données de démonstration

Un script `scripts/seed.py` (voir backend/README.md) charge des données synthétiques qui reproduisent fidèlement les fixtures frontend.

## Tests

Backend:
```bash
cd backend
pytest
```

Frontend:
```bash
cd frontend
npm run typecheck
npm run lint
```

## Production

Backend:
- Uvicorn unique worker tant que le magasin vectoriel est embarqué (Qdrant lock).
- Configurez le budget de jetons et `TRUST_PROXY_HEADERS` selon la topologie.
- Exposez `/api/*`.

Frontend:
```bash
cd frontend
npm run build
npm run preview    # ou servez dist/ derrière un CDN
```
Définissez `VITE_API_BASE_URL` si l’API est sur un domaine différent.

## Sécurité

- Les endpoints `/api/agent/*` sont actuellement non authentifiés (développement). Ajoutez le garde d’auth dans `backend/app/core/security.py` avant tout déploiement partagé.


## Dépannage

- `psql: command not found` (Windows): appelez `psql.exe` par son chemin complet ou ajoutez-le au PATH.
- L’assistant reste en BM25 seul: vérifiez les logs de warmup et la présence de `MISTRAL_API_KEY`.
- CORS: utilisez le proxy Vite en dev; en prod, ajustez `CORS_ORIGINS` et `VITE_API_BASE_URL`.

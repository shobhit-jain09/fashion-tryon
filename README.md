# AI Fashion Try-On App (iOS + Shopping)

Production-ready starter architecture for an app that:
- captures or uploads a user photo
- applies fashion outfits using an AI virtual try-on pipeline
- shows shoppable products from partner stores
- redirects to secure checkout links from inside the app

## Recommended Stack

- Mobile app: React Native (Expo) for fast iOS deployment
- Backend API: FastAPI (Python)
- Database: PostgreSQL (Supabase/Neon or self-hosted)
- Object storage: S3-compatible bucket for images
- AI virtual try-on: external model provider (Replicate/FAL/Segmind)
- Auth: Clerk/Firebase Auth/Supabase Auth
- Payments: deep links to merchant checkout (Shopify/WooCommerce/Affiliate links)

## Project Structure

```text
fashion-tryon-app/
  apps/
    mobile/              # Expo iOS app
    web/                 # Web UI demo (HTML/JS) mounted at /ui
  services/
    api/                 # FastAPI backend
  AGENT_PROMPT.md        # Exact agent prompt for coding automation
  .env.example
```

## Quick Start

1) Backend

```bash
cd services/api
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010
```

2) Mobile app

```bash
cd apps/mobile
npm install
npx expo start
```

3) Web UI (browser) — talks to the same API

Start the backend, then open:

- [http://127.0.0.1:8010/ui/](http://127.0.0.1:8010/ui/)

You can call **Health**, **Provider status**, upload an image, run **Generate outfit**, and open product buy links.

If you only open the HTML file (`file://`), set **API base** in the page header to `http://127.0.0.1:8010` and click **Save**.

### “Page not working” / blank browser

1. **Start the backend first** (nothing will load until it is running).
2. Open **exactly** (note trailing slash on `/ui/`):
   - API home: [http://127.0.0.1:8010/](http://127.0.0.1:8010/) — you should see JSON with `"web_ui": "/ui/"`.
   - Health: [http://127.0.0.1:8010/health](http://127.0.0.1:8010/health) — should be `{"status":"ok"}`.
   - Web UI: [http://127.0.0.1:8010/ui/](http://127.0.0.1:8010/ui/).
3. Run **uvicorn from `services/api`** so uploads and static paths resolve (see commands below).
4. If `/ui/` returns 404, confirm the folder `apps/web` exists next to `services/` in the repo and restart the server.

5) Configure environment

- Copy `.env.example` values to:
  - `services/api/.env`
  - `apps/mobile/.env` (Expo: `EXPO_PUBLIC_*` vars)

## API Flow

1. Mobile uploads user photo -> `POST /v1/try-on/upload`
2. Mobile creates job -> `POST /v1/try-on/request`
3. Backend simulates queued -> processing -> completed states
4. Mobile polls `GET /v1/try-on/{job_id}`
5. Backend returns generated image URL + mapped products
6. Mobile opens `purchase_url` in in-app browser or external browser

## Real AI Provider (Replicate)

Backend supports two modes:
- `AI_PROVIDER=mock` -> local demo behavior
- `AI_PROVIDER=replicate` -> live provider calls

Set these in `services/api/.env`:

```bash
AI_PROVIDER=replicate
AI_PROVIDER_API_KEY=r8_...
REPLICATE_MODEL_VERSION=<replicate_model_version_id>
```

How it works:
- `POST /v1/try-on/request` creates a Replicate prediction
- `GET /v1/try-on/{job_id}` fetches prediction status/output
- Completed prediction output URL is returned as `generated_image_url`

Provider validation endpoint:
- `GET /v1/provider/status` returns provider config readiness (selected provider, key/model availability, warnings)

## Apple Store Readiness Checklist

- Add `NSCameraUsageDescription` and photo library permissions in `app.json`
- Add privacy policy + terms URL in app settings
- Moderate generated content and block unsafe prompts
- Never store card details in app unless you are PCI-compliant
- Add analytics + crash reporting (Sentry/Firebase Crashlytics)

## Current Repository

This code is connected to:
- [shobhit-jain09/fashion-tryon](https://github.com/shobhit-jain09/fashion-tryon)

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
    api/                 # FastAPI backend (+ app/data/catalog.json curated outfits)
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

### Configure environment

- Copy `.env.example` values to:
  - `services/api/.env`
  - `apps/mobile/.env` (Expo: `EXPO_PUBLIC_*` vars)

## API Flow

1. (Optional) Client loads outfits -> `GET /v1/catalog?category=casual&limit=20`
2. Mobile uploads user photo -> `POST /v1/try-on/upload`
3. Mobile creates job -> `POST /v1/try-on/request` (optional `selected_product` with garment image + purchase URL)
4. Backend simulates queued -> processing -> completed states (or Replicate live)
5. Mobile polls `GET /v1/try-on/{job_id}`
6. Backend returns generated image URL + products (Myntra/Flipkart-style links)
7. Mobile opens `purchase_url` in browser

## Myntra, Flipkart, and “real” dresses

- **Myntra** does not publish an open product API for third-party apps. Legitimate options are **partner/affiliate programs**, **manual curation**, or **your own merchandising feed**. This repo ships `services/api/app/data/catalog.json`: replace entries with **real PDP URLs and images** from your own sourcing or affiliate tools (do not scrape their site against their terms).
- **Flipkart** offers an **[Affiliate API](https://affiliate.flipkart.com/api-docs/)** for search and feeds. Set `FLIPKART_AFFILIATE_ID` and `FLIPKART_AFFILIATE_TOKEN` in `services/api/.env`, then use:
  - `GET /v1/catalog/flipkart-search?q=anarkali+kurta`
  - or `GET /v1/catalog?category=casual&flipkart_query=dress` (merges local + Flipkart results when credentials work)

Try-on quality depends on your **Replicate model**: many virtual try-on models expect **person + garment image**. The backend sends `garment` from the selected catalog item when you pass `selected_product` or a matching `selected_product_id`.

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

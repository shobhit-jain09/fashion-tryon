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

3) Configure environment

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

## Apple Store Readiness Checklist

- Add `NSCameraUsageDescription` and photo library permissions in `app.json`
- Add privacy policy + terms URL in app settings
- Moderate generated content and block unsafe prompts
- Never store card details in app unless you are PCI-compliant
- Add analytics + crash reporting (Sentry/Firebase Crashlytics)

## Current Repository

This code is connected to:
- [shobhit-jain09/fashion-tryon](https://github.com/shobhit-jain09/fashion-tryon)

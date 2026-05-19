# GrillSync Cloud

Multi-branch restaurant cloud dashboard. Receives sales data from locally hosted POS systems and aggregates analytics (revenue, profit, best sellers, branch comparison) across all branches.

**Stack:** Next.js 15 (App Router) · MongoDB Atlas + Mongoose · JWT auth · Cloudinary (receipts) · Tailwind · Recharts · Axios. Deploys as a single project to Vercel.

---

## Local development (VS Code)

```bash
cp .env.example .env.local
# fill MONGODB_URI, JWT_SECRET, and (optional) CLOUDINARY_* + SEED_TOKEN
npm install
npm run dev          # http://localhost:3000
```

`.env.local` example:
```
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/grillsync
JWT_SECRET=any-long-random-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SEED_TOKEN=dev-seed-token
```

### Seed demo data (optional)

With `SEED_TOKEN` set:
```bash
curl -X POST "http://localhost:3000/api/seed?token=dev-seed-token"
# Login:  demo@grillsync.app  /  demo1234
```

---

## Deploy to Vercel

1. Push this folder to a Git repo.
2. Vercel → New Project → import the repo.
3. Set environment variables (same as `.env.local`, **without** `SEED_TOKEN` unless you want demo seeding in prod).
4. Deploy. The `/api/*` routes run as Vercel serverless functions; the rest is static / RSC.

MongoDB Atlas: whitelist `0.0.0.0/0` (Vercel functions have no fixed IP) or use Atlas's Vercel integration.

---

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/register`, `/register/success` | Owner + first-branch registration; one-time API Secret reveal |
| `/login` | JWT login (token stored in `localStorage`) |
| `/dashboard` | KPI cards, revenue trend, hourly bars, best sellers, branch comparison. Branch filter + Today/7d/30d/90d + Refresh button |
| `/branches` | List + add branches; new branches show fresh credentials once |
| `/orders` | Paginated, searchable, branch/date filtered |
| `/expenses` | CRUD with category + Cloudinary receipt upload; feeds profit analytics |

## API

Auth (Bearer JWT):
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET  /api/auth/me`
- `GET  /api/branches` · `POST /api/branches` · `PATCH/DELETE /api/branches/[id]`
- `GET  /api/orders`
- `GET  /api/expenses` · `POST /api/expenses` · `DELETE /api/expenses?id=…` · `POST /api/expenses/upload`
- `GET  /api/analytics/summary` · `revenue-trend` · `best-sellers` · `branches`

Public ingestion (branch credentials, no JWT):
- **`POST /api/sync/batch`** — HMAC-signed, used by the existing Jonel's POS
- `POST /api/sync/upload` — simpler alias using `x-api-key` + `x-api-secret`

---

## POS sync contract (matches existing POS)

The existing POS (`server/sync/syncService.js`) already POSTs to `/sync/batch`
with HMAC-signed payloads. **This cloud honors that exact contract**, so the
only change needed in the POS `.env` is the `CLOUD_SYNC_URL`:

```
CLOUD_SYNC_URL=https://<your-vercel-app>.vercel.app/api
CLOUD_SYNC_API_KEY=<branch.apiKey from registration>
CLOUD_SYNC_SECRET=<branch.apiSecret — shown ONCE>
CLOUD_RESTAURANT_ID=<restaurant.restaurantId>
CLOUD_BRANCH_ID=<branch.branchId>
```

> The POS calls `${CLOUD_SYNC_URL}/sync/batch`. Setting `CLOUD_SYNC_URL` to
> `https://app.vercel.app/api` resolves to `/api/sync/batch` here. ✅

Headers the POS sends:
```
X-Api-Key:       <branch.apiKey>
X-Restaurant-Id: <restaurant.restaurantId>
X-Timestamp:     <ms-since-epoch>
X-Signature:     HMAC_SHA256( sha256(plainSecret) , `${ts}.${body}` )
```

Body:
```json
{ "restaurantId":"…", "branchId":"…", "sentAt":"…",
  "records":[{ "id":"…","entity":"order","entityId":"…","op":"upsert","payload":{…},"createdAt":"…"}] }
```

Response:
```json
{ "accepted":[{"id":"<localQueueId>","cloudId":"<mongo _id>"}] }
```

### Why we keep HMAC instead of the spec's plain key/secret

Your brief asked for plain `x-api-key` / `x-api-secret` headers. The deployed POS already signs requests, and HMAC is **strictly more secure** than shipping the secret on every request. To avoid touching the POS, the cloud:
- accepts the POS's existing HMAC contract on `/api/sync/batch`
- also exposes a simpler `/api/sync/upload` (plain key+secret) for future clients

**API Secret is shown once.** Only `sha256(secret)` is stored, which doubles as the HMAC key (matching `syncService.js`).

### Idempotency

Orders are upserted on `(branchId, orderId)`. Re-sending the same record is a no-op.

---

## Profit formula

`profit = revenue − expenses` per the spec. No inventory costing.

## Project layout

```
app/
  api/…              REST endpoints
  (dashboard)/…      authed pages (layout enforces JWT in localStorage)
  register, login, …
components/dashboard/
lib/                 mongodb, jwt, auth, crypto (HMAC), cloudinary, axios client
models/              Mongoose schemas
```

## What's intentionally NOT here

No Socket.io · no SSE · no Redis · no queues · no webhooks · no Docker · no microservices. Everything is REST + Mongo + JWT. Refresh buttons everywhere instead of realtime.

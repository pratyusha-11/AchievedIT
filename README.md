# AchievedIT

Your personal achievement registry — upload certificates (photo or PDF), fill details
in yourself or let AI extract them, then search and filter your whole collection.
Every user only ever sees their own certificates.

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS → **Vercel**
- **Backend:** Node.js + Express + MongoDB (Mongoose) → **Render**
- **Auth:** JWT in an httpOnly cookie (not localStorage — JavaScript can't read it, which
  closes off the most common way tokens get stolen via XSS)
- **File storage:** Cloudinary (certificate photos/PDFs) — never in MongoDB
- **AI extraction:** Groq (`qwen/qwen3.6-27b`, vision + JSON mode), called server-side only

```
achievedit-mern/
  backend/     Express API
  frontend/    React app
  render.yaml  Render blueprint (optional, one-click provisioning)
```

Every service on this stack is free, with **no time-boxed trial** — MongoDB Atlas M0,
Cloudinary Free, Groq's free tier, and Vercel Hobby are all "free forever" plans, not
14-day trials. The one exception is Render's free web service, which stays free forever
too but **spins down after 15 minutes of inactivity** (next request takes 30-60s to wake
it back up) — more on this below.

## Backend structure — why it's organized this way

```
backend/
  server.js                  entry point: env validation, DB connect, then listen
  src/
    app.js                   Express app: middleware + routes wired together
    config/env.js            fails fast on boot if required env vars are missing
    db/db.js                 MongoDB connection
    models/                  Mongoose schemas (user, certificate)
    routes/                  URL → controller mapping, one file per resource
    controllers/             request handling — thin, delegates to services
    services/                external integrations (Cloudinary, Groq) — swappable
    middleware/               auth, file upload, centralized error handling
    utils/asyncHandler.js     wraps controllers so errors reach the error handler
```

`routes → controllers → models/services`, one small file per responsibility. Adding a
feature (say, a "share portfolio" endpoint) means adding one route, one controller
function, and reusing existing models — nothing else needs to change. Swapping Cloudinary
for another storage provider later would mean editing only `storage.service.js`.

## What makes this production-ready, specifically

- **Fails fast on missing config** — `src/config/env.js` checks all required env vars on
  boot and exits with a clear message, instead of crashing mysteriously on the first
  request that needs a missing key.
- **Centralized error handling** — every controller is wrapped in `asyncHandler`, so a
  thrown error (bad DB write, Cloudinary hiccup, whatever) always reaches
  `error.middleware.js` and returns a clean JSON error instead of crashing the process
  or leaking a stack trace to the client.
- **Rate limiting** — a light app-wide limiter, plus tighter limits on `/api/auth/*`
  (brute-force protection) and `/api/certificates/extract` (this one calls Groq — worth
  protecting so one user can't burn your whole app's free-tier quota).
- **helmet + compression** — standard security headers, and gzip'd responses to stay
  further under Render/Vercel's free bandwidth caps as traffic grows.
- **Health check** — `GET /api/health`, wired as Render's health-check path so Render
  knows to restart the service if it ever gets stuck.
- **Graceful shutdown** — `SIGTERM` lets in-flight requests finish instead of dying
  mid-response on every redeploy.

## Free-tier planning — the part you specifically asked about

**MongoDB (Atlas M0): 512MB, free forever, no time limit.** Only certificate *metadata*
lives here (text fields) — tiny. At realistic scale (thousands of certificates) you'd
use a low single-digit percentage of this. Not a concern for a long time.

**Cloudinary (Free): 25 credits/month**, where 1 credit = 1GB storage OR 1GB bandwidth OR
1,000 transformations, drawn from one shared pool. This is the tier to actually watch —
and **bandwidth (viewing), not storage, is usually what runs out first** as traffic
grows, because every certificate view costs bandwidth but only counts against storage
once. Two things in this codebase specifically address that:
1. **Client-side compression before upload** (`src/lib/compressImage.ts`) — resizes
   photos to a max of 1600px and re-encodes as JPEG before they ever leave the browser.
   Typical phone photos are 3-8MB; this gets them down to a few hundred KB with no
   visible quality loss for a certificate. Cuts both storage and every future view's
   bandwidth, for free, on upload.
2. **Auto-format/auto-quality delivery** (`storage.service.js` → `toOptimizedUrl`) —
   every image is served through Cloudinary's `f_auto,q_auto` transformation, which
   picks the smallest acceptable format/quality per viewer automatically (e.g. AVIF/WebP
   instead of JPEG where supported). Same stored file, smaller file actually sent.

**Render (free web service): 750 hours/month, spins down after 15 min idle.** This is
the real UX tradeoff of staying fully free: if nobody's used the app in a while, the
*next* person's first request takes 30-60 seconds while it wakes up. For a personal
project or early multi-college use this is a fair trade for $0/month. If it ever bothers
you, the fix is a $7/month Render instance — no code changes needed either way.

**Vercel Hobby: 100GB bandwidth/month.** Comfortable for a static frontend at this scale.

**Bottom line:** you can run this for real users at $0/month for a good while. The
thing worth actually watching (via each platform's usage dashboard, occasionally) is
Cloudinary bandwidth — not because it's close to a problem now, but because it's the
one that has the least headroom of the four.

## 1. MongoDB Atlas

Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com), add a
database user, allow network access from anywhere (0.0.0.0/0 is fine here), copy the
connection string.

## 2. Cloudinary

Free account at [cloudinary.com](https://cloudinary.com). Cloud name, API key, and API
secret are on the dashboard homepage.

**One required setting for PDFs to actually open (not just photos):** Cloudinary blocks
PDF/ZIP delivery by default on free accounts, as an anti-abuse measure. Go to
**Settings → Security → "PDF and ZIP files delivery"** and enable **"Allow delivery of
PDF and ZIP files."** Without this, PDF certificates upload fine but return an error
when viewed. Photo certificates (JPG/PNG/WEBP) are unaffected either way.

## 3. Groq (optional — only needed for "Extract with AI")

Free key at [console.groq.com/keys](https://console.groq.com/keys). Leave it unset and
the app degrades gracefully — manual entry still works, the AI button just won't.

## 4. Backend — local setup

```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, Cloudinary keys, GROQ_API_KEY
npm install
npm run dev
```

API runs on `http://localhost:5000`.

## 5. Frontend — local setup

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api for local dev
npm install
npm run dev
```

## 6. Deploying — Render (backend) first, then Vercel (frontend)

**Step 1 — backend on Render**
1. Push this repo to GitHub.
2. On Render, either use **New → Blueprint** and point it at this repo (it'll read
   `render.yaml` and set most of it up automatically), or create a Web Service manually
   with root directory `backend`, build command `npm install`, start command `npm start`.
3. Fill in the env vars from step 4 above. For `CLIENT_URL`, use a placeholder for now.
4. Deploy. Copy the live URL Render gives you (e.g. `https://achievedit-backend.onrender.com`).

**Step 2 — frontend on Vercel, pointed at that backend**
1. Import the `frontend` folder as a new Vercel project.
2. Set `VITE_API_URL` to your Render URL + `/api`.
3. Deploy. Copy the live URL Vercel gives you (e.g. `https://achievedit.vercel.app`).

**Step 3 — close the loop**
1. Back on Render → your service → Environment → update `CLIENT_URL` to the real Vercel
   URL from step 2.
2. Redeploy the backend.

## Shipping updates after this

Both Render and Vercel auto-deploy on every push to your connected branch — that's the
whole update workflow: **edit code → `git push` → both redeploy on their own.** Frontend
and backend are fully independent deployments; changing one never requires redeploying
or even touching the other, since they only ever talk over the versioned `/api/*` HTTP
contract. If you rename or restructure an API response shape, update the matching spot
in `frontend/src/types.ts` and the relevant page/component — nothing else in either
codebase needs to know.

## How auth and privacy actually work

- Passwords are hashed with bcrypt — never stored in plain text.
- Login/register sets a signed JWT in an **httpOnly** cookie (30-day expiry) — client-side
  JavaScript literally cannot read it, which closes off the most common token-theft path
  (a malicious script reading `localStorage`).
- In production the cookie is `SameSite=None; Secure` (required for the cross-site
  Vercel↔Render setup); locally it relaxes to `SameSite=Lax` since that combination
  doesn't work over plain `http://localhost`. This switches automatically based on
  `NODE_ENV`.
- Every certificate document has a `user` field. The `authUser` middleware decodes the
  cookie on every protected route, and every database query is scoped to
  `{ user: req.userId }` in the controller itself — one user can never reach another
  user's data, enforced at the query level, not just hidden in the UI.
- The Groq key lives only in backend env vars. The AI-extraction request goes
  browser → your backend → Groq → back to your backend → browser; the key never reaches
  the client. Extraction works on photo certificates (JPG/PNG/WEBP); PDFs fall back to
  manual entry since Groq's vision model takes images only.

## Feature roadmap (not built yet)

- Bulk upload with a review queue
- Shareable public portfolio page
- Resume-bullet generator from stored certificates
- College-form export (CSV/DOCX) for a selected set of certificates
- Duplicate detection on upload

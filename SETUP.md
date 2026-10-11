# Setup Guide — The Journeymen Collective App

## Step 1: Install Node.js

1. Go to [nodejs.org](https://nodejs.org)
2. Download and install the **LTS version** (the green button)
3. Restart your terminal after installing

## Step 2: Install dependencies

Open Terminal, navigate to this folder, and run:

```bash
cd "/Users/robertgrover/Illuminate App"
npm install
```

## Step 3: Run the app locally

```bash
npm run dev
```

Then open your browser to: **http://localhost:3000**

You'll see the login page. Enter any email + password to enter the demo.

---

## Step 4: Connect Bunny.net Videos

In `src/lib/mockData.ts`, replace `YOUR_LIBRARY_ID` and `YOUR_VIDEO_ID_X` 
with your real Bunny.net library and video IDs.

Your Bunny.net Library ID is found in:
**Bunny.net Dashboard → Stream → Your Library → Library ID**

Each video has a unique Video ID shown in the video details.

---

## Step 5: Connect Supabase (real auth & database)

1. Create a free project at [supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local`
3. Fill in your Supabase URL and anon key (found in Supabase → Settings → API)

---

## Step 6: Deploy to Vercel

1. Create a free account at [vercel.com](https://vercel.com)
2. Install Vercel CLI: `npm install -g vercel`
3. Run: `vercel`
4. Follow the prompts — it auto-deploys!
5. Point `thejourneymencollective.app` to your Vercel deployment in your domain settings

---

## What's been built (Phase 1)

- Login page with Journeymen Collective branding
- Dashboard with stats, continue watching, and categories
- Full video library with search and category filtering
- Video player page with Bunny.net embed support
- Progress tracking (currently using demo data)
- Clean dark gold theme throughout

## What's coming (Phase 2)

- Real user accounts via Supabase
- Actual progress tracking saved to database
- Admin panel to add/manage videos without coding
- Community / private social feed
- AI-powered client summaries
- Mobile app (iOS + Android)

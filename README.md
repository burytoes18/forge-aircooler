# Forge — Hardware Research Workspace

A research workbench for the radiator-principle air cooler project. Ask questions, run structured workflows, get cited, domain-tagged answers. Built on Next.js, Supabase, and the Anthropic API.

---

## What you need before starting

1. A computer with [Node.js](https://nodejs.org/en/download) installed (version 18 or higher)
2. An Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com) (you'll need to add a payment method; typical research session costs ₹20–80)
3. A Supabase account — free at [supabase.com](https://supabase.com)
4. A Vercel account — free at [vercel.com](https://vercel.com)
5. A GitHub account — free at [github.com](https://github.com) (Vercel deploys from GitHub)

---

## Step 1 — Set up Supabase (your database)

Supabase stores all your research: deliverables, benchmarks, workflow runs, the project brief.

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → New project
2. Give it a name (e.g. `forge-cooler`) and a strong password → Create project
3. Wait 1–2 minutes for it to spin up
4. Go to **Project Settings → API** and copy three values:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → this is your `SUPABASE_SERVICE_ROLE_KEY`  
     *(keep the service_role key private — it has full database access)*
5. Go to **SQL Editor** in the left sidebar
6. Click **New query**, paste the entire contents of `supabase/migrations/0001_init.sql`, click **Run**
7. You should see "Success" — this created all the tables

---

## Step 2 — Run the app locally first

This lets you test everything before deploying.

**In your terminal:**

```bash
# 1. Go into the project folder
cd forge

# 2. Install dependencies
npm install

# 3. Copy the environment file template
cp .env.example .env.local
```

**Edit `.env.local`** and fill in your values:

```
ANTHROPIC_API_KEY=sk-ant-...          ← from console.anthropic.com
NEXT_PUBLIC_SUPABASE_URL=https://...  ← from Supabase settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... ← from Supabase settings
SUPABASE_SERVICE_ROLE_KEY=eyJ...     ← from Supabase settings
```

**Seed the database** (this populates benchmarks, workflows, and the project brief):

```bash
npm run seed
```

You should see:
```
✓ project_brief seeded
✓ workflow seeded: engineering-review
✓ workflow seeded: market-validation
✓ workflow seeded: unit-economics
✓ workflow seeded: regulatory-check
✓ workflow seeded: manufacturing-sourcing
✓ 7 benchmarks seeded
All seed data inserted successfully.
```

**Start the app:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the Forge home screen.

---

## Step 3 — Deploy to Vercel (so dad can use it from anywhere)

1. **Push to GitHub:**
   - Create a new repository on [github.com](https://github.com) (make it Private)
   - In your terminal:
     ```bash
     git init
     git add .
     git commit -m "initial commit"
     git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
     git push -u origin main
     ```

2. **Connect to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository" → select your repo
   - Framework preset: **Next.js** (auto-detected)

3. **Add environment variables** in Vercel:
   - Before clicking Deploy, expand "Environment Variables"
   - Add each variable from your `.env.local`:
     - `ANTHROPIC_API_KEY`
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - Click **Deploy**

4. **Wait 2–3 minutes** — Vercel builds and deploys automatically
5. You'll get a URL like `https://forge-cooler.vercel.app` — that's your app, live

The seed script already ran locally against your Supabase database, so the deployed app will immediately show all benchmarks and workflows.

---

## How to use Forge

### Ask (for quick questions)
Click **Ask** in the sidebar. Type any question — engineering, market, financial, whatever. The agent searches the web for real sources, tags every claim with its confidence level (verified / estimate / assumption / needs expert), and returns a structured answer in 30–90 seconds.

### Run a Workflow (for deep research)
Click **Workflows** → pick one (e.g. Engineering Review) → fill in what you're researching → click **Draft a plan**. The agent proposes a numbered plan. Review it, then click **Approve & run**. The full deliverable appears in 2–5 minutes with all claims sourced.

### Benchmarks
Click **Benchmarks** to see the Grounding Reference table — key figures the agent always checks its answers against (AC cooling capacity, COP ranges, India market size, etc.). Click **Re-verify** on any row to search for an updated figure. You approve before anything saves.

### Project Brief
Click **Project Brief** to edit the product description, known unknowns, and agent rules. Changes take effect on the next query.

---

## Confidence tags — what they mean

| Tag | Meaning |
|-----|---------|
| ✓ Verified | The agent found a real source via web search in this session |
| Unverified | A source exists but the quality is low — treat with caution |
| Estimate | Calculated or interpolated — the agent explains how |
| Assumption | Logical inference — no data backing |
| **Needs expert** | A licensed engineer, lawyer, or specialist must confirm this |

**The "Needs expert" tag is the most important.** Engineering design choices and regulatory advice always need professional sign-off. The agent flags these so you know what to take to a consultant.

---

## Cost guide

- **Anthropic API:** Sonnet 4.6 model. A typical Ask query costs ~₹3–8. A full deep workflow (with 6–10 web searches) costs ~₹15–40. Web search adds $0.01 per search.
- **Supabase:** Free tier (500MB storage, 50,000 monthly active users). You will not exceed this.
- **Vercel:** Free Hobby tier. You will not exceed this.

---

## Troubleshooting

**"Missing Supabase env vars" error**
→ Your `.env.local` is missing or has wrong values. Double-check the three Supabase keys.

**"Missing ANTHROPIC_API_KEY" error**
→ Add the key to `.env.local` (local) or Vercel environment variables (deployed).

**Seed fails with "relation does not exist"**
→ You haven't run the SQL migration yet. Go to Supabase → SQL Editor, paste `0001_init.sql`, click Run.

**Workflow runs but returns no deliverable**
→ Check the Supabase dashboard (Table Editor → workflow_runs) for an error_message in the failed row.

**App deployed but shows blank data**
→ The seed ran against your local Supabase but Vercel points to the same Supabase URL, so data should appear. If not, run `npm run seed` again after confirming env vars are correct.

---

## File structure (for reference)

```
forge/
├── app/                     ← pages and API routes
│   ├── page.tsx             ← home dashboard
│   ├── ask/                 ← Ask surface
│   ├── workflows/           ← workflow registry + runner
│   ├── deliverables/        ← research output library
│   ├── benchmarks/          ← grounding reference table
│   ├── brief/               ← editable project brief
│   ├── settings/            ← setup guide + env reference
│   └── api/                 ← server-side API routes (AI calls go here)
├── components/              ← reusable UI pieces
├── lib/
│   ├── anthropic.ts         ← Anthropic SDK (server-only)
│   ├── prompts/             ← modular system prompt files
│   ├── workflows/           ← the 5 workflow specs (editable JSON)
│   ├── schemas/             ← data shape definitions (Zod)
│   └── supabase/            ← database clients
├── supabase/migrations/     ← run this once to create tables
├── seed/                    ← run once to populate initial data
└── .env.local               ← your private keys (never commit this)
```

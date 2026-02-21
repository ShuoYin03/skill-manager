# Repo Launcher — Deployment Guide

This guide walks you through setting up all external services and deploying everything end-to-end. All services used are **free tier**.

---

## Table of Contents

1. [GitHub Repository Setup](#1-github-repository-setup)
2. [Supabase Setup](#2-supabase-setup)
3. [Stripe Setup](#3-stripe-setup)
4. [Connect Stripe Webhook to Supabase](#4-connect-stripe-webhook-to-supabase)
5. [Deploy the Website (Vercel)](#5-deploy-the-website-vercel)
6. [Configure Electron App Keys](#6-configure-electron-app-keys)
7. [Build & Publish the Desktop App](#7-build--publish-the-desktop-app)
8. [End-to-End Verification](#8-end-to-end-verification)

---

## 1. GitHub Repository Setup

You need a GitHub repo to host releases (the download buttons on the website pull installers from GitHub Releases).

1. Create a new GitHub repository (e.g. `your-username/repo-launcher`)
2. Push the project code:
   ```bash
   git init
   git add -A
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/repo-launcher.git
   git push -u origin main
   ```
3. Note your repo in `owner/repo` format — you'll need it later.

---

## 2. Supabase Setup

Supabase provides auth (Google login) and the database (license storage). Free tier includes 50k monthly active users and 500MB database.

### 2.1 Create Project

1. Go to [supabase.com](https://supabase.com) and sign up / log in
2. Click **"New project"**
3. Set a name (e.g. `repo-launcher`), choose a region close to your users, set a database password
4. Wait for the project to spin up (~2 minutes)

### 2.2 Get Your Keys

Go to **Settings → API** and note:

| Key | Where it goes |
|-----|---------------|
| **Project URL** | `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` |
| **anon / public key** | `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role key** | `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose in frontend!) |

### 2.3 Enable Google Auth

1. Go to **Authentication → Providers → Google**
2. Toggle **Enable**
3. You need Google OAuth credentials:
   - Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
   - Create a new project (or use existing)
   - Click **"Create Credentials" → "OAuth client ID"**
   - Application type: **Web application**
   - Authorized redirect URIs: add `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**
4. Paste Client ID and Client Secret into the Supabase Google provider settings
5. Click **Save**

### 2.4 Configure Redirect URLs

Go to **Authentication → URL Configuration**:

- **Site URL**: `https://your-domain.vercel.app` (or your custom domain)
- **Redirect URLs**: add these two entries:
  - `https://your-domain.vercel.app/auth/callback`
  - `repo-launcher://auth/callback`

The second one is the custom protocol that the desktop app uses for OAuth callback.

### 2.5 Create Database Tables

Go to **SQL Editor** and run this:

```sql
-- Profiles table (auto-populated from auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Licenses table
CREATE TABLE public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  stripe_checkout_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_paid INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  purchased_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own licenses"
  ON public.licenses FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert (used by webhook)
CREATE POLICY "Service role can insert licenses"
  ON public.licenses FOR INSERT
  WITH CHECK (true);
```

### 2.6 Create the verify-license Edge Function

Go to **Edge Functions** (or use the Supabase CLI):

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Create the function
supabase functions new verify-license
```

Replace `supabase/functions/verify-license/index.ts` with:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ valid: false, error: "No token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ valid: false, error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { data: licenses } = await supabase
      .from("licenses")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)

    const valid = licenses !== null && licenses.length > 0

    return new Response(JSON.stringify({ valid, user_id: user.id }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
```

Deploy it:

```bash
supabase functions deploy verify-license --no-verify-jwt
```

> `--no-verify-jwt` is needed because we verify the JWT manually inside the function.

---

## 3. Stripe Setup

Stripe handles the $5 one-time payment. No monthly fees — Stripe only charges per transaction (2.9% + 30¢).

### 3.1 Create Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. You can stay in **Test Mode** while developing (toggle in the top-right)

### 3.2 Create a Product

1. Go to **Products → + Add product**
2. Name: `Repo Launcher — Lifetime License`
3. Pricing: **One time**, **$5.00**
4. Click **Save product**
5. On the product page, find the **Price** section and copy the **Price ID** (starts with `price_`)

### 3.3 Get API Keys

Go to **Developers → API keys**:

| Key | Where it goes |
|-----|---------------|
| **Secret key** (`sk_test_...`) | `STRIPE_SECRET_KEY` |
| **Publishable key** (`pk_test_...`) | Not needed for this setup |

### 3.4 Set Up Webhook

1. Go to **Developers → Webhooks → + Add endpoint**
2. Endpoint URL: `https://your-domain.vercel.app/api/webhook`
   - Replace with your actual Vercel URL after deploying (Step 5)
   - You can add this after deploying — just come back here
3. Events to listen to: select **`checkout.session.completed`**
4. Click **Add endpoint**
5. On the webhook page, click **Reveal** under "Signing secret" and copy it
6. This is your `STRIPE_WEBHOOK_SECRET` (`whsec_...`)

---

## 4. Connect Stripe Webhook to Supabase

The webhook flow is:

```
Stripe checkout completes
  → POST /api/webhook (your Next.js app on Vercel)
    → Verifies Stripe signature
    → Inserts license row into Supabase using service_role key
```

This is already implemented in `website/app/api/webhook/route.ts`. No Edge Function needed for the webhook — it runs on Vercel directly.

---

## 5. Deploy the Website (Vercel)

Vercel is free for personal projects and works perfectly with Next.js.

### 5.1 Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"Add New" → "Project"**
3. Import your GitHub repository
4. **Important**: Set the **Root Directory** to `website` (click "Edit" next to it)
5. Framework should auto-detect as **Next.js**

### 5.2 Set Environment Variables

In the Vercel project settings, go to **Settings → Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `STRIPE_SECRET_KEY` | `sk_test_...` (or `sk_live_...` for prod) |
| `STRIPE_PRICE_ID` | `price_...` from Step 3.2 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from Step 3.4 |
| `NEXT_PUBLIC_SITE_URL` | `https://your-project.vercel.app` |
| `NEXT_PUBLIC_GITHUB_REPO` | `your-username/repo-launcher` |

### 5.3 Deploy

Click **Deploy**. Vercel will build and deploy automatically.

After deployment, **go back to Step 3.4** and update the Stripe webhook URL to use your actual Vercel domain.

Also update Supabase (**Step 2.4**) redirect URLs with the actual Vercel domain.

### 5.4 Custom Domain (Optional)

In Vercel: **Settings → Domains** → Add your domain (e.g. `repo-launcher.com`). Follow the DNS instructions.

---

## 6. Configure Electron App Keys

Edit `src/main/config.ts` with your actual Supabase keys:

```typescript
export const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'
export const SUPABASE_ANON_KEY = 'YOUR_ACTUAL_ANON_KEY'
export const WEBSITE_URL = 'https://your-domain.vercel.app'
```

Also update `src/renderer/src/constants.ts`:

```typescript
export const WEBSITE_URL = 'https://your-domain.vercel.app'
```

---

## 7. Build & Publish the Desktop App

### 7.1 Build Installers

```bash
# macOS (.dmg)
npm run build:mac

# Windows (.exe) — requires Windows or CI
npm run build:win

# Linux (.AppImage)
npm run build:linux
```

Output goes to `dist/`.

### 7.2 Create a GitHub Release

```bash
# Tag the release
git tag v1.0.0
git push origin v1.0.0
```

Then go to your GitHub repo → **Releases → "Create a new release"**:
- Tag: `v1.0.0`
- Title: `v1.0.0`
- Upload the built files:
  - `Repo Launcher-1.0.0-mac.dmg`
  - `Repo Launcher-1.0.0-win-setup.exe`
  - `Repo Launcher-1.0.0-linux.AppImage`
- Click **Publish release**

The website download buttons will now automatically redirect to these files.

### 7.3 Automate with GitHub Actions (Optional)

Create `.github/workflows/release.yml` to auto-build on tag push:

```yaml
name: Build and Release
on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: npx electron-builder --publish always
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This builds for all platforms and automatically uploads to the GitHub Release.

---

## 8. End-to-End Verification

### Test the full flow:

1. **Fresh install**: Download the `.dmg` from the website → install → open → should see "Trial: 7 days left"

2. **Trial expiry**: Open the app's electron-store data and set `trialStartedAt` to 8 days ago:
   ```bash
   # macOS: ~/Library/Application Support/repo-launcher/config.json
   # Edit trialStartedAt to Date.now() - (8 * 86400000)
   ```
   Restart → should see nag screen + only 3 repos shown

3. **Sign in**: Click Settings → Account → "Sign in with Google" → browser opens → Google login → redirect back to app → account shows

4. **Purchase (test mode)**:
   - Visit your website → Sign in → Click "Buy License"
   - Use Stripe test card: `4242 4242 4242 4242`, any future exp date, any CVC
   - Should redirect to success page
   - Check Supabase: **Table Editor → licenses** → new row should appear

5. **License verification**: In the desktop app → restart or wait → nag screen should disappear, full access restored

6. **Sign out**: Settings → Account → Sign out → reverts to trial/expired state

### Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

---

## Cost Summary (all free tier)

| Service | Free Tier | Limits |
|---------|-----------|--------|
| **Supabase** | Free | 50k MAU, 500MB DB, 500MB storage |
| **Vercel** | Hobby (free) | 100GB bandwidth/mo, serverless functions |
| **Stripe** | No monthly fee | 2.9% + 30¢ per transaction |
| **GitHub** | Free | Unlimited public repos, 500MB release storage |

Total cost: **$0/month** + Stripe transaction fees on sales.

---

## Going Live Checklist

- [ ] Switch Stripe from test mode to live mode
- [ ] Update `STRIPE_SECRET_KEY` in Vercel to the live key (`sk_live_...`)
- [ ] Create a new webhook in Stripe live mode with the same URL
- [ ] Update `STRIPE_WEBHOOK_SECRET` in Vercel
- [ ] Update `STRIPE_PRICE_ID` if you created a separate live product
- [ ] Update Supabase Site URL to your production domain
- [ ] Update `WEBSITE_URL` in the Electron app's `config.ts` and `constants.ts`
- [ ] Rebuild and publish a new release of the desktop app

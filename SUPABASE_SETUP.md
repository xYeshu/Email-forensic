# Supabase Setup Guide — Email Forensic App

This guide walks you through setting up Supabase as the backend for the AI analysis feature. The Gemini API key and system prompt are stored securely server-side in a Supabase Edge Function.

---

## Prerequisites

- A Google Gemini API key (get one at [ai.google.dev](https://ai.google.dev))
- A free Supabase account

---

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up / log in
2. Click **"New Project"**
3. Choose your organization (or create one)
4. Fill in:
   - **Project name**: `email-forensic` (or whatever you prefer)
   - **Database password**: Choose a strong password (you won't need this for the Edge Function)
   - **Region**: Pick one closest to your users
5. Click **"Create new project"** and wait for it to provision (~2 minutes)

---

## Step 2: Get Your Project Credentials

Once the project is ready:

1. Go to **Settings → API** (in the left sidebar)
2. Copy these two values:
   - **Project URL** — looks like `https://abcdefghijkl.supabase.co`
   - **anon / public key** — starts with `eyJ...`

3. Paste them into your `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Note:** The anon key is designed to be public. It only grants access through Supabase's Row Level Security policies, which don't apply to Edge Functions by default.

---

## Step 3: Using the Supabase CLI

No installation required — use `npx` to run the Supabase CLI directly:

```bash
# Verify it works
npx -y supabase --version
```

> **Note:** All `supabase` commands in this guide should be run as `npx -y supabase <command>`. The `npx -y` prefix auto-downloads and runs the CLI without needing a global install.

---

## Step 4: Login & Link Your Project

```bash
# Login to Supabase (opens browser for authentication)
npx -y supabase login

# Initialize Supabase (if not already done — this creates the supabase/ directory structure)
# Skip this if the supabase/ directory already exists
npx -y supabase init

# Link to your remote project
npx -y supabase link --project-ref <your-project-id>
```

> Your **project ID** is the subdomain part of your project URL. For example, if your URL is `https://abcdefghijkl.supabase.co`, the project ID is `abcdefghijkl`.

---

## Step 5: Set the Gemini API Key as a Secret

```bash
npx -y supabase secrets set GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

This stores the key securely on Supabase's servers. It is **never** exposed to the client or included in any client-side bundle.

To verify it was set:
```bash
npx -y supabase secrets list
```

---

## Step 6: Deploy the Edge Function

```bash
npx -y supabase functions deploy analyze-email --no-verify-jwt
```

> The `--no-verify-jwt` flag allows the function to be called with just the anon key (without requiring user authentication). This is fine since the function has built-in rate limiting.

To verify deployment:
```bash
npx -y supabase functions list
```

You should see `analyze-email` in the list with status `Active`.

---

## Step 7: Test the Function

You can test the Edge Function directly:

```bash
curl -X POST "https://your-project-id.supabase.co/functions/v1/analyze-email" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test email",
    "fromAddress": "test@example.com",
    "toAddresses": "user@example.com",
    "date": "2026-01-01",
    "messageId": "test-123",
    "authResults": {"spf": "Pass", "dkim": "Pass", "dmarc": "Pass"},
    "body": "This is a test email body.",
    "iocs": {"urls": [], "ips": [], "domains": [], "keywords": []},
    "attachments": [],
    "model": "gemini-2.5-flash"
  }'
```

You should get a JSON response with the AI analysis.

---

## Step 8: Run the App

```bash
npm run dev
```

Navigate to the app, upload an `.eml` file, and click **"Run AI Analysis"**. The analysis now goes through your Supabase Edge Function securely.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Supabase configuration is missing" | Check your `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| "Server configuration error" | The `GEMINI_API_KEY` secret isn't set. Run `supabase secrets set GEMINI_API_KEY=...` |
| "Rate limit exceeded" | Wait 1 minute. The function allows 10 requests per minute per IP |
| CORS errors | Ensure the function was deployed with `--no-verify-jwt` |
| "Failed to parse AI response" | Try switching to a different Gemini model |

---

## Security Notes

- ✅ The Gemini API key is stored as a Supabase secret — never exposed to the client
- ✅ The system prompt lives entirely inside the Edge Function — never in the browser bundle
- ✅ The Supabase anon key is safe to include in client code (it's designed for this)
- ✅ Rate limiting prevents API quota abuse (10 req/min per IP)
- ✅ Model selection is validated against a server-side whitelist

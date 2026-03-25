# 🚀 Simple Deploy Instructions

## Current Situation

**Status:** App built successfully  
**Files:** Ready in `/root/clawd/party-time-rebuild`  
**Domain:** partytime.africa (registered)  
**Backend:** Supabase (100% working)

---

## Deploy Method: Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
cd /root/clawd/party-time-rebuild/app
vercel --prod
```

### Step 4: Set Environment Variables

When prompted, add these:

```
NEXT_PUBLIC_SUPABASE_URL=https://zhrpvudzanhabiuddkhz.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTExOTYsImV4cCI6MjA4OTk2NzE5Nn0.RDh17EBVorpnTLcJ2lzb2YFJ92_EognOHjHZO0Ttk2o

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM5MTE5NiwiZXhwIjoyMDg5OTY3MTk2fQ.nGJ-NFxZOfI-VD6YDaz80Yq8wrHw5lw1DF-JjPVIrFI
```

### Step 5: Get Live URL

Vercel will give you: `https://partytime-africa-xxx.vercel.app`

---

## Connect Custom Domain

### In Vercel Dashboard:
1. Go to project settings
2. Add domain: `partytime.africa`
3. Copy DNS records Vercel provides

### In Namecheap:
**Login:** namecheap.com (mcivan250 / [password provided])

1. Domain List → partytime.africa → Manage
2. Advanced DNS
3. Add A Record:
   - Host: `@`
   - Value: `76.76.21.21` (Vercel IP)
4. Add CNAME Record:
   - Host: `www`
   - Value: `cname.vercel-dns.com`
5. Save

**Wait 30-60 minutes for DNS propagation.**

---

## Alternative: One-Click Deploy

If Vercel CLI doesn't work, I can:

1. Push code to GitHub
2. Deploy via Vercel dashboard (one-click)
3. Connect domain manually

**Let me know which method you prefer.**

---

**Standing by for deployment.** 🚀

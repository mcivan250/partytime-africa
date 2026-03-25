# 🚀 GitHub Setup Instructions

## What You Need to Do

### Step 1: Create Repository (2 minutes)

1. Go to: https://github.com/new
2. **Repository name:** `partytime-africa`
3. **Visibility:** Public (recommended) or Private
4. **DON'T** check "Initialize with README"
5. Click "Create repository"

---

### Step 2: After Creating Repository

GitHub will show you setup instructions. **Skip them all.**

Instead, just send me:
- ✅ "Repository created"

I'll push all the code immediately.

---

### Step 3: Connect to Vercel (5 minutes)

After I push the code:

1. Go to: https://vercel.com/signup
2. Sign up with GitHub (click "Continue with GitHub")
3. Authorize Vercel
4. Click "Import Project"
5. Select `partytime-africa` repository
6. Configure:
   - Framework: **Next.js** (auto-detected)
   - Root Directory: `app`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

7. **Add Environment Variables:**

Click "Environment Variables" and add these 3:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://zhrpvudzanhabiuddkhz.supabase.co
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTExOTYsImV4cCI6MjA4OTk2NzE5Nn0.RDh17EBVorpnTLcJ2lzb2YFJ92_EognOHjHZO0Ttk2o
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM5MTE5NiwiZXhwIjoyMDg5OTY3MTk2fQ.nGJ-NFxZOfI-VD6YDaz80Yq8wrHw5lw1DF-JjPVIrFI
```

8. Click **"Deploy"**

---

### Step 4: Get Live URL (3 minutes)

Vercel will build and deploy (takes 2-3 minutes).

You'll get a URL like:
`https://partytime-africa-xxx.vercel.app`

**Test it immediately!**

---

### Step 5: Connect Custom Domain (I'll do this)

Once site is live:
1. You give me the Vercel URL
2. I configure DNS in Namecheap (using credentials you gave)
3. Custom domain works in 30 minutes

---

## Timeline

- **Now:** You create GitHub repo (2 min)
- **+2 min:** I push code (instant)
- **+7 min:** You deploy on Vercel (5 min)
- **+10 min:** Site is LIVE
- **+40 min:** Custom domain live (partytime.africa)

---

**Action:** Go create the repository now:
https://github.com/new

Name: `partytime-africa`

Then say "Repository created" and I'll push the code immediately. 🚀

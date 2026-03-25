# 🔧 FIX: Environment Variables Not Set

## The Problem

Vercel can't find your Supabase credentials. They need to be added in Vercel's dashboard.

---

## SOLUTION: Add Environment Variables in Vercel

### Step 1: Go to Project Settings

1. In Vercel, click on your `partytime-africa` project
2. Click **"Settings"** tab
3. Click **"Environment Variables"** in the left menu

---

### Step 2: Add These 3 Variables

**Click "Add" for each one:**

#### Variable 1:
**Key (Name):**
```
NEXT_PUBLIC_SUPABASE_URL
```
**Value:**
```
https://zhrpvudzanhabiuddkhz.supabase.co
```
**Environments:** Check all 3 boxes (Production, Preview, Development)

---

#### Variable 2:
**Key (Name):**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTExOTYsImV4cCI6MjA4OTk2NzE5Nn0.RDh17EBVorpnTLcJ2lzb2YFJ92_EognOHjHZO0Ttk2o
```
**Environments:** Check all 3 boxes

---

#### Variable 3:
**Key (Name):**
```
SUPABASE_SERVICE_ROLE_KEY
```
**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM5MTE5NiwiZXhwIjoyMDg5OTY3MTk2fQ.nGJ-NFxZOfI-VD6YDaz80Yq8wrHw5lw1DF-JjPVIrFI
```
**Environments:** Check all 3 boxes

---

### Step 3: Save & Redeploy

1. Click **"Save"** for each variable
2. Go to **"Deployments"** tab
3. Click the ⋯ menu on the latest deployment
4. Click **"Redeploy"**

---

## Double-Check These Are Correct:

**Common Mistakes:**
- ❌ Spaces in the variable names (e.g., `NEXT_PUBLIC_SUPABASE_URL ` with space)
- ❌ Wrong environment selected (must check all 3)
- ❌ Typos in the key names
- ❌ Missing parts of the long token values

**Correct Format:**
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://zhrpvudzanhabiuddkhz.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development
```

---

## Screenshot Checklist

After adding all 3, your Environment Variables page should show:

```
NEXT_PUBLIC_SUPABASE_URL
  Production, Preview, Development
  
NEXT_PUBLIC_SUPABASE_ANON_KEY  
  Production, Preview, Development
  
SUPABASE_SERVICE_ROLE_KEY
  Production, Preview, Development
```

---

## After Adding Variables:

**Redeploy:**
1. Deployments tab
2. Latest deployment → ⋯ menu
3. "Redeploy"

**Build will succeed this time!** ✅

---

**Let me know when you've added the variables and I'll help debug if it still fails.** 🚀

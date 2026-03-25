# 🚀 Deploy Party Time Africa to Vercel

## Quick Deploy (5 Minutes)

### Option 1: GitHub + Vercel (Recommended)

**Step 1: Push to GitHub**
```bash
cd /root/clawd/party-time-rebuild
git init
git add .
git commit -m "Initial commit - Party Time Africa MVP"
git remote add origin https://github.com/YOUR_USERNAME/partytime-africa.git
git push -u origin main
```

**Step 2: Deploy on Vercel**
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Import `partytime-africa` repo
5. Configure:
   - Framework: Next.js
   - Root Directory: `app`
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://zhrpvudzanhabiuddkhz.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `[your anon key from .env.local]`
   - `SUPABASE_SERVICE_ROLE_KEY` = `[your service key from .env.local]`
7. Click "Deploy"

**Live in 2-3 minutes!**

---

### Option 2: Vercel CLI (Manual)

```bash
cd /root/clawd/party-time-rebuild/app
npx vercel login
npx vercel --prod
```

Follow prompts:
- Set root directory: `./`
- Override build: No
- Deploy: Yes

---

## After Deployment

### 1. Test Your Live Site
Visit the URL Vercel gives you (e.g., `partytime-africa.vercel.app`)

**Test checklist:**
- ✅ Landing page loads
- ✅ Create event works
- ✅ Event pages display
- ✅ Auth works (signup/signin)
- ✅ Wallet page loads
- ✅ Venues page loads
- ✅ Brunch page loads

### 2. Connect Custom Domain

**In Vercel Dashboard:**
1. Go to Project Settings → Domains
2. Add domain: `partytime.africa`
3. Add domain: `www.partytime.africa`

**In Namecheap:**
1. Go to Domain List → Manage
2. Advanced DNS
3. Add A Record:
   - Host: `@`
   - Value: `76.76.21.21`
   - TTL: Automatic
4. Add CNAME Record:
   - Host: `www`
   - Value: `cname.vercel-dns.com`
   - TTL: Automatic

**Wait 5-30 minutes for DNS propagation.**

---

## Environment Variables Reference

From your `/root/clawd/party-time-rebuild/app/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zhrpvudzanhabiuddkhz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTExOTYsImV4cCI6MjA4OTk2NzE5Nn0.RDh17EBVorpnTLcJ2lzb2YFJ92_EognOHjHZO0Ttk2o
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocnB2dWR6YW5oYWJpdWRka2h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM5MTE5NiwiZXhwIjoyMDg5OTY3MTk2fQ.nGJ-NFxZOfI-VD6YDaz80Yq8wrHw5lw1DF-JjPVIrFI
```

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Make sure all dependencies are in `package.json`
- Verify TypeScript has no errors

### Pages Don't Load
- Check environment variables are set
- Verify Supabase connection
- Check browser console for errors

### Domain Not Working
- DNS takes 5-30 minutes
- Use https://dnschecker.org to check propagation
- Clear browser cache

---

## Quick Commands

```bash
# Check if build works locally
cd app && npm run build

# Test production build
npm run start

# Deploy to Vercel
npx vercel --prod

# Check deployment status
npx vercel ls
```

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs

**Estimated Time:**
- GitHub push: 5 min
- Vercel deploy: 3 min
- Domain setup: 30 min (DNS propagation)
- **Total: 40 minutes to live**

# 🌐 DNS Configuration for partytime.africa

## Step 1: Get Vercel DNS Values

In Vercel dashboard:
1. Go to partytime-africa project
2. Click "Settings" → "Domains"
3. Add domain: `partytime.africa`
4. Vercel will show DNS records to add

## Step 2: Configure Namecheap DNS

**Login:** namecheap.com
**Username:** mcivan250
**Password:** [provided]

**Navigate to:**
1. Domain List
2. partytime.africa → Manage
3. Advanced DNS

**Add These Records:**

### A Record
```
Type: A Record
Host: @
Value: 76.76.21.21
TTL: Automatic
```

### CNAME Record (www)
```
Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
TTL: Automatic
```

## Step 3: Add Domain in Vercel

1. Vercel Project Settings → Domains
2. Add: `partytime.africa`
3. Add: `www.partytime.africa`
4. Vercel will verify DNS
5. SSL certificate auto-issues

## Timeline

- DNS changes: 5 minutes
- Propagation: 10-60 minutes
- SSL certificate: Automatic
- **LIVE:** 30-60 minutes

## Verification

Check DNS propagation:
```bash
dig partytime.africa
nslookup partytime.africa
```

Or visit: https://dnschecker.org

---

**Configuring now...**

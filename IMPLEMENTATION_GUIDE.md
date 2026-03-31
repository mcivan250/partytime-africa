# PartyTime Africa: Implementation Guide for Fixes

## Overview

This guide provides step-by-step instructions for applying all the fixes for real-time updates, media uploads, and notifications. Follow these steps in order to ensure everything is configured correctly.

## Prerequisites

*   Access to your Supabase project dashboard
*   Access to your Vercel project dashboard
*   Git installed on your local machine
*   Node.js 18+ installed

## Step-by-Step Implementation

### Step 1: Apply Database Configuration Fixes

1.  **Open Supabase SQL Editor:**
    *   Go to your Supabase project dashboard
    *   Navigate to **SQL Editor**
    *   Click **New Query**

2.  **Copy and Run `setup-fixes.sql`:**
    *   Open the file `/home/ubuntu/partytime-africa/setup-fixes.sql`
    *   Copy the entire content
    *   Paste it into the Supabase SQL Editor
    *   Click **Run** to execute the script
    *   Wait for the script to complete (should take a few seconds)

3.  **Verify the Results:**
    *   Check for any error messages in the output
    *   If there are errors, refer to the **Troubleshooting Guide** for solutions

### Step 2: Configure Supabase Storage

1.  **Create the Media Bucket (if it doesn't exist):**
    *   Go to your Supabase project dashboard
    *   Navigate to **Storage**
    *   Click **Create a new bucket**
    *   Name it `media`
    *   Make sure it's **Private** (not public)
    *   Click **Create bucket**

2.  **Apply Storage Policies:**
    *   Go to **SQL Editor** in Supabase
    *   Click **New Query**
    *   Open the file `/home/ubuntu/partytime-africa/setup-storage.sql`
    *   Copy the entire content
    *   Paste it into the SQL Editor
    *   Click **Run** to execute the script

3.  **Verify Storage Configuration:**
    *   Go back to **Storage**
    *   Click on the `media` bucket
    *   Go to the **Policies** tab
    *   You should see at least 4 policies listed:
        *   Allow authenticated uploads
        *   Allow authenticated reads
        *   Allow authenticated deletes
        *   Allow public read access

### Step 3: Run Diagnostic Checks

1.  **Execute Diagnostic Script:**
    *   Go to **SQL Editor** in Supabase
    *   Click **New Query**
    *   Open the file `/home/ubuntu/partytime-africa/diagnostic-checks.sql`
    *   Copy the entire content
    *   Paste it into the SQL Editor
    *   Click **Run** to execute the script

2.  **Review Results:**
    *   Scroll through the output and look for the **Summary Report** at the end
    *   All checks should show **✓ PASS**
    *   If any check shows **✗ FAIL**, refer to the **Troubleshooting Guide**

### Step 4: Update Environment Variables

1.  **Verify Local Environment Variables:**
    *   Open `.env.local` in your project root
    *   Ensure these variables are set:
        ```
        NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
        NEXT_PUBLIC_SUPABASE_URL=your_url_here
        SUPABASE_SERVICE_ROLE_KEY=your_key_here
        ```

2.  **Update Vercel Environment Variables:**
    *   Go to your Vercel project dashboard
    *   Navigate to **Settings** → **Environment Variables**
    *   Ensure the same variables are set in the production environment
    *   If you made any changes, trigger a new deployment

### Step 5: Update Code (if needed)

1.  **Pull Latest Changes:**
    ```bash
    cd /home/ubuntu/partytime-africa
    git pull origin main
    ```

2. **Install Dependencies:**
    ```bash
    npm install
    ```

3. **Build Locally:**
    ```bash
    npm run build
    ```

4. **Test Locally:**
    ```bash
    npm run dev
    ```

### Step 6: Deploy to Production

1. **Commit and Push Changes:**
    ```bash
    git add -A
    git commit -m "Fix: Apply database and storage configuration fixes"
    git push origin main
    ```

2. **Deploy to Vercel:**
    ```bash
    vercel --prod
    ```

3. **Monitor Deployment:**
    *   Go to your Vercel project dashboard
    *   Watch the deployment progress
    *   Once complete, visit your live site to verify

### Step 7: Test All Features

#### Test Real-Time Updates

1.  **Open Two Browser Tabs:**
    *   Tab 1: Navigate to https://www.partytime.africa/messages
    *   Tab 2: Navigate to https://www.partytime.africa/messages (same URL)

2. **Send a Test Message:**
    *   In Tab 1, open a conversation and send a message
    *   In Tab 2, verify the message appears immediately (within 1-2 seconds)
    *   If the message doesn't appear, check the browser console for errors

#### Test Media Upload

1. **Navigate to Messages:**
    *   Go to https://www.partytime.africa/messages
    *   Open a conversation

2. **Upload Media:**
    *   Click the **Media** button
    *   Select an image file from your computer
    *   Wait for the upload to complete
    *   Verify the media preview appears
    *   Send the message

3. **Verify Media Display:**
    *   The image should display in the conversation thread
    *   If it doesn't, check the browser console for errors

#### Test Notifications

1. **Open Notifications Panel:**
    *   Look for the bell icon (🔔) in the top navigation
    *   Click it to open the notifications panel

2. **Trigger a Notification:**
    *   Send a message to another user (or have another user send you a message)
    *   A notification should appear in the panel
    *   The unread count should increase

3. **Verify Notification Actions:**
    *   Click on a notification to navigate to the related item
    *   Click the delete button (✕) to remove a notification
    *   Click **Mark all as read** to mark all notifications as read

### Step 8: Monitor and Debug

#### Check Browser Console

1. **Open Developer Tools:**
    *   Press F12 or right-click → **Inspect**
    *   Go to the **Console** tab

2. **Look for Errors:**
    *   Check for any red error messages
    *   Common errors include:
        *   `WebSocket connection failed` → Check Supabase connection
        *   `401 Unauthorized` → Check authentication
        *   `CORS error` → Check API configuration

#### Check Supabase Logs

1. **Go to Supabase Dashboard:**
    *   Navigate to **Logs** → **API Logs**
    *   Look for any errors related to your API calls

2. **Check Realtime Logs:**
    *   Navigate to **Logs** → **Realtime Logs**
    *   Verify that subscription events are being received

#### Check Vercel Logs

1. **Go to Vercel Dashboard:**
    *   Navigate to your project
    *   Go to **Deployments**
    *   Click on the latest deployment
    *   Go to **Logs** to see any errors

---

## Rollback Instructions

If something goes wrong, you can rollback to the previous version:

```bash
# Revert to the previous commit
git revert HEAD

# Push the revert
git push origin main

# Redeploy to Vercel
vercel --prod
```

---

## Support

If you encounter issues during implementation:

1. **Check the Troubleshooting Guide:** `/home/ubuntu/Troubleshooting_Guide.md`
2. **Review Diagnostic Results:** Run the diagnostic checks and compare with expected results
3. **Check Logs:** Review Supabase and Vercel logs for error messages
4. **Contact Support:** Reach out to Supabase or Vercel support if needed

---

**Author:** Manus AI
**Date:** March 31, 2026
**Status:** Ready for Implementation

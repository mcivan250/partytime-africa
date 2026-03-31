# PartyTime Africa - Setup and Running Guide

Welcome to the PartyTime Africa project! This guide provides comprehensive instructions on how to set up, configure, and run the application in both local development and production environments.

## Table of Contents

1.  [Prerequisites](#1-prerequisites)
2.  [Local Development Setup](#2-local-development-setup)
3.  [Environment Variables Configuration](#3-environment-variables-configuration)
4.  [Database Setup (Supabase)](#4-database-setup-supabase)
5.  [Third-Party Integrations Setup](#5-third-party-integrations-setup)
6.  [Running the Application](#6-running-the-application)
7.  [Production Deployment (Vercel)](#7-production-deployment-vercel)
8.  [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Node.js:** Version 18.x or higher (We recommend using `nvm` or `nvm-windows` to manage Node versions).
*   **npm or yarn or pnpm:** Package managers (npm is included with Node.js).
*   **Git:** For version control.
*   **A Supabase Account:** For database, authentication, and storage.
*   **A Vercel Account:** For production deployment.

---

## 2. Local Development Setup

Follow these steps to get the project running on your local machine.

### Step 1: Clone the Repository

Open your terminal and clone the project repository from GitHub:

```bash
git clone https://github.com/mcivan250/partytime-africa.git
cd partytime-africa
```

### Step 2: Install Dependencies

Install all required npm packages:

```bash
npm install
# or if you prefer yarn:
# yarn install
# or pnpm:
# pnpm install
```

---

## 3. Environment Variables Configuration

The application relies on several environment variables to connect to external services. You need to create a `.env.local` file in the root of your project.

### Step 1: Create the `.env.local` file

```bash
touch .env.local
```

### Step 2: Add the required variables

Open `.env.local` in your code editor and add the following variables. You will need to replace the placeholder values with your actual API keys (see Section 5 for how to get these).

```env
# ==========================================
# SUPABASE CONFIGURATION (Required)
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ==========================================
# PAYMENT GATEWAYS
# ==========================================
# Stripe (Optional - if using Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Flutterwave (Optional - if using Flutterwave)
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key
FLUTTERWAVE_WEBHOOK_SECRET=your_flutterwave_webhook_secret

# ==========================================
# EMAIL & SMS NOTIFICATIONS
# ==========================================
# SendGrid (Optional - for emails)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Twilio (Optional - for SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# ==========================================
# APPLICATION URL
# ==========================================
# Use http://localhost:3000 for local development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4. Database Setup (Supabase)

PartyTime Africa uses Supabase for its PostgreSQL database, Authentication, and Storage.

### Step 1: Create a Supabase Project

1.  Go to [Supabase](https://supabase.com/) and sign in.
2.  Click "New Project" and follow the prompts.
3.  Once created, go to **Project Settings -> API** to find your `Project URL`, `anon public` key, and `service_role` key. Add these to your `.env.local` file.

### Step 2: Run Database Migrations

You need to set up the database schema. We have provided SQL scripts in the `migrations/` directory.

1.  In your Supabase dashboard, go to the **SQL Editor**.
2.  Click "New Query".
3.  Copy the contents of the following files and run them in order:
    *   `migrations/add_payment_system.sql` (Sets up transactions, tickets, and email verification)
    *   `migrations/add_booking_system.sql` (Sets up venue layouts and table bookings)
    *   *(If you have other schema files like `messages-schema.sql` or `notifications-schema.sql`, run those as well).*

### Step 3: Configure Storage Buckets

If your application handles media uploads (e.g., event posters, chat media), you need to create storage buckets.

1.  In Supabase, go to **Storage**.
2.  Click "New Bucket".
3.  Create the following buckets (make sure they are set to **Public** if you want images to be viewable by anyone):
    *   `event-images`
    *   `chat-media`
    *   `avatars`

---

## 5. Third-Party Integrations Setup

To fully utilize all features, you need to set up accounts with the following providers and get their API keys.

### Stripe (Payments)
1.  Create an account at [Stripe](https://stripe.com/).
2.  Go to the Developers dashboard to get your Publishable and Secret keys.
3.  Set up a Webhook endpoint pointing to `https://your-production-domain.com/api/webhooks/payments?provider=stripe` to get your Webhook Secret.

### Flutterwave (Payments - Africa Focus)
1.  Create an account at [Flutterwave](https://flutterwave.com/).
2.  Go to Settings -> API Keys to get your Public and Secret keys.
3.  Set up a Webhook endpoint pointing to `https://your-production-domain.com/api/webhooks/payments?provider=flutterwave` and define a secret hash.

### SendGrid (Emails)
1.  Create an account at [SendGrid](https://sendgrid.com/).
2.  Go to Settings -> API Keys and create a new key with full access.
3.  Verify a Sender Identity (the email address you will send from).

### Twilio (SMS)
1.  Create an account at [Twilio](https://www.twilio.com/).
2.  Get your Account SID and Auth Token from the console dashboard.
3.  Purchase or get a trial phone number to send SMS from.

---

## 6. Running the Application

Once your environment variables and database are set up, you can run the application locally.

### Start the Development Server

```bash
npm run dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

### Building for Production Locally (Testing)

To ensure your application builds correctly before deploying:

```bash
npm run build
npm run start
```

---

## 7. Production Deployment (Vercel)

The easiest way to deploy PartyTime Africa is using Vercel, the creators of Next.js.

### Step 1: Push to GitHub

Ensure all your local changes are committed and pushed to your GitHub repository.

```bash
git add .
git commit -m "Ready for production"
git push origin main
```

### Step 2: Import Project in Vercel

1.  Log in to [Vercel](https://vercel.com/).
2.  Click "Add New..." -> "Project".
3.  Import your `partytime-africa` GitHub repository.

### Step 3: Configure Environment Variables in Vercel

Before clicking "Deploy", you MUST add all the environment variables from your `.env.local` file into the Vercel project settings.

1.  In the Vercel deployment configuration screen, open the "Environment Variables" section.
2.  Add every key-value pair.
3.  **Crucial:** Change `NEXT_PUBLIC_APP_URL` to your actual production domain (e.g., `https://www.partytime.africa`).

### Step 4: Deploy

Click "Deploy". Vercel will build and deploy your application.

### Step 5: Update Webhooks

Once deployed, go back to your Stripe and Flutterwave dashboards and update the webhook URLs to point to your new Vercel production domain.

---

## 8. Troubleshooting

### Common Issues

*   **"Unauthorized" or Authentication Errors:**
    *   Check that your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct in `.env.local`.
    *   Ensure you have enabled Email authentication in your Supabase project settings.

*   **Database Errors (e.g., relation does not exist):**
    *   You likely missed running one of the SQL migration scripts in the Supabase SQL Editor. Re-run the scripts from the `migrations/` folder.

*   **Images Not Loading:**
    *   Check if your Supabase Storage buckets (`event-images`, etc.) are created and set to "Public".
    *   Verify your Row Level Security (RLS) policies on the storage buckets allow public read access.

*   **Payments Failing:**
    *   Ensure your Stripe/Flutterwave API keys are correct.
    *   Check the browser console and the Vercel server logs for specific error messages.

*   **Build Errors on Vercel:**
    *   Check the Vercel deployment logs. Common issues are TypeScript type errors or missing environment variables during the build step. Run `npm run build` locally to catch these before deploying.

### Getting Help

If you encounter persistent issues, check the server logs (in your terminal for local dev, or in the Vercel dashboard for production) for detailed error messages.

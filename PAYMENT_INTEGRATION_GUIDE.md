# PartyTime Africa - Payment Integration Guide

## Overview

PartyTime Africa supports two production-ready payment gateways:
- **Stripe** - For international payments and card processing
- **Flutterwave** - For African payments (UGX, KES, NGN, etc.)

## Stripe Setup

### 1. Create a Stripe Account
- Go to [https://stripe.com](https://stripe.com)
- Sign up for a business account
- Verify your email and business information

### 2. Get Your API Keys
- Navigate to **Developers** → **API Keys**
- Copy your **Publishable Key** and **Secret Key**
- Keep these keys secure and never commit them to version control

### 3. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
```

### 4. Set Up Webhooks

Stripe webhooks allow you to receive payment notifications:

1. Go to **Developers** → **Webhooks**
2. Click **Add Endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/payments`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing Secret** and add to `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 5. Test Mode

Before going live, test with Stripe's test cards:
- **Visa**: 4242 4242 4242 4242
- **Mastercard**: 5555 5555 5555 4444
- **Amex**: 3782 822463 10005

Use any future expiration date and any 3-digit CVC.

## Flutterwave Setup

### 1. Create a Flutterwave Account
- Go to [https://www.flutterwave.com](https://www.flutterwave.com)
- Sign up for a business account
- Complete KYC verification

### 2. Get Your API Keys
- Log in to your Flutterwave dashboard
- Navigate to **Settings** → **API Keys**
- Copy your **Public Key** and **Secret Key**

### 3. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY
FLUTTERWAVE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
```

### 4. Set Up Webhooks

Flutterwave webhooks notify you of payment events:

1. Go to **Settings** → **Webhooks**
2. Enter your webhook URL: `https://yourdomain.com/api/webhooks/payments`
3. Select events:
   - `charge.completed`
   - `charge.failed`
4. Copy the **Webhook Secret** and add to `.env.local`:

```bash
FLUTTERWAVE_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
```

### 5. Test Mode

Flutterwave provides test cards:
- **Visa**: 4556737586899855
- **Mastercard**: 5425233010103898
- **Test PIN**: 1234
- **Test OTP**: 123456

## Environment Variables Checklist

```bash
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Flutterwave
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=pk_live_...
FLUTTERWAVE_SECRET_KEY=sk_live_...
FLUTTERWAVE_WEBHOOK_SECRET=...

# Supabase (for transaction storage)
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Payment Flow

### 1. Ticket Purchase
```
User clicks "Buy Tickets"
  ↓
Select quantity and ticket tier
  ↓
Choose payment provider (Stripe or Flutterwave)
  ↓
Enter payment details
  ↓
Payment processed
  ↓
Webhook confirms payment
  ↓
Tickets generated and sent to user
```

### 2. Merchandise Purchase
```
User adds merchandise to cart
  ↓
Proceeds to checkout
  ↓
Selects payment provider
  ↓
Enters payment details
  ↓
Payment processed
  ↓
Order confirmation sent
```

## API Endpoints

### Process Payment
**POST** `/api/payments/process`

Request body:
```json
{
  "amount": 100000,
  "currency": "UGX",
  "description": "Ticket purchase for Skyline Brunch & Beats",
  "email": "user@example.com",
  "provider": "stripe" | "flutterwave",
  "metadata": {
    "eventId": "event-id",
    "ticketTierId": "tier-id",
    "quantity": 2
  }
}
```

Response:
```json
{
  "success": true,
  "transactionId": "pi_1234567890",
  "provider": "stripe",
  "status": "pending",
  "message": "Payment intent created successfully"
}
```

### Webhook Handler
**POST** `/api/webhooks/payments`

Handles payment notifications from both Stripe and Flutterwave.

## Testing

### Local Testing

1. Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

2. Authenticate:
```bash
stripe login
```

3. Forward webhooks to local:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/payments
```

4. Use test cards to process payments

### Production Testing

1. Switch to live API keys in `.env.local`
2. Process small test transactions
3. Verify transactions appear in provider dashboards
4. Confirm webhook notifications are received

## Troubleshooting

### Payment Intent Creation Fails
- Check API keys are correct
- Verify environment variables are set
- Check Stripe/Flutterwave account status
- Review API error messages in logs

### Webhooks Not Received
- Verify webhook URL is accessible
- Check webhook signing secret is correct
- Review webhook logs in provider dashboard
- Ensure endpoint returns 200 OK

### Currency Issues
- Stripe: Use lowercase 3-letter codes (usd, eur, etc.)
- Flutterwave: Use uppercase 3-letter codes (UGX, KES, NGN, etc.)
- Always convert amounts to smallest currency unit (cents/base units)

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all secrets
3. **Validate webhook signatures** before processing
4. **Store transaction IDs** in database for reconciliation
5. **Use HTTPS** for all payment endpoints
6. **Implement rate limiting** on payment endpoints
7. **Log payment errors** for debugging (never log full card details)
8. **Regularly rotate** webhook secrets

## Monitoring

### Key Metrics to Track
- Transaction success rate
- Average transaction time
- Failed payment reasons
- Refund rate
- Webhook delivery success rate

### Alerts to Set Up
- High failure rate (>5%)
- Webhook delivery failures
- Unusual transaction amounts
- Multiple failed attempts from same user

## Support

For issues with:
- **Stripe**: https://support.stripe.com
- **Flutterwave**: https://support.flutterwave.com
- **PartyTime Africa**: Contact your development team

## Next Steps

1. ✅ Set up Stripe account and API keys
2. ✅ Set up Flutterwave account and API keys
3. ✅ Configure environment variables
4. ✅ Set up webhooks
5. ✅ Test with test cards
6. ✅ Deploy to production
7. ✅ Monitor transactions and webhooks

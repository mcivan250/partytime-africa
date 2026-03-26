# Manual Payment Processing Guide

## For Paid Events (Until Mobile Money APIs are integrated)

### Step 1: Event Creation
When you create a paid event, it will show ticket prices but won't process payments automatically yet.

### Step 2: Payment Instructions for Buyers

Add this to your event description or share it after someone RSVPs:

```
💳 PAYMENT INSTRUCTIONS

Send payment to:
• MTN Mobile Money: 0XXXXXXXXX (Chris Mugabo)
• Airtel Money: 0XXXXXXXXX (Chris Mugabo)
• Bank: [Your bank details]

After payment:
1. Screenshot your transaction
2. WhatsApp to: 0XXXXXXXXX
3. Include: Event name + Your name
4. You'll receive confirmation within 1 hour
```

### Step 3: Confirming Payments (Admin)

**Option A: Direct Database Update (Quick)**

1. Go to Supabase Dashboard
2. Navigate to: Table Editor → ticket_purchases
3. Find the purchase record
4. Update these fields:
   - `payment_status`: 'paid'
   - `payment_confirmed_at`: current timestamp
   - `payment_method`: 'mobile_money_manual'

**Option B: SQL Query (Bulk)**

```sql
-- Confirm single ticket
UPDATE ticket_purchases
SET 
  payment_status = 'paid',
  payment_confirmed_at = NOW(),
  payment_method = 'mobile_money_manual'
WHERE id = 'TICKET_ID_HERE';

-- Confirm multiple tickets by phone number
UPDATE ticket_purchases tp
SET 
  payment_status = 'paid',
  payment_confirmed_at = NOW(),
  payment_method = 'mobile_money_manual'
FROM users u
WHERE tp.user_id = u.id
AND u.phone_number = '0XXXXXXXXX';
```

### Step 4: Send Confirmation to Buyer

WhatsApp template:

```
✅ Payment Confirmed!

Your ticket for [EVENT NAME] is confirmed.

Details:
• Ticket Type: [VIP/Regular]
• Quantity: [X]
• Total Paid: UGX [AMOUNT]

See you there! 🎉

Party Time Africa
partytime.africa/e/[EVENT-SLUG]
```

---

## Revenue Tracking

Track manually in a spreadsheet until dashboard is built:

| Date | Event | Buyer | Phone | Amount | Status | Confirmed By |
|------|-------|-------|-------|--------|--------|--------------|
| 2026-03-26 | Tattoos & Cocktails | John Doe | 077XXXXXXX | 50,000 | Paid | Chris |

---

## When APIs Launch

All of this becomes automatic:
- Payment received → Ticket confirmed instantly
- SMS confirmation sent
- Revenue tracking automated
- No manual work needed

**Target API Launch:** 3 weeks (including approval time)

---

## Mobile Money API Applications

**To Apply:**

**MTN Mobile Money:**
- Portal: https://momodeveloper.mtn.com/
- Documents: Business license, Tax ID
- Approval: 5-7 days

**Airtel Money:**
- Contact: Airtel Business Uganda
- Email: businessuganda@ug.airtel.com
- Approval: 7-10 days

**M-Pesa (Kenya prep):**
- Portal: https://developer.safaricom.co.ke/
- Approval: 10-14 days

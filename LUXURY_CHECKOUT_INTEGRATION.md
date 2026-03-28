# Luxury Checkout Integration Guide

## Overview

The **Luxury Checkout System** provides a seamless, premium ticket purchasing experience that integrates multi-tier pricing, affiliate rewards tracking, and digital ticket delivery.

---

## 1. Design Philosophy: "Black Luxury"

The new theme follows a **minimalist, high-end aesthetic** inspired by Partiful:

- **Deep Obsidian Backgrounds** (#1a1a1a, #0a0a0a): Creates a premium, sophisticated feel
- **Shimmering Gold Accents** (#d4af37): Draws attention to key elements and CTAs
- **Clean Typography**: Serif headers (Playfair Display) + Sans-serif body (Inter)
- **Generous Whitespace**: Reduces cognitive load and emphasizes quality
- **Subtle Shadows**: Adds depth without visual clutter

### CSS Variables (in `luxury-dark-theme.css`)

```css
--color-primary: #1a1a1a;      /* Deep Obsidian */
--color-secondary: #0a0a0a;    /* Even Deeper Obsidian */
--color-accent: #d4af37;       /* Shimmering Gold */
--color-text-light: #e0e0e0;   /* Off-white */
--color-text-dark: #888888;    /* Subtle Gray */
```

---

## 2. Component Architecture

### LuxuryCheckout.tsx

The main checkout component handles:

**Props**:
- `eventId`: UUID of the event
- `eventName`: Display name of the event
- `eventDate`: ISO date string
- `eventLocation`: Venue information
- `tiers`: Array of TicketTier objects
- `currency`: Currency code (UGX, KES, NGN, GHS, USD)
- `affiliateRef?`: Optional user ID for affiliate tracking
- `affiliateMomentId?`: Optional moment ID for affiliate tracking

**State Management**:
- `selectedTier`: Currently selected ticket tier
- `quantity`: Number of tickets to purchase
- `loading`: Payment processing state
- `purchaseComplete`: Post-purchase state
- `ticket`: Generated ticket object for display

**Flow**:
1. User selects ticket tier
2. User adjusts quantity
3. Order summary is calculated (includes 5% service fee)
4. User clicks "Purchase"
5. Ticket order is created in database
6. Individual tickets are generated
7. Affiliate sale is tracked (if applicable)
8. Digital pass is displayed

---

## 3. Database Integration

### ticket_orders Table

```sql
CREATE TABLE public.ticket_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  event_id UUID NOT NULL REFERENCES public.events(id),
  total_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### tickets Table Updates

```sql
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS tier_id TEXT,
ADD COLUMN IF NOT EXISTS tier_name TEXT,
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC,
ADD COLUMN IF NOT EXISTS order_id UUID DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS receipt_sent BOOLEAN DEFAULT FALSE;
```

---

## 4. Integration with Event Pages

### Example: Event Detail Page

```typescript
import LuxuryCheckout from '@/components/LuxuryCheckout';
import { useRouter } from 'next/router';

export default function EventDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { ref, moment_id } = router.query;

  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    // Fetch event details from Supabase
    const fetchEvent = async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      setEvent(data);
    };
    fetchEvent();
  }, [id]);

  if (!event) return <div>Loading...</div>;

  return (
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Event Details */}
        <div>
          <h1 className="text-4xl font-display font-bold text-text-light mb-4">
            {event.title}
          </h1>
          <p className="text-text-dark mb-6">{event.description}</p>
          {/* More details... */}
        </div>

        {/* Checkout */}
        <div>
          <LuxuryCheckout
            eventId={event.id}
            eventName={event.title}
            eventDate={event.date}
            eventLocation={event.location}
            tiers={event.ticket_tiers || []}
            currency={event.currency}
            affiliateRef={ref as string}
            affiliateMomentId={moment_id as string}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 5. Affiliate Rewards Integration

When a user purchases through an affiliate link:

1. **URL Parameters** are captured:
   - `?ref=userId` - The affiliate's user ID
   - `?moment_id=momentId` - The Moment that was shared

2. **At Checkout**:
   - Parameters are passed to `LuxuryCheckout`
   - Displayed as a callout: "You're getting this ticket through a friend's referral!"

3. **After Purchase**:
   - `trackAffiliateTicketSale()` is called
   - Affiliate receives 100 Party Points
   - Reward is recorded in `affiliate_rewards` table
   - Affiliate can view reward in their dashboard

---

## 6. Digital Ticket Pass

After successful purchase, the user sees:

**TicketDigitalPass Component** displays:
- Event name and location
- Date and time
- Ticket tier
- Buyer name
- QR code for check-in
- Order ID and total paid
- Download button
- "Add to Calendar" button
- "Email Receipt" button

### Design Features

- **Premium Club Card Aesthetic**: Looks like a luxury membership card
- **Minimalist Layout**: Clean, uncluttered design
- **Afrocentric Accents**: Gold patterns and sophisticated styling
- **High-Resolution QR**: Scannable at any size
- **Downloadable**: Users can save as PNG for offline access

---

## 7. Payment Integration (Future)

Currently, the system accepts "mobile_money" as the payment method. To integrate actual payments:

### Option A: Flutterwave (Recommended for Africa)

```typescript
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

const handlePayment = () => {
  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_KEY,
    tx_ref: order.id,
    amount: selectedPrice * 1.05,
    currency: currency,
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user.email,
      name: user.user_metadata?.full_name,
    },
    customizations: {
      title: 'Party Time Africa',
      description: `Tickets for ${eventName}`,
      logo: 'https://www.partytime.africa/logo.png',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);
  handleFlutterPayment({
    onClose: () => {},
    onComplete: (response) => {
      if (response.status === 'successful') {
        // Mark order as paid
        updateOrderStatus(order.id, 'completed');
      }
    },
  });
};
```

### Option B: Stripe

```typescript
import { loadStripe } from '@stripe/stripe-js';

const handlePayment = async () => {
  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);
  const { error } = await stripe.redirectToCheckout({
    sessionId: checkoutSessionId,
  });
};
```

---

## 8. Email Notifications (Future)

After purchase, send automated emails using Resend or SendGrid:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'tickets@partytime.africa',
  to: user.email,
  subject: `Your Ticket for ${eventName}`,
  html: `
    <h1>Your Ticket is Ready!</h1>
    <p>Download your digital pass or add to your calendar.</p>
    <img src="[QR_CODE_URL]" alt="QR Code" />
    <a href="[DOWNLOAD_LINK]">Download Pass</a>
  `,
});
```

---

## 9. Testing Checklist

- [ ] Tier selection updates price correctly
- [ ] Quantity adjustment calculates total with service fee
- [ ] Purchase button is disabled when no tier selected
- [ ] Affiliate parameters are captured from URL
- [ ] Affiliate callout displays when ref/moment_id present
- [ ] Ticket order is created in database
- [ ] Individual tickets are generated
- [ ] Digital pass displays correctly
- [ ] QR code is scannable
- [ ] Download button works
- [ ] Affiliate rewards are tracked

---

## 10. Styling Reference

### CSS Classes

```css
.card              /* Premium card container */
.form-input        /* Luxury input field */
.form-textarea     /* Luxury textarea */
.form-label        /* Form label styling */
.btn               /* Base button */
.btn-primary       /* Gold accent button */
.btn-secondary     /* Subtle button */
.text-light        /* Off-white text */
.text-dark         /* Subtle gray text */
.text-accent       /* Gold text */
```

---

## 11. Performance Optimization

- **Lazy Load Components**: Use `dynamic()` for checkout on event pages
- **Memoize Calculations**: Use `useMemo()` for price calculations
- **Debounce Quantity Input**: Prevent excessive re-renders
- **Optimize QR Generation**: Generate QR codes server-side when possible

---

## 12. Security Considerations

- **Validate Tier Selection**: Ensure tier belongs to event
- **Check Inventory**: Verify capacity before creating tickets
- **Prevent Duplicate Orders**: Check for existing orders in same session
- **Secure QR Codes**: Include event ID and order ID in QR data
- **RLS Policies**: Ensure users can only view their own orders

---

## Deployment Checklist

- [ ] `luxury-dark-theme.css` is imported in `_app.tsx`
- [ ] `LuxuryCheckout` component is properly exported
- [ ] `TicketDigitalPass` component is properly exported
- [ ] Database schema migrations are applied
- [ ] Environment variables are set (payment keys, email keys)
- [ ] Affiliate tracking is enabled
- [ ] Email notifications are configured
- [ ] Payment processor is integrated
- [ ] QR code generation is tested
- [ ] Mobile responsiveness is verified

---

## Support & Resources

- **Luxury Theme**: `styles/luxury-dark-theme.css`
- **Checkout Component**: `components/LuxuryCheckout.tsx`
- **Digital Pass**: `components/TicketDigitalPass.tsx`
- **Tier Manager**: `components/TicketTierManager.tsx`
- **Database Schema**: `ticket_tiers_schema.sql`
- **Affiliate System**: `lib/affiliate-moments.ts`

---

**The luxury checkout system is now ready for integration. Let's make ticket purchasing an experience, not a transaction!** 🎫✨

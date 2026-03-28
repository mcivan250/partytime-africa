# Affiliate Moments Integration Guide

## Overview

This guide explains how to integrate the Affiliate Moments system into the existing Party Time Africa checkout flow to enable automatic reward tracking when users purchase tickets through affiliate links.

## Architecture

```
User shares Moment with affiliate link
    ↓
Friend clicks link (tracked in affiliate_clicks table)
    ↓
Friend navigates to event page with ?ref=userId&moment_id=momentId
    ↓
Friend purchases ticket
    ↓
trackAffiliateTicketSale() triggered
    ↓
Affiliate reward created (100 Party Points)
    ↓
User's balance updated automatically
```

## Integration Points

### 1. URL Parameter Handling

**Location**: `pages/events/[id].tsx` or event detail component

```typescript
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function EventPage() {
  const router = useRouter();
  const { id } = router.query;
  const { ref, moment_id } = router.query;

  // Store affiliate info in session/context
  useEffect(() => {
    if (ref && moment_id) {
      // Store in localStorage for later retrieval at checkout
      sessionStorage.setItem('affiliate_ref', ref as string);
      sessionStorage.setItem('affiliate_moment_id', moment_id as string);
    }
  }, [ref, moment_id]);

  return (
    // ... event details
  );
}
```

### 2. Checkout Flow Integration

**Location**: `components/CheckoutForm.tsx` or payment component

```typescript
import { trackAffiliateTicketSale } from '@/lib/affiliate-moments';

export default function CheckoutForm({ eventId }) {
  const [processing, setProcessing] = useState(false);

  const handleCheckoutSuccess = async (ticketId: string, buyerId: string) => {
    setProcessing(true);

    // Get affiliate info from session
    const affiliateRef = sessionStorage.getItem('affiliate_ref');
    const affiliateMomentId = sessionStorage.getItem('affiliate_moment_id');

    // Track the affiliate sale
    if (affiliateRef && affiliateMomentId) {
      await trackAffiliateTicketSale(
        affiliateMomentId,
        buyerId,
        eventId
      );

      // Clear session
      sessionStorage.removeItem('affiliate_ref');
      sessionStorage.removeItem('affiliate_moment_id');
    }

    setProcessing(false);
    // Redirect to success page
  };

  return (
    // ... checkout form
  );
}
```

### 3. Dashboard Integration

**Location**: `pages/dashboard.tsx` or user profile page

```typescript
import AffiliateRewardsCard from '@/components/AffiliateRewardsCard';
import PartyPointsBalance from '@/components/PartyPointsBalance';
import AffiliateLeaderboard from '@/components/AffiliateLeaderboard';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <PartyPointsBalance />
      <AffiliateRewardsCard />
      <AffiliateLeaderboard />
    </div>
  );
}
```

### 4. Moments Feed Integration

**Location**: `components/MomentsFeed.tsx` or moments page

Replace existing MomentsFeed with MomentsFeedEnhanced:

```typescript
import MomentsFeedEnhanced from '@/components/MomentsFeedEnhanced';

export default function MomentsPage({ eventId }) {
  return (
    <div>
      <h1>Event Moments</h1>
      <MomentsFeedEnhanced eventId={eventId} />
    </div>
  );
}
```

### 5. Organizer Dashboard Integration

**Location**: `pages/events/[id]/analytics.tsx` or organizer panel

```typescript
import OrganizerAnalyticsDashboard from '@/components/OrganizerAnalyticsDashboard';

export default function EventAnalytics({ eventId }) {
  return (
    <div>
      <h1>Event Analytics</h1>
      <OrganizerAnalyticsDashboard eventId={eventId} />
    </div>
  );
}
```

## Database Setup

Run the SQL schema to create required tables:

```bash
# Connect to Supabase and run:
psql -U postgres -h zhrpvudzanhabiuddkhz.supabase.co -d postgres -f affiliate_rewards_schema.sql
```

Or use Supabase SQL editor to execute:

```sql
-- Copy contents of affiliate_rewards_schema.sql
```

## Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://www.partytime.africa
```

## Testing

### Test Affiliate Link Generation

```typescript
import { generateAffiliateLink } from '@/lib/affiliate-moments';

const link = generateAffiliateLink('moment-123', 'user-456');
// Output: https://www.partytime.africa?moment_id=moment-123&ref=user-456&utm_source=moment&utm_medium=social
```

### Test Reward Tracking

```typescript
import { trackAffiliateTicketSale } from '@/lib/affiliate-moments';

const reward = await trackAffiliateTicketSale(
  'moment-id',
  'buyer-id',
  'event-id'
);
// Creates reward record and updates Party Points
```

### Test Party Points Redemption

```typescript
import { redeemPartyPoints } from '@/lib/affiliate-moments';

const result = await redeemPartyPoints('user-id', 100);
// Returns: { discountCode: 'PARTY1234567890', discountAmount: 1 }
```

## Styling Integration

Import the affiliate engagement styles in your main layout:

```typescript
// pages/_app.tsx or layout.tsx
import '@/styles/affiliate-engagement-styles.css';
```

## Mobile Optimization

The components are fully responsive and work on mobile devices:
- Touch-friendly buttons (48px minimum)
- Responsive grid layouts
- Modal overlays work on small screens
- Share menu positions correctly on mobile

## Analytics Tracking

The system automatically tracks:
- Moment shares (URL clicks)
- Ticket purchases via affiliate links
- Party Points earned and redeemed
- Leaderboard rankings
- Guest check-in patterns

## Performance Considerations

1. **Database Indexes**: All tables have proper indexes for fast queries
2. **Caching**: Consider adding Redis cache for leaderboard (updates every 10s)
3. **Real-time Updates**: Use Supabase real-time subscriptions for live leaderboard
4. **Rate Limiting**: Implement rate limiting on reward creation to prevent abuse

## Security Considerations

1. **URL Parameter Validation**: Validate `ref` and `moment_id` parameters
2. **User Verification**: Ensure only authenticated users can claim rewards
3. **Duplicate Prevention**: Check for duplicate rewards within time window
4. **RLS Policies**: Supabase RLS enabled on all tables

## Troubleshooting

### Rewards not appearing
- Check browser console for errors
- Verify affiliate_ref and affiliate_moment_id in sessionStorage
- Confirm user is authenticated
- Check Supabase database for records

### Party Points not updating
- Verify trackAffiliateTicketSale() is called after purchase
- Check user_id matches between moments and rewards tables
- Confirm party_points table has user record

### Leaderboard not showing
- Verify affiliate_rewards table has claimed rewards
- Check user profiles exist in users table
- Confirm avatar_url is populated

## Future Enhancements

1. **Real-time Notifications**: Notify users when Moments get engagement
2. **Affiliate Tiers**: Different reward rates based on performance
3. **Seasonal Campaigns**: Special bonus multipliers for events
4. **Withdrawal System**: Cash out Party Points to mobile money
5. **Referral Codes**: Alternative to Moment-based affiliate links
6. **Analytics Export**: CSV/PDF reports for top affiliates

## Support

For issues or questions:
1. Check browser console for errors
2. Review Supabase logs for database errors
3. Verify all components are properly imported
4. Test with sample data first

## Files Reference

- `lib/affiliate-moments.ts` - Core affiliate logic
- `components/AffiliateRewardsCard.tsx` - Rewards display
- `components/PartyPointsBalance.tsx` - Points management
- `components/AffiliateLeaderboard.tsx` - Leaderboard
- `components/MomentsFeedEnhanced.tsx` - Enhanced moments with sharing
- `components/OrganizerAnalyticsDashboard.tsx` - Analytics for organizers
- `styles/affiliate-engagement-styles.css` - All styling
- `affiliate_rewards_schema.sql` - Database schema

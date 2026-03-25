# 🎉 Party Time Africa

**Turn up, African style.**

Event platform for Africa — Beautiful invites, Mobile Money payments, table bookings & brunch events.

---

## Features

- ✅ **Event Creation** - Free & paid events with beautiful themes
- ✅ **Authentication** - Email + Phone (SMS OTP)
- ✅ **RSVP System** - Going/Maybe/Can't Go with guest lists
- ✅ **Comments** - Social engagement on events
- ✅ **Wallet System** - Top-up, track spending, installment payments
- ✅ **Table Bookings** - Reserve VIP booths, rooftop tables
- ✅ **Brunch Events** - Sunday brunch listings & bookings
- ✅ **Payment Plans** - Pay in 2, 3, or weekly installments

---

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Hosting:** Vercel
- **Database:** 20 tables with full RLS security

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/mcivan250/partytime-africa.git
cd partytime-africa/app

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Create `.env.local` in the `app` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

---

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mcivan250/partytime-africa)

1. Click the button above
2. Add environment variables
3. Deploy!

---

## Database Setup

Database schemas are in:
- `schema.sql` - Core tables (events, users, RSVPs, comments)
- `payment-schema.sql` - Payment system tables
- `table-booking-schema.sql` - Booking system tables

Apply to your Supabase project:
1. Go to SQL Editor in Supabase dashboard
2. Copy contents of each schema file
3. Run the SQL

---

## Project Structure

```
app/
├── app/                    # Next.js pages
│   ├── page.tsx           # Landing page
│   ├── create/            # Event creation
│   ├── e/[slug]/          # Event display
│   ├── auth/              # Authentication
│   ├── wallet/            # Wallet dashboard
│   ├── venues/            # Venue discovery
│   └── brunch/            # Brunch events
├── lib/                   # Utilities
│   ├── supabase.ts        # Database client
│   ├── auth.ts            # Auth helpers
│   ├── rsvp.ts            # RSVP functions
│   ├── comments.ts        # Comment functions
│   └── types.ts           # TypeScript types
└── public/                # Static assets
```

---

## Features Roadmap

### Week 1 (MVP) ✅
- [x] Event creation & display
- [x] Authentication (email + phone)
- [x] RSVP system
- [x] Comments
- [x] Wallet dashboard
- [x] Payment plans UI

### Week 2
- [ ] Mobile Money API (MTN, Airtel, M-Pesa)
- [ ] Complete booking flow
- [ ] Event editing
- [ ] WhatsApp sharing
- [ ] Profile pages

### Week 3-4
- [ ] Search functionality
- [ ] Organizer dashboard
- [ ] Revenue analytics
- [ ] QR code check-in
- [ ] WhatsApp notifications

---

## Contributing

This is a private project. For collaboration inquiries, contact the maintainer.

---

## License

Proprietary. © 2026 Chris Ivan Mugabo Holdings.

---

## Contact

- **Domain:** partytime.africa
- **Email:** Coming soon
- **Social:** @partytimeafrica

---

**Built in Uganda. For Africa. 🌍**

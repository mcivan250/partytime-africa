# Partiful Clone Analysis — Complete Feature Breakdown

**Goal:** Clone Partiful exactly, then add African market improvements.

---

## CORE FEATURES (Must Clone)

### 1. **Event Creation Flow**

**Step 1: Basic Info**
- Event title
- Date & time (or "poll for best time")
- Location (address + map link)
- Description

**Step 2: Visual Customization**
- Background themes (20+ options: sunset, galaxy, watercolor, etc.)
- Fonts (display fonts for title)
- Animations/effects (confetti, sunbeams, bows, graduation)
- Poster templates (pre-designed graphics)
- RSVP glyph style (emojis vs text)

**Step 3: Settings**
- Guest list visibility (public/private)
- Comment permissions
- Photo album enabled
- Max capacity
- RSVP deadline

### 2. **RSVP Options**

Three states:
- ✅ **Going** (green)
- ❓ **Maybe** (yellow)
- ❌ **Can't Go** (red)

Features:
- See who responded
- Profile photos visible
- Click on name → see their profile
- Change RSVP anytime

### 3. **Guest List View**

**For Hosts:**
- Full list with contact info
- Export to CSV
- Text blast button
- Individual message button

**For Guests:**
- See all "Going" people
- See all "Maybe" people
- Profile photos + names
- Click to view profile (if public)

### 4. **Comments Section**

- Threaded comments (reply to specific comments)
- Emoji reactions to comments
- @mention other guests
- Host can pin important comments
- Real-time updates (see new comments instantly)

### 5. **Host Features**

**Text Blast:**
- Send message to ALL guests at once
- Goes via email/SMS/push notification
- "Running late" "Bring drinks" "Address changed"

**Event Updates:**
- Edit details after creation
- Notify guests of changes
- Cancel event option

**Guest Management:**
- Remove uninvited guests
- Block users
- Export guest list

### 6. **Guest Questions (Pre-Event Polls)**

Host can ask:
- Dietary restrictions
- Song requests (Spotify integration)
- "What should the theme be?"
- "What should I make for dinner?"

Guests answer, everyone sees responses

### 7. **Payment Requests**

"Let guests chip in" feature:
- Add Venmo/Cash App/PayPal link
- Optional amount suggestion
- Track who paid (honor system, not enforced)

### 8. **Photo Album**

**During Event:**
- Guests upload photos in real-time
- Public or private album
- All guests can see/download

**After Event:**
- Becomes permanent memory album
- Host can curate (remove bad photos)
- Download all as ZIP

### 9. **Sharing Options**

One-tap share via:
- Copy link
- Text message (SMS)
- Email
- Instagram DM
- WhatsApp
- Twitter/X
- Facebook

**Link Format:** `partiful.com/e/[event-id]`

### 10. **Mobile App Features**

- iOS + Android native apps
- Push notifications for:
  - New RSVPs
  - New comments
  - Host updates
  - Event reminders (1 day, 1 hour before)
- Calendar integration (add to Apple/Google Calendar)

---

## USER FLOWS TO CLONE

### **Flow 1: Create Event (Host)**

1. Click "Create Event"
2. Enter title → live preview updates
3. Choose theme → background changes
4. Add date/time/location
5. Customize poster/fonts/effects
6. Set privacy settings
7. Click "Create"
8. Get shareable link
9. Share to contacts

### **Flow 2: Receive Invite (Guest)**

1. Click link (from text/WhatsApp/email)
2. See beautiful event page
3. Scroll through details
4. See who's already going (social proof)
5. Click RSVP button
6. Choose Going/Maybe/Can't Go
7. (Optional) Add comment
8. Done — now in guest list

### **Flow 3: Pre-Event Engagement**

1. Host posts update → guests get notification
2. Guests comment/ask questions
3. Other guests reply
4. Hype builds in comment thread
5. Someone shares to their Instagram Story
6. New people discover event → RSVP

### **Flow 4: Day-Of Event**

1. Guests get reminder notification
2. Click link for address/details
3. Open in Maps app
4. Arrive at party
5. Upload photos to album
6. See live feed of other guests' photos

### **Flow 5: Post-Event**

1. Host sends thank-you text blast
2. Guests view/download photo album
3. Host gets prompt: "Create your next event?"
4. **Viral loop:** Guests who had fun → create their own events

---

## DESIGN SYSTEM TO CLONE

### **Visual Style:**
- Playful, Gen Z aesthetic
- Bold typography
- Gradients + animations
- Emoji-heavy
- Mobile-first design

### **Color Palette:**
- Bright, saturated colors
- Each theme has unique gradient
- High contrast for readability

### **Typography:**
- Display fonts for event titles
- Clean sans-serif for body text
- Emoji support everywhere

### **Animations:**
- Smooth transitions
- Confetti effects
- Hover states
- Loading states are playful (not boring spinners)

---

## TECH STACK (Partiful likely uses)

**Frontend:**
- React (probably Next.js)
- Mobile: React Native or Swift/Kotlin

**Backend:**
- Node.js API
- PostgreSQL database
- Real-time: WebSockets or Firebase

**Infrastructure:**
- CDN for images (Cloudflare)
- SMS: Twilio
- Email: SendGrid
- Push notifications: OneSignal or Firebase

**Payment:**
- No direct payment processing
- Just links to Venmo/CashApp/PayPal

---

## OUR TECH STACK (Party Time)

**Frontend:**
- Next.js 15 (React)
- Tailwind CSS (rapid styling)
- Framer Motion (animations)
- React Native (mobile apps later)

**Backend:**
- Supabase (new project)
  - PostgreSQL database
  - Auth (magic link, phone)
  - Storage (images)
  - Realtime (comments/RSVPs)
  - Edge Functions (API logic)

**Integrations:**
- Flutterwave (Mobile Money payments)
- Twilio (SMS for text blast)
- Google Maps API (location)
- Cloudinary (image hosting/optimization)

**Hosting:**
- Vercel (frontend)
- Supabase (backend)

---

## DATABASE SCHEMA (MVP)

### **users**
- id (uuid)
- phone_number
- email
- name
- profile_photo_url
- created_at

### **events**
- id (uuid)
- host_id (fk → users)
- title
- description
- date_time
- location_address
- location_lat_lng
- theme (sunset, galaxy, etc.)
- poster_template
- font_style
- animation_effect
- max_capacity
- is_guest_list_public
- created_at
- updated_at

### **rsvps**
- id (uuid)
- event_id (fk → events)
- user_id (fk → users)
- status (going, maybe, cant_go)
- plus_ones (integer)
- created_at
- updated_at

### **comments**
- id (uuid)
- event_id (fk → events)
- user_id (fk → users)
- parent_comment_id (fk → comments, nullable)
- content (text)
- created_at

### **photos**
- id (uuid)
- event_id (fk → events)
- user_id (fk → users)
- image_url
- caption
- created_at

### **event_questions**
- id (uuid)
- event_id (fk → events)
- question_text
- question_type (text, multiple_choice, etc.)

### **event_answers**
- id (uuid)
- question_id (fk → event_questions)
- user_id (fk → users)
- answer_text

---

## MVP SCOPE (Week 1)

### Phase 1: Core Event Creation
- [ ] Create account (phone/email)
- [ ] Create event (title, date, location)
- [ ] Choose theme (5 preset themes to start)
- [ ] Get shareable link
- [ ] View event page

### Phase 2: RSVP System
- [ ] Guest clicks link → sees event
- [ ] RSVP (Going/Maybe/Can't Go)
- [ ] See guest list
- [ ] Profile photos

### Phase 3: Social Features
- [ ] Comment thread
- [ ] Emoji reactions
- [ ] Real-time updates

### Phase 4: Sharing
- [ ] Copy link
- [ ] Share to WhatsApp
- [ ] Share to Instagram

---

## WEEK 2-4 FEATURES

- [ ] Text blast (host → all guests)
- [ ] Photo album
- [ ] Guest questions/polls
- [ ] Calendar integration
- [ ] Mobile Money payment links
- [ ] More themes/customization
- [ ] QR code check-in
- [ ] Instagram Story templates

---

## COMPETITIVE ADVANTAGES (After Clone)

Once we have feature parity with Partiful, we add:

1. **Mobile Money** (MTN/Airtel) — bigger than Venmo in Africa
2. **Ticket Sales** — monetize paid events
3. **WhatsApp Groups** — auto-create group for attendees
4. **Transport Coordination** — ride-sharing for guests
5. **Afrocentric Themes** — Kampala vibes, Nairobi aesthetics
6. **Influencer Tools** — analytics for professional hosts
7. **Brand Partnerships** — UBL/Diageo custom templates

---

## SUCCESS METRICS

**Week 1 Goals:**
- 10 events created
- 50 total RSVPs
- 3 users create 2+ events (retention)

**Month 1 Goals:**
- 100 events
- 500 users
- 1 viral event (100+ RSVPs)
- 5 paying customers (ticket sales)

**Month 3 Goals:**
- 1,000 events
- 5,000 users
- 10% conversion to paid tier
- Partnership with 1 major brand

---

## NEXT STEPS

1. ✅ Complete this analysis
2. 🔲 Set up new Supabase project
3. 🔲 Initialize Next.js repo
4. 🔲 Build database schema
5. 🔲 Design system (Tailwind components)
6. 🔲 Event creation flow
7. 🔲 RSVP system
8. 🔲 Guest list view
9. 🔲 Comment thread
10. 🔲 Deploy MVP

**Target: MVP live in 7 days.**

---

*Last updated: 2026-03-24*

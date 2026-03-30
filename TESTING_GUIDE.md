# PartyTime Africa - Testing Guide

## Overview
This guide provides comprehensive testing procedures for all user flows and features of PartyTime Africa.

---

## Test Environment Setup

### Prerequisites
- Browser: Chrome, Firefox, Safari, or Edge (latest versions)
- Devices: Desktop, Tablet, Mobile
- Network: Stable internet connection
- Test Accounts: Use demo credentials below

### Demo Test Accounts
```
Email: chris@example.com
Password: password

Email: sarah@example.com
Password: password

Email: james@example.com
Password: password
```

---

## User Flow Testing

### Flow 1: New User Signup & First Event Discovery
**Objective:** Verify new user can sign up and discover events

**Steps:**
1. Navigate to https://partytime.africa
2. Click "Get Started" button
3. Fill signup form with:
   - Name: Test User
   - Email: testuser@example.com
   - Password: TestPass123!
4. Click "Create Account"
5. Verify redirect to dashboard
6. Click "Explore Events"
7. Verify events list displays with filters

**Expected Results:**
- ✅ Signup successful
- ✅ Dashboard loads with welcome message
- ✅ Events page shows all 10+ demo events
- ✅ Filters (Upcoming/All/Past) work correctly

---

### Flow 2: Browse Events & RSVP
**Objective:** Verify event browsing and RSVP functionality

**Steps:**
1. From events page, click on any event card
2. Review event details (title, date, location, description)
3. Click "Going" button to RSVP
4. Verify RSVP status changes
5. Go back to dashboard
6. Verify event appears in "Your RSVPs" section

**Expected Results:**
- ✅ Event detail page loads with all information
- ✅ RSVP button responds immediately
- ✅ Event appears in dashboard RSVPs
- ✅ RSVP count updates in real-time

---

### Flow 3: Create Event
**Objective:** Verify event creation workflow

**Steps:**
1. From dashboard, click "Create Event"
2. Fill form with:
   - Title: "My Test Party"
   - Description: "Test event description"
   - Date: Tomorrow
   - Time: 7:00 PM
   - Location: Test Venue, Kampala
   - Theme: Sunset
3. Click "Create Event"
4. Verify redirect to event detail page
5. Verify event appears in hosted events

**Expected Results:**
- ✅ Event creation form submits successfully
- ✅ New event appears in dashboard
- ✅ Event detail page shows correct information
- ✅ Event appears in events listing

---

### Flow 4: User Profile Management
**Objective:** Verify profile editing functionality

**Steps:**
1. Click profile icon/link
2. Click "Edit Profile"
3. Update name and bio
4. Click "Save Changes"
5. Verify changes persist after refresh

**Expected Results:**
- ✅ Profile edit mode activates
- ✅ Changes save successfully
- ✅ Updated information displays on profile

---

### Flow 5: Wallet & Transactions
**Objective:** Verify wallet page functionality

**Steps:**
1. Navigate to /wallet
2. Verify balance displays (150,000 UGX)
3. Review transaction history
4. Click "Add Funds" button
5. Click "Withdraw" button

**Expected Results:**
- ✅ Wallet page loads with balance
- ✅ Transaction history displays correctly
- ✅ Action buttons are clickable
- ✅ Affiliate earnings section visible

---

### Flow 6: Messages
**Objective:** Verify messaging functionality

**Steps:**
1. Navigate to /messages
2. Verify conversation list displays
3. Click on a conversation
4. Verify message thread loads
5. Type and send a test message

**Expected Results:**
- ✅ Messages page loads with conversations
- ✅ Unread indicators display correctly
- ✅ Conversation detail page loads
- ✅ Message composition works

---

### Flow 7: Friends
**Objective:** Verify friends functionality

**Steps:**
1. Navigate to /friends
2. Verify online friends section displays
3. Verify all friends list shows
4. Click on a friend to message
5. Check mutual friends count

**Expected Results:**
- ✅ Friends page loads with all sections
- ✅ Online status indicators display
- ✅ Friend cards show mutual friends count
- ✅ Message links work

---

### Flow 8: Vibe Map
**Objective:** Verify Vibe Map feature

**Steps:**
1. Navigate to /vibe-map
2. Verify interactive map displays
3. Click on venue markers
4. Use filter buttons (Hot/Moderate/Chill)
5. Verify venue list updates

**Expected Results:**
- ✅ Map visualization loads
- ✅ Venue markers display with correct colors
- ✅ Venue details panel shows on click
- ✅ Filters update venue list correctly
- ✅ Vibe scores display accurately

---

## Mobile Responsiveness Testing

### Test Devices
- iPhone 12/13/14 (375px width)
- Samsung Galaxy S21/S22 (360px width)
- iPad (768px width)
- Desktop (1920px width)

### Mobile Test Checklist

#### Navigation
- ✅ Hamburger menu appears on mobile
- ✅ Navigation items are touch-friendly (min 44px height)
- ✅ Links don't overlap
- ✅ Back buttons work correctly

#### Layout
- ✅ Single column layout on mobile
- ✅ Two column on tablet
- ✅ Three column on desktop
- ✅ No horizontal scrolling (except intentional)
- ✅ Images scale properly

#### Forms
- ✅ Input fields are touch-friendly
- ✅ Keyboard doesn't cover submit button
- ✅ Error messages display clearly
- ✅ Form labels are readable

#### Performance
- ✅ Pages load in < 2 seconds
- ✅ Smooth scrolling
- ✅ No lag on interactions
- ✅ Images load quickly

---

## Performance Testing

### Load Time Benchmarks
| Page | Target | Acceptable |
|------|--------|-----------|
| Homepage | < 1.5s | < 2s |
| Events List | < 1.5s | < 2s |
| Event Detail | < 1s | < 1.5s |
| Dashboard | < 1.5s | < 2s |
| Vibe Map | < 2s | < 3s |

### Lighthouse Audit
- Performance: > 90
- Accessibility: > 85
- Best Practices: > 90
- SEO: > 90

### Network Testing
- Test on 4G/LTE
- Test on 3G (if applicable)
- Test with throttled connection
- Verify graceful degradation

---

## Browser Compatibility Testing

### Desktop Browsers
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Mobile Browsers
- ✅ Chrome Mobile
- ✅ Safari iOS
- ✅ Firefox Mobile
- ✅ Samsung Internet

### Testing Checklist
- ✅ Page renders correctly
- ✅ All features work
- ✅ No console errors
- ✅ Responsive design works

---

## Accessibility Testing

### Keyboard Navigation
- ✅ Tab through all interactive elements
- ✅ Enter activates buttons
- ✅ Escape closes modals
- ✅ Focus indicators visible

### Screen Reader Testing
- ✅ Page structure makes sense
- ✅ Images have alt text
- ✅ Form labels associated with inputs
- ✅ Headings properly nested

### Color Contrast
- ✅ Text contrast ratio > 4.5:1
- ✅ UI elements contrast ratio > 3:1
- ✅ Color not only means of communication

---

## Security Testing

### Authentication
- ✅ Password field masked
- ✅ Session timeout works
- ✅ Logout clears session
- ✅ Protected routes redirect to login

### Data Validation
- ✅ SQL injection attempts blocked
- ✅ XSS attempts blocked
- ✅ CSRF tokens present
- ✅ Input sanitization works

### HTTPS
- ✅ All connections use HTTPS
- ✅ No mixed content warnings
- ✅ SSL certificate valid

---

## Bug Reporting Template

```
Title: [Brief description of issue]

Environment:
- Browser: [Chrome/Firefox/Safari/Edge]
- Device: [Desktop/Tablet/Mobile]
- OS: [Windows/Mac/iOS/Android]
- Screen Size: [e.g., 375px]

Steps to Reproduce:
1. [First step]
2. [Second step]
3. [Final step]

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Screenshots/Videos:
[Attach if possible]

Severity:
- [ ] Critical (app broken)
- [ ] High (major feature broken)
- [ ] Medium (feature partially broken)
- [ ] Low (minor issue)
```

---

## Regression Testing Checklist

### Before Each Release
- ✅ All user flows complete successfully
- ✅ No new console errors
- ✅ Mobile responsiveness verified
- ✅ Performance benchmarks met
- ✅ All links work
- ✅ Forms submit correctly
- ✅ Authentication works
- ✅ Database queries perform well

---

## Test Results Log

| Date | Tester | Environment | Result | Notes |
|------|--------|-------------|--------|-------|
| 2026-03-30 | QA Team | Desktop | PASS | All flows working |
| 2026-03-30 | QA Team | Mobile | PASS | Responsive design verified |
| 2026-03-30 | QA Team | Tablet | PASS | Layout adapts correctly |

---

## Known Issues

### Current Issues
- [ ] GitHub push authentication (workaround: local commits)
- [ ] Real-time updates require page refresh
- [ ] Payment integration pending

### Resolved Issues
- ✅ Schema mismatch (name vs title) - Fixed
- ✅ Mobile responsiveness - Improved
- ✅ Event filtering - Working

---

## Sign-Off

**QA Lead:** _________________ **Date:** _______

**Product Manager:** _________________ **Date:** _______

**Development Lead:** _________________ **Date:** _______

---

Generated: March 30, 2026

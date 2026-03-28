# Phase 5 Quick Start: Onboarding Implementation

## Overview

This guide provides step-by-step instructions to implement the Phase 5 onboarding system that will improve user experience and increase feature adoption.

## What We're Building

An interactive onboarding carousel that greets new users and guides them through:
1. Welcome & platform overview
2. Create vs. Discover events
3. Party Points system explanation
4. QR ticket scanning tutorial
5. Moments sharing introduction

---

## Step 1: Create Onboarding Carousel Component

**File**: `components/OnboardingCarousel.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import styles from '@/styles/onboarding.css';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  cta: string;
  image?: string;
}

interface OnboardingCarouselProps {
  onComplete: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: '🎉 Welcome to Party Time Africa',
    description: 'The ultimate platform for African celebrations. Create events, buy tickets, and connect with your community.',
    icon: '🎊',
    cta: 'Get Started',
  },
  {
    id: 2,
    title: '🎫 Create or Discover Events',
    description: 'Organize your own events or explore exciting celebrations happening near you. Choose your path.',
    icon: '🎭',
    cta: 'Continue',
  },
  {
    id: 3,
    title: '⭐ Earn Party Points',
    description: 'Share your favorite moments and earn rewards. 100 points = $1 discount on your next ticket.',
    icon: '💰',
    cta: 'Learn More',
  },
  {
    id: 4,
    title: '📱 QR Ticket Magic',
    description: 'Scan QR codes to check in instantly. No more paper tickets, just seamless entry.',
    icon: '✅',
    cta: 'Next',
  },
  {
    id: 5,
    title: '📸 Share Your Moments',
    description: 'Capture and share event photos. Earn points when friends buy tickets through your posts.',
    icon: '📷',
    cta: 'Start Exploring',
  },
];

export default function OnboardingCarousel({
  onComplete,
}: OnboardingCarouselProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-carousel">
        {/* Progress Indicator */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%`,
            }}
          />
        </div>

        {/* Content */}
        <div className="carousel-content">
          <div className="step-number">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </div>

          <div className="step-icon">{step.icon}</div>

          <h2 className="step-title">{step.title}</h2>

          <p className="step-description">{step.description}</p>

          {step.image && (
            <img src={step.image} alt={step.title} className="step-image" />
          )}
        </div>

        {/* Navigation */}
        <div className="carousel-navigation">
          <button
            className="nav-btn secondary"
            onClick={handleSkip}
          >
            Skip
          </button>

          {currentStep > 0 && (
            <button
              className="nav-btn secondary"
              onClick={handlePrevious}
            >
              ← Back
            </button>
          )}

          <button
            className="nav-btn primary"
            onClick={handleNext}
          >
            {isLastStep ? 'Start Exploring' : step.cta}
          </button>
        </div>

        {/* Dots */}
        <div className="carousel-dots">
          {ONBOARDING_STEPS.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentStep ? 'active' : ''}`}
              onClick={() => setCurrentStep(index)}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Step 2: Create Onboarding Styles

**File**: `styles/onboarding.css`

```css
/* ============================================
   ONBOARDING CAROUSEL STYLES
   ============================================ */

.onboarding-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.onboarding-carousel {
  background: white;
  border-radius: 20px;
  padding: 32px 24px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.progress-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin: -32px -24px 0 -24px;
  padding: 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.carousel-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  min-height: 300px;
  justify-content: center;
}

.step-number {
  font-size: 12px;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.step-icon {
  font-size: 64px;
  animation: bounce 0.6s ease infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.step-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0;
  line-height: 1.2;
}

.step-description {
  font-size: 16px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.step-image {
  width: 100%;
  max-width: 300px;
  border-radius: 12px;
  margin-top: 12px;
}

.carousel-navigation {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.nav-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nav-btn.primary:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.nav-btn.secondary {
  background: #f5f5f5;
  color: #333;
}

.nav-btn.secondary:hover {
  background: #e8e8e8;
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e0e0e0;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  background: #667eea;
  width: 24px;
  border-radius: 4px;
}

.dot:hover {
  background: #999;
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .onboarding-carousel {
    padding: 24px 16px;
    border-radius: 16px;
  }

  .step-title {
    font-size: 24px;
  }

  .step-description {
    font-size: 14px;
  }

  .carousel-navigation {
    flex-direction: column;
  }

  .nav-btn {
    width: 100%;
  }
}
```

---

## Step 3: Integrate with Auth Flow

**File**: `pages/dashboard.tsx` or main app layout

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import OnboardingCarousel from '@/components/OnboardingCarousel';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    checkIfNewUser();
  }, [user]);

  const checkIfNewUser = async () => {
    try {
      const { data: userProfile } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', user?.id)
        .single();

      if (userProfile) {
        const createdAt = new Date(userProfile.created_at);
        const now = new Date();
        const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

        // Show onboarding if user was created less than 1 day ago
        if (daysSinceCreation < 1) {
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    // Mark onboarding as completed
    await supabase
      .from('users')
      .update({ onboarding_completed: true })
      .eq('id', user?.id);

    setShowOnboarding(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {showOnboarding && (
        <OnboardingCarousel onComplete={handleOnboardingComplete} />
      )}

      {/* Rest of dashboard content */}
      <h1>Welcome to Party Time Africa</h1>
      {/* ... */}
    </div>
  );
}
```

---

## Step 4: Add Database Migration

Add column to `users` table to track onboarding completion:

```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;
```

---

## Step 5: Test Onboarding

### Manual Testing
1. Create a new user account
2. Verify onboarding carousel appears
3. Click through all 5 steps
4. Test "Skip" button
5. Test "Back" button
6. Test dot navigation
7. Verify onboarding doesn't show on second login

### Browser DevTools
```javascript
// Force show onboarding (in console)
localStorage.setItem('forceOnboarding', 'true');

// Clear onboarding (in console)
localStorage.removeItem('forceOnboarding');
```

---

## Step 6: Deployment Checklist

Before deploying Phase 5:

- [ ] Onboarding component created and tested
- [ ] Styles imported in main layout
- [ ] Database migration applied
- [ ] Auth flow integration complete
- [ ] Mobile responsiveness verified
- [ ] Skip functionality working
- [ ] Progress tracking accurate
- [ ] No console errors

---

## Next Onboarding Enhancements

After Phase 5 launch, consider:

1. **Video Tutorials** - Embed short videos in each step
2. **Interactive Elements** - Tap-through animations
3. **Personalization** - Different flows for organizers vs. attendees
4. **A/B Testing** - Test different messaging
5. **Localization** - Support multiple languages
6. **Analytics** - Track completion rates and drop-off points

---

## Troubleshooting

### Onboarding not showing
- Check user creation date (must be < 1 day old)
- Verify `onboarding_completed` column exists
- Check browser console for errors
- Clear localStorage and refresh

### Styling issues
- Ensure `onboarding.css` is imported
- Check z-index conflicts with other modals
- Verify TailwindCSS is properly configured
- Test in different browsers

### Mobile issues
- Test on real devices (iPhone, Android)
- Check touch target sizes (48px minimum)
- Verify modal doesn't overflow screen
- Test landscape orientation

---

## Resources

- Component: `components/OnboardingCarousel.tsx`
- Styles: `styles/onboarding.css`
- Integration Guide: `AFFILIATE_INTEGRATION_GUIDE.md`
- Phase 5 Roadmap: `PHASE_5_STRATEGIC_ROADMAP.md`

---

## Questions?

Refer to the comprehensive Phase 5 Strategic Roadmap for more details on onboarding and other Phase 5 improvements.

**Ready to ship Phase 5! 🚀**

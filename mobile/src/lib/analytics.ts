import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// First-party product analytics. Fire-and-forget: never blocks the UI, never
// throws. Events land in the `app_events` table and roll up via admin_funnel.
//
// Keep event names stable and few — a good funnel is a handful of steps, not a
// hundred noisy events.
export type AnalyticsEvent =
  | 'app_open'
  | 'sign_up'
  | 'event_view'
  | 'rsvp'
  | 'checkout_start'
  | 'promote_share'
  | 'payout_request'
  | 'reservation_request';

export function track(name: AnalyticsEvent, props: Record<string, unknown> = {}) {
  // Attribute to the signed-in user when we have one; the RLS policy enforces
  // that a supplied profile_id must match the caller.
  supabase.auth.getSession().then(({ data }) => {
    supabase
      .from('app_events')
      .insert({
        name,
        props,
        platform: Platform.OS,
        profile_id: data.session?.user.id ?? null,
      })
      .then(() => {});
  });
}

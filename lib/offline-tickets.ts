/**
 * Offline Ticket Cache Service
 * Allows users to access their tickets even without internet connection
 */

export interface CachedTicket {
  id: string;
  ticket_number: string;
  event_title: string;
  event_date: string;
  qr_code_data: string;
  barcode_data?: string;
  status: 'active' | 'used' | 'cancelled';
  checked_in: boolean;
  cached_at: number;
}

const STORAGE_KEY = 'party_time_tickets_cache';
const CACHE_EXPIRY_DAYS = 30;

/**
 * Save ticket to local storage for offline access
 */
export async function cacheTicketOffline(ticket: CachedTicket): Promise<void> {
  try {
    const cache = getOfflineTickets();
    const existingIndex = cache.findIndex((t) => t.id === ticket.id);

    if (existingIndex >= 0) {
      cache[existingIndex] = { ...ticket, cached_at: Date.now() };
    } else {
      cache.push({ ...ticket, cached_at: Date.now() });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error caching ticket offline:', error);
  }
}

/**
 * Retrieve all cached tickets from local storage
 */
export function getOfflineTickets(): CachedTicket[] {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return [];

    const tickets: CachedTicket[] = JSON.parse(cached);

    // Filter out expired tickets
    const now = Date.now();
    const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    return tickets.filter((ticket) => now - ticket.cached_at < maxAge);
  } catch (error) {
    console.error('Error retrieving offline tickets:', error);
    return [];
  }
}

/**
 * Get a specific ticket by ID from cache
 */
export function getOfflineTicket(ticketId: string): CachedTicket | null {
  const tickets = getOfflineTickets();
  return tickets.find((t) => t.id === ticketId) || null;
}

/**
 * Clear all cached tickets
 */
export function clearOfflineTickets(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing offline tickets:', error);
  }
}

/**
 * Generate Apple Wallet pass (PKPass format)
 * This allows users to add tickets to their Apple Wallet
 */
export async function generateAppleWalletPass(
  ticket: CachedTicket,
  eventDetails: {
    eventId: string;
    organizerName: string;
    eventLocation: string;
    eventImage: string;
  }
): Promise<Blob> {
  // This is a simplified version. In production, you'd use a library like passkit-generator
  const passData = {
    formatVersion: 1,
    teamIdentifier: 'PARTYTIME',
    passTypeIdentifier: 'pass.com.partytime.event',
    serialNumber: ticket.ticket_number,
    description: ticket.event_title,
    organizationName: eventDetails.organizerName,
    logoText: 'Party Time Africa',
    barcode: {
      format: 'PKBarcodeFormatQR',
      message: ticket.qr_code_data,
      messageEncoding: 'iso-8859-1',
    },
    locations: [
      {
        latitude: 0,
        longitude: 0,
        relevantText: eventDetails.eventLocation,
      },
    ],
    eventTicketFields: [
      {
        key: 'eventName',
        label: 'Event',
        value: ticket.event_title,
      },
      {
        key: 'eventDate',
        label: 'Date',
        value: ticket.event_date,
      },
      {
        key: 'ticketNumber',
        label: 'Ticket #',
        value: ticket.ticket_number,
      },
    ],
  };

  return new Blob([JSON.stringify(passData)], { type: 'application/json' });
}

/**
 * Generate Google Wallet pass (JWT format)
 * This allows users to add tickets to their Google Wallet
 */
export async function generateGoogleWalletPass(
  ticket: CachedTicket,
  eventDetails: {
    eventId: string;
    organizerName: string;
    eventLocation: string;
  }
): Promise<string> {
  // In production, you'd sign this JWT with your Google Wallet credentials
  const passData = {
    iss: 'PARTYTIME',
    aud: 'google',
    typ: 'savetowallet',
    origins: ['https://www.partytime.africa'],
    payload: {
      eventTicketObjects: [
        {
          id: `${eventDetails.eventId}/${ticket.ticket_number}`,
          classId: `${eventDetails.eventId}`,
          state: 'ACTIVE',
          ticketNumber: ticket.ticket_number,
          ticketHolderName: 'Ticket Holder',
          eventName: {
            defaultValue: {
              language: 'en-US',
              value: ticket.event_title,
            },
          },
          eventDateTime: {
            start: ticket.event_date,
          },
          locations: [
            {
              latitude: 0,
              longitude: 0,
            },
          ],
          barcode: {
            type: 'QR_CODE',
            value: ticket.qr_code_data,
          },
        },
      ],
    },
  };

  return JSON.stringify(passData);
}

/**
 * Detect if user is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Set up listener for online/offline status changes
 */
export function setupOfflineListener(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Sync cached tickets with server when back online
 */
export async function syncTicketsWhenOnline(
  supabase: any
): Promise<CachedTicket[]> {
  if (!isOnline()) {
    console.log('Still offline, cannot sync');
    return [];
  }

  try {
    const cachedTickets = getOfflineTickets();
    const syncedTickets: CachedTicket[] = [];

    for (const ticket of cachedTickets) {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticket.id)
        .single();

      if (!error && data) {
        // Update local cache with latest server data
        const updatedTicket: CachedTicket = {
          ...ticket,
          status: data.status,
          checked_in: data.checked_in,
          cached_at: Date.now(),
        };
        await cacheTicketOffline(updatedTicket);
        syncedTickets.push(updatedTicket);
      }
    }

    return syncedTickets;
  } catch (error) {
    console.error('Error syncing tickets:', error);
    return [];
  }
}

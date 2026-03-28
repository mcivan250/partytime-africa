import { supabase } from './supabase';
import QRCode from 'qrcode';

export interface Ticket {
  id: string;
  event_id: string;
  buyer_id: string;
  ticket_number: string;
  qr_code_data: string;
  barcode_data: string;
  price_paid: number;
  status: 'active' | 'used' | 'cancelled' | 'refunded';
  checked_in: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Generate a unique ticket number
 * Format: PT-EVENT-{eventId}-{randomNumber}
 */
export function generateTicketNumber(eventId: string): string {
  const randomNum = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `PT-${eventId.substring(0, 8).toUpperCase()}-${randomNum}`;
}

/**
 * Generate QR code data as a data URL
 */
export async function generateQRCode(ticketNumber: string, eventId: string): Promise<string> {
  try {
    const qrData = JSON.stringify({
      ticketNumber,
      eventId,
      timestamp: new Date().toISOString(),
    });

    // Use the correct options for qrcode library
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate barcode data (simplified version using ticket number)
 * In production, you'd use a barcode library like jsbarcode
 */
export function generateBarcodeData(ticketNumber: string): string {
  // Format: CODE128 barcode data
  // For now, we'll just store the ticket number
  // In production, use jsbarcode library
  return ticketNumber;
}

/**
 * Create a new ticket for an event
 */
export async function createTicket(
  eventId: string,
  buyerId: string,
  pricePaid: number
): Promise<Ticket> {
  try {
    const ticketNumber = generateTicketNumber(eventId);
    const qrCodeDataUrl = await generateQRCode(ticketNumber, eventId);
    const barcodeData = generateBarcodeData(ticketNumber);

    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          event_id: eventId,
          buyer_id: buyerId,
          ticket_number: ticketNumber,
          qr_code_data: qrCodeDataUrl,
          barcode_data: barcodeData,
          price_paid: pricePaid,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
}

/**
 * Get tickets for a specific event (for organizers)
 */
export async function getEventTickets(eventId: string) {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching event tickets:', error);
    throw error;
  }
}

/**
 * Get tickets for a specific buyer
 */
export async function getBuyerTickets(buyerId: string) {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching buyer tickets:', error);
    throw error;
  }
}

/**
 * Check in a ticket (mark as used)
 */
export async function checkInTicket(
  ticketId: string,
  organizerId: string,
  deviceInfo?: string,
  locationData?: string
): Promise<Ticket> {
  try {
    // Update ticket status
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: organizerId,
        status: 'used',
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Log the check-in
    const { error: logError } = await supabase
      .from('ticket_checkins')
      .insert([
        {
          ticket_id: ticketId,
          checked_in_by: organizerId,
          device_info: deviceInfo,
          location_data: locationData,
        },
      ]);

    if (logError) throw logError;

    return ticketData;
  } catch (error) {
    console.error('Error checking in ticket:', error);
    throw error;
  }
}

/**
 * Get check-in analytics for an event
 */
export async function getEventCheckInAnalytics(eventId: string) {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('event_id', eventId);

    if (error) throw error;

    const totalTickets = tickets?.length || 0;
    const checkedIn = tickets?.filter((t) => t.checked_in).length || 0;
    const noShow = totalTickets - checkedIn;
    const totalRevenue = tickets?.reduce((sum, t) => sum + t.price_paid, 0) || 0;

    return {
      totalTickets,
      checkedIn,
      noShow,
      checkInRate: totalTickets > 0 ? (checkedIn / totalTickets) * 100 : 0,
      totalRevenue,
      averagePrice: totalTickets > 0 ? totalRevenue / totalTickets : 0,
    };
  } catch (error) {
    console.error('Error fetching check-in analytics:', error);
    throw error;
  }
}

/**
 * Validate a ticket QR code
 */
export async function validateTicketQRCode(
  ticketNumber: string,
  eventId: string
): Promise<{ valid: boolean; ticket?: Ticket; message: string }> {
  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('ticket_number', ticketNumber)
      .eq('event_id', eventId)
      .single();

    if (error || !ticket) {
      return { valid: false, message: 'Ticket not found' };
    }

    if (ticket.status === 'cancelled') {
      return { valid: false, message: 'Ticket has been cancelled', ticket };
    }

    if (ticket.status === 'refunded') {
      return { valid: false, message: 'Ticket has been refunded', ticket };
    }

    if (ticket.checked_in) {
      return { valid: false, message: 'Ticket already checked in', ticket };
    }

    return { valid: true, ticket, message: 'Ticket is valid' };
  } catch (error) {
    console.error('Error validating ticket:', error);
    return { valid: false, message: 'Error validating ticket' };
  }
}

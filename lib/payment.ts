/**
 * Payment Integration Module
 * Handles payment processing with Flutterwave for UGX transactions
 */

export interface PaymentConfig {
  publicKey: string;
  amount: number;
  currency: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  txRef: string;
  redirectUrl: string;
}

export interface PaymentResponse {
  status: 'success' | 'failed' | 'pending';
  transactionId: string;
  amount: number;
  currency: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  tier: 'vip' | 'regular' | 'early-bird';
  price: number;
  purchasedAt: string;
  status: 'active' | 'used' | 'cancelled';
}

/**
 * Initialize Flutterwave payment
 */
export function initializeFlutterwavePayment(config: PaymentConfig): string {
  const flutterwaveUrl = 'https://checkout.flutterwave.com/v3/hosted/';
  
  const payload = {
    public_key: config.publicKey,
    tx_ref: config.txRef,
    amount: config.amount,
    currency: config.currency,
    customer: {
      email: config.email,
      phonenumber: config.phoneNumber,
      name: config.fullName,
    },
    customizations: {
      title: 'PartyTime Africa - Event Ticket',
      description: 'Purchase event ticket',
      logo: 'https://partytime.africa/logo.png',
    },
    redirect_url: config.redirectUrl,
  };

  // In production, this would be handled server-side
  return `${flutterwaveUrl}?payload=${btoa(JSON.stringify(payload))}`;
}

/**
 * Verify payment with Flutterwave
 */
export async function verifyFlutterwavePayment(
  transactionId: string,
  secretKey: string
): Promise<PaymentResponse> {
  try {
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const data = await response.json();

    if (data.status === 'success' && data.data.status === 'successful') {
      return {
        status: 'success',
        transactionId: data.data.id,
        amount: data.data.amount,
        currency: data.data.currency,
        timestamp: data.data.created_at,
      };
    }

    return {
      status: 'failed',
      transactionId: transactionId,
      amount: 0,
      currency: 'UGX',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      status: 'failed',
      transactionId: transactionId,
      amount: 0,
      currency: 'UGX',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Calculate ticket price with tiers
 */
export function calculateTicketPrice(
  basePrice: number,
  tier: 'vip' | 'regular' | 'early-bird'
): number {
  const multipliers = {
    'vip': 2.5,
    'regular': 1.0,
    'early-bird': 0.75,
  };

  return Math.round(basePrice * multipliers[tier]);
}

/**
 * Generate unique transaction reference
 */
export function generateTxRef(eventId: string, userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `PT-${eventId}-${userId}-${timestamp}-${random}`;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'UGX'): string {
  return `${amount.toLocaleString()} ${currency}`;
}

/**
 * Ticket pricing tiers for events
 */
export const TICKET_TIERS = {
  'early-bird': {
    name: 'Early Bird',
    discount: 25,
    description: 'Limited spots - 25% off',
    icon: '🐦',
  },
  'regular': {
    name: 'Regular',
    discount: 0,
    description: 'Standard admission',
    icon: '🎫',
  },
  'vip': {
    name: 'VIP',
    discount: -150,
    description: 'Premium experience with perks',
    icon: '👑',
  },
};

/**
 * Affiliate commission calculation
 */
export function calculateAffiliateCommission(
  ticketPrice: number,
  commissionRate: number = 0.1 // 10% default
): number {
  return Math.round(ticketPrice * commissionRate);
}

/**
 * Process bulk ticket purchase
 */
export async function processBulkTicketPurchase(
  eventId: string,
  userId: string,
  quantity: number,
  tier: 'vip' | 'regular' | 'early-bird',
  basePrice: number
): Promise<{ success: boolean; tickets: Ticket[]; totalAmount: number }> {
  const ticketPrice = calculateTicketPrice(basePrice, tier);
  const totalAmount = ticketPrice * quantity;
  const tickets: Ticket[] = [];

  for (let i = 0; i < quantity; i++) {
    tickets.push({
      id: `TKT-${eventId}-${userId}-${Date.now()}-${i}`,
      eventId,
      userId,
      tier,
      price: ticketPrice,
      purchasedAt: new Date().toISOString(),
      status: 'active',
    });
  }

  return {
    success: true,
    tickets,
    totalAmount,
  };
}

/**
 * Get payment status
 */
export function getPaymentStatus(
  status: string
): 'success' | 'failed' | 'pending' {
  switch (status.toLowerCase()) {
    case 'successful':
    case 'success':
      return 'success';
    case 'failed':
    case 'error':
      return 'failed';
    default:
      return 'pending';
  }
}

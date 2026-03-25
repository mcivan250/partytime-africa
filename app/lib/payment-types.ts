export interface Wallet {
  id: string;
  user_id: string;
  balance_cents: number;
  currency: string;
  pin_hash?: string;
  is_locked: boolean;
  verification_tier: 1 | 2 | 3;
  daily_limit_cents: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  related_wallet_id?: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'transfer_in' | 'transfer_out' | 'payout';
  amount_cents: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price_cents: number;
  quantity_available?: number;
  quantity_sold: number;
  is_active: boolean;
}

export interface TicketPurchase {
  id: string;
  event_id: string;
  user_id: string;
  ticket_type_id: string;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  payment_plan: 'full' | 'installment_2' | 'installment_3' | 'weekly';
  amount_paid_cents: number;
  status: 'pending' | 'confirmed' | 'payment_plan' | 'cancelled' | 'refunded';
  confirmation_code: string;
  checked_in_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Installment {
  id: string;
  ticket_purchase_id: string;
  installment_number: number;
  amount_cents: number;
  due_date: string;
  paid_at?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  reminder_sent_at?: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'mobile_money' | 'card';
  provider: string;
  last_four?: string;
  phone_number?: string;
  is_default: boolean;
  is_verified: boolean;
}

export interface EventPaymentSettings {
  id: string;
  event_id: string;
  is_paid_event: boolean;
  accept_installments: boolean;
  min_down_payment_percent: number;
  payment_deadline_hours: number;
  late_fee_cents: number;
  auto_cancel_unpaid: boolean;
  payout_timing: 'instant' | 'after_event' | 'scheduled';
}

// Helper functions
export function formatCurrency(cents: number, currency = 'USD'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function calculateInstallments(
  totalCents: number,
  plan: 'installment_2' | 'installment_3' | 'weekly',
  eventDate: Date
): { amount_cents: number; due_date: Date }[] {
  const now = new Date();
  const daysUntilEvent = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (plan === 'installment_2') {
    const firstPayment = Math.floor(totalCents * 0.5);
    const secondPayment = totalCents - firstPayment;
    
    return [
      { amount_cents: firstPayment, due_date: now },
      { amount_cents: secondPayment, due_date: new Date(eventDate.getTime() - 3 * 24 * 60 * 60 * 1000) }
    ];
  }

  if (plan === 'installment_3') {
    const firstPayment = Math.floor(totalCents * 0.35);
    const secondPayment = Math.floor(totalCents * 0.35);
    const thirdPayment = totalCents - firstPayment - secondPayment;
    
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysBefore = new Date(eventDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    return [
      { amount_cents: firstPayment, due_date: now },
      { amount_cents: secondPayment, due_date: weekFromNow },
      { amount_cents: thirdPayment, due_date: threeDaysBefore }
    ];
  }

  if (plan === 'weekly') {
    const numWeeks = Math.min(Math.floor(daysUntilEvent / 7), 4); // Max 4 weeks
    const weeklyAmount = Math.floor(totalCents / numWeeks);
    const installments: { amount_cents: number; due_date: Date }[] = [];
    
    for (let i = 0; i < numWeeks; i++) {
      const dueDate = new Date(now.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const amount = i === numWeeks - 1 
        ? totalCents - (weeklyAmount * (numWeeks - 1)) 
        : weeklyAmount;
      
      installments.push({ amount_cents: amount, due_date: dueDate });
    }
    
    return installments;
  }

  return [];
}

export function getPaymentPlanDescription(plan: TicketPurchase['payment_plan']): string {
  switch (plan) {
    case 'full':
      return 'Pay in Full';
    case 'installment_2':
      return 'Pay in 2 Installments (50% now)';
    case 'installment_3':
      return 'Pay in 3 Installments (35% now)';
    case 'weekly':
      return 'Pay Weekly';
    default:
      return 'Unknown Plan';
  }
}

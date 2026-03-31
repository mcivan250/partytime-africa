-- Create transactions table for payment tracking
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_tier_id UUID REFERENCES ticket_tiers(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'UGX',
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'flutterwave')),
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  refunded_at TIMESTAMP
);

-- Create tickets table for ticket management
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_tier_id UUID REFERENCES ticket_tiers(id),
  transaction_id VARCHAR(255) REFERENCES transactions(transaction_id),
  ticket_number VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'expired')),
  qr_code TEXT,
  checked_in_at TIMESTAMP,
  checked_in_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Create ticket tiers table for different ticket types
CREATE TABLE IF NOT EXISTS ticket_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  quantity_available INTEGER,
  quantity_sold INTEGER DEFAULT 0,
  early_bird BOOLEAN DEFAULT FALSE,
  early_bird_discount DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create email verification table
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
  verified_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_event_id ON transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_ticket_tiers_event_id ON ticket_tiers(event_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS on tickets table
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
CREATE POLICY "Users can view their own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Event hosts can view all tickets for their events" ON tickets;
CREATE POLICY "Event hosts can view all tickets for their events"
  ON tickets FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE host_id = auth.uid()
    )
  );

-- Enable RLS on ticket_tiers table
ALTER TABLE ticket_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_tiers
DROP POLICY IF EXISTS "Anyone can view ticket tiers" ON ticket_tiers;
CREATE POLICY "Anyone can view ticket tiers"
  ON ticket_tiers FOR SELECT
  USING (TRUE);

-- Enable RLS on email_verifications table
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_verifications
DROP POLICY IF EXISTS "Users can view their own verifications" ON email_verifications;
CREATE POLICY "Users can view their own verifications"
  ON email_verifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create verifications" ON email_verifications;
CREATE POLICY "Users can create verifications"
  ON email_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for transactions and tickets
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_tiers;

-- Create function to get ticket sales for an event
CREATE OR REPLACE FUNCTION get_ticket_sales(p_event_id UUID)
RETURNS TABLE (
  tier_name VARCHAR,
  quantity_sold BIGINT,
  total_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tt.name,
    COUNT(t.id)::BIGINT as quantity_sold,
    SUM(tr.amount)::DECIMAL as total_revenue
  FROM ticket_tiers tt
  LEFT JOIN tickets t ON tt.id = t.ticket_tier_id
  LEFT JOIN transactions tr ON t.transaction_id = tr.transaction_id
  WHERE tt.event_id = p_event_id
  GROUP BY tt.id, tt.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to get event revenue
CREATE OR REPLACE FUNCTION get_event_revenue(p_event_id UUID)
RETURNS TABLE (
  total_revenue DECIMAL,
  total_tickets BIGINT,
  completed_transactions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(tr.amount)::DECIMAL as total_revenue,
    COUNT(t.id)::BIGINT as total_tickets,
    COUNT(DISTINCT tr.id)::BIGINT as completed_transactions
  FROM transactions tr
  LEFT JOIN tickets t ON tr.transaction_id = t.transaction_id
  WHERE tr.event_id = p_event_id AND tr.status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Create function to check in a ticket
CREATE OR REPLACE FUNCTION check_in_ticket(p_qr_code TEXT, p_checked_in_by UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  ticket_id UUID,
  user_name VARCHAR
) AS $$
DECLARE
  v_ticket_id UUID;
  v_user_name VARCHAR;
BEGIN
  -- Find ticket by QR code
  SELECT id INTO v_ticket_id FROM tickets WHERE qr_code = p_qr_code;
  
  IF v_ticket_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Ticket not found', NULL::UUID, NULL::VARCHAR;
    RETURN;
  END IF;
  
  -- Check if already checked in
  IF (SELECT checked_in_at FROM tickets WHERE id = v_ticket_id) IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'Ticket already checked in', v_ticket_id, NULL::VARCHAR;
    RETURN;
  END IF;
  
  -- Get user name
  SELECT auth.users.raw_user_meta_data->>'name' INTO v_user_name 
  FROM tickets 
  JOIN auth.users ON tickets.user_id = auth.users.id 
  WHERE tickets.id = v_ticket_id;
  
  -- Check in the ticket
  UPDATE tickets 
  SET checked_in_at = NOW(), checked_in_by = p_checked_in_by, status = 'used'
  WHERE id = v_ticket_id;
  
  RETURN QUERY SELECT TRUE, 'Ticket checked in successfully', v_ticket_id, v_user_name;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON tickets TO authenticated;
GRANT SELECT ON ticket_tiers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON email_verifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_ticket_sales TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_revenue TO authenticated;
GRANT EXECUTE ON FUNCTION check_in_ticket TO authenticated;

-- Summary
-- This migration adds:
-- 1. transactions table - stores all payment transactions
-- 2. tickets table - stores issued tickets with QR codes
-- 3. ticket_tiers table - defines different ticket types and prices
-- 4. email_verifications table - tracks email verification status
-- 5. RLS policies - secure access to payment and ticket data
-- 6. Functions - helper functions for analytics and check-in
-- 7. Indexes - performance optimization for queries

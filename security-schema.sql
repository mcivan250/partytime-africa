-- Security & Audit Schema for Party Time Africa

-- Audit Logs (track all important actions)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL, -- 'login', 'payment', 'transfer', 'withdrawal', 'pin_change'
    entity_type TEXT, -- 'wallet', 'transaction', 'event', 'user'
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    geolocation TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Login Attempts (rate limiting)
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT,
    phone_number TEXT,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Users (for support & management)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'finance_admin', 'support_admin', 'readonly')),
    permissions JSONB DEFAULT '{}',
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Admin Actions (track what admins do)
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(id) NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    reason TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disputes (for refund requests)
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id),
    ticket_purchase_id UUID REFERENCES ticket_purchases(id),
    user_id UUID REFERENCES users(id) NOT NULL,
    type TEXT CHECK (type IN ('refund', 'fraud', 'service_issue', 'duplicate_charge', 'other')),
    reason TEXT NOT NULL,
    evidence JSONB DEFAULT '{}', -- screenshots, emails, etc.
    amount_cents INTEGER,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'rejected', 'closed')),
    resolution TEXT,
    resolved_by UUID REFERENCES admin_users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fraud Alerts (automatic detection)
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    transaction_id UUID REFERENCES transactions(id),
    alert_type TEXT NOT NULL, -- 'velocity', 'amount', 'location', 'device', 'pattern'
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    details JSONB NOT NULL,
    fraud_score DECIMAL(3,2), -- 0.00 to 1.00
    is_false_positive BOOLEAN,
    reviewed_by UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    action_taken TEXT, -- 'blocked', 'held', 'approved', 'refunded'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Questions (for account recovery)
CREATE TABLE IF NOT EXISTS security_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    question TEXT NOT NULL,
    answer_hash TEXT NOT NULL, -- bcrypt hash
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device Tracking (known devices for each user)
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    device_fingerprint TEXT NOT NULL,
    device_name TEXT, -- 'iPhone 13', 'Chrome on Windows'
    last_ip_address TEXT,
    last_location TEXT,
    is_trusted BOOLEAN DEFAULT FALSE,
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_fingerprint)
);

-- Verification Documents (for KYC)
CREATE TABLE IF NOT EXISTS verification_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    document_type TEXT CHECK (document_type IN ('national_id', 'passport', 'drivers_license', 'proof_of_address')),
    document_number TEXT,
    document_url TEXT NOT NULL, -- encrypted storage URL
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'expired')),
    verified_by UUID REFERENCES admin_users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE wallets ADD COLUMN IF NOT EXISTS pin_set_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS pin_changed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS last_transaction_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS daily_transaction_count INTEGER DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS daily_transaction_sum_cents INTEGER DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS daily_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS single_transaction_limit_cents INTEGER DEFAULT 50000;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS geolocation TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fraud_score DECIMAL(3,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES admin_users(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);

CREATE INDEX IF NOT EXISTS idx_disputes_user_id ON disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user_id ON fraud_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_severity ON fraud_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_created_at ON fraud_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON user_devices(device_fingerprint);

CREATE INDEX IF NOT EXISTS idx_verification_docs_user_id ON verification_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_docs_status ON verification_documents(verification_status);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Audit logs: Only admins can view
CREATE POLICY "Only admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Login attempts: No public access (system only)
CREATE POLICY "No public access to login attempts"
    ON login_attempts FOR ALL
    USING (false);

-- Admin users: Only super admins can manage
CREATE POLICY "Only super admins can manage admin users"
    ON admin_users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.role = 'super_admin'
        )
    );

-- Disputes: Users can view and create their own
CREATE POLICY "Users can view their own disputes"
    ON disputes FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create disputes"
    ON disputes FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all disputes"
    ON disputes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.role IN ('super_admin', 'finance_admin', 'support_admin')
        )
    );

-- Fraud alerts: Only admins
CREATE POLICY "Only admins can view fraud alerts"
    ON fraud_alerts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Security questions: Users can manage their own
CREATE POLICY "Users can manage their own security questions"
    ON security_questions FOR ALL
    USING (user_id = auth.uid());

-- User devices: Users can view their own
CREATE POLICY "Users can view their own devices"
    ON user_devices FOR SELECT
    USING (user_id = auth.uid());

-- Verification documents: Users can view their own
CREATE POLICY "Users can view their own verification docs"
    ON verification_documents FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can upload verification docs"
    ON verification_documents FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can review verification docs"
    ON verification_documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.role IN ('super_admin', 'finance_admin')
        )
    );

-- Functions for automatic daily limit reset
CREATE OR REPLACE FUNCTION reset_daily_wallet_limits()
RETURNS void AS $$
BEGIN
    UPDATE wallets
    SET 
        daily_transaction_count = 0,
        daily_transaction_sum_cents = 0,
        daily_reset_at = NOW()
    WHERE daily_reset_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on disputes
CREATE TRIGGER update_disputes_updated_at 
    BEFORE UPDATE ON disputes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create first super admin (Chris)
-- Run this manually with Chris's user ID after first signup
-- INSERT INTO admin_users (user_id, role, permissions)
-- VALUES ('[CHRIS_USER_ID]', 'super_admin', '{"all": true}');

COMMENT ON TABLE audit_logs IS 'Comprehensive logging of all security-relevant actions';
COMMENT ON TABLE login_attempts IS 'Track login attempts for rate limiting and security';
COMMENT ON TABLE admin_users IS 'Platform administrators with elevated permissions';
COMMENT ON TABLE disputes IS 'User disputes and refund requests';
COMMENT ON TABLE fraud_alerts IS 'Automatic fraud detection alerts';
COMMENT ON TABLE security_questions IS 'Account recovery security questions';
COMMENT ON TABLE user_devices IS 'Known devices for each user (device fingerprinting)';
COMMENT ON TABLE verification_documents IS 'KYC documents for identity verification';

// SQL Schema for Invoices Database
// This file defines the database schema for invoices, payments, and communications

export const INVOICES_DB_SCHEMA = `
-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date TIMESTAMP NOT NULL,
    issue_date TIMESTAMP NOT NULL,
    days_past_due INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN julianday('now') - julianday(due_date) > 0 
            THEN CAST(julianday('now') - julianday(due_date) AS INTEGER)
            ELSE 0 
        END
    ) STORED,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT -- JSON for additional fields
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'completed',
    metadata TEXT,
    FOREIGN KEY (invoice_number) REFERENCES invoices(invoice_number)
);

-- Payment plans table
CREATE TABLE IF NOT EXISTS payment_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    installment_amount DECIMAL(10,2) NOT NULL,
    frequency TEXT, -- 'weekly', 'bi-weekly', 'monthly'
    next_payment_date TIMESTAMP,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_number) REFERENCES invoices(invoice_number)
);

-- Communications table
CREATE TABLE IF NOT EXISTS communications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,
    invoice_number TEXT,
    channel TEXT NOT NULL, -- 'email', 'sms', 'phone'
    strategy TEXT NOT NULL, -- 'reminder', 'negotiation', 'final_notice'
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_status TEXT DEFAULT 'pending',
    response_received_at TIMESTAMP,
    response_content TEXT,
    ai_generated BOOLEAN DEFAULT true,
    compliance_score DECIMAL(3,2),
    cost DECIMAL(8,4),
    metadata TEXT,
    FOREIGN KEY (invoice_number) REFERENCES invoices(invoice_number)
);

-- Next actions table
CREATE TABLE IF NOT EXISTS next_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    suggested_action TEXT NOT NULL,
    suggested_time TIMESTAMP,
    suggested_channel TEXT,
    suggested_strategy TEXT,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP,
    execution_status TEXT, -- 'pending', 'completed', 'skipped'
    result TEXT,
    FOREIGN KEY (invoice_number) REFERENCES invoices(invoice_number)
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    customer_id TEXT,
    invoice_number TEXT,
    event_data TEXT, -- JSON payload
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    session_id TEXT
);

-- Indexes for invoices table
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_days_past_due ON invoices(days_past_due);
CREATE INDEX IF NOT EXISTS idx_invoices_amount ON invoices(amount);

-- Indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_invoice_number ON payments(invoice_number);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Indexes for communications table
CREATE INDEX IF NOT EXISTS idx_communications_customer_id ON communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_communications_invoice_number ON communications(invoice_number);
CREATE INDEX IF NOT EXISTS idx_communications_channel ON communications(channel);
CREATE INDEX IF NOT EXISTS idx_communications_sent_at ON communications(sent_at);
CREATE INDEX IF NOT EXISTS idx_communications_delivery_status ON communications(delivery_status);

-- Indexes for next_actions table
CREATE INDEX IF NOT EXISTS idx_next_actions_customer_id ON next_actions(customer_id);
CREATE INDEX IF NOT EXISTS idx_next_actions_invoice_number ON next_actions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_next_actions_suggested_time ON next_actions(suggested_time);
CREATE INDEX IF NOT EXISTS idx_next_actions_execution_status ON next_actions(execution_status);

-- Indexes for analytics table
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_customer_id ON analytics_events(customer_id);

-- Views for analytics
CREATE VIEW IF NOT EXISTS customer_summary AS
SELECT 
    c.customer_id,
    c.name,
    c.email,
    c.phone,
    COUNT(i.id) as total_invoices,
    COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as paid_amount,
    COALESCE(SUM(CASE WHEN i.status != 'paid' THEN i.amount ELSE 0 END), 0) as outstanding_amount,
    COALESCE(SUM(p.amount), 0) as total_paid,
    MAX(i.days_past_due) as max_days_past_due,
    c.created_at as customer_since
FROM customers c
LEFT JOIN invoices i ON c.customer_id = i.customer_id
LEFT JOIN payments p ON i.invoice_number = p.invoice_number
GROUP BY c.customer_id;

CREATE VIEW IF NOT EXISTS invoice_performance AS
SELECT 
    i.invoice_number,
    i.customer_id,
    i.amount,
    i.days_past_due,
    i.status,
    COUNT(comm.id) as communication_count,
    MAX(comm.sent_at) as last_communication,
    COALESCE(SUM(p.amount), 0) as amount_paid,
    (i.amount - COALESCE(SUM(p.amount), 0)) as balance_due,
    CASE 
        WHEN i.status = 'paid' THEN 'paid'
        WHEN i.amount = COALESCE(SUM(p.amount), 0) THEN 'paid'
        WHEN i.days_past_due <= 15 THEN 'current'
        WHEN i.days_past_due <= 30 THEN 'overdue'
        ELSE 'severely_overdue'
    END as collection_status
FROM invoices i
LEFT JOIN communications comm ON i.invoice_number = comm.invoice_number
LEFT JOIN payments p ON i.invoice_number = p.invoice_number
GROUP BY i.invoice_number;

CREATE VIEW IF NOT EXISTS channel_effectiveness AS
SELECT 
    comm.channel,
    comm.strategy,
    COUNT(*) as total_sent,
    SUM(CASE WHEN comm.delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
    SUM(CASE WHEN comm.response_received_at IS NOT NULL THEN 1 ELSE 0 END) as responses,
    AVG(comm.compliance_score) as avg_compliance_score,
    AVG(comm.cost) as avg_cost,
    SUM(CASE WHEN p.amount > 0 THEN 1 ELSE 0 END) as conversions
FROM communications comm
LEFT JOIN invoices i ON comm.invoice_number = i.invoice_number
LEFT JOIN payments p ON comm.invoice_number = p.invoice_number 
    AND p.payment_date > comm.sent_at
GROUP BY comm.channel, comm.strategy;

-- Triggers for data integrity
CREATE TRIGGER IF NOT EXISTS update_invoice_timestamp 
AFTER UPDATE ON invoices
BEGIN
    UPDATE invoices SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS log_communication_event 
AFTER INSERT ON communications
BEGIN
    INSERT INTO analytics_events (event_type, customer_id, invoice_number, event_data)
    VALUES ('communication_sent', NEW.customer_id, NEW.invoice_number, 
            json_object('channel', NEW.channel, 'strategy', NEW.strategy));
END;

CREATE TRIGGER IF NOT EXISTS log_payment_event 
AFTER INSERT ON payments
BEGIN
    INSERT INTO analytics_events (event_type, invoice_number, event_data)
    VALUES ('payment_received', NEW.invoice_number, 
            json_object('amount', NEW.amount, 'method', NEW.payment_method));
END;
`;

// Insert statements for initial data (if needed)
export const INSERT_SAMPLE_DATA = `
-- Sample invoice data (for testing)
INSERT OR IGNORE INTO invoices (
    invoice_number, customer_id, amount, due_date, issue_date, status
) VALUES 
    ('INV-2025-001', 'CUST-001', 500.00, '2025-05-01T00:00:00Z', '2025-04-15T00:00:00Z', 'pending'),
    ('INV-2025-002', 'CUST-001', 250.00, '2025-05-15T00:00:00Z', '2025-05-01T00:00:00Z', 'pending'),
    ('INV-2025-003', 'CUST-002', 1000.00, '2025-04-20T00:00:00Z', '2025-04-05T00:00:00Z', 'pending');

-- Sample communication data
INSERT OR IGNORE INTO communications (
    customer_id, invoice_number, channel, strategy, content, delivery_status
) VALUES 
    ('CUST-001', 'INV-2025-001', 'email', 'reminder', 
     'Friendly reminder about your invoice', 'delivered'),
    ('CUST-002', 'INV-2025-003', 'sms', 'negotiation', 
     'Let us help with your payment options', 'delivered');
`;

// Common queries
export const INVOICE_QUERIES = {
  // Invoice queries
  GET_BY_NUMBER: 'SELECT * FROM invoices WHERE invoice_number = ?',
  LIST_BY_CUSTOMER: 'SELECT * FROM invoices WHERE customer_id = ? ORDER BY due_date DESC',
  LIST_OVERDUE: 'SELECT * FROM invoices WHERE days_past_due > 0 AND status != "paid" ORDER BY days_past_due DESC',
  CREATE: 'INSERT INTO invoices (invoice_number, customer_id, amount, due_date, issue_date, status, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
  UPDATE: 'UPDATE invoices SET amount = ?, due_date = ?, status = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP WHERE invoice_number = ?',
  UPDATE_STATUS: 'UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE invoice_number = ?',
  
  // Payment queries
  CREATE_PAYMENT: 'INSERT INTO payments (invoice_number, amount, payment_method, transaction_id, status, metadata) VALUES (?, ?, ?, ?, ?, ?)',
  GET_PAYMENTS: 'SELECT * FROM payments WHERE invoice_number = ? ORDER BY payment_date DESC',
  GET_TOTAL_PAID: 'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_number = ? AND status = "completed"',
  
  // Communication queries
  CREATE_COMMUNICATION: 'INSERT INTO communications (customer_id, invoice_number, channel, strategy, content, ai_generated, compliance_score, cost, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  GET_COMMUNICATIONS: 'SELECT * FROM communications WHERE customer_id = ? ORDER BY sent_at DESC',
  GET_COMMUNICATIONS_BY_INVOICE: 'SELECT * FROM communications WHERE invoice_number = ? ORDER BY sent_at DESC',
  UPDATE_DELIVERY_STATUS: 'UPDATE communications SET delivery_status = ?, response_received_at = ?, response_content = ? WHERE id = ?',
  
  // Next action queries
  CREATE_NEXT_ACTION: 'INSERT INTO next_actions (customer_id, invoice_number, suggested_action, suggested_time, suggested_channel, suggested_strategy, confidence_score) VALUES (?, ?, ?, ?, ?, ?, ?)',
  GET_PENDING_ACTIONS: 'SELECT * FROM next_actions WHERE execution_status = "pending" AND suggested_time <= datetime("now")',
  UPDATE_ACTION_STATUS: 'UPDATE next_actions SET execution_status = ?, executed_at = ?, result = ? WHERE id = ?',
  
  // Analytics queries
  GET_DASHBOARD_SUMMARY: `
    SELECT 
      COUNT(DISTINCT i.customer_id) as total_customers,
      COUNT(i.id) as total_invoices,
      COALESCE(SUM(i.amount), 0) as total_outstanding,
      COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as total_paid,
      ROUND(COUNT(CASE WHEN i.status = 'paid' THEN 1 END) * 100.0 / COUNT(i.id), 2) as recovery_rate,
      AVG(i.days_past_due) as avg_days_past_due,
      COUNT(c.id) as total_communications
    FROM invoices i
    LEFT JOIN communications c ON i.invoice_number = c.invoice_number
  `,
  
  GET_CHANNEL_EFFECTIVENESS: 'SELECT * FROM channel_effectiveness',
  GET_CUSTOMER_SUMMARY: 'SELECT * FROM customer_summary WHERE customer_id = ?',
  
  // Payment plan queries
  CREATE_PAYMENT_PLAN: 'INSERT INTO payment_plans (invoice_number, total_amount, installment_amount, frequency, next_payment_date) VALUES (?, ?, ?, ?, ?)',
  GET_PAYMENT_PLAN: 'SELECT * FROM payment_plans WHERE invoice_number = ? AND status = "active"',
  UPDATE_PAYMENT_PLAN: 'UPDATE payment_plans SET next_payment_date = ?, status = ? WHERE id = ?',
  
  // Event logging
  LOG_EVENT: 'INSERT INTO analytics_events (event_type, customer_id, invoice_number, event_data, user_id, session_id) VALUES (?, ?, ?, ?, ?, ?)',
  GET_RECENT_EVENTS: 'SELECT * FROM analytics_events WHERE timestamp >= datetime("now", "-7 days") ORDER BY timestamp DESC LIMIT 100'
} as const;
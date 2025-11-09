// SQL Schema for Customers Database
// This file defines the database schema for customer management

export const CUSTOMERS_DB_SCHEMA = `
-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    address TEXT,
    company TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    communication_preferences TEXT, -- JSON: {email: true, sms: true, phone: true}
    compliance_consent TEXT, -- JSON: {tcpa_consent: boolean, consent_date: timestamp}
    metadata TEXT -- JSON for additional fields
);

-- Indexes for customers table
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Trigger to update customer timestamp on change
CREATE TRIGGER IF NOT EXISTS update_customer_timestamp 
AFTER UPDATE ON customers
BEGIN
    UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
`;

// Insert statements for initial data (if needed)
export const INSERT_CUSTOMERS = `
-- Example customer insert (for testing)
INSERT OR IGNORE INTO customers (
    customer_id, 
    name, 
    email, 
    phone, 
    communication_preferences, 
    compliance_consent
) VALUES 
    ('CUST-001', 'John Smith', 'john@example.com', '+1-555-0123', 
     '{"email": true, "sms": true, "phone": false}', 
     '{"tcpa_consent": true, "consent_date": "2025-01-15T09:00:00Z"}'),
    ('CUST-002', 'Jane Doe', 'jane@example.com', '+1-555-0456', 
     '{"email": true, "sms": false, "phone": true}', 
     '{"tcpa_consent": true, "consent_date": "2025-01-10T14:30:00Z"}');
`;

// Common queries
export const CUSTOMER_QUERIES = {
  // Get customer by ID
  GET_BY_ID: 'SELECT * FROM customers WHERE customer_id = ?',
  
  // Get customer by email
  GET_BY_EMAIL: 'SELECT * FROM customers WHERE email = ?',
  
  // Get customer by phone
  GET_BY_PHONE: 'SELECT * FROM customers WHERE phone = ?',
  
  // List all customers with pagination
  LIST_ALL: `
    SELECT * FROM customers 
    WHERE status = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `,
  
  // Search customers
  SEARCH: `
    SELECT * FROM customers 
    WHERE (name LIKE ? OR email LIKE ? OR company LIKE ?)
    AND status = ?
    ORDER BY name ASC
    LIMIT ? OFFSET ?
  `,
  
  // Create new customer
  CREATE: `
    INSERT INTO customers (
      customer_id, name, email, phone, address, company, 
      communication_preferences, compliance_consent, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  
  // Update customer
  UPDATE: `
    UPDATE customers SET 
      name = ?, email = ?, phone = ?, address = ?, company = ?,
      communication_preferences = ?, compliance_consent = ?, metadata = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE customer_id = ?
  `,
  
  // Update customer status
  UPDATE_STATUS: `
    UPDATE customers SET 
      status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE customer_id = ?
  `,
  
  // Delete customer (soft delete)
  DELETE: `
    UPDATE customers SET 
      status = 'archived', updated_at = CURRENT_TIMESTAMP
    WHERE customer_id = ?
  `,
  
  // Count customers by status
  COUNT_BY_STATUS: 'SELECT COUNT(*) as count FROM customers WHERE status = ?',
  
  // Get customers with overdue invoices
  WITH_OVERDUE: `
    SELECT DISTINCT c.* FROM customers c
    INNER JOIN invoices i ON c.customer_id = i.customer_id
    WHERE i.days_past_due > 0 AND i.status != 'paid'
    AND c.status = 'active'
    ORDER BY i.days_past_due DESC
  `,
  
  // Get customer statistics
  GET_STATS: `
    SELECT 
      COUNT(*) as total_customers,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_customers,
      COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as customers_with_email,
      COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as customers_with_phone,
      COUNT(CASE WHEN compliance_consent IS NOT NULL THEN 1 END) as customers_with_consent
    FROM customers
  `
} as const;
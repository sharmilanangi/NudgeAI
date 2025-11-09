// Database types for customers-db
// Generated from SQL schema

export interface CustomerRow {
  id: number;
  customer_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'archived';
  communication_preferences?: string; // JSON string
  compliance_consent?: string; // JSON string
  metadata?: string; // JSON string
}

export interface DB {
  customers: CustomerRow;
}
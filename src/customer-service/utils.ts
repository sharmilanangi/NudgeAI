// Customer Service Utility Functions
// GREEN phase implementation - minimal but functional

import { Customer, CreateCustomerRequest, UpdateCustomerRequest, CustomerValidationResult } from './interfaces';

/**
 * Validate customer data for creation or updates
 */
export function validateCustomerData(
  data: CreateCustomerRequest | UpdateCustomerRequest,
  isUpdate: boolean = false
): CustomerValidationResult {
  const errors: string[] = [];

  // Name is required for both create and update
  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required');
    } else if (data.name.length > 200) {
      errors.push('Name must be 200 characters or less');
    }
  } else if (!isUpdate) {
    errors.push('Name is required');
  }

  // Email validation
  if (data.email !== undefined) {
    if (data.email && !isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }
  }

  // Phone validation
  if (data.phone !== undefined) {
    if (data.phone && !isValidPhone(data.phone)) {
      errors.push('Invalid phone number format');
    }
  }

  // TCPA compliance validation
  if (data.complianceConsent !== undefined) {
    if (data.complianceConsent && !isTcpaCompliant(data.complianceConsent)) {
      errors.push('TCPA consent data is invalid');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate a unique customer ID
 */
export function generateCustomerId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `CUST-${timestamp}-${random}`.toUpperCase();
}

/**
 * Sanitize customer data before database operations
 */
export function sanitizeCustomerData(
  data: CreateCustomerRequest | UpdateCustomerRequest
): CreateCustomerRequest | UpdateCustomerRequest {
  const sanitized: CreateCustomerRequest | UpdateCustomerRequest = {};

  if (data.name !== undefined) {
    sanitized.name = data.name.trim();
  }

  if (data.email !== undefined) {
    sanitized.email = data.email ? data.email.toLowerCase().trim() : undefined;
  }

  if (data.phone !== undefined) {
    sanitized.phone = data.phone ? data.phone.trim() : undefined;
  }

  if (data.address !== undefined) {
    sanitized.address = data.address ? data.address.trim() : undefined;
  }

  if (data.company !== undefined) {
    sanitized.company = data.company ? data.company.trim() : undefined;
  }

  if (data.communicationPreferences !== undefined) {
    sanitized.communicationPreferences = data.communicationPreferences;
  }

  if (data.complianceConsent !== undefined) {
    sanitized.complianceConsent = data.complianceConsent;
  }

  return sanitized;
}

/**
 * Check if customer exists in database
 */
export async function customerExists(customerId: string): Promise<boolean> {
  // This would be implemented with actual database calls
  // For now, return false to allow creation
  return false;
}

/**
 * Transform database row to Customer object
 */
export function mapDbRowToCustomer(row: any): Customer {
  return {
    customerId: row.customer_id,
    name: row.name,
    email: row.email || undefined,
    phone: row.phone || undefined,
    address: row.address || undefined,
    company: row.company || undefined,
    communicationPreferences: row.communication_preferences 
      ? JSON.parse(row.communication_preferences) 
      : undefined,
    complianceConsent: row.compliance_consent 
      ? JSON.parse(row.compliance_consent) 
      : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status || 'active'
  };
}

/**
 * Transform Customer object to database row
 */
export function mapCustomerToDbRow(customer: Customer): any {
  return {
    customer_id: customer.customerId,
    name: customer.name,
    email: customer.email || null,
    phone: customer.phone || null,
    address: customer.address || null,
    company: customer.company || null,
    communication_preferences: customer.communicationPreferences 
      ? JSON.stringify(customer.communicationPreferences) 
      : null,
    compliance_consent: customer.complianceConsent 
      ? JSON.stringify(customer.complianceConsent) 
      : null,
    status: customer.status
  };
}

/**
 * Apply search filters to customer query
 */
export function applyCustomerFilters(
  baseQuery: string,
  filters: any
): { query: string; params: any[] } {
  const params: any[] = [];
  let whereConditions: string[] = [];

  if (filters.query) {
    whereConditions.push('(name LIKE ? OR email LIKE ? OR company LIKE ?)');
    const searchPattern = `%${filters.query}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (filters.status) {
    whereConditions.push('status = ?');
    params.push(filters.status);
  }

  if (filters.email) {
    whereConditions.push('email = ?');
    params.push(filters.email);
  }

  if (filters.phone) {
    whereConditions.push('phone = ?');
    params.push(filters.phone);
  }

  if (filters.company) {
    whereConditions.push('company = ?');
    params.push(filters.company);
  }

  // Build the complete query
  let query = baseQuery;
  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  // Add sorting
  const sortBy = filters.sortBy || 'name';
  const sortOrder = filters.sortOrder || 'asc';
  query += ` ORDER BY ${sortBy} ${sortOrder}`;

  // Add pagination
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return { query, params };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  // Basic phone validation - allow +, digits, spaces, hyphens, parentheses
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Check TCPA compliance for consent data
 */
export function isTcpaCompliant(consent: any): boolean {
  if (!consent || typeof consent !== 'object') {
    return false;
  }

  // Must have tcpaConsent as boolean
  if (typeof consent.tcpaConsent !== 'boolean') {
    return false;
  }

  // If consent is given, must have consentDate
  if (consent.tcpaConsent) {
    if (!consent.consentDate || typeof consent.consentDate !== 'string') {
      return false;
    }

    // Check if consentDate is a valid date string
    const consentDate = new Date(consent.consentDate);
    if (isNaN(consentDate.getTime())) {
      return false;
    }
  }

  return true;
}

/**
 * Format customer data for API response
 */
export function formatCustomerResponse(customer: Customer): Customer {
  // Return a copy to prevent mutation
  return { ...customer };
}

/**
 * Create customer audit log entry
 */
export async function logCustomerOperation(
  operation: string,
  customerId: string,
  userId?: string
): Promise<void> {
  // In a real implementation, this would log to an audit table
  // For GREEN phase, we'll just console.log
  const logEntry = {
    operation,
    customerId,
    userId,
    timestamp: new Date().toISOString()
  };
  
  console.log('Customer operation:', JSON.stringify(logEntry));
}
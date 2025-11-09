// Shared utility functions for Nudge AI
// These will be expanded during TDD implementation

import { Customer, Invoice } from './interfaces';

/**
 * Calculate days past due for an invoice
 */
export function calculateDaysPastDue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic US format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?1?-?\.?\s?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Check if current time is within TCPA compliant calling hours (8 AM - 9 PM local time)
 */
export function isTcpaCompliantTime(timezone: string = 'America/New_York'): boolean {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: '2-digit',
    hour12: false
  };
  const hour = parseInt(now.toLocaleTimeString('en-US', options));
  return hour >= 8 && hour <= 21;
}

/**
 * Get the next TCPA compliant time for communication
 */
export function getNextTcpaCompliantTime(timezone: string = 'America/New_York'): Date {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: '2-digit',
    hour12: false
  };
  const hour = parseInt(now.toLocaleTimeString('en-US', options));
  
  const nextTime = new Date(now);
  
  if (hour < 8) {
    // Before 8 AM, set to 8 AM today
    nextTime.setHours(8, 0, 0, 0);
  } else if (hour >= 21) {
    // After 9 PM, set to 8 AM tomorrow
    nextTime.setDate(nextTime.getDate() + 1);
    nextTime.setHours(8, 0, 0, 0);
  }
  // If within hours, can use current time
  
  return nextTime;
}

/**
 * Calculate confidence score for AI recommendations
 */
export function calculateConfidenceScore(
  factors: { factor: string; weight: number; present: boolean }[]
): number {
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const presentWeight = factors
    .filter(f => f.present)
    .reduce((sum, f) => sum + f.weight, 0);
  
  return totalWeight > 0 ? presentWeight / totalWeight : 0;
}

/**
 * Determine collection strategy based on days past due and amount
 */
export function determineCollectionStrategy(
  daysPastDue: number,
  amount: number
): 'reminder' | 'negotiation' | 'final_notice' | 'escalation' {
  if (daysPastDue <= 15) {
    return 'reminder';
  } else if (daysPastDue <= 30) {
    return 'negotiation';
  } else if (daysPastDue <= 60) {
    return amount > 1000 ? 'negotiation' : 'final_notice';
  } else {
    return 'escalation';
  }
}

/**
 * Validate required fields for customer creation
 */
export function validateCustomer(customer: Partial<Customer>): string[] {
  const errors: string[] = [];
  
  if (!customer.customerId || customer.customerId.trim().length === 0) {
    errors.push('Customer ID is required');
  }
  
  if (!customer.name || customer.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (customer.email && !isValidEmail(customer.email)) {
    errors.push('Invalid email format');
  }
  
  if (customer.phone && !isValidPhone(customer.phone)) {
    errors.push('Invalid phone format');
  }
  
  return errors;
}

/**
 * Validate required fields for invoice creation
 */
export function validateInvoice(invoice: Partial<Invoice>): string[] {
  const errors: string[] = [];
  
  if (!invoice.invoiceNumber || invoice.invoiceNumber.trim().length === 0) {
    errors.push('Invoice number is required');
  }
  
  if (!invoice.customerId || invoice.customerId.trim().length === 0) {
    errors.push('Customer ID is required');
  }
  
  if (!invoice.amount || invoice.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (!invoice.dueDate) {
    errors.push('Due date is required');
  }
  
  return errors;
}
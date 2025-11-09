// Invoice Service TypeScript Interfaces
// Interfaces for invoice creation, management, payment tracking, and financial calculations

import type { PaymentMethod } from '../payment-processor/interfaces';
import type { PaymentPlanFrequency } from '../shared/types';

export interface Invoice {
  invoiceNumber: string;
  customerId: string;
  amount: number;
  dueDate: string;
  issueDate: string;
  daysPastDue: number;
  status: 'pending' | 'paid' | 'partially_paid' | 'written_off';
  createdAt: string;
  updatedAt: string;
  paymentsMade?: number;
  balanceDue?: number;
  lastCommunication?: string;
  nextAction?: NextAction;
}

export interface Payment {
  paymentId: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod | string;
  transactionId?: string;
  status: 'completed' | 'failed' | 'pending';
  fee?: number;
  netAmount?: number;
}

export interface PaymentPlan {
  planId: string;
  invoiceNumber: string;
  totalAmount: number;
  installmentAmount: number;
  frequency: PaymentPlanFrequency;
  nextPaymentDate: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  installments: PaymentPlanInstallment[];
}

export interface PaymentPlanInstallment {
  dueDate: string;
  amount: number;
  status: 'scheduled' | 'paid' | 'failed';
}

export type PaymentInstallmentStatus = 'scheduled' | 'paid' | 'failed';

export interface NextAction {
  action: string;
  strategy: string;
  channel: string;
  suggestedTime: string;
  confidence: number;
  reasoning?: {
    factors: string[];
    dataPoints: Record<string, any>;
  };
}

// Invoice creation and management interfaces
export interface CreateInvoiceRequest {
  invoiceNumber: string;
  customerId: string;
  amount: number;
  dueDate: string;
  issueDate: string;
  metadata?: Record<string, any>;
}

export interface UpdateInvoiceRequest {
  amount?: number;
  dueDate?: string;
  status?: Invoice['status'];
  metadata?: Record<string, any>;
}

export interface InvoiceQuery {
  customerId?: string;
  status?: Invoice['status'];
  minAmount?: number;
  maxAmount?: number;
  minDaysPastDue?: number;
  maxDaysPastDue?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'invoiceNumber' | 'amount' | 'dueDate' | 'daysPastDue' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Payment processing interfaces
export interface CreatePaymentRequest {
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  fee?: number;
  metadata?: Record<string, any>;
}

export interface PaymentSummary {
  totalPaid: number;
  totalFees: number;
  netAmount: number;
  paymentCount: number;
  lastPaymentDate?: string;
}

// Payment plan interfaces
export interface CreatePaymentPlanRequest {
  invoiceNumber: string;
  totalAmount: number;
  installmentAmount: number;
  frequency: PaymentPlan['frequency'];
  startDate: string;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentPlanRequest {
  installmentAmount?: number;
  frequency?: PaymentPlan['frequency'];
  nextPaymentDate?: string;
  status?: PaymentPlan['status'];
}

// Financial calculation interfaces
export interface FinancialSummary {
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  averageDaysPastDue: number;
  recoveryRate: number;
  paymentPlanCount: number;
  writtenOffAmount: number;
}

export interface CustomerInvoiceSummary {
  customerId: string;
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  balanceDue: number;
  averageDaysPastDue: number;
  oldestInvoiceDate?: string;
  newestInvoiceDate?: string;
}

export interface InvoiceMetrics {
  invoiceNumber: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentProgress: number; // percentage
  daysPastDue: number;
  projectedPayoffDate?: string;
  riskScore: number; // 0-100
}

// Database result wrapper
export interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  rowCount?: number;
  executionTime?: number;
}

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    executionTime: number;
  };
}
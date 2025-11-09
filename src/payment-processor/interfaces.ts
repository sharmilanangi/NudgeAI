// Payment Processor TypeScript Interfaces
// Comprehensive interface definitions for payment processing functionality

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'ach';
  token: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  country?: string;
  isDefault?: boolean;
  customerId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface PaymentGatewayResponse {
  success: boolean;
  transactionId?: string;
  amount?: number;
  currency?: string;
  status?: 'succeeded' | 'failed' | 'pending' | 'requires_action';
  errorCode?: string;
  errorMessage?: string;
  fees?: PaymentGatewayFees;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface PaymentGatewayFees {
  processingFee: number;
  applicationFee?: number;
  stripeFee?: number;
  netAmount: number;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  paymentMethodId: string;
  gatewayTransactionId?: string;
  gatewayResponse?: PaymentGatewayResponse;
  failureReason?: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: string;
  transactionId: string;
  amount: number;
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other';
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  gatewayRefundId?: string;
  gatewayResponse?: PaymentGatewayResponse;
  failureReason?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chargeback {
  id: string;
  transactionId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'under_review' | 'won' | 'lost';
  evidenceRequired?: boolean;
  evidenceSubmitted?: boolean;
  dueDate?: string;
  gatewayChargebackId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
  riskScore?: number;
  recommendations?: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  recommendation?: string;
}

export interface PaymentProcessingOptions {
  captureMethod?: 'automatic' | 'manual';
  statementDescriptor?: string;
  receiptEmail?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
  offSession?: boolean;
  confirmImmediately?: boolean;
  returnUrl?: string;
}

export interface PaymentProcessorConfig {
  gatewayProvider: 'stripe' | 'paypal' | 'square';
  stripeSecretKey?: string;
  webhookSecret?: string;
  defaultCurrency: string;
  supportedCurrencies: string[];
  maxTransactionAmount: number;
  fraudDetectionEnabled: boolean;
  retryPolicy: RetryPolicy;
  refundPolicy: RefundPolicy;
  chargebackPolicy: ChargebackPolicy;
}

export interface RetryPolicy {
  maxAttempts: number;
  retryDelay: number[]; // in seconds
  exponentialBackoff: boolean;
  retryableErrorCodes: string[];
}

export interface RefundPolicy {
  autoRefundEnabled: boolean;
  refundWindow: number; // in days
  maxRefundAmount: number;
  requireApproval: boolean;
  autoApprovalThreshold: number;
}

export interface ChargebackPolicy {
  autoResponseEnabled: boolean;
  evidenceCollectionEnabled: boolean;
  responseDeadline: number; // in days
  autoWinThreshold: number;
}

export interface PaymentMetrics {
  totalProcessed: number;
  totalAmount: number;
  successRate: number;
  averageProcessingTime: number;
  failureReasons: Record<string, number>;
  refundRate: number;
  chargebackRate: number;
  topPaymentMethods: Array<{
    type: string;
    count: number;
    amount: number;
  }>;
  dailyProcessing: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
}

export interface PaymentEventPayload {
  type: 'payment.completed' | 'payment.failed' | 'refund.processed' | 'chargeback.initiated' | 'chargeback.resolved';
  data: {
    transactionId?: string;
    refundId?: string;
    chargebackId?: string;
    invoiceNumber?: string;
    customerId?: string;
    amount?: number;
    status?: string;
    reason?: string;
    gatewayResponse?: PaymentGatewayResponse;
    metadata?: Record<string, any>;
  };
  timestamp: string;
  version: string;
}

export interface PaymentProcessorService {
  // Payment processing
  processPayment(request: PaymentProcessingRequest): Promise<Transaction>;
  validatePaymentMethod(paymentMethod: PaymentMethod): Promise<PaymentValidationResult>;
  validatePaymentAmount(amount: number, invoiceNumber?: string): Promise<PaymentValidationResult>;
  
  // Transaction management
  getTransaction(transactionId: string): Promise<Transaction | null>;
  retryTransaction(transactionId: string): Promise<Transaction>;
  cancelTransaction(transactionId: string): Promise<Transaction>;
  
  // Refund handling
  processRefund(transactionId: string, amount: number, reason: string): Promise<Refund>;
  getRefund(refundId: string): Promise<Refund | null>;
  listRefunds(transactionId: string): Promise<Refund[]>;
  
  // Chargeback handling
  handleChargeback(chargebackData: any): Promise<Chargeback>;
  submitChargebackEvidence(chargebackId: string, evidence: any): Promise<Chargeback>;
  getChargeback(chargebackId: string): Promise<Chargeback | null>;
  
  // Utilities
  getPaymentMetrics(startDate?: string, endDate?: string): Promise<PaymentMetrics>;
  getPaymentMethods(customerId: string): Promise<PaymentMethod[]>;
  deletePaymentMethod(paymentMethodId: string): Promise<boolean>;
}

export interface PaymentProcessingRequest {
  invoiceNumber: string;
  customerId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  options?: PaymentProcessingOptions;
}

// Gateway-specific interfaces for Stripe integration
export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  customer: string;
  metadata?: Record<string, any>;
  created: number;
}

export interface StripeRefund {
  id: string;
  amount: number;
  currency: string;
  payment_intent: string;
  status: string;
  reason?: string;
  metadata?: Record<string, any>;
  created: number;
}

export interface StripeChargeback {
  id: string;
  amount: number;
  currency: string;
  charge: string;
  reason: string;
  status: string;
  is_charge_refundable: boolean;
  created: number;
}
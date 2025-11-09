// Shared interfaces for Nudge AI
// These will be populated during TDD implementation

export interface Customer {
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  communicationPreferences?: {
    email: boolean;
    sms: boolean;
    phone: boolean;
  };
  complianceConsent?: {
    tcpaConsent: boolean;
    consentDate: string;
  };
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'archived';
}

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

export interface Communication {
  id: string;
  customerId: string;
  invoiceNumber?: string;
  channel: 'email' | 'sms' | 'phone';
  strategy: 'reminder' | 'negotiation' | 'final_notice';
  content: string;
  sentAt: string;
  deliveryStatus: 'pending' | 'delivered' | 'failed';
  responseReceivedAt?: string;
  responseContent?: string;
  aiGenerated: boolean;
  complianceScore?: number;
  cost?: number;
}

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

export interface Payment {
  paymentId: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
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
  frequency: 'weekly' | 'bi_weekly' | 'monthly';
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

// API Request/Response types will be added during TDD
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
    timestamp?: string;
  };
}

// Environment types
export interface Env {
  // Services
  API_GATEWAY: any;
  CUSTOMER_SERVICE: any;
  INVOICE_SERVICE: any;
  COMMUNICATION_SERVICE: any;
  AI_AGENT_SERVICE: any;
  COMPLIANCE_SERVICE: any;
  ANALYTICS_SERVICE: any;
  PAYMENT_PROCESSOR: any;
  ADMIN_SERVICE: any;
  
  // Data Storage
  CUSTOMERS_DB: any;
  INVOICES_DB: any;
  CUSTOMER_DATA: any;
  COMMUNICATIONS_LOG: any;
  
  // Queues
  PAYMENT_EVENTS: any;
  COMMUNICATION_EVENTS: any;
  COMPLIANCE_CHECKS: any;
  AI_PROCESSING: any;
  EMAIL_SENDING: any;
  SMS_SENDING: any;
  VOICE_CALLS: any;
  
  // Environment variables
  JWT_SECRET: string;
  DATABASE_URL: string;
  STRIPE_SECRET_KEY: string;
  SENDGRID_API_KEY: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
}
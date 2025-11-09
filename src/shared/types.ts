// Shared type definitions for Nudge AI
// These will be expanded during TDD implementation

export type CommunicationChannel = 'email' | 'sms' | 'phone';
export type CommunicationStrategy = 'reminder' | 'negotiation' | 'final_notice';
export type CustomerStatus = 'active' | 'inactive' | 'archived';
export type InvoiceStatus = 'pending' | 'paid' | 'partially_paid' | 'written_off';
export type PaymentStatus = 'completed' | 'failed' | 'pending';
export type PaymentPlanStatus = 'active' | 'completed' | 'cancelled';
export type DeliveryStatus = 'pending' | 'delivered' | 'failed';
export type PaymentPlanFrequency = 'weekly' | 'bi_weekly' | 'monthly';

export type SortOrder = 'asc' | 'desc';
export type SortField = 'name' | 'amount' | 'daysPastDue' | 'lastCommunication';

export type ApiError = {
  code: string;
  message: string;
  details?: any;
  requestId?: string;
  timestamp?: string;
};

export type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type FilterOptions = {
  status?: CustomerStatus;
  minAmount?: number;
  maxAmount?: number;
  minDaysPastDue?: number;
  maxDaysPastDue?: number;
  customerId?: string;
};

export type CustomerFilter = {
  status?: CustomerStatus;
  minAmount?: number;
  maxDaysPastDue?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
};

export type NextActionRequest = {
  customerId: string;
  action: {
    type: string;
    strategy: string;
    channel: string;
    executeAt?: string;
  };
  customizations?: {
    urgency?: 'low' | 'medium' | 'high';
    tone?: string;
  };
};

export type CommunicationRequest = {
  customerId: string;
  invoiceNumber?: string;
  strategy: CommunicationStrategy;
  customizations?: {
    subject?: string;
    urgency?: string;
  };
  sendImmediately?: boolean;
};

export type PaymentRequest = {
  invoiceNumber: string;
  amount: number;
  paymentMethod: {
    type: string;
    token: string;
    last4?: string;
  };
  customerId?: string;
};

export type PaymentPlanRequest = {
  invoiceNumber: string;
  totalAmount: number;
  installmentAmount: number;
  frequency: PaymentPlanFrequency;
  startDate: string;
  paymentMethod: {
    type: string;
    token: string;
  };
};

export type ImportRequest = {
  format: 'csv';
  data: string;
  mapping: Record<string, number>;
  options?: {
    skipDuplicates?: boolean;
    validateCustomers?: boolean;
  };
};

export type ImportResponse = {
  importId: string;
  status: 'processing' | 'completed' | 'failed';
  recordsProcessed: number;
  totalRecords: number;
  errors: string[];
  estimatedCompletion?: string;
};

export type AnalyticsSummary = {
  totalCustomers: number;
  totalInvoices: number;
  totalOutstanding: number;
  recoveryRate: number;
  averageDaysPastDue: number;
  communicationsSent: number;
};

export type ChannelEffectiveness = {
  channel: CommunicationChannel;
  sent: number;
  delivered: number;
  responses: number;
  conversionRate: number;
};

export type CustomerSummary = {
  customers: Array<{
    customerId: string;
    name: string;
    email?: string;
    phone?: string;
    totalInvoices: number;
    outstandingAmount: number;
    maxDaysPastDue: number;
    lastCommunication?: string;
    nextAction?: any;
  }>;
  pagination: PaginationInfo;
};

export type InvoiceSummary = {
  invoices: Array<{
    invoiceNumber: string;
    customerId: string;
    amount: number;
    daysPastDue: number;
    status: InvoiceStatus;
    paymentsMade?: number;
    balanceDue?: number;
    lastCommunication?: string;
    nextAction?: any;
  }>;
  summary: {
    totalAmount: number;
    totalInvoices: number;
    averageDaysPastDue: number;
  };
};

// Database result types
export type DatabaseResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    duration: number;
    rowsRead: number;
    rowsWritten: number;
  };
};

// Event types for observers and queues
export type PaymentEvent = {
  type: 'payment_completed' | 'payment_failed';
  invoiceNumber: string;
  amount: number;
  timestamp: string;
  transactionId?: string;
  error?: string;
};

export type CommunicationEvent = {
  type: 'communication_sent' | 'communication_delivered' | 'communication_failed';
  customerId: string;
  invoiceNumber?: string;
  channel: CommunicationChannel;
  strategy: CommunicationStrategy;
  timestamp: string;
  communicationId: string;
  cost?: number;
  error?: string;
};

export type ComplianceCheckEvent = {
  type: 'compliance_check';
  customerId: string;
  communicationId: string;
  content: string;
  channel: CommunicationChannel;
  timestamp: string;
};

// AI-related types
export type AiRequest = {
  model: string;
  input: any;
  options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
};

export type AiResponse = {
  success: boolean;
  response?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
};
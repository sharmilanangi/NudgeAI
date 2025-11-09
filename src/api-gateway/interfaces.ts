// API Gateway TypeScript interfaces for request/response handling
// These interfaces define the contracts for HTTP API operations

export interface AuthenticatedRequest {
  userId?: string;
  apiKey?: string;
  roles?: string[];
  permissions?: string[];
  clientId?: string;
}

export interface RequestMetadata {
  requestId: string;
  timestamp: string;
  clientIP: string;
  userAgent: string;
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
}

export interface RouteConfig {
  path: string;
  method: string;
  handler: string;
  authentication?: {
    required: boolean;
    methods: ('api_key' | 'jwt' | 'oauth')[];
    roles?: string[];
    permissions?: string[];
  };
  validation?: {
    body?: Record<string, any>;
    query?: Record<string, any>;
    headers?: Record<string, any>;
  };
  rateLimit?: {
    requests: number;
    window: number; // seconds
    strategy?: 'fixed' | 'sliding';
  };
  cache?: {
    enabled: boolean;
    ttl: number; // seconds
    key?: string;
    vary?: string[];
  };
  timeout?: number; // milliseconds
  retries?: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface CacheControl {
  maxAge?: number;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
  etag?: string;
  lastModified?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
    timestamp?: string;
    stack?: string; // Only in development
  };
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
    rateLimit?: RateLimitInfo;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    cache?: CacheControl;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  code: string;
}

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  clientId?: string;
  roles?: string[];
  permissions?: string[];
  error?: {
    code: string;
    message: string;
  };
}

export interface ServiceCallResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    service: string;
    duration: number;
  };
  duration: number;
}

export interface GatewayMetrics {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  responseSize: number;
  cacheHit: boolean;
  authenticated: boolean;
  userId?: string;
  clientId?: string;
  userAgent: string;
  clientIP: string;
  timestamp: string;
}

// Customer API specific interfaces
export interface CreateCustomerRequest {
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
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  communicationPreferences?: {
    email?: boolean;
    sms?: boolean;
    phone?: boolean;
  };
  status?: 'active' | 'inactive' | 'archived';
}

export interface GetCustomersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'archived';
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// Invoice API specific interfaces
export interface CreateInvoiceRequest {
  customerId: string;
  amount: number;
  dueDate: string;
  issueDate?: string;
}

export interface UpdateInvoiceRequest {
  amount?: number;
  dueDate?: string;
  status?: 'pending' | 'paid' | 'partially_paid' | 'written_off';
}

export interface GetInvoicesQuery {
  customerId?: string;
  page?: number;
  limit?: number;
  status?: 'pending' | 'paid' | 'partially_paid' | 'written_off';
  sortBy?: 'issueDate' | 'dueDate' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

// Communication API specific interfaces
export interface SendCommunicationRequest {
  customerId: string;
  invoiceNumber?: string;
  channel: 'email' | 'sms' | 'phone';
  strategy: 'reminder' | 'negotiation' | 'final_notice';
  content?: string;
  sendAt?: string;
}

export interface GetCommunicationsQuery {
  customerId?: string;
  invoiceNumber?: string;
  channel?: 'email' | 'sms' | 'phone';
  page?: number;
  limit?: number;
  sortBy?: 'sentAt';
  sortOrder?: 'asc' | 'desc';
}

// Payment API specific interfaces
export interface ProcessPaymentRequest {
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
}

export interface CreatePaymentPlanRequest {
  invoiceNumber: string;
  installmentAmount: number;
  frequency: 'weekly' | 'bi_weekly' | 'monthly';
  startDate?: string;
}

// Error codes for API Gateway
export enum GatewayErrorCodes {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_FORMAT = 'INVALID_FIELD_FORMAT',
  
  // Rate limiting errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Routing errors
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  ENDPOINT_DISABLED = 'ENDPOINT_DISABLED',
  
  // Service errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  SERVICE_TIMEOUT = 'SERVICE_TIMEOUT',
  BAD_GATEWAY = 'BAD_GATEWAY',
  
  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  
  // Business logic errors
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  INVOICE_NOT_FOUND = 'INVOICE_NOT_FOUND',
  INVALID_PAYMENT_AMOUNT = 'INVALID_PAYMENT_AMOUNT',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE'
}

// HTTP Status Code mappings
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

export type HttpStatusCode = typeof HTTP_STATUS_CODES[keyof typeof HTTP_STATUS_CODES];
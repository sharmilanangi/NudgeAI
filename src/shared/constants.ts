// Application constants for Nudge AI

export const API_CONFIG = {
  RATE_LIMIT: 100, // requests per minute
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 50,
  MAX_AI_CONCURRENCY: 10,
  REQUEST_TIMEOUT: 30000, // 30 seconds
} as const;

export const COMMUNICATION_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 60000, // 1 minute
  MAX_EMAIL_LENGTH: 50000, // characters
  MAX_SMS_LENGTH: 1600, // characters
  DEFAULT_TONE: 'professional',
} as const;

export const COMPLIANCE_CONFIG = {
  TCPA_START_HOUR: 8, // 8 AM
  TCPA_END_HOUR: 21, // 9 PM
  MAX_CALLS_PER_DAY: 3,
  MAX_SMS_PER_DAY: 5,
  MAX_EMAILS_PER_DAY: 10,
  REQUIRED_DISCLOSURES: [
    'This is an attempt to collect a debt',
    'Any information obtained will be used for that purpose'
  ],
  MIN_COMPLIANCE_SCORE: 0.9, // 90%
} as const;

export const COLLECTION_STRATEGIES = {
  REMINDER: {
    name: 'reminder',
    maxDaysPastDue: 15,
    defaultTone: 'gentle',
    urgency: 'low',
  },
  NEGOTIATION: {
    name: 'negotiation',
    maxDaysPastDue: 30,
    defaultTone: 'empathetic',
    urgency: 'medium',
  },
  FINAL_NOTICE: {
    name: 'final_notice',
    maxDaysPastDue: 60,
    defaultTone: 'firm',
    urgency: 'high',
  },
  ESCALATION: {
    name: 'escalation',
    maxDaysPastDue: 999,
    defaultTone: 'urgent',
    urgency: 'critical',
  },
} as const;

export const PAYMENT_CONFIG = {
  MIN_PAYMENT_AMOUNT: 1.00,
  MAX_PAYMENT_AMOUNT: 999999.99,
  PROCESSING_FEE_PERCENTAGE: 0.015, // 1.5%
  DEFAULT_PAYMENT_PLAN_FREQUENCY: 'monthly',
  MAX_INSTALLMENTS: 12,
  MIN_INSTALLMENT_AMOUNT: 25.00,
} as const;

export const AI_CONFIG = {
  DEFAULT_MODEL: 'llama-3.1-8b-instruct',
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 500,
  CONTEXT_WINDOW_SIZE: 4096,
  MEMORY_RETENTION_DAYS: 90,
  LEARNING_RATE: 0.001,
} as const;

export const ANALYTICS_CONFIG = {
  DEFAULT_DATE_RANGE_DAYS: 30,
  RECOVERY_RATE_TARGET: 0.68, // 68%
  RESPONSE_RATE_TARGET: 0.40, // 40%
  COST_REDUCTION_TARGET: 0.70, // 70%
  COMPLIANCE_RATE_TARGET: 1.0, // 100%
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  COMPLIANCE_VIOLATION: 'COMPLIANCE_VIOLATION',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  INVOICE_NOT_FOUND: 'INVOICE_NOT_FOUND',
  COMMUNICATION_FAILED: 'COMMUNICATION_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  BUCKET_ERROR: 'BUCKET_ERROR',
  QUEUE_ERROR: 'QUEUE_ERROR',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const TIMEZONES = {
  US_EASTERN: 'America/New_York',
  US_CENTRAL: 'America/Chicago',
  US_MOUNTAIN: 'America/Denver',
  US_PACIFIC: 'America/Los_Angeles',
} as const;

export const COMMUNICATION_TEMPLATES = {
  EMAIL_SUBJECTS: {
    REMINDER: 'Friendly Reminder: Invoice {invoiceNumber}',
    NEGOTIATION: 'Let\'s Work Together on Your Invoice {invoiceNumber}',
    FINAL_NOTICE: 'Final Notice: Immediate Action Required for Invoice {invoiceNumber}',
  },
  SMS_OPENERS: {
    REMINDER: 'Hi {name}, regarding invoice {invoiceNumber}',
    NEGOTIATION: 'About your invoice {invoiceNumber} - we can help',
    FINAL_NOTICE: 'URGENT: Final notice for invoice {invoiceNumber}',
  },
  REQUIRED_DISCLOSURES: [
    'This is an attempt to collect a debt',
    'Any information obtained will be used for that purpose',
  ],
} as const;

export const FEATURE_FLAGS = {
  ENABLE_VOICE_CALLS: false, // MVP: disable voice calls
  ENABLE_PAYMENT_PLANS: true,
  ENABLE_BULK_IMPORT: true,
  ENABLE_ADVANCED_ANALYTICS: false, // MVP: basic analytics only
  ENABLE_MULTI_LANGUAGE: false, // Future feature
  ENABLE_CUSTOM_BRANDING: false, // Future feature
} as const;

export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const;

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

export const VALIDATION_RULES = {
  CUSTOMER_ID: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[A-Za-z0-9_-]+$/,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[A-Za-z\s\-'.]+$/,
  },
  INVOICE_NUMBER: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[A-Za-z0-9\-_]+$/,
  },
  EMAIL: {
    MAX_LENGTH: 255,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    MAX_LENGTH: 20,
    PATTERN: /^\+?1?-?\.?\s?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
  },
} as const;
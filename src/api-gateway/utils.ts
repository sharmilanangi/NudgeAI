// API Gateway utility functions
// These functions will be implemented during TDD phases

import { 
  AuthenticatedRequest, 
  RequestMetadata, 
  RouteConfig, 
  AuthResult, 
  ServiceCallResult,
  GatewayMetrics,
  ValidationError,
  CacheControl,
  RateLimitInfo,
  ApiResponse,
  HTTP_STATUS_CODES,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  GetCustomersQuery,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  GetInvoicesQuery,
  SendCommunicationRequest,
  GetCommunicationsQuery,
  ProcessPaymentRequest,
  CreatePaymentPlanRequest
} from './interfaces';
import { GatewayErrorCodes } from './interfaces';

// Authentication utilities
export const extractAuthToken = (request: Request): string | null => {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  const url = new URL(request.url);
  const tokenParam = url.searchParams.get('token');
  if (tokenParam) {
    return tokenParam;
  }
  
  return null;
};

export const validateApiKey = async (apiKey: string): Promise<AuthResult> => {
  if (!apiKey || apiKey.length < 10) {
    return {
      authenticated: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key format'
      }
    };
  }
  
  return {
    authenticated: true,
    clientId: `client_${apiKey.substring(0, 8)}`
  };
};

export const validateJwtToken = async (token: string): Promise<AuthResult> => {
  if (!token || token.length < 20) {
    return {
      authenticated: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid JWT token'
      }
    };
  }
  
  return {
    authenticated: true,
    userId: `user_${token.substring(0, 8)}`
  };
};

export const checkPermissions = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission) || userPermissions.includes('*')
  );
};

// Request parsing utilities
export const parseRequestBody = async (request: Request): Promise<any> => {
  const contentType = request.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }
  
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
};

export const extractRequestMetadata = (request: Request): RequestMetadata => {
  const url = new URL(request.url);
  
  return {
    requestId: generateRequestId(),
    timestamp: getCurrentTimestamp(),
    clientIP: getClientIP(request),
    userAgent: request.headers.get('user-agent') || '',
    method: request.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    headers: Object.fromEntries(request.headers.entries())
  };
};

// Validation utilities
export const validateRequestData = (data: any, schema: Record<string, any>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'root',
      message: 'Invalid data format',
      value: data,
      code: 'INVALID_FORMAT'
    });
    return errors;
  }
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: `${field} is required`,
        value,
        code: 'REQUIRED_FIELD'
      });
    }
    
    if (value !== undefined && rules.type && typeof value !== rules.type) {
      errors.push({
        field,
        message: `${field} must be of type ${rules.type}`,
        value,
        code: 'INVALID_TYPE'
      });
    }
  }
  
  return errors;
};

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

// Rate limiting utilities
export const checkRateLimit = async (
  clientId: string, 
  limit: number, 
  window: number
): Promise<RateLimitInfo> => {
  const key = `rate_limit:${clientId}:${Math.floor(Date.now() / (window * 1000))}`;
  const current = await incrementRateLimitCounter(key, window);
  
  return {
    limit,
    remaining: Math.max(0, limit - current),
    reset: Math.floor(Date.now() / 1000) + window,
    retryAfter: current >= limit ? window : undefined
  };
};

export const incrementRateLimitCounter = async (key: string, window: number): Promise<number> => {
  return 1;
};

// Caching utilities
export const generateCacheKey = (request: Request, vary?: string[]): string => {
  const url = new URL(request.url);
  const baseKey = `cache:${request.method}:${url.pathname}`;
  
  if (!vary || vary.length === 0) {
    return baseKey;
  }
  
  const varyValues = vary
    .map(header => `${header}:${request.headers.get(header) || ''}`)
    .join(':');
    
  return `${baseKey}:${varyValues}`;
};

export const getFromCache = async (key: string): Promise<any | null> => {
  return null;
};

export const setCache = async (key: string, value: any, ttl: number): Promise<void> => {
  // Minimal implementation for GREEN phase
};

export const generateETag = (data: any): string => {
  const hash = btoa(JSON.stringify(data)).slice(0, 16);
  return `"${hash}"`;
};

// Response formatting utilities
export const createSuccessResponse = <T>(
  data: T, 
  metadata?: Partial<ApiResponse<T>['meta']>
): ApiResponse<T> => {
  return {
    success: true,
    data,
    meta: {
      requestId: generateRequestId(),
      timestamp: getCurrentTimestamp(),
      version: '1.0.0',
      ...metadata
    }
  };
};

export const createErrorResponse = (
  code: GatewayErrorCodes,
  message: string,
  details?: any,
  requestId?: string
): ApiResponse => {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      requestId: requestId || generateRequestId(),
      timestamp: getCurrentTimestamp()
    },
    meta: {
      requestId: requestId || generateRequestId(),
      timestamp: getCurrentTimestamp(),
      version: '1.0.0'
    }
  };
};

export const formatHttpResponse = (apiResponse: ApiResponse): Response => {
  const statusCode = apiResponse.success ? 200 : 
    apiResponse.error?.code === 'NOT_FOUND' ? 404 :
    apiResponse.error?.code === 'UNAUTHORIZED' ? 401 :
    apiResponse.error?.code === 'VALIDATION_ERROR' ? 400 :
    500;
    
  return new Response(JSON.stringify(apiResponse), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': apiResponse.meta?.requestId || ''
    }
  });
};

// Service communication utilities
export const callService = async <T>(
  serviceName: string,
  methodName: string,
  params: any,
  timeout?: number
): Promise<ServiceCallResult<T>> => {
  const startTime = Date.now();
  
  try {
    // This is a minimal implementation for GREEN phase
    // In a real implementation, this would use the env bindings
    // to call the actual service method
    const mockData = {} as T;
    
    return {
      success: true,
      data: mockData,
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: error instanceof Error ? error.message : 'Unknown service error',
        service: serviceName,
        duration: Date.now() - startTime
      },
      duration: Date.now() - startTime
    };
  }
};

export const handleServiceError = (error: any, serviceName: string): ServiceCallResult => {
  return {
    success: false,
    error: {
      code: 'SERVICE_ERROR',
      message: error instanceof Error ? error.message : 'Unknown service error',
      service: serviceName,
      duration: 0
    },
    duration: 0
  };
};

// Routing utilities
export const matchRoute = (path: string, method: string, routes: RouteConfig[]): RouteConfig | null => {
  return routes.find(route => 
    route.method === method && 
    (route.path === path || path.match(new RegExp(route.path.replace(/\*/g, '.*'))))
  ) || null;
};

export const extractPathParams = (path: string, routePath: string): Record<string, string> => {
  const params: Record<string, string> = {};
  
  if (routePath.includes(':')) {
    const routeParts = routePath.split('/');
    const pathParts = path.split('/');
    
    routeParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.substring(1);
        params[paramName] = pathParts[index] || '';
      }
    });
  }
  
  return params;
};

// Customer-specific validation utilities
export const validateCreateCustomerRequest = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Name is required and must be a non-empty string',
      value: data.name,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  if (data.email && !validateEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format',
      value: data.email,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  if (data.phone && !validatePhone(data.phone)) {
    errors.push({
      field: 'phone',
      message: 'Invalid phone number format',
      value: data.phone,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  return errors;
};

export const validateUpdateCustomerRequest = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (data.email && !validateEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format',
      value: data.email,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  if (data.phone && !validatePhone(data.phone)) {
    errors.push({
      field: 'phone',
      message: 'Invalid phone number format',
      value: data.phone,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  if (data.status && !['active', 'inactive', 'archived'].includes(data.status)) {
    errors.push({
      field: 'status',
      message: 'Status must be one of: active, inactive, archived',
      value: data.status,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  return errors;
};

export const validateGetCustomersQuery = (query: Record<string, string>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (query.page && isNaN(Number(query.page))) {
    errors.push({
      field: 'page',
      message: 'Page must be a number',
      value: query.page,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  if (query.limit && isNaN(Number(query.limit))) {
    errors.push({
      field: 'limit',
      message: 'Limit must be a number',
      value: query.limit,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  if (query.status && !['active', 'inactive', 'archived'].includes(query.status)) {
    errors.push({
      field: 'status',
      message: 'Status must be one of: active, inactive, archived',
      value: query.status,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  return errors;
};

// Invoice-specific validation utilities
export const validateCreateInvoiceRequest = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!data.customerId || typeof data.customerId !== 'string') {
    errors.push({
      field: 'customerId',
      message: 'Customer ID is required and must be a string',
      value: data.customerId,
      code: 'MISSING_REQUIRED_FIELD'
    });
  }
  
  if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    errors.push({
      field: 'amount',
      message: 'Amount is required and must be a positive number',
      value: data.amount,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  if (!data.dueDate || typeof data.dueDate !== 'string') {
    errors.push({
      field: 'dueDate',
      message: 'Due date is required and must be a string',
      value: data.dueDate,
      code: 'MISSING_REQUIRED_FIELD'
    });
  }
  
  return errors;
};

export const validateUpdateInvoiceRequest = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (data.amount !== undefined && (isNaN(Number(data.amount)) || Number(data.amount) <= 0)) {
    errors.push({
      field: 'amount',
      message: 'Amount must be a positive number',
      value: data.amount,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  if (data.status && !['pending', 'paid', 'partially_paid', 'written_off'].includes(data.status)) {
    errors.push({
      field: 'status',
      message: 'Status must be one of: pending, paid, partially_paid, written_off',
      value: data.status,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  return errors;
};

export const validateGetInvoicesQuery = (query: Record<string, string>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (query.page && isNaN(Number(query.page))) {
    errors.push({
      field: 'page',
      message: 'Page must be a number',
      value: query.page,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  if (query.limit && isNaN(Number(query.limit))) {
    errors.push({
      field: 'limit',
      message: 'Limit must be a number',
      value: query.limit,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  if (query.status && !['pending', 'paid', 'partially_paid', 'written_off'].includes(query.status)) {
    errors.push({
      field: 'status',
      message: 'Status must be one of: pending, paid, partially_paid, written_off',
      value: query.status,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  return errors;
};

// Communication-specific validation utilities
export const validateSendCommunicationRequest = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!data.customerId || typeof data.customerId !== 'string') {
    errors.push({
      field: 'customerId',
      message: 'Customer ID is required and must be a string',
      value: data.customerId,
      code: 'MISSING_REQUIRED_FIELD'
    });
  }
  
  if (!data.channel || !['email', 'sms', 'phone'].includes(data.channel)) {
    errors.push({
      field: 'channel',
      message: 'Channel is required and must be one of: email, sms, phone',
      value: data.channel,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  if (!data.strategy || !['reminder', 'negotiation', 'final_notice'].includes(data.strategy)) {
    errors.push({
      field: 'strategy',
      message: 'Strategy is required and must be one of: reminder, negotiation, final_notice',
      value: data.strategy,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  return errors;
};

export const validateGetCommunicationsQuery = (query: Record<string, string>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (query.page && isNaN(Number(query.page))) {
    errors.push({
      field: 'page',
      message: 'Page must be a number',
      value: query.page,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  if (query.limit && isNaN(Number(query.limit))) {
    errors.push({
      field: 'limit',
      message: 'Limit must be a number',
      value: query.limit,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  if (query.channel && !['email', 'sms', 'phone'].includes(query.channel)) {
    errors.push({
      field: 'channel',
      message: 'Channel must be one of: email, sms, phone',
      value: query.channel,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  return errors;
};

// Payment-specific validation utilities
export const validateProcessPaymentRequest = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!data.invoiceNumber || typeof data.invoiceNumber !== 'string') {
    errors.push({
      field: 'invoiceNumber',
      message: 'Invoice number is required and must be a string',
      value: data.invoiceNumber,
      code: 'MISSING_REQUIRED_FIELD'
    });
  }
  
  if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    errors.push({
      field: 'amount',
      message: 'Amount is required and must be a positive number',
      value: data.amount,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  if (!data.paymentMethod || typeof data.paymentMethod !== 'string') {
    errors.push({
      field: 'paymentMethod',
      message: 'Payment method is required and must be a string',
      value: data.paymentMethod,
      code: 'MISSING_REQUIRED_FIELD'
    });
  }
  
  return errors;
};

export const validateCreatePaymentPlanRequest = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!data.invoiceNumber || typeof data.invoiceNumber !== 'string') {
    errors.push({
      field: 'invoiceNumber',
      message: 'Invoice number is required and must be a string',
      value: data.invoiceNumber,
      code: 'MISSING_REQUIRED_FIELD'
    });
  }
  
  if (!data.installmentAmount || isNaN(Number(data.installmentAmount)) || Number(data.installmentAmount) <= 0) {
    errors.push({
      field: 'installmentAmount',
      message: 'Installment amount is required and must be a positive number',
      value: data.installmentAmount,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  if (!data.frequency || !['weekly', 'bi_weekly', 'monthly'].includes(data.frequency)) {
    errors.push({
      field: 'frequency',
      message: 'Frequency is required and must be one of: weekly, bi_weekly, monthly',
      value: data.frequency,
      code: 'INVALID_FIELD_FORMAT'
    });
  }
  
  return errors;
};

// Metrics and logging utilities
export const recordGatewayMetrics = (metrics: GatewayMetrics): void => {
  // Minimal implementation for GREEN phase - would normally send to monitoring system
  console.log('Gateway metrics:', JSON.stringify(metrics));
};

export const logRequest = (metadata: RequestMetadata, auth?: AuthenticatedRequest): void => {
  console.log('Request logged:', {
    requestId: metadata.requestId,
    method: metadata.method,
    path: metadata.path,
    clientIP: metadata.clientIP,
    userId: auth?.userId,
    timestamp: metadata.timestamp
  });
};

export const logError = (error: Error, metadata: RequestMetadata): void => {
  console.error('Error logged:', {
    requestId: metadata.requestId,
    error: error.message,
    stack: error.stack,
    path: metadata.path,
    method: metadata.method,
    timestamp: metadata.timestamp
  });
};

// Security utilities
export const detectSqlInjection = (input: string): boolean => {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  const suspiciousPatterns = [
    /union\s+select/i,
    /select\s+.*\s+from/i,
    /insert\s+into/i,
    /update\s+.*\s+set/i,
    /delete\s+from/i,
    /drop\s+table/i,
    /exec\s*\(/i,
    /script\s*>/i,
    /--/,
    /\/\*/,
    /\*\//
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
};

export const detectXss = (input: string): boolean => {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /expression\s*\(/i
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

export const validateCsrfToken = (token: string, session: string): boolean => {
  // Minimal implementation for GREEN phase
  return Boolean(token && session && token.length > 10);
};

// Utility helper functions
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

export const getClientIP = (request: Request): string => {
  // Try various headers that might contain the real client IP
  const headers = [
    'CF-Connecting-IP',
    'X-Forwarded-For',
    'X-Real-IP',
    'X-Client-IP'
  ];
  
  for (const header of headers) {
    const ip = request.headers.get(header);
    if (ip) {
      return (ip.split(',')[0] || '').trim();
    }
  }
  
  return '127.0.0.1';
};

export const parseUserAgent = (userAgent: string): Record<string, string> => {
  if (!userAgent || typeof userAgent !== 'string') {
    return {
      browser: 'unknown',
      os: 'unknown',
      device: 'unknown'
    };
  }
  
  const result: Record<string, string> = {
    browser: 'unknown',
    os: 'unknown',
    device: 'unknown'
  };
  
  // Simple browser detection
  if (userAgent.includes('Chrome')) result.browser = 'Chrome';
  else if (userAgent.includes('Firefox')) result.browser = 'Firefox';
  else if (userAgent.includes('Safari')) result.browser = 'Safari';
  else if (userAgent.includes('Edge')) result.browser = 'Edge';
  
  // Simple OS detection
  if (userAgent.includes('Windows')) result.os = 'Windows';
  else if (userAgent.includes('Mac')) result.os = 'macOS';
  else if (userAgent.includes('Linux')) result.os = 'Linux';
  else if (userAgent.includes('Android')) result.os = 'Android';
  else if (userAgent.includes('iOS')) result.os = 'iOS';
  
  return result;
};
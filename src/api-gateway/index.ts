import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import {
  extractAuthToken,
  validateApiKey,
  validateJwtToken,
  parseRequestBody,
  extractRequestMetadata,
  validateCreateCustomerRequest,
  validateUpdateCustomerRequest,
  validateGetCustomersQuery,
  validateCreateInvoiceRequest,
  validateUpdateInvoiceRequest,
  validateGetInvoicesQuery,
  validateSendCommunicationRequest,
  validateGetCommunicationsQuery,
  validateProcessPaymentRequest,
  validateCreatePaymentPlanRequest,
  createSuccessResponse,
  createErrorResponse,
  formatHttpResponse,
  callService,
  checkRateLimit,
  generateRequestId,
  logRequest,
  logError,
  recordGatewayMetrics
} from './utils';
import { GatewayErrorCodes } from './interfaces';

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    const startTime = Date.now();
    let metadata = extractRequestMetadata(request);
    let statusCode = 200;
    
    try {
      const url = new URL(request.url);
      const { pathname, method } = { pathname: url.pathname, method: request.method };
      
      // Basic rate limiting
      const clientIP = metadata.clientIP;
      const rateLimitInfo = await checkRateLimit(clientIP, 100, 60); // 100 requests per minute
      
      if (rateLimitInfo.remaining <= 0) {
        statusCode = 429;
        const errorResponse = createErrorResponse(
          GatewayErrorCodes.RATE_LIMIT_EXCEEDED,
          'Rate limit exceeded',
          { retryAfter: rateLimitInfo.retryAfter },
          metadata.requestId
        );
        return formatHttpResponse(errorResponse);
      }
      
      // Extract and validate authentication
      const authToken = extractAuthToken(request);
      let authInfo = null;
      
      if (authToken) {
        if (authToken.startsWith('sk_')) {
          authInfo = await validateApiKey(authToken);
        } else if (authToken.includes('.')) {
          authInfo = await validateJwtToken(authToken);
        }
      }
      
      // Route handling
      let response: any = null;
      
      // Customer routes
      if (pathname === '/customers' && method === 'POST') {
        const body = await parseRequestBody(request);
        const validationErrors = validateCreateCustomerRequest(body);
        
        if (validationErrors.length > 0) {
          statusCode = 400;
          response = createErrorResponse(
            GatewayErrorCodes.VALIDATION_ERROR,
            'Validation failed',
            { errors: validationErrors },
            metadata.requestId
          );
        } else {
          const result = await callService('CUSTOMER_SERVICE', 'createCustomer', body);
          if (result.success) {
            response = createSuccessResponse(result.data, undefined);
          } else {
            statusCode = 500;
            response = createErrorResponse(
              GatewayErrorCodes.SERVICE_UNAVAILABLE,
              result.error?.message || 'Service unavailable',
              undefined,
              metadata.requestId
            );
          }
        }
      }
      else if (pathname === '/customers' && method === 'GET') {
        const query = Object.fromEntries(url.searchParams.entries());
        const validationErrors = validateGetCustomersQuery(query);
        
        if (validationErrors.length > 0) {
          statusCode = 400;
          response = createErrorResponse(
            GatewayErrorCodes.VALIDATION_ERROR,
            'Validation failed',
            { errors: validationErrors },
            metadata.requestId
          );
        } else {
          const result = await callService('CUSTOMER_SERVICE', 'getCustomers', query);
          if (result.success) {
            response = createSuccessResponse(result.data, undefined);
          } else {
            statusCode = 500;
            response = createErrorResponse(
              GatewayErrorCodes.SERVICE_UNAVAILABLE,
              result.error?.message || 'Service unavailable',
              undefined,
              metadata.requestId
            );
          }
        }
      }
      else if (pathname.startsWith('/customers/') && method === 'PUT') {
        const customerId = pathname.split('/')[2];
        const body = await parseRequestBody(request);
        const validationErrors = validateUpdateCustomerRequest(body);
        
        if (validationErrors.length > 0) {
          statusCode = 400;
          response = createErrorResponse(
            GatewayErrorCodes.VALIDATION_ERROR,
            'Validation failed',
            { errors: validationErrors },
            metadata.requestId
          );
        } else {
          const result = await callService('CUSTOMER_SERVICE', 'updateCustomer', { id: customerId, ...body });
          if (result.success) {
            response = createSuccessResponse(result.data, undefined);
          } else {
            statusCode = 500;
            response = createErrorResponse(
              GatewayErrorCodes.SERVICE_UNAVAILABLE,
              result.error?.message || 'Service unavailable',
              undefined,
              metadata.requestId
            );
          }
        }
      }
      // Invoice routes
      else if (pathname === '/invoices' && method === 'POST') {
        const body = await parseRequestBody(request);
        const validationErrors = validateCreateInvoiceRequest(body);
        
        if (validationErrors.length > 0) {
          statusCode = 400;
          response = createErrorResponse(
            GatewayErrorCodes.VALIDATION_ERROR,
            'Validation failed',
            { errors: validationErrors },
            metadata.requestId
          );
        } else {
          const result = await callService('INVOICE_SERVICE', 'createInvoice', body);
          if (result.success) {
            response = createSuccessResponse(result.data, undefined);
          } else {
            statusCode = 500;
            response = createErrorResponse(
              GatewayErrorCodes.SERVICE_UNAVAILABLE,
              result.error?.message || 'Service unavailable',
              undefined,
              metadata.requestId
            );
          }
        }
      }
      else if (pathname === '/invoices' && method === 'GET') {
        const query = Object.fromEntries(url.searchParams.entries());
        const validationErrors = validateGetInvoicesQuery(query);
        
        if (validationErrors.length > 0) {
          statusCode = 400;
          response = createErrorResponse(
            GatewayErrorCodes.VALIDATION_ERROR,
            'Validation failed',
            { errors: validationErrors },
            metadata.requestId
          );
        } else {
          const result = await callService('INVOICE_SERVICE', 'getInvoices', query);
          if (result.success) {
            response = createSuccessResponse(result.data, undefined);
          } else {
            statusCode = 500;
            response = createErrorResponse(
              GatewayErrorCodes.SERVICE_UNAVAILABLE,
              result.error?.message || 'Service unavailable',
              undefined,
              metadata.requestId
            );
          }
        }
      }
      // Communication routes
      else if (pathname === '/communications' && method === 'POST') {
        const body = await parseRequestBody(request);
        const validationErrors = validateSendCommunicationRequest(body);
        
        if (validationErrors.length > 0) {
          statusCode = 400;
          response = createErrorResponse(
            GatewayErrorCodes.VALIDATION_ERROR,
            'Validation failed',
            { errors: validationErrors },
            metadata.requestId
          );
        } else {
          const result = await callService('COMMUNICATION_SERVICE', 'sendCommunication', body);
          if (result.success) {
            response = createSuccessResponse(result.data, undefined);
          } else {
            statusCode = 500;
            response = createErrorResponse(
              GatewayErrorCodes.SERVICE_UNAVAILABLE,
              result.error?.message || 'Service unavailable',
              undefined,
              metadata.requestId
            );
          }
        }
      }
      // Payment routes
      else if (pathname === '/payments/process' && method === 'POST') {
        const body = await parseRequestBody(request);
        const validationErrors = validateProcessPaymentRequest(body);
        
        if (validationErrors.length > 0) {
          statusCode = 400;
          response = createErrorResponse(
            GatewayErrorCodes.VALIDATION_ERROR,
            'Validation failed',
            { errors: validationErrors },
            metadata.requestId
          );
        } else {
          const result = await callService('PAYMENT_PROCESSOR', 'processPayment', body);
          if (result.success) {
            response = createSuccessResponse(result.data, undefined);
          } else {
            statusCode = 500;
            response = createErrorResponse(
              GatewayErrorCodes.SERVICE_UNAVAILABLE,
              result.error?.message || 'Service unavailable',
              undefined,
              metadata.requestId
            );
          }
        }
      }
      else {
        statusCode = 404;
        response = createErrorResponse(
          GatewayErrorCodes.NOT_FOUND,
          'Endpoint not found',
          undefined,
          metadata.requestId
        );
      }
      
      // Log the request
      logRequest(metadata, authInfo || undefined);
      
      // Format and return response
      const http_response = formatHttpResponse(response);
      statusCode = http_response.status;
      return http_response;
      
    } catch (error) {
      statusCode = 500;
      logError(error instanceof Error ? error : new Error('Unknown error'), metadata);
      
      const errorResponse = createErrorResponse(
        GatewayErrorCodes.INTERNAL_SERVER_ERROR,
        error instanceof Error ? error.message : 'Internal server error',
        undefined,
        metadata.requestId
      );
      
      return formatHttpResponse(errorResponse);
    } finally {
      // Record metrics
      const metrics = {
        requestId: metadata.requestId,
        method: metadata.method,
        path: metadata.path,
        statusCode,
        duration: Date.now() - startTime,
        responseSize: 0,
        cacheHit: false,
        authenticated: false,
        userAgent: metadata.userAgent,
        clientIP: metadata.clientIP,
        timestamp: metadata.timestamp
      };
      
      recordGatewayMetrics(metrics);
    }
  }
}

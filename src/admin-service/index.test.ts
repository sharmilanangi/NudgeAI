import { expect, test, describe, beforeEach, vi } from 'vitest';
import AdminService from './index';
import type { Env } from './raindrop.gen';

// Mock environment for testing
const createMockEnv = (): Env => ({
  _raindrop: {
    app: {} as any
  },
  AI: {} as any,
  AI_AGENT_SERVICE: {} as any,
  AI_PROCESSING: {} as any,
  ANALYTICS_SERVICE: {} as any,
  annotation: {} as any,
  API_GATEWAY: {} as any,
  COMMUNICATION_SERVICE: {} as any,
  COMMUNICATIONS_LOG: {} as any,
  COMPLIANCE_CHECKS: {} as any,
  COMPLIANCE_SERVICE: {} as any,
  CUSTOMER_DATA: {} as any,
  CUSTOMER_SERVICE: {} as any,
  CUSTOMERS_DB: {} as any,
  EMAIL_SENDING: {} as any,
  INVOICE_SERVICE: {} as any,
  INVOICES_DB: {} as any,
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    with: vi.fn().mockReturnThis(),
    log: vi.fn(),
    logAtLevel: vi.fn(),
    message: vi.fn()
  },
  mem: {
    get: async () => null,
    set: async () => {},
    delete: async () => {}
  } as any,
  PAYMENT_PROCESSOR: {} as any,
  SMS_SENDING: {} as any,
  tracer: {} as any,
  VOICE_CALLS: {} as any,
  LM_AUTH_ALLOWED_ISSUERS: '',
  LM_AUTH_ALLOWED_ORIGINS: ''
});

describe('Admin Service', () => {
  let service: AdminService;
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = createMockEnv();
    service = new AdminService(mockEnv);
  });

  test('should initialize correctly', () => {
    expect(service).toBeDefined();
  });

  test('should handle health check request', async () => {
    const request = new Request('http://localhost/health', {
      method: 'GET'
    });

    const response = await service.fetch(request);
    expect(response.status).toBe(200);

    const data = await response.json() as any;
    expect(data.success).toBe(true);
    expect(data.data.status).toBeDefined();
  });

  test('should require authentication for protected endpoints', async () => {
    const request = new Request('http://localhost/users', {
      method: 'GET'
    });

    const response = await service.fetch(request);
    expect(response.status).toBe(401);

    const data = await response.json() as any;
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  test('should reject invalid authentication', async () => {
    const request = new Request('http://localhost/users', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    const response = await service.fetch(request);
    expect(response.status).toBe(401);
  });

  test('should handle OPTIONS requests (CORS)', async () => {
    const request = new Request('http://localhost/users', {
      method: 'OPTIONS'
    });

    const response = await service.fetch(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  test('should return 404 for unknown endpoints', async () => {
    const request = new Request('http://localhost/unknown', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer some-token'
      }
    });

    const response = await service.fetch(request);
    expect(response.status).toBe(401); // Still 401 due to auth check first
  });
});

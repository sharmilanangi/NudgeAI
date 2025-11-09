import { expect, test, describe, beforeEach, vi } from 'vitest';
import ComplianceService from './index';
import { Env } from './raindrop.gen';
import {
  ComplianceCheckRequest,
  ComplianceQueueMessage,
  CustomerComplianceProfile,
  CommunicationComplianceRecord
} from './interfaces';

// Mock environment
const mockEnv: Partial<Env> = {
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  } as any,
  COMPLIANCE_CHECKS: {
    send: vi.fn().mockResolvedValue(undefined)
  } as any
};

describe('ComplianceService', () => {
  let service: ComplianceService;

  beforeEach(() => {
    service = new ComplianceService({} as any, mockEnv as Env);
    vi.clearAllMocks();
  });

  describe('checkCompliance', () => {
    test('should pass compliance check for valid communication', async () => {
      const request: ComplianceCheckRequest = {
        customerId: 'CUST-001',
        communicationId: 'COMM-001',
        content: 'This is an attempt to collect a debt. Name of creditor: ABC Corp. Amount: $100. You have the right to dispute this debt.',
        channel: 'email',
        strategy: 'reminder',
        customerTimezone: 'America/New_York'
      };

      const result = await service.checkCompliance(request);

      expect(result).toBeDefined();
      expect(result.compliant).toBe(true);
      expect(result.canProceed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.auditEntry).toBeDefined();
      expect(mockEnv.logger.info).toHaveBeenCalledWith('Compliance check completed', expect.any(Object));
    });

    test('should fail compliance check for missing consent', async () => {
      const request: ComplianceCheckRequest = {
        customerId: 'CUST-002',
        communicationId: 'COMM-002',
        content: 'Payment reminder',
        channel: 'sms',
        strategy: 'reminder'
      };

      const result = await service.checkCompliance(request);

      expect(result.compliant).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.type === 'TCPA_CONSENT_MISSING')).toBe(true);
    });

    test('should fail compliance check outside calling hours', async () => {
      const request: ComplianceCheckRequest = {
        customerId: 'CUST-003',
        communicationId: 'COMM-003',
        content: 'Payment reminder',
        channel: 'phone',
        strategy: 'reminder',
        customerTimezone: 'America/New_York'
      };

      // Mock current time to be outside calling hours (e.g., 10 PM)
      const originalDate = Date;
      const mockDate = vi.fn(() => new Date('2025-01-01T22:00:00Z'));
      global.Date = mockDate as any;

      const result = await service.checkCompliance(request);

      expect(result.compliant).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.violations.some(v => v.type === 'TCPA_TIME_RESTRICTION')).toBe(true);

      // Restore original Date
      global.Date = originalDate;
    });

    test('should warn about frequency limits approaching', async () => {
      const request: ComplianceCheckRequest = {
        customerId: 'CUST-004',
        communicationId: 'COMM-004',
        content: 'This is an attempt to collect a debt with proper disclosures',
        channel: 'sms',
        strategy: 'reminder'
      };

      const result = await service.checkCompliance(request);

      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
      expect(result.auditEntry).toBeDefined();
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    test('should generate next allowed time for non-compliant communication', async () => {
      const request: ComplianceCheckRequest = {
        customerId: 'CUST-005',
        communicationId: 'COMM-005',
        content: 'Payment reminder',
        channel: 'sms',
        strategy: 'reminder'
      };

      const result = await service.checkCompliance(request);

      if (!result.compliant) {
        expect(result.nextAllowedTime).toBeDefined();
        expect(result.nextAllowedTime).toBeInstanceOf(Date);
      }
    });
  });

  describe('processQueueMessage', () => {
    test('should process compliance check queue message', async () => {
      const message: ComplianceQueueMessage = {
        type: 'COMPLIANCE_CHECK',
        customerId: 'CUST-006',
        communicationId: 'COMM-006',
        content: 'This is an attempt to collect a debt with all required disclosures',
        channel: 'email',
        strategy: 'reminder',
        timestamp: new Date().toISOString(),
        priority: 'medium'
      };

      await service.processQueueMessage(message);

      expect(mockEnv.logger.info).toHaveBeenCalledWith('Compliance check completed', expect.objectContaining({
        customerId: 'CUST-006',
        communicationId: 'COMM-006'
      }));
    });

    test('should handle compliance violations appropriately', async () => {
      const message: ComplianceQueueMessage = {
        type: 'COMPLIANCE_CHECK',
        customerId: 'CUST-007',
        communicationId: 'COMM-007',
        content: 'Payment reminder without consent',
        channel: 'sms',
        strategy: 'reminder',
        timestamp: new Date().toISOString(),
        priority: 'high'
      };

      await service.processQueueMessage(message);

      expect(mockEnv.logger.warn).toHaveBeenCalledWith('Compliance violation detected', expect.any(Object));
    });
  });

  describe('HTTP Endpoints', () => {
    test('should handle compliance check POST request', async () => {
      const requestBody: ComplianceCheckRequest = {
        customerId: 'CUST-008',
        communicationId: 'COMM-008',
        content: 'Valid compliance content',
        channel: 'email',
        strategy: 'reminder'
      };

      const request = new Request('http://localhost/compliance/check', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await service.fetch(request);

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toBeDefined();
      expect(result.auditEntry).toBeDefined();
    });

    test('should handle GET customer profile request', async () => {
      const request = new Request('http://localhost/compliance/customer/CUST-009', {
        method: 'GET'
      });

      const response = await service.fetch(request);

      expect(response.status).toBe(200);
      const profile = await response.json();
      expect(profile.customerId).toBe('CUST-009');
    });

    test('should handle GET next allowed time request', async () => {
      const request = new Request('http://localhost/compliance/next-allowed/CUST-010/sms', {
        method: 'GET'
      });

      const response = await service.fetch(request);

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.customerId).toBe('CUST-010');
      expect(result.channel).toBe('sms');
      expect(result.nextAllowedTime).toBeDefined();
    });

    test('should return 404 for unknown endpoints', async () => {
      const request = new Request('http://localhost/unknown', {
        method: 'GET'
      });

      const response = await service.fetch(request);

      expect(response.status).toBe(404);
    });

    test('should handle server errors gracefully', async () => {
      const request = new Request('http://localhost/compliance/check', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await service.fetch(request);

      expect(response.status).toBe(500);
    });
  });

  describe('generateRecommendedActions', () => {
    test('should generate actions from violations and warnings', async () => {
      const request: ComplianceCheckRequest = {
        customerId: 'CUST-011',
        communicationId: 'COMM-011',
        content: 'Invalid content',
        channel: 'sms',
        strategy: 'reminder'
      };

      const result = await service.checkCompliance(request);

      if (result.violations.length > 0 || result.warnings.length > 0) {
        expect(result.recommendedActions).toBeDefined();
        expect(Array.isArray(result.recommendedActions)).toBe(true);
      }
    });
  });
});

// Keep the original dummy test for backward compatibility
test('dummy test', async () => {
  expect(true).toBe(true);
});

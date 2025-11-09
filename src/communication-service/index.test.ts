import { expect, test, describe, beforeEach, beforeAll, vi } from 'vitest';
import CommunicationService from './index';
import { 
  validateCommunicationRequest,
  createCommunicationMessage,
  renderTemplate,
  validateTemplateVariables,
  getTemplateById,
  filterContentForCompliance,
  classifyError,
  shouldRetry,
  calculateDeliveryStats
} from './utils';
import { MessageTemplate } from './interfaces';
import { CommunicationChannel, CommunicationStrategy } from '../shared/types';

// Mock environment for testing
const mockEnv = {
  logger: {
    error: console.error,
    info: console.info,
    warn: console.warn,
  },
  COMMUNICATIONS_LOG: {
    get: () => Promise.resolve(null),
    put: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    list: () => Promise.resolve({ keys: [] }),
  },
  COMMUNICATION_EVENTS: {
    send: () => Promise.resolve(),
    batch: () => Promise.resolve(),
  },
} as any;

test('dummy test', async () => {
  expect(true).toBe(true);
});

describe('Communication Service - GREEN Phase', () => {
  let service: CommunicationService;

  beforeAll(() => {
    service = new CommunicationService();
    // Mock the env property
    (service as any).env = mockEnv;
  });

  test('service can be instantiated', () => {
    expect(service).toBeDefined();
  });

  test('validateCommunicationRequest works correctly', () => {
    const validRequest = {
      customerId: 'cust123',
      channel: 'email' as CommunicationChannel,
      strategy: 'reminder' as CommunicationStrategy,
      customizations: {
        subject: 'Test Subject',
        content: 'Test content'
      }
    };

    const validation = validateCommunicationRequest(validRequest);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    const invalidRequest = {
      customerId: '',
      channel: 'invalid',
      strategy: 'invalid'
    };

    const invalidValidation = validateCommunicationRequest(invalidRequest);
    expect(invalidValidation.isValid).toBe(false);
    expect(invalidValidation.errors.length).toBeGreaterThan(0);
  });

  test('createCommunicationMessage creates proper message', () => {
    const request = {
      customerId: 'cust123',
      channel: 'email' as CommunicationChannel,
      strategy: 'reminder' as CommunicationStrategy,
      customizations: {
        subject: 'Test Subject',
        content: 'Test content'
      }
    };

    const message = createCommunicationMessage(request);
    
    expect(message.customerId).toBe('cust123');
    expect(message.channel).toBe('email');
    expect(message.strategy).toBe('reminder');
    expect(message.deliveryStatus).toBe('pending');
    expect(message.retryCount).toBe(0);
    expect(message.maxRetries).toBe(3);
    expect(message.id).toBeDefined();
    expect(message.createdAt).toBeDefined();
    expect(message.updatedAt).toBeDefined();
  });

  test('renderTemplate substitutes variables correctly', async () => {
    const template: MessageTemplate = {
      id: 'test-template',
      name: 'Test Template',
      channel: 'email',
      strategy: 'reminder',
      subject: 'Subject for {{customerId}}',
      content: 'Hello {{customerId}}, your invoice {{invoiceNumber}} is due.',
      variables: ['customerId', 'invoiceNumber'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const variables = {
      customerId: 'cust123',
      invoiceNumber: 'INV-001'
    };

    const rendered = renderTemplate(template, variables);
    
    expect(rendered.subject).toBe('Subject for cust123');
    expect(rendered.content).toBe('Hello cust123, your invoice INV-001 is due.');
  });

  test('validateTemplateVariables checks required variables', async () => {
    const template = await getTemplateById('test-template');
    
    const validVariables = {
      customerId: 'cust123',
      invoiceNumber: 'INV-001'
    };

    const invalidVariables = {
      customerId: 'cust123'
      // missing invoiceNumber
    };

    const validValidation = validateTemplateVariables(template!, validVariables);
    expect(validValidation.isValid).toBe(true);
    expect(validValidation.missingVariables).toHaveLength(0);

    const invalidValidation = validateTemplateVariables(template!, invalidVariables);
    expect(invalidValidation.isValid).toBe(false);
    expect(invalidValidation.missingVariables).toContain('invoiceNumber');
  });

  test('filterContentForCompliance removes prohibited content', () => {
    const content = 'This is not a lawsuit or legal action. No arrest threats.';
    const { filteredContent, violations } = filterContentForCompliance(content, 'email');
    
    expect(violations.length).toBeGreaterThan(0);
    expect(filteredContent).not.toContain('lawsuit');
    expect(filteredContent).not.toContain('legal action');
    expect(filteredContent).not.toContain('arrest');
    expect(filteredContent).toContain('[REDACTED]');
  });

  test('classifyError properly categorizes errors', () => {
    const rateLimitError = new Error('Rate limit exceeded');
    const permanentError = new Error('Invalid recipient');
    const complianceError = new Error('Compliance violation detected');
    const unknownError = new Error('Something went wrong');

    const rateLimitClassification = classifyError(rateLimitError);
    expect(rateLimitClassification.type).toBe('rate_limit');
    expect(rateLimitClassification.retryable).toBe(true);

    const permanentClassification = classifyError(permanentError);
    expect(permanentClassification.type).toBe('permanent');
    expect(permanentClassification.retryable).toBe(false);

    const complianceClassification = classifyError(complianceError);
    expect(complianceClassification.type).toBe('compliance');
    expect(complianceClassification.retryable).toBe(false);

    const unknownClassification = classifyError(unknownError);
    expect(unknownClassification.type).toBe('unknown');
    expect(unknownClassification.retryable).toBe(true);
  });

  test('shouldRetry determines retry eligibility', () => {
    const messageWithRetries = {
      retryCount: 2,
      maxRetries: 3,
      deliveryStatus: 'failed' as const
    };

    const messageMaxRetries = {
      retryCount: 3,
      maxRetries: 3,
      deliveryStatus: 'failed' as const
    };

    expect(shouldRetry(messageWithRetries)).toBe(true);
    expect(shouldRetry(messageMaxRetries)).toBe(false);
    expect(shouldRetry(messageWithRetries, 'invalid recipient')).toBe(false);
    expect(shouldRetry(messageWithRetries, 'temporary timeout')).toBe(true);
  });

  test('calculateDeliveryStats produces correct statistics', () => {
    const messages = [
      {
        id: '1',
        customerId: 'cust1',
        channel: 'email' as CommunicationChannel,
        strategy: 'reminder' as CommunicationStrategy,
        content: 'Test',
        deliveryStatus: 'delivered' as const,
        retryCount: 0,
        maxRetries: 3,
        cost: 0.01,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        customerId: 'cust2',
        channel: 'sms' as CommunicationChannel,
        strategy: 'reminder' as CommunicationStrategy,
        content: 'Test',
        deliveryStatus: 'failed' as const,
        retryCount: 1,
        maxRetries: 3,
        cost: 0.02,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        customerId: 'cust3',
        channel: 'phone' as CommunicationChannel,
        strategy: 'negotiation' as CommunicationStrategy,
        content: 'Test',
        deliveryStatus: 'pending' as const,
        retryCount: 0,
        maxRetries: 3,
        cost: 0.05,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    const stats = calculateDeliveryStats(messages);
    
    expect(stats.total).toBe(3);
    expect(stats.delivered).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.pending).toBe(1);
    expect(stats.deliveryRate).toBeCloseTo(33.33, 1);
  });
});

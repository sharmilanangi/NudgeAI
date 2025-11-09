import { expect, test, describe, beforeEach, vi } from 'vitest';

// Mock the Service class and environment
vi.mock('@liquidmetal-ai/raindrop-framework', () => ({
  Service: class {
    constructor() {}
    async fetch(request: Request): Promise<Response> {
      return new Response('Mock response');
    }
  }
}));

// Import the utils functions to test them directly
import * as utils from './utils';
import { PaymentMethod } from '../payment-processor/interfaces';
import { PaymentPlanFrequency } from '../shared/types';

describe('Invoice Service Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInvoice', () => {
    test('should create an invoice with required fields', async () => {
      const invoiceData = {
        customerId: 'CUST-001',
        amount: 500.00,
        dueDate: new Date('2025-06-15T00:00:00.000Z')
      };

      const result = await utils.createInvoice(invoiceData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.customerId).toBe('CUST-001');
      expect(result.amount).toBe(500.00);
      expect(result.status).toBe('DRAFT');
      expect(result.currency).toBe('USD');
    });

    test('should throw error for missing required fields', async () => {
      const invoiceData = {
        customerId: 'CUST-001'
        // Missing amount and dueDate
      };

      await expect(utils.createInvoice(invoiceData)).rejects.toThrow('Missing required invoice fields');
    });
  });

  describe('createPayment', () => {
    test('should create a payment with required fields', async () => {
      const paymentData = {
        invoiceId: 'INV-001',
        amount: 100.00,
        paymentMethod: { id: 'pm_123', type: 'card' as const, token: 'tok_123', customerId: 'CUST-001', createdAt: new Date().toISOString() }
      };

      const result = await utils.createPayment(paymentData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.invoiceId).toBe('INV-001');
      expect(result.amount).toBe(100.00);
      expect(result.status).toBe('PENDING');
      expect(result.currency).toBe('USD');
    });

    test('should throw error for missing required fields', async () => {
      const paymentData = {
        invoiceId: 'INV-001'
        // Missing amount
      };

      await expect(utils.createPayment(paymentData)).rejects.toThrow('Missing required payment fields');
    });
  });

  describe('createPaymentPlan', () => {
    test('should create a payment plan with required fields', async () => {
      const planData = {
        customerId: 'CUST-001',
        totalAmount: 1000.00,
        installmentAmount: 100.00,
        frequency: 'monthly' as PaymentPlanFrequency
      };

      const result = await utils.createPaymentPlan(planData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.customerId).toBe('CUST-001');
      expect(result.totalAmount).toBe(1000.00);
      expect(result.installmentAmount).toBe(100.00);
      expect(result.status).toBe('ACTIVE');
    });

    test('should throw error for missing required fields', async () => {
      const planData = {
        customerId: 'CUST-001'
        // Missing totalAmount and installmentAmount
      };

      await expect(utils.createPaymentPlan(planData)).rejects.toThrow('Missing required payment plan fields');
    });
  });

  describe('calculateInvoiceTotal', () => {
    test('should calculate total with line items', async () => {
      const lineItems = [
        {
          id: '1',
          description: 'Item 1',
          quantity: 2,
          unitPrice: 50.00,
          total: 100.00
        },
        {
          id: '2',
          description: 'Item 2',
          quantity: 1,
          unitPrice: 75.00,
          total: 75.00
        }
      ];

      const result = await utils.calculateInvoiceTotal(lineItems);

      expect(result).toBeDefined();
      expect(result.subtotal).toBe(175.00);
      expect(result.total).toBe(175.00);
      expect(result.taxAmount).toBe(0);
      expect(result.currency).toBe('USD');
    });

    test('should calculate total with tax', async () => {
      const lineItems = [
        {
          id: '1',
          description: 'Item 1',
          quantity: 1,
          unitPrice: 100.00,
          total: 100.00
        }
      ];

      const result = await utils.calculateInvoiceTotal(lineItems, 10); // 10% tax

      expect(result.subtotal).toBe(100.00);
      expect(result.taxAmount).toBe(10.00);
      expect(result.total).toBe(110.00);
    });

    test('should calculate total with discount', async () => {
      const lineItems = [
        {
          id: '1',
          description: 'Item 1',
          quantity: 1,
          unitPrice: 100.00,
          total: 100.00
        }
      ];

      const result = await utils.calculateInvoiceTotal(lineItems, undefined, 20); // $20 discount

      expect(result.subtotal).toBe(100.00);
      expect(result.discountAmount).toBe(20);
      expect(result.total).toBe(80.00);
    });
  });

  describe('generatePaymentSchedule', () => {
    test('should generate monthly payment schedule', async () => {
      const planData = {
        totalAmount: 300.00,
        installmentAmount: 100.00,
        frequency: 'monthly' as PaymentPlanFrequency,
        startDate: new Date('2025-06-01')
      };

      const schedule = await utils.generatePaymentSchedule(planData);

      expect(schedule).toHaveLength(3);
      expect(schedule[0].amount).toBe(100.00);
      expect(schedule[0].dueDate).toEqual(new Date('2025-06-01'));
      expect(schedule[1].dueDate).toEqual(new Date('2025-07-01'));
      expect(schedule[2].dueDate).toEqual(new Date('2025-08-01'));
    });

    test('should handle partial final payment', async () => {
      const planData = {
        totalAmount: 250.00,
        installmentAmount: 100.00,
        frequency: 'monthly' as PaymentPlanFrequency,
        startDate: new Date('2025-06-01')
      };

      const schedule = await utils.generatePaymentSchedule(planData);

      expect(schedule).toHaveLength(3);
      expect(schedule[0].amount).toBe(100.00);
      expect(schedule[1].amount).toBe(100.00);
      expect(schedule[2].amount).toBe(50.00); // Partial final payment
    });
  });

  describe('calculateLateFees', () => {
    test('should calculate late fees for overdue days', async () => {
      // Mock the getInvoice function
      vi.spyOn(utils, 'getInvoice').mockResolvedValueOnce({
        id: 'INV-001',
        customerId: 'CUST-001',
        amount: 1000.00,
        currency: 'USD',
        status: 'written_off',
        dueDate: new Date('2025-05-01'),
        issueDate: new Date('2025-04-15'),
        lineItems: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const lateFee = await utils.calculateLateFees('INV-001', 14); // 2 weeks overdue

      expect(lateFee).toBe(20.00); // 2 weeks * 1% * 1000 = $20
    });

    test('should cap late fees at 25% of invoice amount', async () => {
      vi.spyOn(utils, 'getInvoice').mockResolvedValueOnce({
        id: 'INV-001',
        customerId: 'CUST-001',
        amount: 1000.00,
        currency: 'USD',
        status: 'written_off',
        dueDate: new Date('2025-05-01'),
        issueDate: new Date('2025-04-15'),
        lineItems: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const lateFee = await utils.calculateLateFees('INV-001', 365); // 1 year overdue

      expect(lateFee).toBe(250.00); // Capped at 25% of $1000
    });

    test('should throw error for non-existent invoice', async () => {
      vi.spyOn(utils, 'getInvoice').mockResolvedValueOnce(null);

      await expect(utils.calculateLateFees('NONEXISTENT', 14)).rejects.toThrow('Invoice NONEXISTENT not found');
    });
  });
});

// Original dummy test to ensure backward compatibility
test('dummy test', async () => {
  expect(true).toBe(true);
});
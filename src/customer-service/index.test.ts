import { expect, test, describe, beforeEach, vi } from 'vitest';
import CustomerService from './index';
import { Env } from './raindrop.gen';
import { CUSTOMER_QUERIES } from '../sql/customers-db';

// Mock environment
const mockEnv: Partial<Env> = {
  CUSTOMERS_DB: {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1, changed_db: true } }),
    first: vi.fn(),
    all: vi.fn()
  } as any,
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  } as any
};

describe('CustomerService', () => {
  let service: CustomerService;

  beforeEach(() => {
    service = new CustomerService({} as any, mockEnv as Env);
    vi.clearAllMocks();
  });

  describe('validateCustomer', () => {
    test('should validate valid customer creation data', () => {
      const customerData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123'
      };

      const result = service.validateCustomer(customerData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid email format', () => {
      const customerData = {
        name: 'John Doe',
        email: 'invalid-email'
      };

      const result = service.validateCustomer(customerData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    test('should reject empty name', () => {
      const customerData = {
        name: ''
      };

      const result = service.validateCustomer(customerData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    test('should reject invalid phone format', () => {
      const customerData = {
        name: 'John Doe',
        phone: 'abc'
      };

      const result = service.validateCustomer(customerData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid phone number format');
    });
  });

  describe('searchCustomers', () => {
    test('should search customers with basic parameters', async () => {
      const mockCustomers = [
        {
          customer_id: 'CUST-001',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          status: 'active'
        }
      ];

      mockEnv.CUSTOMERS_DB.prepare().bind().all.mockResolvedValueOnce({
        results: mockCustomers
      });

      mockEnv.CUSTOMERS_DB.prepare().bind().first.mockResolvedValueOnce({
        total: 1
      });

      const result = await service.searchCustomers({
        query: 'John',
        limit: 10,
        offset: 0
      });

      expect(result.customers).toHaveLength(1);
      expect(result.customers[0].name).toBe('John Doe');
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('createCustomer', () => {
    test('should create a valid customer', async () => {
      const customerData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123'
      };

      mockEnv.CUSTOMERS_DB.prepare().bind().run.mockResolvedValue({
        meta: { last_row_id: 1, changed_db: true }
      });

      const result = await service.createCustomer(customerData);

      expect(result.success).toBe(true);
      expect(result.customer).toBeDefined();
      expect(result.customer!.name).toBe('John Doe');
      expect(result.customer!.customerId).toMatch(/^CUST-/);
    });

    test('should reject invalid customer data', async () => {
      const customerData = {
        name: '',
        email: 'invalid-email'
      };

      const result = await service.createCustomer(customerData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Name is required');
      expect(result.error).toContain('Invalid email format');
    });
  });

  describe('getCustomer', () => {
    test('should retrieve existing customer', async () => {
      const mockCustomer = {
        customer_id: 'CUST-001',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        status: 'active'
      };

      mockEnv.CUSTOMERS_DB.prepare().bind().first.mockResolvedValueOnce(mockCustomer);

      const result = await service.getCustomer('CUST-001');

      expect(result.success).toBe(true);
      expect(result.customer).toBeDefined();
      expect(result.customer!.name).toBe('John Doe');
    });

    test('should return not found for non-existent customer', async () => {
      mockEnv.CUSTOMERS_DB.prepare().bind().first.mockResolvedValueOnce(null);

      const result = await service.getCustomer('CUST-999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer not found');
    });
  });

  describe('updateCustomer', () => {
    test('should update existing customer', async () => {
      const existingCustomer = {
        customer_id: 'CUST-001',
        name: 'John Doe',
        email: 'john@example.com',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        status: 'active'
      };

      mockEnv.CUSTOMERS_DB.prepare().bind().first
        .mockResolvedValueOnce(existingCustomer) // For existence check
        .mockResolvedValueOnce({ total: 1 });    // For search count

      mockEnv.CUSTOMERS_DB.prepare().bind().all.mockResolvedValue({
        results: []
      });

      mockEnv.CUSTOMERS_DB.prepare().bind().run.mockResolvedValue({
        meta: { last_row_id: 1, changed_db: true }
      });

      const result = await service.updateCustomer('CUST-001', {
        name: 'John Updated'
      });

      expect(result.success).toBe(true);
      expect(result.customer!.name).toBe('John Updated');
    });

    test('should reject invalid update data', async () => {
      const result = await service.updateCustomer('CUST-001', {
        email: 'invalid-email'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email format');
    });
  });

  describe('deleteCustomer', () => {
    test('should delete existing customer', async () => {
      const existingCustomer = {
        customer_id: 'CUST-001',
        name: 'John Doe',
        email: 'john@example.com',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        status: 'active'
      };

      mockEnv.CUSTOMERS_DB.prepare().bind().first.mockResolvedValueOnce(existingCustomer);
      mockEnv.CUSTOMERS_DB.prepare().bind().run.mockResolvedValue({
        meta: { changed_db: true }
      });

      const result = await service.deleteCustomer('CUST-001');

      expect(result.success).toBe(true);
      expect(result.deleted).toBe(true);
    });

    test('should handle non-existent customer gracefully', async () => {
      mockEnv.CUSTOMERS_DB.prepare().bind().first.mockResolvedValueOnce(null);

      const result = await service.deleteCustomer('CUST-999');

      expect(result.success).toBe(true);
      expect(result.deleted).toBe(false);
      expect(result.error).toBe('Customer not found');
    });
  });
});

// Keep the original dummy test for backward compatibility
test('dummy test', async () => {
  expect(true).toBe(true);
});

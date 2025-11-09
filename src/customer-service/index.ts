import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerSearchRequest,
  CustomerSearchResponse,
  CustomerValidationResult,
  CustomerOperationResult,
  CustomerDeleteResult,
  CustomerServiceOperations
} from './interfaces';
import {
  validateCustomerData,
  generateCustomerId,
  sanitizeCustomerData,
  mapDbRowToCustomer,
  mapCustomerToDbRow,
  applyCustomerFilters,
  logCustomerOperation
} from './utils';

export default class CustomerService extends Service<Env> implements CustomerServiceOperations {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { method } = request;

    try {
      // Route the request based on method and path
      if (method === 'GET' && url.pathname === '/customers') {
        return this.handleSearch(request);
      } else if (method === 'GET' && url.pathname.startsWith('/customers/')) {
        const customerId = url.pathname.split('/')[2];
        return this.handleGetCustomer(customerId || '');
      } else if (method === 'POST' && url.pathname === '/customers') {
        return this.handleCreateCustomer(request);
      } else if (method === 'PUT' && url.pathname.startsWith('/customers/')) {
        const customerId = url.pathname.split('/')[2];
        return this.handleUpdateCustomer(customerId || '', request);
      } else if (method === 'DELETE' && url.pathname.startsWith('/customers/')) {
        const customerId = url.pathname.split('/')[2];
        return this.handleDeleteCustomer(customerId || '');
      } else if (method === 'POST' && url.pathname === '/customers/validate') {
        return this.handleValidateCustomer(request);
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Customer service error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(request: CreateCustomerRequest): Promise<CustomerOperationResult> {
    // Validate input
    const validation = validateCustomerData(request);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    try {
      // Sanitize data
      const sanitizedData = sanitizeCustomerData(request);
      
      // Generate customer ID
      const customerId = generateCustomerId();
      const now = new Date().toISOString();

      // Create customer object
      const customer: Customer = {
        customerId,
        name: sanitizedData.name!,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        address: sanitizedData.address,
        company: sanitizedData.company,
        communicationPreferences: sanitizedData.communicationPreferences ? {
          email: sanitizedData.communicationPreferences.email ?? true,
          sms: sanitizedData.communicationPreferences.sms ?? true,
          phone: sanitizedData.communicationPreferences.phone ?? false
        } : undefined,
        complianceConsent: sanitizedData.complianceConsent ? {
          tcpaConsent: sanitizedData.complianceConsent.tcpaConsent ?? false,
          consentDate: sanitizedData.complianceConsent.consentDate || now
        } : undefined,
        createdAt: now,
        updatedAt: now,
        status: 'active'
      };

      // Insert into database
      const dbRow = mapCustomerToDbRow(customer);
      const db = this.env.CUSTOMERS_DB;
      
      await db.prepare(`
        INSERT INTO customers (
          customer_id, name, email, phone, address, company,
          communication_preferences, compliance_consent, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        dbRow.customer_id,
        dbRow.name,
        dbRow.email,
        dbRow.phone,
        dbRow.address,
        dbRow.company,
        dbRow.communication_preferences,
        dbRow.compliance_consent,
        dbRow.status
      ).run();

      // Log the operation
      await logCustomerOperation('CREATE', customerId);

      return {
        success: true,
        customer
      };
    } catch (error: any) {
      if (error.message && error.message.includes('UNIQUE constraint')) {
        return {
          success: false,
          error: 'Customer with this email or phone already exists'
        };
      }
      return {
        success: false,
        error: 'Failed to create customer'
      };
    }
  }

  /**
   * Get a customer by ID
   */
  async getCustomer(customerId: string): Promise<CustomerOperationResult> {
    try {
      const db = this.env.CUSTOMERS_DB;
      const result = await db.prepare('SELECT * FROM customers WHERE customer_id = ?')
        .bind(customerId)
        .first();

      if (!result) {
        return {
          success: false,
          error: 'Customer not found'
        };
      }

      const customer = mapDbRowToCustomer(result);
      return {
        success: true,
        customer
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to retrieve customer'
      };
    }
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(customerId: string, request: UpdateCustomerRequest): Promise<CustomerOperationResult> {
    // Validate input
    const validation = validateCustomerData(request, true);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    try {
      // Check if customer exists
      const existingResult = await this.getCustomer(customerId);
      if (!existingResult.success) {
        return existingResult;
      }

      const existingCustomer = existingResult.customer || {
        customerId: '',
        name: '',
        createdAt: '',
        updatedAt: '',
        status: 'active' as const
      };

      // Sanitize update data
      const sanitizedData = sanitizeCustomerData(request);

      // Merge with existing data
      const updatedCustomer: Customer = {
        ...existingCustomer,
        ...sanitizedData,
        communicationPreferences: sanitizedData.communicationPreferences ? {
          email: sanitizedData.communicationPreferences.email ?? existingCustomer.communicationPreferences?.email ?? true,
          sms: sanitizedData.communicationPreferences.sms ?? existingCustomer.communicationPreferences?.sms ?? true,
          phone: sanitizedData.communicationPreferences.phone ?? existingCustomer.communicationPreferences?.phone ?? false
        } : existingCustomer.communicationPreferences,
        complianceConsent: sanitizedData.complianceConsent ? {
          tcpaConsent: sanitizedData.complianceConsent.tcpaConsent ?? existingCustomer.complianceConsent?.tcpaConsent ?? false,
          consentDate: sanitizedData.complianceConsent.consentDate || existingCustomer.complianceConsent?.consentDate || new Date().toISOString()
        } : existingCustomer.complianceConsent,
        updatedAt: new Date().toISOString()
      };

      // Update in database
      const dbRow = mapCustomerToDbRow(updatedCustomer);
      const db = this.env.CUSTOMERS_DB;
      
      await db.prepare(`
        UPDATE customers SET 
          name = ?, email = ?, phone = ?, address = ?, company = ?,
          communication_preferences = ?, compliance_consent = ?, status = ?
        WHERE customer_id = ?
      `).bind(
        dbRow.name,
        dbRow.email,
        dbRow.phone,
        dbRow.address,
        dbRow.company,
        dbRow.communication_preferences,
        dbRow.compliance_consent,
        dbRow.status,
        dbRow.customer_id
      ).run();

      // Log the operation
      await logCustomerOperation('UPDATE', customerId);

      return {
        success: true,
        customer: updatedCustomer
      };
    } catch (error: any) {
      if (error.message && error.message.includes('UNIQUE constraint')) {
        return {
          success: false,
          error: 'Email or phone already exists'
        };
      }
      return {
        success: false,
        error: 'Failed to update customer'
      };
    }
  }

  /**
   * Delete (archive) a customer
   */
  async deleteCustomer(customerId: string): Promise<CustomerDeleteResult> {
    try {
      // Check if customer exists
      const existingResult = await this.getCustomer(customerId);
      if (!existingResult.success) {
        return {
          success: true,
          deleted: false,
          error: 'Customer not found'
        };
      }

      // Soft delete by setting status to archived
      const db = this.env.CUSTOMERS_DB;
      await db.prepare('UPDATE customers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?')
        .bind('archived', customerId)
        .run();

      // Log the operation
      await logCustomerOperation('DELETE', customerId);

      return {
        success: true,
        deleted: true
      };
    } catch (error) {
      return {
        success: false,
        deleted: false,
        error: 'Failed to delete customer'
      };
    }
  }

  /**
   * Search for customers
   */
  async searchCustomers(request: CustomerSearchRequest): Promise<CustomerSearchResponse> {
    try {
      const baseQuery = 'SELECT * FROM customers';
      const { query, params } = applyCustomerFilters(baseQuery, request);

      const db = this.env.CUSTOMERS_DB;
      const result = await db.prepare(query).bind(...params).all();

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM customers';
      const { query: countQueryStr, params: countParams } = applyCustomerFilters(countQuery, {
        ...request,
        limit: undefined,
        offset: undefined,
        sortBy: undefined,
        sortOrder: undefined
      });

      const countResult = await db.prepare(countQueryStr).bind(...countParams).first<{ total: number }>();

      const customers = result.results.map(row => mapDbRowToCustomer(row));
      const total = countResult?.total || 0;
      const limit = request.limit || 50;
      const offset = request.offset || 0;
      const hasMore = offset + customers.length < total;

      return {
        customers,
        total,
        limit,
        offset,
        hasMore
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        customers: [],
        total: 0,
        limit: request.limit || 50,
        offset: request.offset || 0,
        hasMore: false
      };
    }
  }

  /**
   * Validate customer data
   */
  validateCustomer(request: CreateCustomerRequest | UpdateCustomerRequest): CustomerValidationResult {
    return validateCustomerData(request, 'name' in request && request.name === undefined);
  }

  // HTTP handlers
  private async handleCreateCustomer(request: Request): Promise<Response> {
    const data = await request.json() as CreateCustomerRequest;
    const result = await this.createCustomer(data);

    if (result.success) {
      return new Response(JSON.stringify(result.customer), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleGetCustomer(customerId: string): Promise<Response> {
    const result = await this.getCustomer(customerId);

    if (result.success) {
      return new Response(JSON.stringify(result.customer), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleUpdateCustomer(customerId: string, request: Request): Promise<Response> {
    const data = await request.json() as UpdateCustomerRequest;
    const result = await this.updateCustomer(customerId, data);

    if (result.success) {
      return new Response(JSON.stringify(result.customer), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleDeleteCustomer(customerId: string): Promise<Response> {
    const result = await this.deleteCustomer(customerId);

    if (result.success && result.deleted) {
      return new Response(null, { status: 204 });
    } else if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleSearch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const searchRequest: CustomerSearchRequest = {
      query: url.searchParams.get('query') || undefined,
      status: url.searchParams.get('status') as any || undefined,
      email: url.searchParams.get('email') || undefined,
      phone: url.searchParams.get('phone') || undefined,
      company: url.searchParams.get('company') || undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
      offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined,
      sortBy: url.searchParams.get('sortBy') as any || undefined,
      sortOrder: url.searchParams.get('sortOrder') as any || undefined
    };

    const result = await this.searchCustomers(searchRequest as any);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleValidateCustomer(request: Request): Promise<Response> {
    const data = await request.json() as any;
    const isUpdate = request.url.includes('update');
    const result = this.validateCustomer(data);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

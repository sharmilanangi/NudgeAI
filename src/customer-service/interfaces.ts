// Customer Service TypeScript Interfaces
// Defines the contract for customer operations and data structures

export interface Customer {
  customerId: string;
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
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'archived';
}

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
  complianceConsent?: {
    tcpaConsent?: boolean;
    consentDate?: string;
  };
  status?: 'active' | 'inactive' | 'archived';
}

export interface CustomerSearchRequest {
  query?: string;
  status?: 'active' | 'inactive' | 'archived';
  email?: string;
  phone?: string;
  company?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerSearchResponse {
  customers: Customer[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CustomerValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CustomerOperationResult {
  success: boolean;
  customer?: Customer;
  error?: string;
}

export interface CustomerDeleteResult {
  success: boolean;
  deleted: boolean;
  error?: string;
}

export interface CustomerServiceOperations {
  createCustomer(request: CreateCustomerRequest): Promise<CustomerOperationResult>;
  getCustomer(customerId: string): Promise<CustomerOperationResult>;
  updateCustomer(customerId: string, request: UpdateCustomerRequest): Promise<CustomerOperationResult>;
  deleteCustomer(customerId: string): Promise<CustomerDeleteResult>;
  searchCustomers(request: CustomerSearchRequest): Promise<CustomerSearchResponse>;
  validateCustomer(request: CreateCustomerRequest | UpdateCustomerRequest): CustomerValidationResult;
}
// Admin Service Interfaces
// These interfaces define the structure for administrative operations

export interface AdminUser {
  userId: string;
  username: string;
  email: string;
  role: AdminRole;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRole {
  roleId: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
}

export interface Permission {
  permissionId: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface SystemConfiguration {
  configId: string;
  category: ConfigCategory;
  key: string;
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  isEditable: boolean;
  requiresRestart: boolean;
  updatedBy?: string;
  updatedAt: string;
}

export type ConfigCategory = 
  | 'system'
  | 'communication'
  | 'payment'
  | 'compliance'
  | 'ai'
  | 'security'
  | 'integration';

export interface AdminAuditLog {
  logId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AdminReport {
  reportId: string;
  name: string;
  description: string;
  type: ReportType;
  parameters: ReportParameter[];
  schedule?: ReportSchedule;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  lastRunAt?: string;
}

export type ReportType = 
  | 'user_activity'
  | 'system_performance'
  | 'communication_effectiveness'
  | 'payment_collections'
  | 'compliance_status'
  | 'ai_performance'
  | 'custom';

export interface ReportParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  description: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  timezone: string;
  nextRun: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
}

export interface AdminSession {
  sessionId: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  createdAt: string;
  lastAccessAt: string;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  services: ServiceHealth[];
  timestamp: string;
  uptime: number;
  version: string;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  responseTime: number;
  lastCheck: string;
  errorRate?: number;
  details?: Record<string, any>;
}

export interface AdminOperation {
  operationId: string;
  type: OperationType;
  status: OperationStatus;
  initiatedBy: string;
  targetResource?: string;
  parameters: Record<string, any>;
  progress: number;
  estimatedCompletion?: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export type OperationType = 
  | 'bulk_user_update'
  | 'system_backup'
  | 'data_import'
  | 'data_export'
  | 'configuration_update'
  | 'maintenance_mode'
  | 'cache_clear'
  | 'index_rebuild';

export type OperationStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

// API Request/Response types for admin operations
export interface AdminUserCreateRequest {
  username: string;
  email: string;
  roleId: string;
  isActive?: boolean;
}

export interface AdminUserUpdateRequest {
  username?: string;
  email?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface SystemConfigUpdateRequest {
  value: any;
  reason?: string;
}

export interface AdminReportGenerateRequest {
  reportId: string;
  parameters?: Record<string, any>;
  format?: 'pdf' | 'excel' | 'csv' | 'json';
}

export interface BulkOperationRequest {
  operation: OperationType;
  targets: string[];
  parameters: Record<string, any>;
}

export interface AdminApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface PaginatedAdminResponse<T> extends AdminApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Database query interfaces
export interface AdminQuery {
  filters?: {
    role?: string;
    isActive?: boolean;
    dateRange?: {
      start: string;
      end: string;
    };
    search?: string;
  };
  sorting?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

// Mock data interfaces for testing
export interface MockAdminData {
  users: AdminUser[];
  roles: AdminRole[];
  permissions: Permission[];
  configurations: SystemConfiguration[];
  auditLogs: AdminAuditLog[];
  reports: AdminReport[];
  sessions: AdminSession[];
  operations: AdminOperation[];
}
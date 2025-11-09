import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import type {
  AdminUser,
  AdminRole,
  Permission,
  SystemConfiguration,
  AdminAuditLog,
  AdminReport,
  AdminSession,
  SystemHealth,
  AdminOperation,
  AdminApiResponse,
  PaginatedAdminResponse,
  AdminQuery,
  BulkOperationRequest,
  AdminUserCreateRequest,
  AdminUserUpdateRequest,
  SystemConfigUpdateRequest,
  ConfigCategory,
  OperationType,
  ReportType
} from './interfaces';
import {
  validateAdminUser,
  hashPassword,
  verifyPassword,
  generateSessionToken,
  validateSessionToken,
  hasPermission,
  canAccessResource,
  validateConfigValue,
  sanitizeConfigData,
  applySystemConfig,
  rollbackConfigChange,
  createAuditLog,
  logUserAction,
  getAuditTrail,
  generateReport,
  scheduleReport,
  exportReportData,
  checkServiceHealth,
  getSystemHealth,
  monitorSystemMetrics,
  getPerformanceMetrics,
  createBulkOperation,
  executeBulkOperation,
  cancelBulkOperation,
  getOperationStatus,
  buildAdminQuery,
  executeAdminQuery,
  paginateResults,
  sanitizeInput,
  validateIpAddress,
  detectSuspiciousActivity,
  lockUserAccount,
  importAdminData,
  exportAdminData,
  validateImportData,
  clearAdminCache,
  invalidateUserCache,
  refreshConfigCache,
  sendAdminNotification,
  escalateCriticalIssue,
  createSystemBackup,
  restoreSystemBackup,
  validateBackupIntegrity,
  testIntegrationConnection,
  syncIntegrationData,
  getIntegrationStatus,
  generateAdminId,
  formatAdminTimestamp,
  calculateOperationProgress,
  isValidEmail,
  isValidUsername,
  rateLimitCheck,
  getAdminStats,
  createAdminResponse,
  logPerformanceMetric,
  validateAdminRequest
} from './utils';

export default class extends Service<Env> {
  // In-memory storage for demo purposes - in production use proper database
  private users: Map<string, AdminUser> = new Map();
  private roles: Map<string, AdminRole> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private configurations: Map<string, SystemConfiguration> = new Map();
  private sessions: Map<string, AdminSession> = new Map();
  private operations: Map<string, AdminOperation> = new Map();
  private auditLogs: AdminAuditLog[] = [];

  async fetch(request: Request): Promise<Response> {
    // Initialize mock data if needed
    if (this.users.size === 0) {
      this.initializeMockData();
    }

    const url = new URL(request.url);
    const { method } = request;
    const path = url.pathname;

    try {
      // Simple mock response for now
      if (path === '/' && method === 'GET') {
        return this.json({ status: 'Admin service running' });
      }

      return new Response('Not Found', { status: 404 });

    } catch (error) {
      this.env.logger.error('Admin service error:', error as any);
      return this.json({ error: 'Internal error' }, 500);
    }
  }

  private initializeMockData(): void {
    // Create default admin role
    const adminRole: AdminRole = {
      roleId: 'role_admin',
      name: 'Administrator',
      description: 'Full system access',
      permissions: [],
      isSystem: true
    };

    // Create basic permissions
    const permissions: Permission[] = [
      {
        permissionId: 'perm_user_read',
        name: 'Read Users',
        resource: 'users',
        action: 'read',
        description: 'View user accounts'
      },
      {
        permissionId: 'perm_user_write',
        name: 'Manage Users',
        resource: 'users',
        action: 'write',
        description: 'Create and modify user accounts'
      },
      {
        permissionId: 'perm_system_config',
        name: 'System Configuration',
        resource: 'system',
        action: 'configure',
        description: 'Modify system configuration'
      }
    ];

    // Store permissions and role
    permissions.forEach(p => this.permissions.set(p.permissionId, p));
    adminRole.permissions = permissions;
    this.roles.set(adminRole.roleId, adminRole);

    // Create default admin user
    const adminUser: AdminUser = {
      userId: 'user_admin',
      username: 'admin',
      email: 'admin@system.com',
      role: adminRole,
      permissions: permissions,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.set(adminUser.userId, adminUser);
  }

  private async authenticateRequest(request: Request): Promise<AdminUser | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    if (!validateSessionToken(token)) {
      return null;
    }

    // Find session by token
    const session = Array.from(this.sessions.values()).find(s => s.token === token && s.isActive);
    if (!session || new Date(session.expiresAt) < new Date()) {
      return null;
    }

    const user = this.users.get(session.userId);
    if (user && user.isActive) {
      // Update last access
      session.lastAccessAt = new Date().toISOString();
      this.sessions.set(session.sessionId, session);
    }

    return user || null;
  }

  private async handleRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      // Public endpoints (no auth required)
      if (path === '/health' && method === 'GET') {
        return this.json(createAdminResponse(true, getSystemHealth()));
      }

      // Authenticate for all other endpoints
      const user = await this.authenticateRequest(request);
      if (!user) {
        return this.json(createAdminResponse(false, null, {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }), 401);
      }

      // Route based on path and method
      if (path === '/users' && method === 'GET') {
        return this.handleGetUsers(request, user);
      } else if (path === '/users' && method === 'POST') {
        return this.handleCreateUser(request, user);
      } else if (path.startsWith('/users/') && method === 'GET') {
        const userId = path.split('/')[2];
        return this.handleGetUser(userId || '', user);
      } else if (path.startsWith('/users/') && method === 'PUT') {
        const userId = path.split('/')[2];
        return this.handleUpdateUser(userId || '', request, user);
      } else if (path === '/config' && method === 'GET') {
        return this.handleGetConfig(request, user);
      } else if (path === '/config' && method === 'PUT') {
        return this.handleUpdateConfig(request, user);
      } else if (path === '/reports' && method === 'GET') {
        return this.handleGetReports(user);
      } else if (path === '/reports' && method === 'POST') {
        return this.handleGenerateReport(request, user);
      } else if (path === '/operations' && method === 'GET') {
        return this.handleGetOperations(user);
      } else if (path === '/operations' && method === 'POST') {
        return this.handleCreateOperation(request, user);
      } else if (path === '/stats' && method === 'GET') {
        return this.json(createAdminResponse(true, getAdminStats(url.searchParams.get('timeRange') || '24h')));
      } else if (path === '/audit' && method === 'GET') {
        return this.handleGetAuditTrail(request, user);
      }

      return this.json(createAdminResponse(false, null, {
        code: 'NOT_FOUND',
        message: 'Endpoint not found'
      }), 404);

    } catch (error) {
      this.env.logger.error('Admin service error:', error as any);
      return this.json(createAdminResponse(false, null, {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }), 500);
    }
  }

  private async handleGetUsers(request: Request, user: AdminUser): Promise<Response> {
    if (!hasPermission(user, 'users', 'read')) {
      return this.json(createAdminResponse(false, null, {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions'
      }), 403);
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';

    let users = Array.from(this.users.values());
    
    if (search) {
      users = users.filter(u => 
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    const paginatedResult = paginateResults(users, page, limit);
    return this.json(createAdminResponse(true, paginatedResult.data, {
      pagination: paginatedResult.pagination
    }));
  }

  private async handleGetUser(userId: string, user: AdminUser): Promise<Response> {
    if (!hasPermission(user, 'users', 'read')) {
      return this.json(createAdminResponse(false, null, {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions'
      }), 403);
    }

    const targetUser = this.users.get(userId);
    if (!targetUser) {
      return this.json(createAdminResponse(false, null, {
        code: 'NOT_FOUND',
        message: 'User not found'
      }), 404);
    }

    return this.json(createAdminResponse(true, targetUser));
  }

  private async handleCreateUser(request: Request, user: AdminUser): Promise<Response> {
    if (!hasPermission(user, 'users', 'write')) {
      return this.json(createAdminResponse(false, null, {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions'
      }), 403);
    }

    const body = await request.json() as AdminUserCreateRequest;
    const validation = validateAdminRequest(body, ['username', 'email', 'roleId']);
    
    if (!validation.valid) {
      return this.json(createAdminResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: validation.errors
      }), 400);
    }

    if (!isValidEmail(body.email)) {
      return this.json(createAdminResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format'
      }), 400);
    }

    if (!isValidUsername(body.username)) {
      return this.json(createAdminResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid username format'
      }), 400);
    }

    // Check if username or email already exists
    const existingUser = Array.from(this.users.values()).find(u => 
      u.username === body.username || u.email === body.email
    );

    if (existingUser) {
      return this.json(createAdminResponse(false, null, {
        code: 'CONFLICT',
        message: 'Username or email already exists'
      }), 409);
    }

    const role = this.roles.get(body.roleId);
    if (!role) {
      return this.json(createAdminResponse(false, null, {
        code: 'NOT_FOUND',
        message: 'Role not found'
      }), 404);
    }

    const newUser: AdminUser = {
      userId: generateAdminId('user'),
      username: body.username,
      email: body.email,
      role: role,
      permissions: role.permissions,
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.users.set(newUser.userId, newUser);
    
    logUserAction(user.userId, 'create_user', {
      targetUserId: newUser.userId,
      username: newUser.username
    });

    return this.json(createAdminResponse(true, newUser), 201);
  }

  private async handleUpdateUser(userId: string, request: Request, user: AdminUser): Promise<Response> {
    if (!hasPermission(user, 'users', 'write')) {
      return this.json(createAdminResponse(false, null, {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions'
      }), 403);
    }

    const targetUser = this.users.get(userId);
    if (!targetUser) {
      return this.json(createAdminResponse(false, null, {
        code: 'NOT_FOUND',
        message: 'User not found'
      }), 404);
    }

    const body = await request.json() as AdminUserUpdateRequest;
    
    if (body.email && !isValidEmail(body.email)) {
      return this.json(createAdminResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format'
      }), 400);
    }

    if (body.username && !isValidUsername(body.username)) {
      return this.json(createAdminResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid username format'
      }), 400);
    }

    // Update user
    const updatedUser = {
      ...targetUser,
      ...body,
      updatedAt: new Date().toISOString()
    };

    if (body.roleId) {
      const role = this.roles.get(body.roleId);
      if (role) {
        updatedUser.role = role;
        updatedUser.permissions = role.permissions;
      }
    }

    this.users.set(userId, updatedUser);
    
    logUserAction(user.userId, 'update_user', {
      targetUserId: userId,
      changes: body
    });

    return this.json(createAdminResponse(true, updatedUser));
  }

  private async handleGetConfig(request: Request, user: AdminUser): Promise<Response> {
    if (!hasPermission(user, 'system', 'configure')) {
      return this.json(createAdminResponse(false, null, {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions'
      }), 403);
    }

    const url = new URL(request.url);
    const category = url.searchParams.get('category') as ConfigCategory;

    let configs = Array.from(this.configurations.values());
    if (category) {
      configs = configs.filter(c => c.category === category);
    }

    return this.json(createAdminResponse(true, configs));
  }

  private async handleUpdateConfig(request: Request, user: AdminUser): Promise<Response> {
    if (!hasPermission(user, 'system', 'configure')) {
      return this.json(createAdminResponse(false, null, {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions'
      }), 403);
    }

    const body = await request.json() as { configId: string; update: SystemConfigUpdateRequest };
    
    const config = this.configurations.get(body.configId);
    if (!config) {
      return this.json(createAdminResponse(false, null, {
        code: 'NOT_FOUND',
        message: 'Configuration not found'
      }), 404);
    }

    if (!validateConfigValue(body.update.value, config.dataType)) {
      return this.json(createAdminResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid configuration value type'
      }), 400);
    }

    const updatedConfig = {
      ...config,
      value: body.update.value,
      updatedBy: user.userId,
      updatedAt: new Date().toISOString()
    };

    this.configurations.set(body.configId, updatedConfig);
    
    logUserAction(user.userId, 'update_config', {
      configId: body.configId,
      reason: body.update.reason
    });

    return this.json(createAdminResponse(true, updatedConfig));
  }

  private async handleGetReports(user: AdminUser): Promise<Response> {
    // For now, return mock reports
    const reports: AdminReport[] = [
      {
        reportId: 'report_user_activity',
        name: 'User Activity Report',
        description: 'Daily user activity summary',
        type: 'user_activity',
        parameters: [],
        isActive: true,
        createdBy: 'system',
        createdAt: new Date().toISOString()
      }
    ];

    return this.json(createAdminResponse(true, reports));
  }

  private async handleGenerateReport(request: Request, user: AdminUser): Promise<Response> {
    const body = await request.json() as { reportId: string; parameters?: Record<string, any> };
    
    const reportData = generateReport(body.reportId, body.parameters || {});
    
    logUserAction(user.userId, 'generate_report', {
      reportId: body.reportId,
      parameters: body.parameters
    });

    return this.json(createAdminResponse(true, reportData));
  }

  private async handleGetOperations(user: AdminUser): Promise<Response> {
    const operations = Array.from(this.operations.values());
    return this.json(createAdminResponse(true, operations));
  }

  private async handleCreateOperation(request: Request, user: AdminUser): Promise<Response> {
    const body = await request.json() as BulkOperationRequest;
    
    const operation = createBulkOperation(body);
    operation.initiatedBy = user.userId;
    
    this.operations.set(operation.operationId, operation);
    
    logUserAction(user.userId, 'create_operation', {
      operationId: operation.operationId,
      type: operation.type
    });

    return this.json(createAdminResponse(true, operation), 201);
  }

  private async handleGetAuditTrail(request: Request, user: AdminUser): Promise<Response> {
    const url = new URL(request.url);
    const resourceId = url.searchParams.get('resourceId');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    let logs = this.auditLogs;
    
    if (resourceId) {
      logs = logs.filter(log => log.resourceId === resourceId);
    }

    logs = logs.slice(0, limit);
    
    return this.json(createAdminResponse(true, logs));
  }

  private json(data: any, status: number = 200, meta?: any): Response {
    const body = JSON.stringify(data);
    return new Response(body, {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import {
  ComplianceCheckRequest,
  ComplianceCheckResult,
  ComplianceViolation,
  ComplianceWarning,
  CommunicationComplianceRecord,
  ComplianceQueueMessage
} from './interfaces';
import {
  checkTcpaCompliance,
  checkFdcpaCompliance,
  validateContent,
  verifyConsent,
  checkFrequencyLimits,
  createAuditEntry,
  loadComplianceRules,
  getCustomerComplianceProfile,
  updateCustomerComplianceProfile,
  getNextAllowedTime
} from './utils';

export default class ComplianceService extends Service<Env> {
  
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { method } = request;

    try {
      if (method === 'POST' && url.pathname === '/compliance/check') {
        return this.handleComplianceCheck(request);
      } else if (method === 'POST' && url.pathname === '/compliance/batch-check') {
        return this.handleBatchComplianceCheck(request);
      } else if (method === 'GET' && url.pathname.startsWith('/compliance/customer/')) {
        const customerId = url.pathname.split('/')[3];
        return this.handleGetCustomerProfile(customerId || '');
      } else if (method === 'GET' && url.pathname.startsWith('/compliance/next-allowed/')) {
        const parts = url.pathname.split('/');
        const customerId = parts[3] || '';
        const channel = (parts[4] || 'sms') as 'sms' | 'email' | 'phone';
        return this.handleGetNextAllowedTime(customerId, channel);
      } else if (method === 'POST' && url.pathname === '/compliance/process-queue') {
        return this.handleQueueProcessing(request);
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Compliance service error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Perform compliance check for a single communication
   */
  async checkCompliance(request: ComplianceCheckRequest): Promise<ComplianceCheckResult> {
    const startTime = Date.now();
    
    try {
      // Load compliance rules
      const rules = loadComplianceRules();
      
      // Get customer compliance profile
      const customerProfile = await getCustomerComplianceProfile(request.customerId);
      
      // Initialize results
      const allViolations: ComplianceViolation[] = [];
      const allWarnings: ComplianceWarning[] = [];

      // TCPA compliance check
      const tcpaResult = checkTcpaCompliance(request, customerProfile, rules.tcpa);
      allViolations.push(...tcpaResult.violations);
      allWarnings.push(...tcpaResult.warnings);

      // FDCPA compliance check
      const fdcpaResult = checkFdcpaCompliance(request, customerProfile, rules.fdcpa);
      allViolations.push(...fdcpaResult.violations);
      allWarnings.push(...fdcpaResult.warnings);

      // Content validation
      const contentResult = validateContent(request.content, request.strategy, rules);
      allViolations.push(...contentResult.violations);
      allWarnings.push(...contentResult.warnings);

      // Consent verification
      const consentResult = verifyConsent(request, customerProfile, rules.tcpa);
      allViolations.push(...consentResult.violations);
      allWarnings.push(...consentResult.warnings);

      // Frequency limit check
      const frequencyResult = checkFrequencyLimits(
        request.customerId,
        request.channel,
        customerProfile,
        rules
      );
      allViolations.push(...frequencyResult.violations);
      allWarnings.push(...frequencyResult.warnings);

      // Determine if communication can proceed
      const canProceed = allViolations.length === 0;
      
      // Calculate next allowed time if not compliant
      let nextAllowedTime: Date | undefined;
      if (!canProceed) {
        nextAllowedTime = getNextAllowedTime(
          request.customerId,
          request.channel,
          request.customerTimezone || 'UTC',
          customerProfile,
          rules.tcpa
        );
      }

      // Create compliance result
      const result: ComplianceCheckResult = {
        compliant: canProceed,
        violations: allViolations,
        warnings: allWarnings,
        auditEntry: createAuditEntry(request, {
          compliant: canProceed,
          violations: allViolations,
          warnings: allWarnings,
          auditEntry: {} as any,
          canProceed,
          nextAllowedTime
        }, Date.now() - startTime),
        recommendedActions: this.generateRecommendedActions(allViolations, allWarnings),
        canProceed,
        nextAllowedTime
      };

      // Update customer profile with communication record
      const communicationRecord: CommunicationComplianceRecord = {
        id: request.communicationId,
        timestamp: new Date().toISOString(),
        channel: request.channel,
        strategy: request.strategy,
        compliant: canProceed,
        violations: allViolations.map(v => v.type),
        warnings: allWarnings.map(w => w.type),
        processingTimeMs: Date.now() - startTime
      };

      await updateCustomerComplianceProfile(request.customerId, communicationRecord);

      return result;
    } catch (error) {
      console.error('Compliance check error:', error);
      throw error;
    }
  }

  /**
   * Process messages from compliance queue
   */
  async processQueueMessage(message: ComplianceQueueMessage): Promise<void> {
    try {
      const complianceRequest: ComplianceCheckRequest = {
        customerId: message.customerId,
        communicationId: message.communicationId,
        content: message.content,
        channel: message.channel,
        strategy: message.strategy,
        metadata: message.metadata
      };

      const result = await this.checkCompliance(complianceRequest);

      // Log the compliance check result
      this.env.logger.info('Compliance check completed', {
        customerId: message.customerId,
        communicationId: message.communicationId,
        compliant: result.compliant,
        violationsCount: result.violations.length,
        warningsCount: result.warnings.length
      });

      // If not compliant, queue for review or send alerts as needed
      if (!result.compliant) {
        await this.handleComplianceViolation(message, result);
      }

    } catch (error) {
      this.env.logger.error('Error processing compliance queue message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        message
      });
      throw error;
    }
  }

  private generateRecommendedActions(
    violations: ComplianceViolation[],
    warnings: ComplianceWarning[]
  ): string[] {
    const actions: string[] = [];

    violations.forEach(violation => {
      if (violation.suggestedFix) {
        actions.push(violation.suggestedFix);
      }
    });

    warnings.forEach(warning => {
      if (warning.recommendation) {
        actions.push(warning.recommendation);
      }
    });

    if (actions.length === 0 && warnings.length > 0) {
      actions.push('Review communication for compliance best practices');
    }

    return actions;
  }

  private async handleComplianceViolation(
    message: ComplianceQueueMessage,
    result: ComplianceCheckResult
  ): Promise<void> {
    // In a real implementation, this might:
    // - Send alerts to compliance team
    // - Queue for manual review
    // - Update customer risk scores
    // - Block the communication
    
    this.env.logger.warn('Compliance violation detected', {
      customerId: message.customerId,
      communicationId: message.communicationId,
      violations: result.violations.map(v => ({
        type: v.type,
        severity: v.severity,
        description: v.description
      }))
    });
  }

  // HTTP Handlers
  private async handleComplianceCheck(request: Request): Promise<Response> {
    const data = await request.json() as ComplianceCheckRequest;
    const result = await this.checkCompliance(data);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleBatchComplianceCheck(request: Request): Promise<Response> {
    const requests = await request.json() as ComplianceCheckRequest[];
    const results = await Promise.all(
      requests.map(req => this.checkCompliance(req))
    );

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleGetCustomerProfile(customerId: string): Promise<Response> {
    const profile = await getCustomerComplianceProfile(customerId);
    
    return new Response(JSON.stringify(profile), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleGetNextAllowedTime(
    customerId: string,
    channel: 'sms' | 'email' | 'phone'
  ): Promise<Response> {
    const customerProfile = await getCustomerComplianceProfile(customerId);
    const rules = loadComplianceRules();
    
    const nextAllowed = getNextAllowedTime(
      customerId,
      channel,
      'UTC',
      customerProfile,
      rules.tcpa
    );

    return new Response(JSON.stringify({
      customerId,
      channel,
      nextAllowedTime: nextAllowed.toISOString(),
      nextAllowedHours: nextAllowed.getHours(),
      timezone: 'UTC'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleQueueProcessing(request: Request): Promise<Response> {
    const message = await request.json() as ComplianceQueueMessage;
    await this.processQueueMessage(message);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Compliance check completed'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

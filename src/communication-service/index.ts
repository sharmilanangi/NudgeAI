import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import { CommunicationChannel, CommunicationStrategy } from '../shared/types';
import { 
  CommunicationRequest, 
  CommunicationMessage, 
  MessageTemplate,
  CommunicationPreferences,
  CommunicationStats,
  ServiceHealth
} from './interfaces';
import {
  validateCommunicationRequest,
  createCommunicationMessage,
  getTemplateById,
  renderTemplate,
  validateTemplateVariables,
  queueCommunication,
  logCommunicationEvent,
  updateDeliveryStatus,
  performComplianceCheck,
  formatEmailContent,
  formatSmsContent,
  preparePhoneCallScript,
  isWithinAllowedHours,
  getNextAllowedTime,
  trackDeliveryStatus,
  calculateDeliveryStats,
  testSendGridConnection,
  testTwilioConnection,
  parseProviderWebhook,
  executeMultiChannelCampaign,
  determineNextChannel,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplatesByChannelAndStrategy
} from './utils';

export default class extends Service<Env> {
  private defaultRetryLogic = {
    maxRetries: 3,
    retryDelays: [60, 300, 900], // 1min, 5min, 15min
    backoffMultiplier: 2,
    maxDelaySeconds: 3600,
    retryableErrors: ['timeout', 'rate_limit', 'temporary']
  };

  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const method = request.method;
      
      // Route handling
      if (method === 'POST' && url.pathname === '/send') {
        return this.handleSend(request);
      }
      
      if (method === 'GET' && url.pathname === '/health') {
        return this.handleHealth();
      }
      
      if (method === 'GET' && url.pathname === '/stats') {
        return this.handleStats(url.searchParams);
      }
      
      if (method === 'POST' && url.pathname === '/templates') {
        return this.handleCreateTemplate(request);
      }
      
      if (method === 'GET' && url.pathname.startsWith('/templates/')) {
        const templateId = url.pathname.split('/')[2];
        return this.handleGetTemplate(templateId || '');
      }
      
      if (method === 'GET' && url.pathname === '/templates') {
        return this.handleListTemplates(url.searchParams);
      }
      
      if (method === 'POST' && url.pathname === '/test-connections') {
        return this.handleTestConnections(request);
      }
      
      if (method === 'POST' && url.pathname === '/webhook') {
        return this.handleWebhook(request);
      }
      
      if (method === 'POST' && url.pathname === '/campaigns/execute') {
        return this.handleExecuteCampaign(request);
      }
      
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      this.env.logger.error('Communication service error:', error as any);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  private async handleSend(request: Request): Promise<Response> {
    const body = await request.json() as CommunicationRequest;
    
    // Validate request
    const validation = validateCommunicationRequest(body);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create message
    let message = createCommunicationMessage(body);

    // Apply template if specified
    if (body.templateId) {
      const template = await getTemplateById(body.templateId);
      if (template) {
        // Mock template variables for GREEN phase
        const variables = {
          customerId: body.customerId,
          invoiceNumber: body.invoiceNumber,
          ...body.customizations
        };
        
        const varValidation = validateTemplateVariables(template, variables);
        if (!varValidation.isValid) {
          return new Response(
            JSON.stringify({ error: 'Template variables missing', details: varValidation.missingVariables }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        const rendered = renderTemplate(template, variables);
        message.subject = rendered.subject;
        message.content = rendered.content;
      }
    }

    // Perform compliance check
    const complianceCheck = await performComplianceCheck(
      message.customerId,
      message.id,
      message.channel,
      message.content
    );
    
    if (!complianceCheck.passed) {
      return new Response(
        JSON.stringify({ error: 'Compliance check failed', details: complianceCheck.errors }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Queue for processing
    await queueCommunication(message);

    // Log event
    await logCommunicationEvent('message_sent', message.id, {
      customerId: message.customerId,
      channel: message.channel,
    });

    return new Response(
      JSON.stringify({ messageId: message.id, status: 'queued' }),
      { status: 202, headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleHealth(): Promise<Response> {
    // GREEN phase: Mock health check
    const health: ServiceHealth = {
      status: 'healthy',
      providers: {
        sendgrid: 'available',
        twilio: 'available',
      },
      queueHealth: {
        communicationEvents: 'healthy',
        emailSending: 'healthy',
        smsSending: 'healthy',
        voiceCalls: 'healthy',
      },
      lastChecked: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(health),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleStats(searchParams: URLSearchParams): Promise<Response> {
    // GREEN phase: Mock stats
    const mockMessages: CommunicationMessage[] = [
      {
        id: '1',
        customerId: 'cust1',
        channel: 'email',
        strategy: 'reminder',
        content: 'Test email',
        deliveryStatus: 'delivered',
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        customerId: 'cust2',
        channel: 'sms',
        strategy: 'negotiation',
        content: 'Test SMS',
        deliveryStatus: 'failed',
        retryCount: 1,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    const stats = calculateDeliveryStats(mockMessages);
    
    const fullStats: CommunicationStats = {
      ...stats,
      pending: 0,
      byChannel: {
        email: { total: 1, delivered: 1, failed: 0, deliveryRate: 100, averageCost: 0.01 },
        sms: { total: 1, delivered: 0, failed: 1, deliveryRate: 0, averageCost: 0.02 },
        phone: { total: 0, delivered: 0, failed: 0, deliveryRate: 0, averageCost: 0.05 },
      },
      byStrategy: {
        reminder: { total: 1, delivered: 1, failed: 0, deliveryRate: 100, averageCost: 0.01 },
        negotiation: { total: 1, delivered: 0, failed: 1, deliveryRate: 0, averageCost: 0.02 },
        final_notice: { total: 0, delivered: 0, failed: 0, deliveryRate: 0, averageCost: 0.05 },
      },
      dateRange: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
    };

    return new Response(
      JSON.stringify(fullStats),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleCreateTemplate(request: Request): Promise<Response> {
    const body = await request.json() as any;
    
    try {
      const template = await createTemplate(body);
      return new Response(
        JSON.stringify(template),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to create template' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  private async handleGetTemplate(templateId: string): Promise<Response> {
    const template = await getTemplateById(templateId);
    
    if (!template) {
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(template),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleListTemplates(searchParams: URLSearchParams): Promise<Response> {
    const channel = searchParams.get('channel') as CommunicationChannel;
    const strategy = searchParams.get('strategy') as CommunicationStrategy;
    
    let templates: MessageTemplate[] = [];
    
    if (channel && strategy) {
      templates = await getTemplatesByChannelAndStrategy(channel, strategy);
    } else {
      // Return mock list for GREEN phase
      templates = [
        await getTemplateById('email-reminder'),
        await getTemplateById('sms-negotiation')
      ].filter(Boolean) as MessageTemplate[];
    }

    return new Response(
      JSON.stringify({ templates }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleTestConnections(request: Request): Promise<Response> {
    const body = await request.json().catch(() => ({})) as any;
    
    const results = {
      sendgrid: body.sendgridApiKey ? await testSendGridConnection(body.sendgridApiKey) : false,
      twilio: body.twilioAccountSid && body.twilioAuthToken ? 
        await testTwilioConnection(body.twilioAccountSid, body.twilioAuthToken) : false,
    };

    return new Response(
      JSON.stringify(results),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleWebhook(request: Request): Promise<Response> {
    const body = await request.json() as any;
    const provider = request.headers.get('x-provider') as 'sendgrid' | 'twilio';
    
    if (!provider) {
      return new Response(
        JSON.stringify({ error: 'Provider header required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const parsed = parseProviderWebhook(provider, body);
    
    // Update delivery status (mock)
    await logCommunicationEvent('message_delivered', parsed.messageId, {
      provider,
      status: parsed.status,
      error: parsed.error,
    });

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleExecuteCampaign(request: Request): Promise<Response> {
    const body = await request.json() as any;
    
    try {
      await executeMultiChannelCampaign(body.campaign, body.customerData);
      
      return new Response(
        JSON.stringify({ status: 'campaign_started', campaignId: body.campaign.id }),
        { status: 202, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to execute campaign' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
}

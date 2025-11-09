// Communication Service Utility Functions
// Helper functions for communication operations

import { CommunicationChannel, CommunicationStrategy, DeliveryStatus } from '../shared/types';
import { 
  MessageTemplate, 
  CommunicationMessage, 
  DeliveryAttempt,
  CommunicationPreferences,
  ComplianceCheck,
  CommunicationEvent,
  DeliveryTracking,
  ProviderConfig,
  RetryLogic
} from './interfaces';

// TODO: Template Management Utilities

/**
 * Load template by ID from storage
 */
export async function getTemplateById(templateId: string): Promise<MessageTemplate | null> {
  // GREEN phase: Mock template implementation
  const mockTemplate: MessageTemplate = {
    id: templateId,
    name: 'Mock Template',
    channel: 'email',
    strategy: 'reminder',
    subject: 'Mock Subject',
    content: 'Mock content with {{variables}}',
    variables: ['variables'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return mockTemplate;
}

/**
 * Load templates by channel and strategy
 */
export async function getTemplatesByChannelAndStrategy(
  channel: CommunicationChannel,
  strategy: CommunicationStrategy
): Promise<MessageTemplate[]> {
  // GREEN phase: Mock template list
  const mockTemplate: MessageTemplate = {
    id: 'mock-template-id',
    name: 'Mock Template',
    channel,
    strategy,
    subject: 'Mock Subject',
    content: 'Mock content for {{channel}} with {{strategy}}',
    variables: ['channel', 'strategy'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return [mockTemplate];
}

/**
 * Render template with provided variables
 */
export function renderTemplate(
  template: MessageTemplate,
  variables: Record<string, any>
): { subject?: string; content: string } {
  // GREEN phase: Simple variable substitution
  let content = template.content;
  let subject = template.subject;
  
  // Replace {{variable}} patterns
  Object.entries(variables).forEach(([key, value]) => {
    const pattern = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(pattern, String(value));
    if (subject) {
      subject = subject.replace(pattern, String(value));
    }
  });
  
  return { subject, content };
}

/**
 * Validate template variables
 */
export function validateTemplateVariables(
  template: MessageTemplate,
  variables: Record<string, any>
): { isValid: boolean; missingVariables: string[] } {
  // GREEN phase: Check required variables
  const missingVariables: string[] = [];
  
  template.variables.forEach(variable => {
    if (!(variable in variables)) {
      missingVariables.push(variable);
    }
  });
  
  return {
    isValid: missingVariables.length === 0,
    missingVariables
  };
}

// TODO: Message Processing Utilities

/**
 * Create communication message from request
 */
export function createCommunicationMessage(request: any): CommunicationMessage {
  // GREEN phase: Basic message creation
  const now = new Date().toISOString();
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    customerId: request.customerId || 'unknown',
    invoiceNumber: request.invoiceNumber,
    channel: request.channel || 'email',
    strategy: request.strategy || 'reminder',
    templateId: request.templateId,
    subject: request.customizations?.subject,
    content: request.customizations?.content || 'Default content',
    deliveryStatus: 'pending',
    retryCount: 0,
    maxRetries: 3,
    metadata: request.metadata,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update message delivery status
 */
export function updateDeliveryStatus(
  message: CommunicationMessage,
  status: DeliveryStatus,
  providerMessageId?: string,
  error?: string
): CommunicationMessage {
  // GREEN phase: Update status and timestamps
  const now = new Date().toISOString();
  return {
    ...message,
    deliveryStatus: status,
    sentAt: status === 'delivered' ? now : message.sentAt,
    deliveredAt: status === 'delivered' ? now : message.deliveredAt,
    failedAt: status === 'failed' ? now : message.failedAt,
    updatedAt: now,
    metadata: {
      ...message.metadata,
      providerMessageId,
      error,
    }
  };
}

/**
 * Calculate next retry time
 */
export function calculateNextRetry(
  message: CommunicationMessage,
  retryLogic: RetryLogic
): Date | null {
  // GREEN phase: Simple exponential backoff
  if (message.retryCount >= retryLogic.maxRetries) {
    return null;
  }
  
  const delay = retryLogic.retryDelays[message.retryCount] || 
    Math.min(
      (retryLogic.retryDelays[0] || 60) * Math.pow(retryLogic.backoffMultiplier, message.retryCount),
      retryLogic.maxDelaySeconds
    );
  
  const nextRetry = new Date();
  nextRetry.setSeconds(nextRetry.getSeconds() + delay);
  return nextRetry;
}

/**
 * Check if message should be retried
 */
export function shouldRetry(message: CommunicationMessage, error?: string): boolean {
  // GREEN phase: Simple retry logic
  if (message.retryCount >= message.maxRetries) {
    return false;
  }
  
  // Don't retry certain error types
  const nonRetryableErrors = [
    'permanent_failure',
    'invalid_recipient',
    'compliance_violation',
    'blocked'
  ];
  
  if (error && nonRetryableErrors.some(pattern => error.toLowerCase().includes(pattern))) {
    return false;
  }
  
  return true;
}

// TODO: Channel-Specific Utilities

/**
 * Format email content with proper headers
 */
export function formatEmailContent(
  subject: string,
  content: string,
  metadata?: Record<string, any>
): { subject: string; htmlContent: string; textContent: string } {
  // GREEN phase: Basic email formatting
  const htmlContent = `
    <html>
      <body>
        <p>${content.replace(/\n/g, '<br>')}</p>
      </body>
    </html>
  `;
  
  const textContent = content;
  
  return { subject, htmlContent, textContent };
}

/**
 * Validate email address format
 */
export function validateEmailAddress(email: string): boolean {
  // GREEN phase: Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format SMS content (truncate if needed)
 */
export function formatSmsContent(content: string, metadata?: Record<string, any>): string {
  // GREEN phase: Basic SMS formatting with length limit
  const maxLength = 1600; // Standard SMS limit
  if (content.length <= maxLength) {
    return content;
  }
  
  return content.substring(0, maxLength - 3) + '...';
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // GREEN phase: Basic phone validation
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  const digitsOnly = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && digitsOnly.length >= 10;
}

/**
 * Prepare phone call script
 */
export function preparePhoneCallScript(
  content: string,
  metadata?: Record<string, any>
): { script: string; notes: string[] } {
  // GREEN phase: Basic script preparation
  const script = content.length > 500 ? content.substring(0, 497) + '...' : content;
  const notes = [
    'Speak clearly and slowly',
    'Verify customer identity',
    'Follow compliance guidelines'
  ];
  
  return { script, notes };
}

// TODO: Compliance and Preferences Utilities

/**
 * Check if current time is within allowed communication hours
 */
export function isWithinAllowedHours(
  preferences: CommunicationPreferences,
  channel: CommunicationChannel
): boolean {
  // GREEN phase: Basic time window checking
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  let quietHours;
  switch (channel) {
    case 'email':
      quietHours = preferences.email.quietHours;
      break;
    case 'sms':
      quietHours = preferences.sms.quietHours;
      break;
    case 'phone':
      quietHours = preferences.phone.quietHours;
      break;
  }
  
  if (!quietHours) {
    return true; // No restrictions
  }
  
  const [startHour, startMin] = quietHours.start.split(':').map(Number);
  const [endHour, endMin] = quietHours.end.split(':').map(Number);
  const startTime = (startHour || 0) * 60 + (startMin || 0);
  const endTime = (endHour || 0) * 60 + (endMin || 0);
  
  if (startTime <= endTime) {
    return currentTime < startTime || currentTime > endTime;
  } else {
    return currentTime > endTime && currentTime < startTime;
  }
}

/**
 * Calculate next allowed communication time
 */
export function getNextAllowedTime(
  preferences: CommunicationPreferences,
  channel: CommunicationChannel
): Date {
  // GREEN phase: Calculate next available time
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  let quietHours;
  switch (channel) {
    case 'email':
      quietHours = preferences.email.quietHours;
      break;
    case 'sms':
      quietHours = preferences.sms.quietHours;
      break;
    case 'phone':
      quietHours = preferences.phone.quietHours;
      break;
  }
  
  if (!quietHours) {
    return now; // No restrictions
  }
  
  const [endHour, endMin] = quietHours.end.split(':').map(Number);
  const nextAllowed = new Date(now);
  nextAllowed.setHours(endHour || 0, endMin || 0, 0, 0);
  
  if (nextAllowed <= now) {
    nextAllowed.setDate(nextAllowed.getDate() + 1);
  }
  
  return nextAllowed;
}

/**
 * Perform compliance check on communication content
 */
export async function performComplianceCheck(
  customerId: string,
  communicationId: string,
  channel: CommunicationChannel,
  content: string
): Promise<ComplianceCheck> {
  // GREEN phase: Basic compliance checking
  const now = new Date().toISOString();
  
  const checks = {
    tcpaCompliance: true, // Mock - would check consent, time restrictions
    doNotCall: true,      // Mock - would check DNC lists
    timeRestrictions: true, // Mock - would check allowed hours
    contentRestrictions: true, // Mock - would check prohibited content
  };
  
  const score = Object.values(checks).every(Boolean) ? 100 : 50;
  const passed = score >= 80;
  
  return {
    id: `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    communicationId,
    customerId,
    channel,
    content,
    checks,
    score,
    passed,
    warnings: passed ? [] : ['Mock compliance warning'],
    errors: passed ? [] : ['Mock compliance error'],
    checkedAt: now,
  };
}

/**
 * Filter content based on compliance rules
 */
export function filterContentForCompliance(
  content: string,
  channel: CommunicationChannel
): { filteredContent: string; violations: string[] } {
  // GREEN phase: Basic content filtering
  const prohibitedWords = ['lawsuit', 'legal action', 'arrest', 'wage garnishment'];
  const violations: string[] = [];
  let filteredContent = content;
  
  prohibitedWords.forEach(word => {
    if (content.toLowerCase().includes(word)) {
      violations.push(`Prohibited term: ${word}`);
      filteredContent = filteredContent.replace(new RegExp(word, 'gi'), '[REDACTED]');
    }
  });
  
  return { filteredContent, violations };
}

// TODO: Analytics and Reporting Utilities

/**
 * Calculate delivery statistics for messages
 */
export function calculateDeliveryStats(messages: CommunicationMessage[]): any {
  // GREEN phase: Basic statistics calculation
  const total = messages.length;
  const delivered = messages.filter(m => m.deliveryStatus === 'delivered').length;
  const failed = messages.filter(m => m.deliveryStatus === 'failed').length;
  const pending = messages.filter(m => m.deliveryStatus === 'pending').length;
  
  return {
    total,
    delivered,
    failed,
    pending,
    deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
  };
}

/**
 * Generate communication effectiveness report
 */
export function generateEffectivenessReport(messages: CommunicationMessage[]): any {
  // GREEN phase: Basic effectiveness report
  const stats = calculateDeliveryStats(messages);
  
  return {
    summary: stats,
    period: {
      start: new Date().toISOString(),
      end: new Date().toISOString(),
    },
  };
}

/**
 * Calculate cost analysis by channel and strategy
 */
export function calculateCostAnalysis(messages: CommunicationMessage[]): any {
  // GREEN phase: Basic cost analysis
  const totalCost = messages.reduce((sum, m) => sum + (m.cost || 0), 0);
  
  return {
    totalCost,
    averageCost: messages.length > 0 ? totalCost / messages.length : 0,
    byChannel: {
      email: { cost: 0, count: 0 },
      sms: { cost: 0, count: 0 },
      phone: { cost: 0, count: 0 },
    },
  };
}

// TODO: Provider Integration Utilities

/**
 * Test SendGrid connectivity
 */
export async function testSendGridConnection(apiKey: string): Promise<boolean> {
  // GREEN phase: Mock connection test
  console.log('Testing SendGrid connection with API key:', apiKey.substring(0, 4) + '...');
  return true;
}

/**
 * Test Twilio connectivity
 */
export async function testTwilioConnection(accountSid: string, authToken: string): Promise<boolean> {
  // GREEN phase: Mock connection test
  console.log('Testing Twilio connection with Account SID:', accountSid.substring(0, 4) + '...');
  return true;
}

/**
 * Parse provider webhook responses
 */
export function parseProviderWebhook(
  provider: 'sendgrid' | 'twilio',
  payload: any
): { messageId: string; status: DeliveryStatus; error?: string } {
  // GREEN phase: Basic webhook parsing
  const messageId = payload.message_id || payload.id || 'unknown';
  
  // Mock status determination
  let status: DeliveryStatus = 'delivered';
  if (payload.event === 'dropped' || payload.event === 'bounce' || payload.status === 'failed') {
    status = 'failed';
  } else if (payload.event === 'processed' || payload.status === 'queued') {
    status = 'pending';
  }
  
  return {
    messageId,
    status,
    error: payload.error || payload.reason,
  };
}

// TODO: Queue and Event Utilities

/**
 * Queue communication for processing
 */
export async function queueCommunication(
  message: CommunicationMessage,
  delay?: number
): Promise<void> {
  // GREEN phase: Mock queue implementation
  // In real implementation, this would use env.COMMUNICATION_EVENTS queue
  console.log('Queueing communication:', { 
    messageId: message.id, 
    channel: message.channel, 
    delay 
  });
}

/**
 * Log communication event to tracking
 */
export async function logCommunicationEvent(
  event: string,
  messageId: string,
  metadata?: Record<string, any>
): Promise<void> {
  // GREEN phase: Mock event logging
  // In real implementation, this would use env.COMMUNICATIONS_LOG bucket
  const logEntry: CommunicationEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: event as any,
    messageId,
    customerId: metadata?.customerId || 'unknown',
    channel: metadata?.channel || 'email',
    timestamp: new Date().toISOString(),
    data: metadata || {},
  };
  
  console.log('Logging communication event:', logEntry);
}

/**
 * Create delivery attempt record
 */
export function createDeliveryAttempt(
  messageId: string,
  attemptNumber: number,
  provider: string
): DeliveryAttempt {
  // GREEN phase: Create delivery attempt
  const now = new Date().toISOString();
  return {
    id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    messageId,
    attemptNumber,
    status: 'pending',
    provider: provider as any,
    startedAt: now,
  };
}

// TODO: Error Handling and Validation Utilities

/**
 * Validate communication request
 */
export function validateCommunicationRequest(request: any): { isValid: boolean; errors: string[] } {
  // GREEN phase: Basic request validation
  const errors: string[] = [];
  
  if (!request.customerId) {
    errors.push('Customer ID is required');
  }
  
  if (!request.channel || !['email', 'sms', 'phone'].includes(request.channel)) {
    errors.push('Valid channel (email, sms, phone) is required');
  }
  
  if (!request.strategy || !['reminder', 'negotiation', 'final_notice'].includes(request.strategy)) {
    errors.push('Valid strategy (reminder, negotiation, final_notice) is required');
  }
  
  if (request.channel === 'email' && !request.customizations?.subject) {
    errors.push('Email subject is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Handle and classify communication errors
 */
export function classifyError(error: any): {
  type: 'temporary' | 'permanent' | 'rate_limit' | 'compliance' | 'unknown';
  retryable: boolean;
  message: string;
} {
  // GREEN phase: Basic error classification
  const errorMessage = error?.message || String(error);
  const lowerError = errorMessage.toLowerCase();
  
  if (lowerError.includes('rate limit') || lowerError.includes('too many requests')) {
    return {
      type: 'rate_limit',
      retryable: true,
      message: errorMessage
    };
  }
  
  if (lowerError.includes('invalid recipient') || lowerError.includes('blocked') || 
      lowerError.includes('unsubscribed') || lowerError.includes('compliance')) {
    return {
      type: lowerError.includes('compliance') ? 'compliance' : 'permanent',
      retryable: false,
      message: errorMessage
    };
  }
  
  if (lowerError.includes('timeout') || lowerError.includes('network') || 
      lowerError.includes('temporary')) {
    return {
      type: 'temporary',
      retryable: true,
      message: errorMessage
    };
  }
  
  return {
    type: 'unknown',
    retryable: true,
    message: errorMessage
  };
}

/**
 * Sanitize communication content
 */
export function sanitizeContent(content: string, channel: CommunicationChannel): string {
  // GREEN phase: Basic content sanitization
  let sanitized = content.trim();
  
  // Remove potentially dangerous HTML for email
  if (channel === 'email') {
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
  }
  
  // Normalize line endings
  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  return sanitized;
}

// TODO: Multi-channel coordination utilities

/**
 * Coordinate multi-channel campaign execution
 */
export async function executeMultiChannelCampaign(
  campaign: any,
  customerData: any
): Promise<void> {
  // GREEN phase: Mock campaign execution
  console.log('Executing multi-channel campaign:', campaign.id, 'for customer:', customerData.id);
  
  // Mock processing each channel
  for (const channel of campaign.channels) {
    console.log('Processing channel:', channel);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing
  }
}

/**
 * Determine optimal next channel based on previous attempts
 */
export function determineNextChannel(
  previousAttempts: DeliveryAttempt[],
  preferences: CommunicationPreferences
): CommunicationChannel | null {
  // GREEN phase: Simple channel selection logic
  const attemptedChannels = previousAttempts.map(a => 
    a.provider === 'sendgrid' ? 'email' : 
    a.provider === 'twilio' ? 'sms' : 'phone'
  );
  
  const allChannels: CommunicationChannel[] = ['email', 'sms', 'phone'];
  
  for (const channel of allChannels) {
    if (!attemptedChannels.includes(channel)) {
      // Check if channel is enabled in preferences
      if (
        (channel === 'email' && preferences.email.enabled) ||
        (channel === 'sms' && preferences.sms.enabled) ||
        (channel === 'phone' && preferences.phone.enabled)
      ) {
        return channel;
      }
    }
  }
  
  return null; // All channels attempted or none enabled
}

// TODO: Delivery tracking utilities

/**
 * Track delivery status across all channels
 */
export async function trackDeliveryStatus(messageId: string): Promise<DeliveryTracking | null> {
  // GREEN phase: Mock delivery tracking
  const mockTracking: DeliveryTracking = {
    messageId,
    events: [],
    currentStatus: 'pending',
    attempts: [],
    cost: 0,
    lastUpdated: new Date().toISOString(),
  };
  
  return mockTracking;
}

/**
 * Update delivery tracking with new event
 */
export async function updateDeliveryTracking(
  messageId: string,
  event: CommunicationEvent
): Promise<void> {
  // GREEN phase: Mock tracking update
  console.log('Updating delivery tracking:', { messageId, eventId: event.id, type: event.type });
}

// TODO: Template management utilities

/**
 * Create new message template
 */
export async function createTemplate(template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<MessageTemplate> {
  // GREEN phase: Mock template creation
  const now = new Date().toISOString();
  const newTemplate: MessageTemplate = {
    ...template,
    id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
  
  console.log('Creating template:', newTemplate.id);
  return newTemplate;
}

/**
 * Update existing message template
 */
export async function updateTemplate(templateId: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate> {
  // GREEN phase: Mock template update
  const updatedTemplate: MessageTemplate = {
    id: templateId,
    name: updates.name || 'Updated Template',
    channel: updates.channel || 'email',
    strategy: updates.strategy || 'reminder',
    subject: updates.subject,
    content: updates.content || 'Updated content',
    variables: updates.variables || [],
    isActive: updates.isActive ?? true,
    createdAt: updates.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  console.log('Updating template:', templateId);
  return updatedTemplate;
}

/**
 * Delete message template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  // GREEN phase: Mock template deletion
  console.log('Deleting template:', templateId);
}
// Communication Service Interfaces
// Defines the contract for all communication operations

import { CommunicationChannel, CommunicationStrategy, DeliveryStatus } from '../shared/types';

export interface MessageTemplate {
  id: string;
  name: string;
  channel: CommunicationChannel;
  strategy: CommunicationStrategy;
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationRequest {
  customerId: string;
  invoiceNumber?: string;
  channel: CommunicationChannel;
  strategy: CommunicationStrategy;
  templateId?: string;
  customizations?: {
    subject?: string;
    content?: string;
    urgency?: 'low' | 'medium' | 'high';
    tone?: string;
  };
  scheduledFor?: string;
  metadata?: Record<string, any>;
}

export interface CommunicationMessage {
  id: string;
  customerId: string;
  invoiceNumber?: string;
  channel: CommunicationChannel;
  strategy: CommunicationStrategy;
  templateId?: string;
  subject?: string;
  content: string;
  deliveryStatus: DeliveryStatus;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  cost?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAttempt {
  id: string;
  messageId: string;
  attemptNumber: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  provider: 'sendgrid' | 'twilio' | 'twilio_voice';
  providerMessageId?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
  cost?: number;
}

export interface CommunicationPreferences {
  customerId: string;
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    quietHours?: {
      start: string; // HH:mm
      end: string;   // HH:mm
    };
  };
  sms: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    quietHours?: {
      start: string; // HH:mm
      end: string;   // HH:mm
    };
  };
  phone: {
    enabled: boolean;
    quietHours?: {
      start: string; // HH:mm
      end: string;   // HH:mm
    };
  };
  updatedAt: string;
}

export interface MultiChannelCampaign {
  id: string;
  name: string;
  description?: string;
  strategy: CommunicationStrategy;
  channels: CommunicationChannel[];
  rules: {
    email?: {
      delay?: number; // hours after initial
      conditions?: Record<string, any>;
    };
    sms?: {
      delay?: number; // hours after initial
      conditions?: Record<string, any>;
    };
    phone?: {
      delay?: number; // hours after initial
      conditions?: Record<string, any>;
    };
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationStats {
  total: number;
  pending: number;
  delivered: number;
  failed: number;
  byChannel: Record<CommunicationChannel, {
    total: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    averageCost: number;
  }>;
  byStrategy: Record<CommunicationStrategy, {
    total: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    averageCost: number;
  }>;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface ProviderConfig {
  sendgrid?: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
}

export interface RetryLogic {
  maxRetries: number;
  retryDelays: number[]; // in seconds
  backoffMultiplier: number;
  maxDelaySeconds: number;
  retryableErrors: string[];
}

export interface ComplianceCheck {
  id: string;
  communicationId: string;
  customerId: string;
  channel: CommunicationChannel;
  content: string;
  checks: {
    tcpaCompliance: boolean;
    doNotCall: boolean;
    timeRestrictions: boolean;
    contentRestrictions: boolean;
  };
  score: number; // 0-100
  passed: boolean;
  warnings?: string[];
  errors?: string[];
  checkedAt: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  providers: {
    sendgrid: 'available' | 'unavailable' | 'degraded';
    twilio: 'available' | 'unavailable' | 'degraded';
  };
  queueHealth: {
    communicationEvents: 'healthy' | 'backlog' | 'full';
    emailSending: 'healthy' | 'backlog' | 'full';
    smsSending: 'healthy' | 'backlog' | 'full';
    voiceCalls: 'healthy' | 'backlog' | 'full';
  };
  lastChecked: string;
}

// Raindrop-specific environment interfaces
export interface CommunicationServiceEnv {
  COMMUNICATION_EVENTS: any; // Queue
  COMMUNICATIONS_LOG: any;   // Bucket
  [key: string]: any;
}

export interface CommunicationEvent {
  id: string;
  type: 'message_sent' | 'message_delivered' | 'message_failed' | 'retry_attempted';
  messageId: string;
  customerId: string;
  channel: CommunicationChannel;
  timestamp: string;
  data: Record<string, any>;
}

export interface DeliveryTracking {
  messageId: string;
  events: CommunicationEvent[];
  currentStatus: DeliveryStatus;
  attempts: DeliveryAttempt[];
  cost: number;
  lastUpdated: string;
}
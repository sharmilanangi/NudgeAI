// Analytics Service Interfaces
// These interfaces define the data structures for analytics calculations

export interface AnalyticsData {
  recoveryRate: number;
  channelEffectiveness: ChannelEffectivenessData[];
  customerEngagement: CustomerEngagementData;
  performanceDashboard: PerformanceDashboardData;
}

export interface RecoveryRateData {
  totalInvoices: number;
  paidInvoices: number;
  partiallyPaidInvoices: number;
  writtenOffInvoices: number;
  rate: number;
  period: {
    start: string;
    end: string;
  };
}

export interface ChannelEffectivenessData {
  channel: 'email' | 'sms' | 'phone';
  totalSent: number;
  delivered: number;
  failed: number;
  responses: number;
  conversionRate: number;
  averageResponseTime: number; // in hours
  costPerConversion: number;
  period: {
    start: string;
    end: string;
  };
}

export interface CustomerEngagementData {
  totalCustomers: number;
  activeCustomers: number;
  engagedCustomers: number; // customers with at least one response
  averageEngagementScore: number;
  engagementBySegment: {
    highRisk: { count: number; engagementRate: number };
    mediumRisk: { count: number; engagementRate: number };
    lowRisk: { count: number; engagementRate: number };
  };
  communicationPreferences: {
    email: number;
    sms: number;
    phone: number;
    multiChannel: number;
  };
  period: {
    start: string;
    end: string;
  };
}

export interface PerformanceDashboardData {
  summary: {
    totalOutstanding: number;
    totalCollected: number;
    recoveryRate: number;
    averageDaysPastDue: number;
    communicationEffectiveness: number;
  };
  trends: {
    daily: Array<{
      date: string;
      amountCollected: number;
      communicationsSent: number;
      responsesReceived: number;
    }>;
    weekly: Array<{
      week: string;
      recoveryRate: number;
      customerEngagement: number;
    }>;
    monthly: Array<{
      month: string;
      totalInvoices: number;
      totalCollected: number;
      newCustomers: number;
    }>;
  };
  topPerformers: {
    channels: Array<{
      channel: string;
      conversionRate: number;
      totalConversions: number;
    }>;
    strategies: Array<{
      strategy: string;
      successRate: number;
      totalAttempts: number;
    }>;
  };
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    metric: string;
    threshold: number;
    currentValue: number;
    timestamp: string;
  }>;
}

export interface AnalyticsQuery {
  type: 'recovery_rate' | 'channel_effectiveness' | 'customer_engagement' | 'performance_dashboard';
  filters?: {
    startDate?: string;
    endDate?: string;
    customerSegment?: 'high_risk' | 'medium_risk' | 'low_risk' | 'all';
    channel?: 'email' | 'sms' | 'phone' | 'all';
    status?: 'pending' | 'paid' | 'partially_paid' | 'written_off' | 'all';
  };
  groupBy?: 'day' | 'week' | 'month';
}

export interface AnalyticsResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    queryExecutionTime: number;
    recordsProcessed: number;
    lastUpdated: string;
  };
}

// Database query result interfaces
export interface InvoiceAnalyticsRow {
  invoice_number: string;
  customer_id: string;
  amount: number;
  balance_due: number;
  status: string;
  days_past_due: number;
  issue_date: string;
  due_date: string;
  updated_at: string;
}

export interface CommunicationAnalyticsRow {
  id: string;
  customer_id: string;
  invoice_number?: string;
  channel: string;
  strategy: string;
  sent_at: string;
  delivery_status: string;
  response_received_at?: string;
  cost?: number;
}

export interface CustomerAnalyticsRow {
  customer_id: string;
  total_invoices: number;
  total_outstanding: number;
  max_days_past_due: number;
  communication_count: number;
  response_count: number;
  last_communication?: string;
  last_response?: string;
}
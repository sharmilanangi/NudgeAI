// Analytics Update Task Interfaces
// These interfaces define the data structures for scheduled analytics updates

export interface AnalyticsUpdateTaskConfig {
  schedule: {
    timezone: string;
    enabled: boolean;
  };
  retention: {
    dailyReports: number; // days to keep daily reports
    weeklyReports: number; // weeks to keep weekly reports  
    monthlyReports: number; // months to keep monthly reports
  };
  thresholds: {
    recoveryRateAlert: number;
    engagementAlert: number;
    costPerConversionAlert: number;
  };
}

export interface ScheduledAnalyticsUpdate {
  executionTime: number;
  scheduleType: 'daily' | 'weekly' | 'monthly';
  cronExpression: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  error?: string;
}

export interface DailyAnalyticsData {
  date: string;
  recoveryRate: number;
  totalInvoices: number;
  totalCollected: number;
  communicationsSent: number;
  responsesReceived: number;
  channelEffectiveness: {
    email: { sent: number; delivered: number; responses: number };
    sms: { sent: number; delivered: number; responses: number };
    phone: { sent: number; delivered: number; responses: number };
  };
  customerEngagement: {
    activeCustomers: number;
    engagedCustomers: number;
    averageEngagementScore: number;
  };
  performance: {
    averageDaysPastDue: number;
    totalOutstanding: number;
    collectionEfficiency: number;
  };
}

export interface WeeklyAnalyticsSummary {
  weekStart: string;
  weekEnd: string;
  dailyData: DailyAnalyticsData[];
  aggregatedMetrics: {
    totalRecoveryRate: number;
    totalCollected: number;
    totalCommunications: number;
    totalResponses: number;
    averageEngagementScore: number;
    weekOverWeekChange: number;
  };
  trends: {
    recoveryRateTrend: 'increasing' | 'decreasing' | 'stable';
    engagementTrend: 'increasing' | 'decreasing' | 'stable';
    collectionTrend: 'improving' | 'declining' | 'stable';
  };
}

export interface MonthlyAnalyticsReport {
  month: string;
  weeklySummaries: WeeklyAnalyticsSummary[];
  finalMetrics: {
    totalRecoveryRate: number;
    totalCollected: number;
    totalCommunications: number;
    totalResponses: number;
    newCustomers: number;
    churnedCustomers: number;
    customerRetentionRate: number;
    averageEngagementScore: number;
  };
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    category: 'recovery' | 'engagement' | 'performance' | 'cost';
    message: string;
    impact: 'high' | 'medium' | 'low';
    recommendation?: string;
  }>;
}

export interface AnalyticsUpdateResult {
  success: boolean;
  scheduleType: 'daily' | 'weekly' | 'monthly';
  executionTime: string;
  recordsProcessed: number;
  metricsCalculated: number;
  alertsGenerated: number;
  dashboardsUpdated: number;
  errors?: Array<{
    component: string;
    error: string;
    timestamp: string;
  }>;
  performance: {
    totalExecutionTime: number; // milliseconds
    dataProcessingTime: number;
    calculationTime: number;
    dashboardUpdateTime: number;
  };
}

export interface DashboardRefreshConfig {
  dashboards: Array<{
    name: string;
    type: 'executive' | 'operational' | 'analytical';
    refreshFrequency: 'realtime' | 'hourly' | 'daily';
    dataSources: string[];
    lastRefresh?: string;
    status: 'active' | 'inactive' | 'error';
  }>;
  caching: {
    enabled: boolean;
    ttl: number; // seconds
    invalidationRules: Array<{
      trigger: 'data_change' | 'schedule' | 'manual';
      dataSource: string;
    }>;
  };
}

export interface AnalyticsUpdateMetrics {
  taskExecutions: {
    daily: number;
    weekly: number;
    monthly: number;
    total: number;
  };
  performance: {
    averageExecutionTime: number;
    successRate: number;
    lastExecutionTime: string;
    lastSuccessTime: string;
    longestExecution: number;
    shortestExecution: number;
  };
  dataProcessing: {
    totalRecordsProcessed: number;
    averageRecordsPerExecution: number;
    peakRecordsProcessed: number;
    dataFreshness: number; // minutes since last update
  };
  errors: {
    totalErrors: number;
    errorRate: number;
    commonErrors: Array<{
      error: string;
      count: number;
      lastOccurred: string;
    }>;
  };
}

export interface PerformanceMetricCalculation {
  metricType: 'recovery_rate' | 'engagement_score' | 'cost_per_conversion' | 'collection_efficiency';
  calculationMethod: 'simple' | 'weighted' | 'rolling_average' | 'trend_analysis';
  parameters: {
    period: string;
    weights?: Record<string, number>;
    threshold?: number;
    comparisonPeriod?: string;
  };
  result: {
    value: number;
    trend: 'up' | 'down' | 'stable';
    confidence: number;
    lastCalculated: string;
  };
}

export interface AnalyticsAggregationResult {
  aggregationType: 'daily' | 'weekly' | 'monthly';
  period: {
    start: string;
    end: string;
  };
  sourceData: {
    invoices: number;
    communications: number;
    customers: number;
    payments: number;
  };
  aggregatedMetrics: {
    financial: Record<string, number>;
    operational: Record<string, number>;
    engagement: Record<string, number>;
  };
  quality: {
    completeness: number; // percentage of expected data
    accuracy: number; // confidence score
    timeliness: number; // data freshness score
  };
}
// AI Agent Service Interfaces
// Defines the contracts for AI operations, reasoning, and recommendations

export interface ConversationContext {
  customerId: string;
  invoiceNumber?: string;
  sessionId: string;
  conversationHistory: ConversationMessage[];
  customerProfile?: CustomerProfile;
  currentScenario: CollectionScenario;
}

export interface ConversationMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    model?: string;
    tokens?: number;
    reasoning?: string;
  };
}

export interface CustomerProfile {
  customerId: string;
  riskLevel: 'low' | 'medium' | 'high';
  preferredCommunicationChannel: 'email' | 'sms' | 'phone';
  communicationFrequency: 'low' | 'medium' | 'high';
  paymentHistory: PaymentHistoryMetrics;
  behavioralPatterns: BehavioralPatterns;
  personalizationData: PersonalizationData;
}

export interface PaymentHistoryMetrics {
  totalPayments: number;
  onTimePaymentRate: number;
  averagePaymentDelay: number;
  largestPaymentAmount: number;
  missedPayments: number;
  partialPayments: number;
}

export interface BehavioralPatterns {
  preferredContactTimes: string[];
  responseLatency: {
    average: number;
    min: number;
    max: number;
  };
  engagementLevel: 'low' | 'medium' | 'high';
  lastInteractionChannel: string;
  optimalContactFrequency: number;
}

export interface PersonalizationData {
  preferredTone: 'formal' | 'casual' | 'empathetic';
  languagePreferences: string[];
  sensitivityLevel: 'low' | 'medium' | 'high';
  negotiationStyle: 'cooperative' | 'firm' | 'flexible';
  customTriggers: string[];
}

export interface CollectionScenario {
  invoiceNumber: string;
  amount: number;
  daysPastDue: number;
  previousAttempts: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  complianceRequirements: ComplianceRequirement[];
  availableStrategies: CollectionStrategy[];
}

export interface ComplianceRequirement {
  type: 'tcpa' | 'fdcpa' | 'state_regulation';
  description: string;
  constraints: Record<string, any>;
  activeHours: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface CollectionStrategy {
  id: string;
  name: string;
  description: string;
  channels: ('email' | 'sms' | 'phone')[];
  conditions: StrategyCondition[];
  actions: StrategyAction[];
  expectedOutcome: StrategyOutcome;
}

export interface StrategyCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
  weight?: number;
}

export interface StrategyAction {
  type: 'send_communication' | 'schedule_followup' | 'escalate' | 'offer_payment_plan';
  parameters: Record<string, any>;
  delay?: number;
}

export interface StrategyOutcome {
  successProbability: number;
  expectedRevenue: number;
  complianceRisk: 'low' | 'medium' | 'high';
  customerImpact: 'positive' | 'neutral' | 'negative';
}

export interface NextActionRecommendation {
  action: 'send_reminder' | 'send_negotiation' | 'escalate' | 'offer_payment_plan' | 'schedule_call' | 'wait';
  channel: 'email' | 'sms' | 'phone';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timing: {
    executeAt: string;
    reason: string;
    complianceWindow: boolean;
  };
  content: {
    subject?: string;
    body: string;
    tone: string;
    personalizationLevel: number;
  };
  confidence: number;
  reasoning: {
    factors: string[];
    dataPoints: Record<string, any>;
    riskAssessment: string;
  };
  expectedOutcomes: {
    paymentProbability: number;
    responseProbability: number;
    complianceScore: number;
  };
}

export interface ContentGenerationRequest {
  type: 'reminder' | 'negotiation' | 'payment_plan_offer' | 'final_notice' | 'welcome';
  customerId: string;
  invoiceNumber?: string;
  channel: 'email' | 'sms' | 'phone';
  personalization: {
    tone: string;
    language: string;
    urgency: string;
    customVariables: Record<string, any>;
  };
  constraints: {
    maxLength?: number;
    complianceChecks: string[];
    brandGuidelines: string[];
    legalRequirements: string[];
  };
  context: {
    previousCommunications: ConversationMessage[];
    customerProfile: CustomerProfile;
    scenario: CollectionScenario;
  };
}

export interface ContentGenerationResponse {
  content: {
    subject?: string;
    body: string;
    personalizations: Record<string, string>;
    variations: ContentVariation[];
  };
  metadata: {
    model: string;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    processingTime: number;
    confidence: number;
  };
  quality: {
    relevanceScore: number;
    complianceScore: number;
    personalizationScore: number;
    clarityScore: number;
  };
  suggestions: ContentSuggestion[];
}

export interface ContentVariation {
  id: string;
  type: 'tone' | 'urgency' | 'length' | 'channel';
  content: string;
  expectedPerformance: number;
  targetAudience: string;
}

export interface ContentSuggestion {
  type: 'improvement' | 'alternative' | 'compliance';
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export interface StrategySelectionRequest {
  customerId: string;
  invoiceNumber: string;
  availableStrategies: CollectionStrategy[];
  context: {
    customerProfile: CustomerProfile;
    scenario: CollectionScenario;
    conversationHistory: ConversationMessage[];
    businessGoals: BusinessGoals;
    constraints: BusinessConstraints;
  };
}

export interface BusinessGoals {
  primaryGoal: 'maximize_recovery' | 'maintain_relationship' | 'minimize_costs' | 'compliance_first';
  secondaryGoals: string[];
  priorities: Record<string, number>;
  targetMetrics: {
    recoveryRate: number;
    customerSatisfaction: number;
    complianceScore: number;
    costEfficiency: number;
  };
}

export interface BusinessConstraints {
  maxAttempts: number;
  timeWindows: TimeWindow[];
  budgetLimits: {
    perCustomer: number;
    total: number;
  };
  complianceRequirements: ComplianceRequirement[];
  brandGuidelines: string[];
}

export interface TimeWindow {
  start: string;
  end: string;
  days: string[];
  timezone: string;
  purpose: string;
}

export interface StrategySelectionResponse {
  selectedStrategy: CollectionStrategy;
  reasoning: StrategyReasoning;
  alternatives: StrategyAlternative[];
  implementation: StrategyImplementation;
  monitoring: StrategyMonitoring;
}

export interface StrategyReasoning {
  selectionFactors: SelectionFactor[];
  scoreBreakdown: ScoreBreakdown;
  riskAssessment: RiskAssessment;
  expectedOutcomes: ExpectedOutcome[];
}

export interface SelectionFactor {
  factor: string;
  weight: number;
  score: number;
  impact: 'positive' | 'negative' | 'neutral';
  data: any;
}

export interface ScoreBreakdown {
  totalScore: number;
  categoryScores: Record<string, number>;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface RiskAssessment {
  complianceRisk: number;
  financialRisk: number;
  reputationalRisk: number;
  operationalRisk: number;
  overallRisk: 'low' | 'medium' | 'high';
}

export interface ExpectedOutcome {
  metric: string;
  expectedValue: number;
  confidence: number;
  timeframe: string;
}

export interface StrategyAlternative {
  strategy: CollectionStrategy;
  score: number;
  pros: string[];
  cons: string[];
  useCase: string;
}

export interface StrategyImplementation {
  steps: ImplementationStep[];
  requiredResources: string[];
  timeline: string;
  dependencies: string[];
  successCriteria: string[];
}

export interface ImplementationStep {
  id: string;
  description: string;
  type: 'action' | 'check' | 'approval';
  order: number;
  estimatedDuration: number;
  responsible: string;
}

export interface StrategyMonitoring {
  kpis: MonitoringKPI[];
  alerts: MonitoringAlert[];
  reporting: ReportingConfig;
}

export interface MonitoringKPI {
  name: string;
  metric: string;
  target: number;
  threshold: number;
  frequency: string;
}

export interface MonitoringAlert {
  condition: string;
  severity: 'info' | 'warning' | 'critical';
  recipients: string[];
  actions: string[];
}

export interface ReportingConfig {
  frequency: string;
  recipients: string[];
  format: string;
  metrics: string[];
}

export interface AIProcessingRequest {
  type: 'content_generation' | 'strategy_selection' | 'recommendation' | 'reasoning';
  payload: ContentGenerationRequest | StrategySelectionRequest | any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata: {
    requestId: string;
    userId?: string;
    timestamp: string;
    timeout: number;
  };
}

export interface AIProcessingResponse {
  success: boolean;
  requestId: string;
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    processingTime: number;
    model: string;
    tokens: number;
    confidence: number;
  };
}

// AI Model interfaces
export interface AIModelRequest {
  model: string;
  prompt: string;
  context?: any[];
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
}

export interface AIModelResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
  metadata?: any;
}

// Error types
export interface AIServiceError {
  code: string;
  message: string;
  type: 'validation' | 'model_error' | 'processing' | 'timeout' | 'compliance';
  details?: any;
  retryable: boolean;
  suggestedAction?: string;
}
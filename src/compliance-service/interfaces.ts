// Compliance Service Interfaces
// Define interfaces for TCPA and FDCPA compliance checking

export interface ComplianceCheckRequest {
  customerId: string;
  communicationId: string;
  content: string;
  channel: 'email' | 'sms' | 'phone';
  strategy: 'reminder' | 'negotiation' | 'final_notice';
  customerTimezone?: string;
  customerConsent?: {
    sms: boolean;
    email: boolean;
    phone: boolean;
    consentDate?: string;
    consentMethod?: string;
  };
  metadata?: {
    invoiceNumber?: string;
    amount?: number;
    daysPastDue?: number;
    previousCommunications?: number;
  };
}

export interface ComplianceCheckResult {
  compliant: boolean;
  violations: ComplianceViolation[];
  warnings: ComplianceWarning[];
  auditEntry: AuditEntry;
  recommendedActions?: string[];
  canProceed: boolean;
  nextAllowedTime?: Date;
}

export interface ComplianceViolation {
  type: 'TCPA_TIME_RESTRICTION' | 'FDCPA_DISCLOSURE_MISSING' | 'FDCPA_HARASSMENT' | 'TCPA_CONSENT_MISSING' | 'CONTENT_PROHIBITED';
  severity: 'high' | 'medium' | 'low';
  description: string;
  regulation: string;
  section?: string;
  suggestedFix?: string;
}

export interface ComplianceWarning {
  type: 'FREQUENCY_LIMIT' | 'CONTENT_RISK' | 'TIME_BOUNDARY' | 'CONSENT_EXPIRING';
  severity: 'low' | 'medium';
  description: string;
  recommendation?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  customerId: string;
  communicationId: string;
  checkType: string;
  result: 'PASS' | 'FAIL' | 'WARNING';
  violations: string[];
  warnings: string[];
  processingTimeMs: number;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface TcpaComplianceRule {
  callingHours: {
    start: number; // 8 (8 AM)
    end: number;   // 21 (9 PM)
  };
  maxDailyCalls: number;
  maxWeeklyCalls: number;
  maxDailyTexts: number;
  maxWeeklyTexts: number;
  consentRequired: boolean;
  consentExpirationDays: number;
  prohibitedContent: string[];
}

export interface FdcpaComplianceRule {
  requiredDisclosures: string[];
  prohibitedPractices: string[];
  maxDailyContacts: number;
  maxWeeklyContacts: number;
  callFrequencyRules: {
    minHoursBetweenCalls: number;
    minDaysBetweenThirdPartyContact: number;
  };
  requiredContentElements: {
    identityDisclosure: boolean;
    purposeDisclosure: boolean;
    debtValidationNotice: boolean;
    rightsDisclosure: boolean;
  };
}

export interface ComplianceRuleSet {
  tcpa: TcpaComplianceRule;
  fdcpa: FdcpaComplianceRule;
  lastUpdated: string;
  version: string;
}

export interface CustomerComplianceProfile {
  customerId: string;
  contactPreferences: {
    preferredChannel?: 'email' | 'sms' | 'phone';
    contactFrequency: 'low' | 'medium' | 'high';
    quietHours?: {
      start: string;
      end: string;
    };
  };
  consentHistory: ConsentRecord[];
  communicationHistory: CommunicationComplianceRecord[];
  violationHistory: ComplianceViolation[];
  riskScore: number; // 0-100
  lastReviewDate?: string;
}

export interface ConsentRecord {
  id: string;
  type: 'sms' | 'email' | 'phone';
  granted: boolean;
  timestamp: string;
  method: 'written' | 'electronic' | 'verbal';
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: string;
  revokedAt?: string;
}

export interface CommunicationComplianceRecord {
  id: string;
  timestamp: string;
  channel: 'email' | 'sms' | 'phone';
  strategy: 'reminder' | 'negotiation' | 'final_notice';
  compliant: boolean;
  violations: string[];
  warnings: string[];
  processingTimeMs: number;
}

export interface ComplianceAuditTrail {
  customerId: string;
  period: {
    start: string;
    end: string;
  };
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warnings: number;
  violations: ComplianceViolation[];
  averageProcessingTime: number;
  generatedAt: string;
}

export interface ComplianceQueueMessage {
  type: 'COMPLIANCE_CHECK';
  customerId: string;
  communicationId: string;
  content: string;
  channel: 'email' | 'sms' | 'phone';
  strategy: 'reminder' | 'negotiation' | 'final_notice';
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  metadata?: any;
}
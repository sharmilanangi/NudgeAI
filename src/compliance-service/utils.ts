// Compliance Service Utility Functions

import { 
  ComplianceCheckRequest, 
  ComplianceCheckResult, 
  ComplianceRuleSet,
  TcpaComplianceRule,
  FdcpaComplianceRule,
  CustomerComplianceProfile,
  AuditEntry,
  ComplianceViolation,
  ComplianceWarning
} from './interfaces';

/**
 * Check TCPA compliance for a communication request
 */
export function checkTcpaCompliance(
  request: ComplianceCheckRequest,
  customerProfile: CustomerComplianceProfile,
  rules: TcpaComplianceRule
): { violations: ComplianceViolation[]; warnings: ComplianceWarning[] } {
  const violations: ComplianceViolation[] = [];
  const warnings: ComplianceWarning[] = [];

  // Check consent
  if (rules.consentRequired) {
    const consent = customerProfile.consentHistory.find(
      c => c.type === request.channel && c.granted && !c.revokedAt
    );
    
    if (!consent) {
      violations.push({
        type: 'TCPA_CONSENT_MISSING',
        severity: 'high',
        description: `Missing required consent for ${request.channel} communication`,
        regulation: 'TCPA',
        section: '47 U.S.C. § 227',
        suggestedFix: 'Obtain explicit consent from customer before communication'
      });
    } else if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
      violations.push({
        type: 'TCPA_CONSENT_MISSING',
        severity: 'high',
        description: `Consent for ${request.channel} has expired`,
        regulation: 'TCPA',
        section: '47 U.S.C. § 227',
        suggestedFix: 'Renew consent from customer'
      });
    }
  }

  // Check calling hours
  const now = new Date();
  const currentHour = now.getHours();
  if (currentHour < rules.callingHours.start || currentHour > rules.callingHours.end) {
    violations.push({
      type: 'TCPA_TIME_RESTRICTION',
      severity: 'high',
      description: `Communication attempted outside allowed hours (${rules.callingHours.start}:00 - ${rules.callingHours.end}:00)`,
      regulation: 'TCPA',
      section: '47 C.F.R. § 64.1200',
      suggestedFix: `Wait until ${rules.callingHours.start}:00 to attempt communication`
    });
  }

  // Check frequency limits
  const today = new Date().toDateString();
  const thisWeek = getWeekStart(new Date());
  
  const todayComms = customerProfile.communicationHistory.filter(
    c => new Date(c.timestamp).toDateString() === today && c.channel === request.channel
  );
  
  const weekComms = customerProfile.communicationHistory.filter(
    c => new Date(c.timestamp) >= thisWeek && c.channel === request.channel
  );

  if (request.channel === 'sms' || request.channel === 'phone') {
    const dailyLimit = request.channel === 'sms' ? rules.maxDailyTexts : rules.maxDailyCalls;
    const weeklyLimit = request.channel === 'sms' ? rules.maxWeeklyTexts : rules.maxWeeklyCalls;

    if (todayComms.length >= dailyLimit) {
      violations.push({
        type: 'TCPA_CONSENT_MISSING',
        severity: 'medium',
        description: `Daily ${request.channel} limit exceeded (${todayComms.length}/${dailyLimit})`,
        regulation: 'TCPA',
        suggestedFix: 'Wait until tomorrow to send communication'
      });
    }

    if (weekComms.length >= weeklyLimit) {
      violations.push({
        type: 'TCPA_CONSENT_MISSING',
        severity: 'medium',
        description: `Weekly ${request.channel} limit exceeded (${weekComms.length}/${weeklyLimit})`,
        regulation: 'TCPA',
        suggestedFix: 'Wait until next week to send communication'
      });
    }
  }

  // Check prohibited content
  const hasProhibited = containsProhibitedContent(request.content, rules.prohibitedContent);
  if (hasProhibited) {
    violations.push({
      type: 'CONTENT_PROHIBITED',
      severity: 'high',
      description: 'Communication contains prohibited content',
      regulation: 'TCPA',
      section: '47 C.F.R. § 64.1200',
      suggestedFix: 'Remove prohibited content from communication'
    });
  }

  return { violations, warnings };
}

/**
 * Check FDCPA compliance for a communication request
 */
export function checkFdcpaCompliance(
  request: ComplianceCheckRequest,
  customerProfile: CustomerComplianceProfile,
  rules: FdcpaComplianceRule
): { violations: ComplianceViolation[]; warnings: ComplianceWarning[] } {
  const violations: ComplianceViolation[] = [];
  const warnings: ComplianceWarning[] = [];

  // Check required disclosures
  const disclosureValidation = validateRequiredDisclosures(request.content, rules.requiredDisclosures);
  if (disclosureValidation.missing.length > 0) {
    violations.push({
      type: 'FDCPA_DISCLOSURE_MISSING',
      severity: 'high',
      description: `Missing required FDCPA disclosures: ${disclosureValidation.missing.join(', ')}`,
      regulation: 'FDCPA',
      section: '15 U.S.C. § 1692e',
      suggestedFix: `Include required disclosures: ${disclosureValidation.missing.join(', ')}`
    });
  }

  // Check harassment patterns
  const today = new Date().toDateString();
  const todayComms = customerProfile.communicationHistory.filter(
    c => new Date(c.timestamp).toDateString() === today
  );

  if (todayComms.length >= rules.maxDailyContacts) {
    violations.push({
      type: 'FDCPA_HARASSMENT',
      severity: 'high',
      description: `Daily contact limit exceeded (${todayComms.length}/${rules.maxDailyContacts})`,
      regulation: 'FDCPA',
      section: '15 U.S.C. § 1692d',
      suggestedFix: 'Wait until tomorrow to attempt communication'
    });
  }

  // Check call frequency rules
  const lastCall = customerProfile.communicationHistory
    .filter(c => c.channel === 'phone')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  if (lastCall && request.channel === 'phone') {
    const hoursSinceLastCall = (new Date().getTime() - new Date(lastCall.timestamp).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastCall < rules.callFrequencyRules.minHoursBetweenCalls) {
      violations.push({
        type: 'FDCPA_HARASSMENT',
        severity: 'medium',
        description: `Insufficient time between calls (${hoursSinceLastCall.toFixed(1)} hours, minimum ${rules.callFrequencyRules.minHoursBetweenCalls})`,
        regulation: 'FDCPA',
        section: '15 U.S.C. § 1692d',
        suggestedFix: `Wait at least ${rules.callFrequencyRules.minHoursBetweenCalls - hoursSinceLastCall} more hours`
      });
    }
  }

  // Check prohibited practices
  const prohibitedPatterns = ['threaten violence', 'arrest without cause', 'misrepresent amount', 'false legal action'];
  const lowerContent = request.content.toLowerCase();
  
  for (const practice of prohibitedPatterns) {
    if (lowerContent.includes(practice)) {
      violations.push({
        type: 'FDCPA_HARASSMENT',
        severity: 'high',
        description: `Prohibited practice detected: ${practice}`,
        regulation: 'FDCPA',
        section: '15 U.S.C. § 1692e',
        suggestedFix: 'Remove prohibited language from communication'
      });
    }
  }

  return { violations, warnings };
}

/**
 * Validate communication content for prohibited terms and required disclosures
 */
export function validateContent(
  content: string,
  strategy: string,
  rules: ComplianceRuleSet
): { violations: ComplianceViolation[]; warnings: ComplianceWarning[] } {
  const violations: ComplianceViolation[] = [];
  const warnings: ComplianceWarning[] = [];

  // Check TCPA prohibited content
  const hasTcpaProhibited = containsProhibitedContent(content, rules.tcpa.prohibitedContent);
  if (hasTcpaProhibited) {
    violations.push({
      type: 'CONTENT_PROHIBITED',
      severity: 'high',
      description: 'Content contains prohibited terms',
      regulation: 'TCPA',
      section: '47 C.F.R. § 64.1200',
      suggestedFix: 'Remove prohibited terms from content'
    });
  }

  // Check FDCPA required disclosures
  const disclosureValidation = validateRequiredDisclosures(content, rules.fdcpa.requiredDisclosures);
  if (disclosureValidation.missing.length > 0) {
    violations.push({
      type: 'FDCPA_DISCLOSURE_MISSING',
      severity: 'high',
      description: `Missing required disclosures: ${disclosureValidation.missing.join(', ')}`,
      regulation: 'FDCPA',
      section: '15 U.S.C. § 1692e',
      suggestedFix: 'Add missing required disclosures'
    });
  }

  // Content risk analysis
  const riskTerms = ['urgent', 'immediate action', 'final notice', 'legal consequences'];
  const foundRisks = riskTerms.filter(term => content.toLowerCase().includes(term));
  
  if (foundRisks.length > 0) {
    warnings.push({
      type: 'CONTENT_RISK',
      severity: 'medium',
      description: `Content contains potentially concerning terms: ${foundRisks.join(', ')}`,
      recommendation: 'Review content for compliance with harassment regulations'
    });
  }

  return { violations, warnings };
}

/**
 * Check if communication time is within allowed hours
 */
export function isWithinAllowedHours(
  timestamp: Date,
  timezone: string,
  rules: TcpaComplianceRule
): boolean {
  try {
    // For simplicity, we'll use the local time of the timestamp
    // In production, you'd want to properly handle timezone conversion
    const hour = timestamp.getHours();
    
    return hour >= rules.callingHours.start && hour <= rules.callingHours.end;
  } catch (error) {
    // If timezone parsing fails, default to checking local time
    const hour = timestamp.getHours();
    return hour >= rules.callingHours.start && hour <= rules.callingHours.end;
  }
}

/**
 * Check communication frequency limits
 */
export function checkFrequencyLimits(
  customerId: string,
  channel: string,
  customerProfile: CustomerComplianceProfile,
  rules: ComplianceRuleSet
): { violations: ComplianceViolation[]; warnings: ComplianceWarning[] } {
  const violations: ComplianceViolation[] = [];
  const warnings: ComplianceWarning[] = [];

  const today = new Date().toDateString();
  const thisWeek = getWeekStart(new Date());
  
  const todayComms = customerProfile.communicationHistory.filter(
    c => new Date(c.timestamp).toDateString() === today && c.channel === channel
  );
  
  const weekComms = customerProfile.communicationHistory.filter(
    c => new Date(c.timestamp) >= thisWeek && c.channel === channel
  );

  // Check daily limits
  if (channel === 'sms') {
    if (todayComms.length >= rules.tcpa.maxDailyTexts) {
      violations.push({
        type: 'TCPA_CONSENT_MISSING',
        severity: 'medium',
        description: `Daily SMS limit exceeded (${todayComms.length}/${rules.tcpa.maxDailyTexts})`,
        regulation: 'TCPA',
        suggestedFix: 'Wait until tomorrow to send SMS'
      });
    }
    
    if (weekComms.length >= rules.tcpa.maxWeeklyTexts) {
      violations.push({
        type: 'TCPA_CONSENT_MISSING',
        severity: 'medium',
        description: `Weekly SMS limit exceeded (${weekComms.length}/${rules.tcpa.maxWeeklyTexts})`,
        regulation: 'TCPA',
        suggestedFix: 'Wait until next week to send SMS'
      });
    }
  } else if (channel === 'phone') {
    if (todayComms.length >= rules.tcpa.maxDailyCalls) {
      violations.push({
        type: 'TCPA_CONSENT_MISSING',
        severity: 'medium',
        description: `Daily call limit exceeded (${todayComms.length}/${rules.tcpa.maxDailyCalls})`,
        regulation: 'TCPA',
        suggestedFix: 'Wait until tomorrow to make call'
      });
    }
    
    if (weekComms.length >= rules.tcpa.maxWeeklyCalls) {
      violations.push({
        type: 'TCPA_CONSENT_MISSING',
        severity: 'medium',
        description: `Weekly call limit exceeded (${weekComms.length}/${rules.tcpa.maxWeeklyCalls})`,
        regulation: 'TCPA',
        suggestedFix: 'Wait until next week to make call'
      });
    }
  }

  // Check FDCPA contact limits
  const allTodayComms = customerProfile.communicationHistory.filter(
    c => new Date(c.timestamp).toDateString() === today
  );
  
  if (allTodayComms.length >= rules.fdcpa.maxDailyContacts) {
    violations.push({
      type: 'FDCPA_HARASSMENT',
      severity: 'high',
      description: `Daily contact limit exceeded (${allTodayComms.length}/${rules.fdcpa.maxDailyContacts})`,
      regulation: 'FDCPA',
      section: '15 U.S.C. § 1692d',
      suggestedFix: 'Wait until tomorrow for any communication'
    });
  }

  // Add frequency warnings approaching limits
  if (channel === 'sms' && todayComms.length >= rules.tcpa.maxDailyTexts * 0.8) {
    warnings.push({
      type: 'FREQUENCY_LIMIT',
      severity: 'medium',
      description: `Approaching daily SMS limit (${todayComms.length}/${rules.tcpa.maxDailyTexts})`,
      recommendation: 'Consider spacing out communications'
    });
  }

  return { violations, warnings };
}

/**
 * Verify customer consent for the communication channel
 */
export function verifyConsent(
  request: ComplianceCheckRequest,
  customerProfile: CustomerComplianceProfile,
  rules: TcpaComplianceRule
): { violations: ComplianceViolation[]; warnings: ComplianceWarning[] } {
  const violations: ComplianceViolation[] = [];
  const warnings: ComplianceWarning[] = [];

  if (!rules.consentRequired) {
    return { violations, warnings };
  }

  // Find current consent for the channel
  const consent = customerProfile.consentHistory.find(
    c => c.type === request.channel && c.granted && !c.revokedAt
  );

  if (!consent) {
    violations.push({
      type: 'TCPA_CONSENT_MISSING',
      severity: 'high',
      description: `No valid consent found for ${request.channel} communication`,
      regulation: 'TCPA',
      section: '47 U.S.C. § 227',
      suggestedFix: 'Obtain explicit consent from customer'
    });
    return { violations, warnings };
  }

  // Check if consent is expired
  if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
    violations.push({
      type: 'TCPA_CONSENT_MISSING',
      severity: 'high',
      description: `Consent for ${request.channel} expired on ${consent.expiresAt}`,
      regulation: 'TCPA',
      section: '47 U.S.C. § 227',
      suggestedFix: 'Renew consent from customer'
    });
    return { violations, warnings };
  }

  // Check if consent is expiring soon
  if (consent.expiresAt) {
    const daysUntilExpiry = Math.ceil((new Date(consent.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 30) {
      warnings.push({
        type: 'CONSENT_EXPIRING',
        severity: 'medium',
        description: `Consent for ${request.channel} expires in ${daysUntilExpiry} days`,
        recommendation: 'Plan to renew consent before expiration'
      });
    }
  }

  // Check consent method meets requirements
  if (request.channel === 'phone' && consent.method === 'verbal' && !consent.ipAddress) {
    warnings.push({
      type: 'CONSENT_EXPIRING',
      severity: 'low',
      description: 'Verbal consent lacks proper documentation',
      recommendation: 'Document verbal consent with additional verification'
    });
  }

  return { violations, warnings };
}

/**
 * Create an audit entry for compliance checking
 */
export function createAuditEntry(
  request: ComplianceCheckRequest,
  result: ComplianceCheckResult,
  processingTimeMs: number
): AuditEntry {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    customerId: request.customerId,
    communicationId: request.communicationId,
    checkType: `${request.channel.toUpperCase()}_COMPLIANCE`,
    result: result.violations.length > 0 ? 'FAIL' : (result.warnings.length > 0 ? 'WARNING' : 'PASS'),
    violations: result.violations.map(v => `${v.type}: ${v.description}`),
    warnings: result.warnings.map(w => `${w.type}: ${w.description}`),
    processingTimeMs
  };
}

/**
 * Load compliance rules from configuration
 */
export function loadComplianceRules(version?: string): ComplianceRuleSet {
  // Default compliance rules for TCPA and FDCPA
  const defaultRules: ComplianceRuleSet = {
    tcpa: {
      callingHours: {
        start: 8,  // 8 AM
        end: 21    // 9 PM
      },
      maxDailyCalls: 3,
      maxWeeklyCalls: 7,
      maxDailyTexts: 5,
      maxWeeklyTexts: 14,
      consentRequired: true,
      consentExpirationDays: 730, // 2 years
      prohibitedContent: ['threat', 'harassment', 'abuse', 'violence']
    },
    fdcpa: {
      requiredDisclosures: [
        'This is an attempt to collect a debt',
        'Name of creditor',
        'Amount of debt',
        'Right to dispute the debt'
      ],
      prohibitedPractices: [
        'violence',
        'arrest threat',
        'misrepresentation',
        'false legal action'
      ],
      maxDailyContacts: 7,
      maxWeeklyContacts: 21,
      callFrequencyRules: {
        minHoursBetweenCalls: 2,
        minDaysBetweenThirdPartyContact: 7
      },
      requiredContentElements: {
        identityDisclosure: true,
        purposeDisclosure: true,
        debtValidationNotice: true,
        rightsDisclosure: true
      }
    },
    lastUpdated: new Date().toISOString(),
    version: version || '1.0.0'
  };

  return defaultRules;
}

/**
 * Get customer compliance profile from database
 */
export async function getCustomerComplianceProfile(
  customerId: string
): Promise<CustomerComplianceProfile> {
  // In a real implementation, this would query the database
  // For now, return a default profile
  return {
    customerId,
    contactPreferences: {
      contactFrequency: 'medium'
    },
    consentHistory: [],
    communicationHistory: [],
    violationHistory: [],
    riskScore: 0
  };
}

/**
 * Update customer compliance profile with new communication record
 */
export async function updateCustomerComplianceProfile(
  customerId: string,
  communicationRecord: any
): Promise<void> {
  // In a real implementation, this would update the database
  // For now, this is a no-op that would be implemented with actual DB logic
  console.log(`Updating compliance profile for customer ${customerId}`, communicationRecord);
}

/**
 * Calculate compliance risk score for a customer
 */
export function calculateRiskScore(
  customerProfile: CustomerComplianceProfile
): number {
  let riskScore = 0;

  // Base score from violation history
  riskScore += customerProfile.violationHistory.length * 10;

  // Weight violations by severity
  customerProfile.violationHistory.forEach(violation => {
    if (violation.severity === 'high') riskScore += 20;
    else if (violation.severity === 'medium') riskScore += 10;
    else if (violation.severity === 'low') riskScore += 5;
  });

  // Consider communication frequency
  const recentCommunications = customerProfile.communicationHistory.filter(
    c => new Date(c.timestamp).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
  );
  
  if (recentCommunications.length > 20) riskScore += 15;
  else if (recentCommunications.length > 10) riskScore += 5;

  // Consent status
  const hasExpiredConsent = customerProfile.consentHistory.some(
    c => c.granted && c.expiresAt && new Date(c.expiresAt) < new Date()
  );
  if (hasExpiredConsent) riskScore += 25;

  // Cap at 100
  return Math.min(riskScore, 100);
}

/**
 * Generate compliance report for a time period
 */
export function generateComplianceReport(
  customerId: string,
  startDate: string,
  endDate: string
): any {
  // In a real implementation, this would query the database and generate a comprehensive report
  return {
    customerId,
    period: { start: startDate, end: endDate },
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    warnings: 0,
    violations: [],
    averageProcessingTime: 0,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Check if content contains prohibited language or terms
 */
export function containsProhibitedContent(
  content: string,
  prohibitedTerms: string[]
): boolean {
  const lowerContent = content.toLowerCase();
  return prohibitedTerms.some(term => lowerContent.includes(term.toLowerCase()));
}

/**
 * Validate required FDCPA disclosures are present
 */
export function validateRequiredDisclosures(
  content: string,
  requiredDisclosures: string[]
): { present: string[]; missing: string[] } {
  const lowerContent = content.toLowerCase();
  const present: string[] = [];
  const missing: string[] = [];

  for (const disclosure of requiredDisclosures) {
    // Simple keyword matching for disclosure presence
    if (lowerContent.includes(disclosure.toLowerCase())) {
      present.push(disclosure);
    } else {
      missing.push(disclosure);
    }
  }

  return { present, missing };
}

/**
 * Get next allowed communication time based on TCPA rules
 */
export function getNextAllowedTime(
  customerId: string,
  channel: string,
  timezone: string,
  customerProfile: CustomerComplianceProfile,
  rules: TcpaComplianceRule
): Date {
  const now = new Date();
  let nextAllowed = new Date(now);

  // Check if we're outside calling hours
  const currentHour = now.getHours();
  if (currentHour < rules.callingHours.start) {
    // Before calling hours - set to start time today
    nextAllowed.setHours(rules.callingHours.start, 0, 0, 0);
  } else if (currentHour > rules.callingHours.end) {
    // After calling hours - set to start time tomorrow
    nextAllowed.setDate(nextAllowed.getDate() + 1);
    nextAllowed.setHours(rules.callingHours.start, 0, 0, 0);
  }

  // Check daily limits
  const today = now.toDateString();
  const todayComms = customerProfile.communicationHistory.filter(
    c => new Date(c.timestamp).toDateString() === today && c.channel === channel
  );

  const dailyLimit = channel === 'sms' ? rules.maxDailyTexts : rules.maxDailyCalls;
  if (todayComms.length >= dailyLimit) {
    // Move to tomorrow during calling hours
    nextAllowed.setDate(nextAllowed.getDate() + 1);
    nextAllowed.setHours(rules.callingHours.start, 0, 0, 0);
  }

  // Check weekly limits
  const thisWeek = getWeekStart(now);
  const weekComms = customerProfile.communicationHistory.filter(
    c => new Date(c.timestamp) >= thisWeek && c.channel === channel
  );

  const weeklyLimit = channel === 'sms' ? rules.maxWeeklyTexts : rules.maxWeeklyCalls;
  if (weekComms.length >= weeklyLimit) {
    // Move to next week
    const nextWeek = new Date(thisWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(rules.callingHours.start, 0, 0, 0);
    nextAllowed = nextWeek;
  }

  return nextAllowed;
}

// Helper function to get start of week (Sunday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}
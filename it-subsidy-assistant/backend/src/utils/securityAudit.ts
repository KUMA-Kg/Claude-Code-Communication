import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';
import crypto from 'crypto';
import { getEnv } from '@/config/environment';

const env = getEnv();
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Security audit logging system for compliance and monitoring
 */

export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  
  // Authorization events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_VIOLATION = 'PERMISSION_VIOLATION',
  
  // Data events
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  DATA_DELETION = 'DATA_DELETION',
  DATA_EXPORT = 'DATA_EXPORT',
  
  // Security events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  MALWARE_DETECTED = 'MALWARE_DETECTED',
  
  // Administrative events
  USER_CREATED = 'USER_CREATED',
  USER_MODIFIED = 'USER_MODIFIED',
  USER_DELETED = 'USER_DELETED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED'
}

export enum SecurityEventSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export interface SecurityEvent {
  id?: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  result: 'SUCCESS' | 'FAILURE';
  details?: any;
  timestamp: Date;
  hash?: string;
}

/**
 * Log security event to database and monitoring systems
 */
export async function logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'hash'>) {
  try {
    const timestamp = new Date();
    const eventId = crypto.randomUUID();
    
    // Create event hash for integrity verification
    const eventData = {
      ...event,
      id: eventId,
      timestamp: timestamp.toISOString()
    };
    
    const hash = createEventHash(eventData);
    
    const securityEvent: SecurityEvent = {
      ...eventData,
      timestamp,
      hash
    };

    // Log to database
    const { error } = await supabase
      .from('security_audit_logs')
      .insert({
        id: eventId,
        event_type: event.eventType,
        severity: event.severity,
        user_id: event.userId,
        user_email: event.userEmail,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        resource: event.resource,
        action: event.action,
        result: event.result,
        details: event.details,
        hash,
        created_at: timestamp
      });

    if (error) {
      logger.error('Failed to log security event to database', { error, event });
    }

    // Log to application logger
    const logLevel = getLogLevel(event.severity);
    logger[logLevel]('Security Event', securityEvent);

    // Send alerts for critical events
    if (event.severity === SecurityEventSeverity.CRITICAL) {
      await sendSecurityAlert(securityEvent);
    }

    // Check for patterns that might indicate attacks
    await analyzeSecurityPatterns(event);

  } catch (error) {
    logger.error('Error in security audit logging', { error, event });
  }
}

/**
 * Create hash of event for integrity verification
 */
function createEventHash(event: any): string {
  const content = JSON.stringify({
    ...event,
    hash: undefined // Exclude hash from hash calculation
  });
  
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

/**
 * Verify event integrity
 */
export async function verifyEventIntegrity(eventId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('security_audit_logs')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error || !data) {
      return false;
    }

    const storedHash = data.hash;
    const recalculatedHash = createEventHash({
      ...data,
      hash: undefined,
      created_at: undefined
    });

    return storedHash === recalculatedHash;
  } catch (error) {
    logger.error('Error verifying event integrity', { error, eventId });
    return false;
  }
}

/**
 * Get log level based on severity
 */
function getLogLevel(severity: SecurityEventSeverity): string {
  switch (severity) {
    case SecurityEventSeverity.INFO:
      return 'info';
    case SecurityEventSeverity.WARNING:
      return 'warn';
    case SecurityEventSeverity.ERROR:
    case SecurityEventSeverity.CRITICAL:
      return 'error';
    default:
      return 'info';
  }
}

/**
 * Send security alert for critical events
 */
async function sendSecurityAlert(event: SecurityEvent) {
  // In production, integrate with alerting service (PagerDuty, Slack, etc.)
  logger.error('🚨 SECURITY ALERT 🚨', {
    eventType: event.eventType,
    severity: event.severity,
    userId: event.userId,
    resource: event.resource,
    details: event.details
  });
  
  // TODO: Implement actual alert sending
  // Example: Send to Slack, email, SMS, etc.
}

/**
 * Analyze security patterns for potential attacks
 */
async function analyzeSecurityPatterns(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'hash'>) {
  if (!event.userId && !event.ipAddress) return;

  const timeWindow = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes
  
  // Count recent security events
  const { data: recentEvents, error } = await supabase
    .from('security_audit_logs')
    .select('id, event_type')
    .gte('created_at', timeWindow.toISOString())
    .or(`user_id.eq.${event.userId},ip_address.eq.${event.ipAddress}`);

  if (error || !recentEvents) return;

  // Define suspicious patterns
  const suspiciousPatterns = [
    {
      name: 'Brute Force Attack',
      condition: () => {
        const loginFailures = recentEvents.filter(
          e => e.event_type === SecurityEventType.LOGIN_FAILURE
        ).length;
        return loginFailures > 10;
      }
    },
    {
      name: 'Permission Scanning',
      condition: () => {
        const accessDenied = recentEvents.filter(
          e => e.event_type === SecurityEventType.ACCESS_DENIED
        ).length;
        return accessDenied > 20;
      }
    },
    {
      name: 'Data Exfiltration Attempt',
      condition: () => {
        const dataExports = recentEvents.filter(
          e => e.event_type === SecurityEventType.DATA_EXPORT
        ).length;
        return dataExports > 5;
      }
    }
  ];

  // Check for suspicious patterns
  for (const pattern of suspiciousPatterns) {
    if (pattern.condition()) {
      await logSecurityEvent({
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecurityEventSeverity.CRITICAL,
        userId: event.userId,
        ipAddress: event.ipAddress,
        result: 'FAILURE',
        details: {
          pattern: pattern.name,
          recentEventCount: recentEvents.length,
          originalEvent: event
        }
      });
    }
  }
}

/**
 * Get security audit report
 */
export async function getSecurityAuditReport(
  startDate: Date,
  endDate: Date,
  filters?: {
    userId?: string;
    eventType?: SecurityEventType;
    severity?: SecurityEventSeverity;
  }
) {
  try {
    let query = supabase
      .from('security_audit_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType);
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Generate summary statistics
    const summary = {
      totalEvents: data?.length || 0,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      topUsers: [] as Array<{ userId: string; count: number }>,
      topResources: [] as Array<{ resource: string; count: number }>
    };

    if (data) {
      // Count by type
      data.forEach(event => {
        summary.byType[event.event_type] = (summary.byType[event.event_type] || 0) + 1;
        summary.bySeverity[event.severity] = (summary.bySeverity[event.severity] || 0) + 1;
      });

      // Top users by event count
      const userCounts = new Map<string, number>();
      data.forEach(event => {
        if (event.user_id) {
          userCounts.set(event.user_id, (userCounts.get(event.user_id) || 0) + 1);
        }
      });
      summary.topUsers = Array.from(userCounts.entries())
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top resources
      const resourceCounts = new Map<string, number>();
      data.forEach(event => {
        if (event.resource) {
          resourceCounts.set(event.resource, (resourceCounts.get(event.resource) || 0) + 1);
        }
      });
      summary.topResources = Array.from(resourceCounts.entries())
        .map(([resource, count]) => ({ resource, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    return {
      events: data,
      summary,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };

  } catch (error) {
    logger.error('Error generating security audit report', { error });
    throw error;
  }
}

/**
 * Compliance report for GDPR, SOC2, etc.
 */
export async function generateComplianceReport(
  complianceType: 'GDPR' | 'SOC2' | 'ISO27001',
  startDate: Date,
  endDate: Date
) {
  const relevantEvents = {
    GDPR: [
      SecurityEventType.DATA_ACCESS,
      SecurityEventType.DATA_MODIFICATION,
      SecurityEventType.DATA_DELETION,
      SecurityEventType.DATA_EXPORT,
      SecurityEventType.USER_CREATED,
      SecurityEventType.USER_DELETED
    ],
    SOC2: [
      SecurityEventType.LOGIN_SUCCESS,
      SecurityEventType.LOGIN_FAILURE,
      SecurityEventType.ACCESS_GRANTED,
      SecurityEventType.ACCESS_DENIED,
      SecurityEventType.SYSTEM_CONFIG_CHANGED
    ],
    ISO27001: Object.values(SecurityEventType)
  };

  const events = relevantEvents[complianceType];
  const reports = [];

  for (const eventType of events) {
    const report = await getSecurityAuditReport(startDate, endDate, {
      eventType: eventType as SecurityEventType
    });
    reports.push({
      eventType,
      ...report.summary
    });
  }

  return {
    complianceType,
    period: { start: startDate, end: endDate },
    reports,
    generatedAt: new Date().toISOString()
  };
}
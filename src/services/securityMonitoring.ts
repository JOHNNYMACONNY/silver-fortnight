 

import { AUTH_CONSTANTS } from '../utils/constants';
import { SecurityEvent, ErrorSeverity, SecurityEventType } from '../types/security';
import { logger } from '@utils/logging/logger';

export class SecurityMonitoringService {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = AUTH_CONSTANTS.MONITORING.MAX_STORED_EVENTS;
  private readonly SUSPICIOUS_THRESHOLD = AUTH_CONSTANTS.MONITORING.SUSPICIOUS_THRESHOLD;
  private readonly ANALYSIS_WINDOW = AUTH_CONSTANTS.MONITORING.ANALYSIS_WINDOW;

  /**
   * Logs a security event with enriched metadata
   */
  async logEvent(event: Omit<SecurityEvent, 'ip' | 'userAgent' | 'timestamp'>): Promise<void> {
    try {
      // Add IP address
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();
      
      const enrichedEvent: SecurityEvent = {
        ...event,
        ip,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      };

      // Store locally with size limit
      this.events.unshift(enrichedEvent);
      if (this.events.length > this.MAX_EVENTS) {
        this.events.pop();
      }

      // Send to monitoring service in production
      await this.sendToMonitoring(enrichedEvent);
      
      // Analyze for suspicious patterns
      await this.analyzeSuspiciousPatterns(enrichedEvent);
    } catch (error) {
      logger.error('Failed to log security event:', 'SERVICE', {}, error as Error);
    }
  }

  /**
   * Sends event to external monitoring service
   */
  private async sendToMonitoring(event: SecurityEvent): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      try {
        // In production, send to your monitoring service
        // Example using a hypothetical monitoring service:
        // await monitoringService.logSecurityEvent(event);
        
        logger.debug('Security Event:', 'SERVICE', {
          type: event.type,
          severity: event.severity,
          timestamp: new Date(event.timestamp).toISOString(),
          details: this.sanitizeEventDetails(event)
        });
      } catch (error) {
        logger.error('Failed to send to monitoring service:', 'SERVICE', {}, error as Error);
      }
    }
  }

  /**
   * Analyzes events for suspicious patterns
   */
  private async analyzeSuspiciousPatterns(newEvent: SecurityEvent): Promise<void> {
    const now = Date.now();
    const relevantEvents = this.events.filter(event => 
      event.ip === newEvent.ip &&
      event.timestamp > now - this.ANALYSIS_WINDOW
    );

    // Check frequency of events from same IP
    if (relevantEvents.length >= this.SUSPICIOUS_THRESHOLD) {
      await this.logEvent({
        type: 'suspicious',
        severity: 'high',
        details: {
          reason: 'High frequency of events from same IP',
          eventCount: relevantEvents.length,
          timeWindowMs: this.ANALYSIS_WINDOW,
          events: this.sanitizeEventDetails(relevantEvents)
        }
      });
    }

    // Check for rapid failed login attempts
    const failedLogins = relevantEvents.filter(event =>
      event.type === 'auth' &&
      event.details?.success === false
    );

    if (failedLogins.length >= 3) {
      await this.logEvent({
        type: 'suspicious',
        severity: 'high',
        details: {
          reason: 'Multiple failed login attempts',
          failureCount: failedLogins.length,
          timeWindowMs: this.ANALYSIS_WINDOW
        }
      });
    }
  }

  /**
   * Sanitizes event details for logging
   */
  private sanitizeEventDetails(events: SecurityEvent | SecurityEvent[]): Record<string, any> {
    const sanitizeEvent = (event: SecurityEvent) => {
      const { details, ...sanitized } = event;
      return {
        ...sanitized,
        details: this.redactSensitiveInfo(details)
      };
    };

    return Array.isArray(events)
      ? events.map(sanitizeEvent)
      : sanitizeEvent(events);
  }

  /**
   * Redacts sensitive information from event details
   */
  private redactSensitiveInfo(details: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential'];
    const redacted = { ...details };

    for (const key of Object.keys(redacted)) {
      if (sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
        redacted[key] = this.redactSensitiveInfo(redacted[key]);
      }
    }

    return redacted;
  }

  /**
   * Gets recent security events with optional filtering
   */
  getRecentEvents(options: {
    type?: SecurityEventType;
    severity?: ErrorSeverity;
    limit?: number;
    startTime?: number;
    endTime?: number;
  } = {}): SecurityEvent[] {
    let filteredEvents = [...this.events];

    if (options.type) {
      filteredEvents = filteredEvents.filter(event => event.type === options.type);
    }

    if (options.severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === options.severity);
    }

    if (options.startTime) {
      filteredEvents = filteredEvents.filter(event => event.timestamp >= options.startTime!);
    }

    if (options.endTime) {
      filteredEvents = filteredEvents.filter(event => event.timestamp <= options.endTime!);
    }

    return filteredEvents.slice(0, options.limit || this.MAX_EVENTS);
  }

  /**
   * Clears all stored events
   */
  clearEvents(): void {
    this.events = [];
  }
}

export const securityMonitor = new SecurityMonitoringService();

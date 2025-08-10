import { SecurityMonitoringService } from '../securityMonitoring';
import { SecurityEvent } from '../../types/security';
import { AUTH_CONSTANTS } from '../../utils/constants';

describe('SecurityMonitoringService', () => {
  let monitor: SecurityMonitoringService;
  const mockIp = '192.168.1.1';
  const mockUserAgent = 'test-agent';

  // Mock fetch for IP lookup
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ip: mockIp })
    })
  ) as jest.Mock;

  // Mock navigator.userAgent
  Object.defineProperty(navigator, 'userAgent', {
    value: mockUserAgent,
    configurable: true
  });

  beforeEach(() => {
    monitor = new SecurityMonitoringService();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('event logging', () => {
    it('enriches events with metadata', async () => {
      const event: Omit<SecurityEvent, 'ip' | 'userAgent' | 'timestamp'> = {
        type: 'auth',
        severity: 'medium',
        details: { action: 'login' }
      };

      await monitor.logEvent(event);

      const events = monitor.getRecentEvents();
      expect(events[0]).toMatchObject({
        ...event,
        ip: mockIp,
        userAgent: mockUserAgent,
        timestamp: expect.any(Number)
      });
    });

    it('maintains maximum event limit', async () => {
      const maxEvents = AUTH_CONSTANTS.MONITORING.MAX_STORED_EVENTS;
      
      // Log more events than the limit
      for (let i = 0; i < maxEvents + 10; i++) {
        await monitor.logEvent({
          type: 'auth',
          severity: 'low',
          details: { id: i }
        });
      }

      const events = monitor.getRecentEvents();
      expect(events.length).toBe(maxEvents);
      expect(events[0].details.id).toBe(maxEvents + 9); // Most recent event
    });
  });

  describe('suspicious pattern detection', () => {
    it('detects high frequency events from same IP', async () => {
      const suspiciousEvents: SecurityEvent[] = [];
      jest.spyOn(monitor, 'logEvent').mockImplementation(async (event) => {
        if (event.type === 'suspicious') {
          suspiciousEvents.push(event as SecurityEvent);
        }
      });

      // Generate events from same IP
      for (let i = 0; i < AUTH_CONSTANTS.MONITORING.SUSPICIOUS_THRESHOLD + 1; i++) {
        await monitor.logEvent({
          type: 'auth',
          severity: 'low',
          details: { attempt: i }
        });
      }

      expect(suspiciousEvents.length).toBeGreaterThan(0);
      expect(suspiciousEvents[0]).toMatchObject({
        type: 'suspicious',
        severity: 'high',
        details: {
          reason: expect.stringContaining('High frequency')
        }
      });
    });

    it('detects multiple failed login attempts', async () => {
      const suspiciousEvents: SecurityEvent[] = [];
      jest.spyOn(monitor, 'logEvent').mockImplementation(async (event) => {
        if (event.type === 'suspicious') {
          suspiciousEvents.push(event as SecurityEvent);
        }
      });

      // Generate failed login events
      for (let i = 0; i < 3; i++) {
        await monitor.logEvent({
          type: 'auth',
          severity: 'medium',
          details: { success: false }
        });
      }

      expect(suspiciousEvents.length).toBeGreaterThan(0);
      expect(suspiciousEvents[0]).toMatchObject({
        type: 'suspicious',
        severity: 'high',
        details: {
          reason: expect.stringContaining('Multiple failed login attempts')
        }
      });
    });
  });

  describe('event filtering', () => {
    beforeEach(async () => {
      // Set up test events
      await monitor.logEvent({
        type: 'auth',
        severity: 'low',
        details: { action: 'login' }
      });
      await monitor.logEvent({
        type: 'token',
        severity: 'high',
        details: { action: 'validate' }
      });
      await monitor.logEvent({
        type: 'suspicious',
        severity: 'high',
        details: { action: 'detect' }
      });
    });

    it('filters events by type', () => {
      const events = monitor.getRecentEvents({ type: 'token' });
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('token');
    });

    it('filters events by severity', () => {
      const events = monitor.getRecentEvents({ severity: 'high' });
      expect(events.length).toBe(2);
      events.forEach(event => expect(event.severity).toBe('high'));
    });

    it('filters events by time range', () => {
      const now = Date.now();
      const events = monitor.getRecentEvents({
        startTime: now - 1000,
        endTime: now + 1000
      });
      expect(events.length).toBe(3);
    });

    it('combines multiple filters', () => {
      const events = monitor.getRecentEvents({
        type: 'suspicious',
        severity: 'high'
      });
      expect(events.length).toBe(1);
      expect(events[0]).toMatchObject({
        type: 'suspicious',
        severity: 'high'
      });
    });
  });

  describe('sensitive data handling', () => {
    it('redacts sensitive information', async () => {
      await monitor.logEvent({
        type: 'auth',
        severity: 'medium',
        details: {
          password: 'secret123',
          token: 'jwt-token',
          user: {
            apiKey: '12345',
            name: 'John'
          }
        }
      });

      const events = monitor.getRecentEvents();
      expect(events[0].details).toMatchObject({
        password: '[REDACTED]',
        token: '[REDACTED]',
        user: {
          apiKey: '[REDACTED]',
          name: 'John'
        }
      });
    });
  });

  describe('error handling', () => {
    it('handles IP lookup failures', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await monitor.logEvent({
        type: 'auth',
        severity: 'low',
        details: { action: 'test' }
      });

      const events = monitor.getRecentEvents();
      expect(events.length).toBe(1);
      expect(events[0].ip).toBeUndefined();
    });

    it('continues monitoring after errors', async () => {
      // First call fails
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'))
        .mockImplementation(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ip: mockIp })
        }));

      await monitor.logEvent({
        type: 'auth',
        severity: 'low',
        details: { id: 1 }
      });

      await monitor.logEvent({
        type: 'auth',
        severity: 'low',
        details: { id: 2 }
      });

      const events = monitor.getRecentEvents();
      expect(events.length).toBe(2);
      expect(events[0].ip).toBe(mockIp);
    });
  });
});

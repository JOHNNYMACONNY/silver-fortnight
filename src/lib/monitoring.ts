import { logEvent } from 'firebase/analytics';
import { getAnalytics } from './firebase';

interface AIRequestMetrics {
  requestType: 'challenge' | 'description' | 'requirements';
  tokensUsed: number;
  responseTime: number;
  success: boolean;
  errorType?: string;
}

interface RateLimitMetrics {
  currentRequests: number;
  timeWindow: number;
  isThrottled: boolean;
}

class AIMonitoring {
  private static instance: AIMonitoring;
  private requestCounts: Map<string, number> = new Map();
  private lastResetTime: number = Date.now();
  private readonly WINDOW_SIZE = 60000; // 1 minute
  private readonly MAX_REQUESTS = 8; // Conservative limit

  private constructor() {
    this.resetCountsPeriodically();
  }

  static getInstance(): AIMonitoring {
    if (!AIMonitoring.instance) {
      AIMonitoring.instance = new AIMonitoring();
    }
    return AIMonitoring.instance;
  }

  private resetCountsPeriodically() {
    setInterval(() => {
      const now = Date.now();
      if (now - this.lastResetTime >= this.WINDOW_SIZE) {
        this.requestCounts.clear();
        this.lastResetTime = now;
      }
    }, this.WINDOW_SIZE);
  }

  async trackRequest(metrics: AIRequestMetrics): Promise<void> {
    try {
      const analytics = getAnalytics();
      
      // Log basic metrics
      logEvent(analytics, 'ai_request', {
        request_type: metrics.requestType,
        tokens_used: metrics.tokensUsed,
        response_time: metrics.responseTime,
        success: metrics.success
      });

      // Track rate limiting
      const windowKey = Math.floor(Date.now() / this.WINDOW_SIZE);
      const currentCount = (this.requestCounts.get(windowKey.toString()) || 0) + 1;
      this.requestCounts.set(windowKey.toString(), currentCount);

      // Log rate limit metrics
      logEvent(analytics, 'ai_rate_limit', {
        current_requests: currentCount,
        max_requests: this.MAX_REQUESTS,
        is_throttled: currentCount >= this.MAX_REQUESTS
      });

      // Log errors if any
      if (!metrics.success && metrics.errorType) {
        logEvent(analytics, 'ai_error', {
          error_type: metrics.errorType,
          request_type: metrics.requestType
        });
        
        console.error('AI Request Error:', {
          type: metrics.errorType,
          requestType: metrics.requestType,
          tokensUsed: metrics.tokensUsed
        });
      }
    } catch (error) {
      console.error('Error tracking AI metrics:', error);
    }
  }

  getRateLimitMetrics(): RateLimitMetrics {
    const currentWindow = Math.floor(Date.now() / this.WINDOW_SIZE);
    const currentRequests = this.requestCounts.get(currentWindow.toString()) || 0;

    return {
      currentRequests,
      timeWindow: this.WINDOW_SIZE,
      isThrottled: currentRequests >= this.MAX_REQUESTS
    };
  }

  // Get current token usage for monitoring
  async getCurrentTokenUsage(): Promise<{daily: number, monthly: number}> {
    try {
      const analytics = getAnalytics();
      // Implement token tracking logic here
      return {
        daily: 0, // Implement actual tracking
        monthly: 0 // Implement actual tracking
      };
    } catch (error) {
      console.error('Error getting token usage:', error);
      return { daily: 0, monthly: 0 };
    }
  }

  // Check if we should throttle requests
  shouldThrottleRequest(): boolean {
    const metrics = this.getRateLimitMetrics();
    return metrics.isThrottled;
  }

  // Get performance metrics
  async getPerformanceMetrics(): Promise<{
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
  }> {
    try {
      const analytics = getAnalytics();
      // Implement performance metrics calculation
      return {
        averageResponseTime: 0,
        successRate: 0,
        errorRate: 0
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {
        averageResponseTime: 0,
        successRate: 0,
        errorRate: 0
      };
    }
  }
}

// Export singleton instance
export const aiMonitoring = AIMonitoring.getInstance();

// Middleware for tracking AI requests
export async function trackAIRequest<T>(
  requestType: AIRequestMetrics['requestType'],
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  let success = false;
  let errorType = undefined;
  let tokensUsed = 0; // This would need to be calculated based on the actual request

  try {
    // Check rate limiting before proceeding
    if (aiMonitoring.shouldThrottleRequest()) {
      throw new Error('Rate limit exceeded');
    }

    const result = await operation();
    success = true;
    return result;
  } catch (error) {
    success = false;
    errorType = error.message;
    throw error;
  } finally {
    const responseTime = Date.now() - startTime;
    await aiMonitoring.trackRequest({
      requestType,
      tokensUsed,
      responseTime,
      success,
      errorType
    });
  }
}

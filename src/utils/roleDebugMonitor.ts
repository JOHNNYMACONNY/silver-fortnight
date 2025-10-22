import { roleMonitor } from './roleOperationsMonitor';
import { logTransaction } from './transactionLogging';
import type { ConsoleLog, NetworkLog } from '../types/mcp';

interface BrowserLog {
  type: 'console' | 'network';
  level: 'info' | 'error' | 'warning';
  message: string;
  timestamp: number;
  details?: any;
}

class RoleDebugMonitor {
  private static instance: RoleDebugMonitor;
  private browserLogs: BrowserLog[] = [];
  private isMonitoringBrowser: boolean = false;
  private monitoringIntervals: { [key: string]: NodeJS.Timeout } = {};

  private constructor() {}

  static getInstance(): RoleDebugMonitor {
    if (!RoleDebugMonitor.instance) {
      RoleDebugMonitor.instance = new RoleDebugMonitor();
    }
    return RoleDebugMonitor.instance;
  }

  async startComprehensiveMonitoring(collaborationId: string): Promise<void> {
    // Start role operations monitoring
    roleMonitor.startMonitoring(collaborationId);

    // Start browser monitoring if not already active
    if (!this.isMonitoringBrowser) {
      await this.startBrowserMonitoring(collaborationId);
    }

    logTransaction({
      operation: 'start_comprehensive_monitoring',
      timestamp: Date.now(),
      details: { collaborationId },
      status: 'started'
    });

    // Set up periodic monitoring
    this.monitoringIntervals[collaborationId] = setInterval(async () => {
      await this.checkMonitoring(collaborationId);
    }, 30000); // Check every 30 seconds
  }

  private async startBrowserMonitoring(collaborationId: string): Promise<void> {
    this.isMonitoringBrowser = true;

    try {
      // Monitor console errors
      const consoleErrors = await this.useMCPTool('getConsoleErrors');
      this.handleConsoleError(consoleErrors, collaborationId);

      // Monitor network errors
      const networkErrors = await this.useMCPTool('getNetworkErrors');
      this.handleNetworkError(networkErrors, collaborationId);

      // Monitor network logs
      const networkLogs = await this.useMCPTool('getNetworkLogs');
      this.handleNetworkLog(networkLogs, collaborationId);

    } catch (error) {
      console.error('Failed to start browser monitoring:', error);
      this.isMonitoringBrowser = false;
    }
  }

  private async useMCPTool(toolName: string): Promise<any> {
    try {
      // This is a placeholder for the actual MCP tool invocation
      // The real implementation would use the MCP system's tool execution mechanism
      return Promise.resolve({}); // Mock response
    } catch (error) {
      console.error(`Failed to use MCP tool ${toolName}:`, error);
      throw error;
    }
  }

  private handleConsoleError(error: ConsoleLog, collaborationId: string): void {
    this.browserLogs.push({
      type: 'console',
      level: 'error',
      message: error.message,
      timestamp: Date.now(),
      details: error
    });

    logTransaction({
      operation: 'console_error',
      timestamp: Date.now(),
      details: { collaborationId, error },
      status: 'failed',
      error: error.message
    });
  }

  private handleNetworkError(error: NetworkLog, collaborationId: string): void {
    if (error.request?.url?.includes(collaborationId)) {
      this.browserLogs.push({
        type: 'network',
        level: 'error',
        message: error.message || `Network error: ${error.request?.url || 'unknown URL'}`,
        timestamp: error.timestamp || Date.now(),
        details: {
          url: error.request?.url,
          method: error.request?.method,
          error: error.error
        }
      });

      logTransaction({
        operation: 'network_error',
        timestamp: Date.now(),
        details: {
          collaborationId,
          url: error.request?.url,
          method: error.request?.method,
          error: error.error
        },
        status: 'failed',
        error: error.message || 'Network error occurred'
      });
    }
  }

  private handleNetworkLog(log: NetworkLog, collaborationId: string): void {
    if (log.request?.url?.includes('firestore') && log.request?.url?.includes(collaborationId)) {
      this.browserLogs.push({
        type: 'network',
        level: 'info',
        message: `Firestore Operation: ${log.request.method} ${log.request.url}`,
        timestamp: log.timestamp || Date.now(),
        details: log
      });
    }
  }

  private async checkMonitoring(collaborationId: string): Promise<void> {
    const operations = roleMonitor.getOperationHistory(collaborationId);
    const pendingOps = operations.filter(op => 
      op.status === 'started' && 
      Date.now() - op.timestamp > 30000
    );

    if (pendingOps.length > 0) {
      logTransaction({
        operation: 'monitoring_check',
        timestamp: Date.now(),
        details: {
          collaborationId,
          pendingOperations: pendingOps.length
        },
        status: 'failed',
        error: `Found ${pendingOps.length} operations pending for >30s`
      });
    }
  }

  stopComprehensiveMonitoring(collaborationId: string): void {
    roleMonitor.stopMonitoring(collaborationId);
    
    const interval = this.monitoringIntervals[collaborationId];
    if (interval) {
      clearInterval(interval);
      delete this.monitoringIntervals[collaborationId];
    }

    this.isMonitoringBrowser = false;
    this.browserLogs = [];

    logTransaction({
      operation: 'stop_comprehensive_monitoring',
      timestamp: Date.now(),
      details: { collaborationId },
      status: 'completed'
    });
  }

  getOperationHistory(collaborationId: string): { operations: any[]; logs: BrowserLog[] } {
    const operations = roleMonitor.getOperationHistory(collaborationId);
    const relevantLogs = this.browserLogs.filter(log => 
      (log.details?.url && log.details.url.includes(collaborationId)) ||
      (log.message && log.message.includes(collaborationId))
    );

    return {
      operations,
      logs: relevantLogs
    };
  }

  verifyCollaborationHealth(collaborationId: string): {
    healthy: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const { operations, logs } = this.getOperationHistory(collaborationId);

    // Check for failed operations
    const failedOps = operations.filter(op => op.status === 'failed');
    if (failedOps.length > 0) {
      issues.push(`Found ${failedOps.length} failed role operations`);
    }

    // Check for network errors
    const networkErrors = logs.filter(log => 
      log.type === 'network' && log.level === 'error'
    );
    if (networkErrors.length > 0) {
      issues.push(`Found ${networkErrors.length} network errors`);
    }

    // Check for consistency
    const consistencyIssues = this.checkDataConsistency(operations);
    if (consistencyIssues.length > 0) {
      issues.push(...consistencyIssues);
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }

  private checkDataConsistency(operations: any[]): string[] {
    const issues: string[] = [];

    // Check for missing responses
    const pendingOps = operations.filter(op => 
      op.status === 'started' && 
      Date.now() - op.timestamp > 30000
    );
    if (pendingOps.length > 0) {
      issues.push(`Found ${pendingOps.length} operations pending for >30s`);
    }

    // Check for duplicate role assignments
    const roleAssignments = new Map<string, string>();
    operations.forEach(op => {
      if (op.data?.participantId) {
        const { roleId, participantId } = op.data;
        if (roleAssignments.has(roleId) && roleAssignments.get(roleId) !== participantId) {
          issues.push(`Role ${roleId} has conflicting participant assignments`);
        }
        roleAssignments.set(roleId, participantId);
      }
    });

    return issues;
  }
}

export const roleDebugMonitor = RoleDebugMonitor.getInstance();
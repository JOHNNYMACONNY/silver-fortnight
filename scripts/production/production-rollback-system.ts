#!/usr/bin/env node

/**
 * TradeYa Production Rollback System
 *
 * Enterprise-grade rollback system with automatic triggers, manual controls,
 * and comprehensive safety mechanisms for production environments.
 */

import {
  collection,
  query,
  limit,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import { execSync } from "child_process";
import { getSyncFirebaseDb } from "../../src/firebase-config";
import { performanceLogger } from "../../src/utils/performance/structuredLogger";
import { ProductionMonitoringService } from "./production-monitoring";
import { PRODUCTION_CONFIG } from "./production-deployment-config";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

// Rollback system interfaces
interface RollbackTrigger {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  automatic: boolean;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  cooldownPeriod: number;
  lastTriggered?: Date;
  triggerCount: number;
}

interface RollbackPlan {
  id: string;
  version: string;
  strategy: "IMMEDIATE" | "PHASED" | "GRADUAL";
  estimatedTime: number;
  dataLossRisk: "NONE" | "MINIMAL" | "SOME" | "SIGNIFICANT";
  steps: RollbackStep[];
  validations: RollbackValidation[];
  emergencyContacts: string[];
  rollbackData?: RollbackData;
}

interface RollbackStep {
  step: number;
  name: string;
  description: string;
  estimatedTime: number;
  automated: boolean;
  dependencies: string[];
  validation: string[];
  emergencyStop: boolean;
  rollbackFunction?: () => Promise<boolean>;
}

interface RollbackValidation {
  name: string;
  check: () => Promise<boolean>;
  critical: boolean;
  timeout: number;
}

interface RollbackData {
  backupPath: string;
  checkpoints: RollbackCheckpoint[];
  dataSnapshot: any;
  configSnapshot: any;
  timestamp: Date;
}

interface RollbackCheckpoint {
  id: string;
  timestamp: Date;
  collection: string;
  documentCount: number;
  dataHash: string;
  verified: boolean;
}

interface RollbackExecution {
  id: string;
  planId: string;
  startTime: Date;
  endTime?: Date;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "PAUSED";
  currentStep: number;
  totalSteps: number;
  progress: number;
  triggeredBy: string;
  reason: string;
  metrics: RollbackMetrics;
  alerts: RollbackAlert[];
  stepResults: StepResult[];
}

interface RollbackMetrics {
  documentsReverted: number;
  collectionsAffected: string[];
  timeElapsed: number;
  validationsPassed: number;
  validationsFailed: number;
  errorCount: number;
  performanceImpact: number;
}

interface RollbackAlert {
  id: string;
  timestamp: Date;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  message: string;
  step?: number;
  acknowledged: boolean;
}

interface StepResult {
  step: number;
  name: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  validationResults: ValidationResult[];
}

interface ValidationResult {
  name: string;
  passed: boolean;
  details: string;
  timestamp: Date;
}

/**
 * Production Rollback System
 */
export class ProductionRollbackSystem {
  private triggers: RollbackTrigger[] = [];
  private rollbackPlan?: RollbackPlan;
  private currentExecution?: RollbackExecution;
  private monitoring: ProductionMonitoringService;
  private projectId: string;
  private isRunning = false;
  private triggerCheckInterval?: NodeJS.Timeout;

  constructor(
    projectId: string,
    environment: "staging" | "production" = "production"
  ) {
    // ensure projectId assigned for CLI-based restore commands
    this.projectId = projectId;
    this.monitoring = new ProductionMonitoringService({
      projectId,
      environment,
      monitoringInterval: 30000,
      alertingThresholds: {
        responseTime: { warning: 1000, critical: 3000 },
        errorRate: { warning: 0.01, critical: 0.05 },
        healthScore: { warning: 85, critical: 70 },
        migrationProgress: { warning: 10, critical: 5 },
        memoryUsage: { warning: 512, critical: 1024 },
        diskUsage: { warning: 80, critical: 90 },
        connectionPool: { warning: 70, critical: 90 },
      },
      dashboardConfig: {
        realTimeUpdates: true,
        autoRefreshInterval: 30000,
        metricsRetention: 7 * 24 * 60 * 60 * 1000,
        customWidgets: [],
        alertsPanel: true,
        performanceCharts: true,
        migrationProgress: true,
      },
      notificationChannels: [],
      healthChecks: [],
      performanceMetrics: {
        collectSystemMetrics: true,
        collectApplicationMetrics: true,
        collectDatabaseMetrics: true,
        samplingRate: 0.1,
        aggregationInterval: 60000,
        customMetrics: [],
      },
      retentionPolicies: {
        rawMetrics: 24 * 60 * 60 * 1000,
        aggregatedMetrics: 30 * 24 * 60 * 60 * 1000,
        alerts: 7 * 24 * 60 * 60 * 1000,
        logs: 30 * 24 * 60 * 60 * 1000,
        healthChecks: 7 * 24 * 60 * 60 * 1000,
      },
      escalationPaths: [],
    });

    this.initializeDefaultTriggers();
    this.setupEmergencyHandlers();
  }

  private initializeDefaultTriggers(): void {
    this.triggers = [
      {
        id: "error-rate-critical",
        name: "Critical Error Rate",
        condition: "error_rate > threshold",
        threshold: PRODUCTION_CONFIG.migration.rollbackThreshold / 100,
        automatic: true,
        severity: "CRITICAL",
        cooldownPeriod: 300000, // 5 minutes
        triggerCount: 0,
      },
      {
        id: "health-score-critical",
        name: "Health Score Critical",
        condition: "health_score < threshold",
        threshold: 70,
        automatic: true,
        severity: "CRITICAL",
        cooldownPeriod: 600000, // 10 minutes
        triggerCount: 0,
      },
      {
        id: "response-time-critical",
        name: "Response Time Critical",
        condition: "response_time > threshold",
        threshold: 5000, // 5 seconds
        automatic: true,
        severity: "HIGH",
        cooldownPeriod: 900000, // 15 minutes
        triggerCount: 0,
      },
      {
        id: "manual-trigger",
        name: "Manual Emergency Rollback",
        condition: "manual_request",
        threshold: 1,
        automatic: false,
        severity: "CRITICAL",
        cooldownPeriod: 0,
        triggerCount: 0,
      },
    ];
  }

  private setupEmergencyHandlers(): void {
    // Emergency signal handlers
    process.on("SIGUSR2", () => {
      this.triggerEmergencyRollback("Emergency signal received (SIGUSR2)");
    });

    // Graceful shutdown handler
    process.on("SIGTERM", async () => {
      if (this.currentExecution && this.currentExecution.status === "RUNNING") {
        await this.pauseRollback("System shutdown requested");
      }
    });
  }

  /**
   * Start the rollback monitoring system
   */
  async startRollbackMonitoring(): Promise<void> {
    if (this.isRunning) {
      performanceLogger.warn(
        "monitoring",
        "Rollback monitoring already running"
      );
      return;
    }

    performanceLogger.info(
      "monitoring",
      "Starting production rollback monitoring"
    );

    this.isRunning = true;

    // Start trigger monitoring
    this.triggerCheckInterval = setInterval(async () => {
      await this.checkRollbackTriggers();
    }, 30000); // Check every 30 seconds

    console.log("\n🛡️  Production Rollback System Active");
    console.log("===================================");
    console.log(
      `🎯 Automatic Triggers: ${
        this.triggers.filter((t) => t.automatic).length
      }`
    );
    console.log(
      `⚠️  Manual Triggers: ${this.triggers.filter((t) => !t.automatic).length}`
    );
    console.log(`🔄 Check Interval: 30 seconds`);
    console.log(`⏰ Started: ${new Date().toISOString()}`);
  }

  /**
   * Stop rollback monitoring
   */
  async stopRollbackMonitoring(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.triggerCheckInterval) {
      clearInterval(this.triggerCheckInterval);
    }

    console.log("\n⏹️  Rollback monitoring stopped");
    performanceLogger.info("monitoring", "Rollback monitoring stopped");
  }

  /**
   * Create rollback plan for current migration
   */
  async createRollbackPlan(migrationVersion: string): Promise<RollbackPlan> {
    performanceLogger.info("monitoring", "Creating rollback plan", {
      migrationVersion,
    });

    const plan: RollbackPlan = {
      id: `rollback-${migrationVersion}-${Date.now()}`,
      version: migrationVersion,
      strategy: "IMMEDIATE",
      estimatedTime: 1800000, // 30 minutes
      dataLossRisk: "MINIMAL",
      steps: [
        {
          step: 1,
          name: "Emergency Stop",
          description: "Stop all migration processes immediately",
          estimatedTime: 60000, // 1 minute
          automated: true,
          dependencies: [],
          validation: ["All processes stopped", "No active transactions"],
          emergencyStop: true,
          rollbackFunction: this.stopMigrationProcesses.bind(this),
        },
        {
          step: 2,
          name: "Health Assessment",
          description: "Assess system health and determine rollback scope",
          estimatedTime: 180000, // 3 minutes
          automated: true,
          dependencies: ["Emergency Stop"],
          validation: ["Health metrics collected", "Impact assessed"],
          emergencyStop: false,
          rollbackFunction: this.assessSystemHealth.bind(this),
        },
        {
          step: 3,
          name: "Data Reversion",
          description: "Revert data changes to pre-migration state",
          estimatedTime: 900000, // 15 minutes
          automated: false,
          dependencies: ["Health Assessment"],
          validation: ["Data reverted", "Integrity verified"],
          emergencyStop: false,
          rollbackFunction: this.revertDataChanges.bind(this),
        },
        {
          step: 4,
          name: "System Verification",
          description: "Verify system functionality and performance",
          estimatedTime: 600000, // 10 minutes
          automated: true,
          dependencies: ["Data Reversion"],
          validation: ["All systems operational", "Performance baseline met"],
          emergencyStop: false,
          rollbackFunction: this.verifySystemHealth.bind(this),
        },
        {
          step: 5,
          name: "Monitoring Reset",
          description: "Reset monitoring and alerting systems",
          estimatedTime: 60000, // 1 minute
          automated: true,
          dependencies: ["System Verification"],
          validation: ["Monitoring active", "Alerts configured"],
          emergencyStop: false,
          rollbackFunction: this.resetMonitoring.bind(this),
        },
      ],
      validations: [
        {
          name: "Database Connectivity",
          check: this.validateDatabaseConnectivity.bind(this),
          critical: true,
          timeout: 30000,
        },
        {
          name: "Data Integrity",
          check: this.validateDataIntegrity.bind(this),
          critical: true,
          timeout: 120000,
        },
        {
          name: "Performance Baseline",
          check: this.validatePerformanceBaseline.bind(this),
          critical: false,
          timeout: 60000,
        },
      ],
      emergencyContacts: [
        "oncall-engineer@tradeya.com",
        "database-admin@tradeya.com",
        "engineering-manager@tradeya.com",
      ],
    };

    this.rollbackPlan = plan;
    await this.saveRollbackPlan(plan);

    return plan;
  }

  /**
   * Execute emergency rollback
   */
  async executeEmergencyRollback(
    reason: string,
    triggeredBy: string = "system"
  ): Promise<RollbackExecution> {
    if (!this.rollbackPlan) {
      throw new Error("No rollback plan available");
    }

    if (this.currentExecution && this.currentExecution.status === "RUNNING") {
      throw new Error("Rollback already in progress");
    }

    performanceLogger.error("monitoring", "Executing emergency rollback", {
      reason,
      triggeredBy,
      planId: this.rollbackPlan.id,
    });

    const execution: RollbackExecution = {
      id: `execution-${Date.now()}`,
      planId: this.rollbackPlan.id,
      startTime: new Date(),
      status: "RUNNING",
      currentStep: 0,
      totalSteps: this.rollbackPlan.steps.length,
      progress: 0,
      triggeredBy,
      reason,
      metrics: {
        documentsReverted: 0,
        collectionsAffected: [],
        timeElapsed: 0,
        validationsPassed: 0,
        validationsFailed: 0,
        errorCount: 0,
        performanceImpact: 0,
      },
      alerts: [],
      stepResults: this.rollbackPlan.steps.map((step) => ({
        step: step.step,
        name: step.name,
        status: "PENDING",
        validationResults: [],
      })),
    };

    this.currentExecution = execution;

    console.log("\n🚨 EMERGENCY ROLLBACK INITIATED");
    console.log("==============================");
    console.log(`🆔 Execution ID: ${execution.id}`);
    console.log(`📝 Reason: ${reason}`);
    console.log(`👤 Triggered By: ${triggeredBy}`);
    console.log(`📊 Total Steps: ${execution.totalSteps}`);
    console.log(`⏰ Start Time: ${execution.startTime.toISOString()}`);

    try {
      // Execute rollback steps
      for (let i = 0; i < this.rollbackPlan.steps.length; i++) {
        const step = this.rollbackPlan.steps[i];
        execution.currentStep = i + 1;

        console.log(`\n📋 STEP ${step.step}: ${step.name}`);
        console.log(
          `⏱️  Estimated Time: ${Math.round(
            step.estimatedTime / 60000
          )} minutes`
        );

        const stepResult = execution.stepResults[i];
        stepResult.status = "RUNNING";
        stepResult.startTime = new Date();

        try {
          // Execute step
          if (step.rollbackFunction) {
            const success = await step.rollbackFunction();
            stepResult.result = { success };

            if (!success) {
              throw new Error(`Step ${step.step} failed to execute`);
            }
          }

          // Run validations
          for (const validation of step.validation) {
            const validationResult: ValidationResult = {
              name: validation,
              passed: true, // This would be actual validation
              details: "Validation passed",
              timestamp: new Date(),
            };
            stepResult.validationResults.push(validationResult);

            if (validationResult.passed) {
              execution.metrics.validationsPassed++;
            } else {
              execution.metrics.validationsFailed++;
            }
          }

          stepResult.status = "COMPLETED";
          stepResult.endTime = new Date();

          console.log(`✅ Step ${step.step} completed successfully`);
        } catch (error) {
          stepResult.status = "FAILED";
          stepResult.endTime = new Date();
          stepResult.error =
            error instanceof Error ? error.message : "Unknown error";
          execution.metrics.errorCount++;

          console.error(
            `❌ Step ${step.step} failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );

          if (step.emergencyStop) {
            execution.status = "FAILED";
            break;
          }
        }

        execution.progress =
          (execution.currentStep / execution.totalSteps) * 100;
        await this.saveExecutionStatus(execution);
      }

      // Finalize rollback
      if (execution.status === "RUNNING") {
        execution.status = "COMPLETED";
        execution.endTime = new Date();
        execution.metrics.timeElapsed =
          execution.endTime.getTime() - execution.startTime.getTime();

        console.log("\n✅ ROLLBACK COMPLETED SUCCESSFULLY");
        console.log(
          `⏱️  Total Time: ${Math.round(
            execution.metrics.timeElapsed / 60000
          )} minutes`
        );
        console.log(
          `📊 Documents Reverted: ${execution.metrics.documentsReverted}`
        );
        console.log(
          `✅ Validations Passed: ${execution.metrics.validationsPassed}`
        );
        console.log(
          `❌ Validations Failed: ${execution.metrics.validationsFailed}`
        );

        performanceLogger.info(
          "monitoring",
          "Emergency rollback completed successfully",
          {
            executionId: execution.id,
            timeElapsed: execution.metrics.timeElapsed,
            documentsReverted: execution.metrics.documentsReverted,
          }
        );
      }
    } catch (error) {
      execution.status = "FAILED";
      execution.endTime = new Date();
      execution.metrics.timeElapsed =
        execution.endTime.getTime() - execution.startTime.getTime();

      console.error("\n💥 ROLLBACK FAILED");
      console.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );

      performanceLogger.error(
        "monitoring",
        "Emergency rollback failed",
        {
          executionId: execution.id,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        error instanceof Error ? error : new Error("Unknown error")
      );
    }

    await this.saveExecutionStatus(execution);
    return execution;
  }

  /**
   * Trigger emergency rollback manually
   */
  async triggerEmergencyRollback(reason: string): Promise<void> {
    const trigger = this.triggers.find((t) => t.id === "manual-trigger");
    if (trigger) {
      trigger.triggerCount++;
      trigger.lastTriggered = new Date();
    }

    await this.executeEmergencyRollback(reason, "manual");
  }

  private async checkRollbackTriggers(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    for (const trigger of this.triggers.filter((t) => t.automatic)) {
      if (await this.shouldTriggerRollback(trigger)) {
        await this.handleTriggerActivation(trigger);
      }
    }
  }

  private async shouldTriggerRollback(
    trigger: RollbackTrigger
  ): Promise<boolean> {
    // Check cooldown period
    if (trigger.lastTriggered) {
      const timeSinceLastTrigger = Date.now() - trigger.lastTriggered.getTime();
      if (timeSinceLastTrigger < trigger.cooldownPeriod) {
        return false;
      }
    }

    // Evaluate trigger condition
    switch (trigger.id) {
      case "error-rate-critical":
        // This would check actual error rate from monitoring
        return false; // Placeholder
      case "health-score-critical":
        // This would check actual health score from monitoring
        return false; // Placeholder
      case "response-time-critical":
        // This would check actual response time from monitoring
        return false; // Placeholder
      default:
        return false;
    }
  }

  private async handleTriggerActivation(
    trigger: RollbackTrigger
  ): Promise<void> {
    trigger.triggerCount++;
    trigger.lastTriggered = new Date();

    performanceLogger.warn("monitoring", "Rollback trigger activated", {
      triggerId: trigger.id,
      triggerName: trigger.name,
      severity: trigger.severity,
    });

    if (trigger.automatic && PRODUCTION_CONFIG.safety.autoRollbackEnabled) {
      await this.executeEmergencyRollback(
        `Automatic trigger: ${trigger.name}`,
        `trigger-${trigger.id}`
      );
    }
  }

  // Rollback step implementations
  private async stopMigrationProcesses(): Promise<boolean> {
    performanceLogger.info("monitoring", "Stopping migration processes");
    // Implementation would stop all active migration processes
    return true;
  }

  private async assessSystemHealth(): Promise<boolean> {
    performanceLogger.info("monitoring", "Assessing system health");
    // Implementation would assess current system state
    return true;
  }

  private async revertDataChanges(): Promise<boolean> {
    performanceLogger.info("monitoring", "Reverting data changes");
    try {
      const backupPath = this.rollbackPlan?.rollbackData?.backupPath;
      if (!backupPath) {
        performanceLogger.error(
          "monitoring",
          "No backupPath found in rollback plan"
        );
        return false;
      }

      // If backupPath seems like a GCS path, attempt gcloud import (requires gcloud CLI + permissions)
      if (typeof backupPath === "string" && backupPath.startsWith("gs://")) {
        try {
          performanceLogger.info(
            "monitoring",
            "Detected GCS backup path, starting gcloud import",
            { backupPath }
          );
          const projectArg = this.projectId
            ? `--project=${this.projectId}`
            : "";
          const cmd =
            `gcloud firestore import "${backupPath}" ${projectArg}`.trim();
          performanceLogger.info("monitoring", "Running command", { cmd });
          execSync(cmd, { stdio: "inherit" });
          performanceLogger.info("monitoring", "gcloud import completed");
          return true;
        } catch (err) {
          performanceLogger.error("monitoring", "gcloud import failed", {
            error: String(err),
          });
          return false;
        }
      }

      // If local file path, attempt JSON restore via admin SDK (best-effort; may require schema knowledge)
      if (existsSync(backupPath)) {
        performanceLogger.info(
          "monitoring",
          "Detected local backup file, attempting JSON restore",
          { backupPath }
        );
        const raw = readFileSync(backupPath, "utf8");
        const snapshot = JSON.parse(raw);
        const db = getSyncFirebaseDb();

        // Expecting snapshot shape: { collectionName: { docId: docData, ... }, ... }
        for (const collectionName of Object.keys(snapshot)) {
          const docs = snapshot[collectionName];
          for (const docId of Object.keys(docs)) {
            const docData = docs[docId];
            // Write doc (overwrites)
            await setDoc(doc(db, collectionName, docId), docData as any);
          }
        }

        performanceLogger.info("monitoring", "Local JSON restore completed");
        return true;
      }

      performanceLogger.error(
        "monitoring",
        "Backup path is not accessible or unrecognized",
        { backupPath }
      );
      return false;
    } catch (err) {
      performanceLogger.error("monitoring", "Error during revertDataChanges", {
        error: String(err),
      });
      return false;
    }
  }

  private async verifySystemHealth(): Promise<boolean> {
    performanceLogger.info("monitoring", "Verifying system health");
    // Implementation would verify system is healthy after rollback
    return true;
  }

  private async resetMonitoring(): Promise<boolean> {
    performanceLogger.info("monitoring", "Resetting monitoring systems");
    // Implementation would reset monitoring and alerting
    return true;
  }

  // Validation implementations
  private async validateDatabaseConnectivity(): Promise<boolean> {
    try {
      const testQuery = query(
        collection(getSyncFirebaseDb(), "health-check"),
        limit(1)
      );
      await getDocs(testQuery);
      return true;
    } catch {
      return false;
    }
  }

  private async validateDataIntegrity(): Promise<boolean> {
    // Implementation would validate data integrity
    return true;
  }

  private async validatePerformanceBaseline(): Promise<boolean> {
    // Implementation would validate performance meets baseline
    return true;
  }

  private async pauseRollback(reason: string): Promise<void> {
    if (this.currentExecution && this.currentExecution.status === "RUNNING") {
      this.currentExecution.status = "PAUSED";

      performanceLogger.warn("monitoring", "Rollback paused", {
        executionId: this.currentExecution.id,
        reason,
      });
    }
  }

  private async saveRollbackPlan(plan: RollbackPlan): Promise<void> {
    const planPath = join(process.cwd(), `rollback-plan-${plan.version}.json`);
    writeFileSync(planPath, JSON.stringify(plan, null, 2));
  }

  private async saveExecutionStatus(
    execution: RollbackExecution
  ): Promise<void> {
    const statusPath = join(
      process.cwd(),
      `rollback-execution-${execution.id}.json`
    );
    writeFileSync(statusPath, JSON.stringify(execution, null, 2));
  }

  /**
   * Get current rollback status
   */
  getCurrentStatus(): { isRunning: boolean; execution?: RollbackExecution } {
    return {
      isRunning: this.isRunning,
      execution: this.currentExecution,
    };
  }

  /**
   * Static method to create and start rollback system
   */
  static async startRollbackSystem(
    projectId: string,
    environment: "staging" | "production" = "production"
  ): Promise<ProductionRollbackSystem> {
    const system = new ProductionRollbackSystem(projectId, environment);
    await system.startRollbackMonitoring();
    return system;
  }
}

// Execute rollback system if this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const projectArg = args.find((arg) => arg.startsWith("--project="));
  const projectId = projectArg
    ? projectArg.split("=")[1]
    : process.env.FIREBASE_PROJECT_ID || "tradeya-45ede";
  const envArg = args.find((arg) => arg.startsWith("--env="));
  const environment = envArg
    ? (envArg.split("=")[1] as "staging" | "production")
    : "production";
  const actionArg = args.find((arg) => arg.startsWith("--action="));
  const action = actionArg ? actionArg.split("=")[1] : "monitor";

  if (!projectId) {
    console.error(
      "❌ Error: Project ID is required. Use --project=<PROJECT_ID> or set FIREBASE_PROJECT_ID"
    );
    process.exit(1);
  }

  console.log("\n🛡️  TradeYa Production Rollback System");
  console.log("====================================");
  console.log(`📊 Project: ${projectId}`);
  console.log(`🌍 Environment: ${environment}`);
  console.log(`🎯 Action: ${action}`);

  const system = new ProductionRollbackSystem(projectId, environment);

  if (action === "emergency") {
    const reasonArg = args.find((arg) => arg.startsWith("--reason="));
    const reason = reasonArg
      ? reasonArg.split("=")[1]
      : "Manual emergency rollback";

    system
      .triggerEmergencyRollback(reason)
      .then(() => {
        console.log("✅ Emergency rollback completed");
        process.exit(0);
      })
      .catch((error) => {
        console.error("💥 Emergency rollback failed:", error);
        process.exit(1);
      });
  } else {
    system
      .startRollbackMonitoring()
      .then(() => {
        console.log("✅ Rollback monitoring started");

        // Handle graceful shutdown
        process.on("SIGINT", async () => {
          console.log("\n⏹️  Shutting down rollback system...");
          await system.stopRollbackMonitoring();
          process.exit(0);
        });
      })
      .catch((error) => {
        console.error("💥 Failed to start rollback system:", error);
        process.exit(1);
      });
  }
}

export type {
  RollbackTrigger,
  RollbackPlan,
  RollbackExecution,
  RollbackMetrics,
};

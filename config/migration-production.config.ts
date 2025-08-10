/**
 * TradeYa Production Migration Configuration
 * Generated: 2025-06-12T15:17:02.044Z
 * Environment: production
 */

export interface ProductionMigrationConfig {
  phasedDeployment: PhasedDeploymentConfig;
  rollbackTriggers: RollbackTrigger[];
  dataValidation: DataValidationConfig;
  compatibilityLayer: CompatibilityLayerConfig;
  emergencyProcedures: EmergencyProcedure[];
}

export const PRODUCTION_MIGRATION_CONFIG: ProductionMigrationConfig = {
  "phasedDeployment": {
    "phase1": {
      "percentage": 10,
      "duration": 3600000,
      "criteria": [
        "health_score_above_90",
        "error_rate_below_1_percent",
        "no_critical_alerts"
      ]
    },
    "phase2": {
      "percentage": 50,
      "duration": 7200000,
      "criteria": [
        "health_score_above_85",
        "error_rate_below_2_percent",
        "user_feedback_positive"
      ]
    },
    "phase3": {
      "percentage": 100,
      "duration": 14400000,
      "criteria": [
        "health_score_above_80",
        "error_rate_below_5_percent",
        "migration_complete"
      ]
    },
    "automaticPromotion": false,
    "manualApprovalRequired": true
  },
  "rollbackTriggers": [
    {
      "name": "Critical Error Rate",
      "condition": "error_rate > 0.05",
      "threshold": 0.05,
      "automatic": true,
      "severity": "critical"
    },
    {
      "name": "Health Score Degradation",
      "condition": "health_score < 70",
      "threshold": 70,
      "automatic": true,
      "severity": "critical"
    },
    {
      "name": "Migration Stall",
      "condition": "migration_progress_stalled > 300",
      "threshold": 300,
      "automatic": true,
      "severity": "high"
    }
  ],
  "dataValidation": {
    "preDeployment": [
      "schema_compatibility_check",
      "index_availability_check",
      "backup_verification",
      "security_rules_validation"
    ],
    "postDeployment": [
      "data_integrity_check",
      "performance_validation",
      "user_experience_validation",
      "compatibility_layer_health"
    ],
    "continuousValidation": [
      "real_time_health_monitoring",
      "error_rate_tracking",
      "performance_metrics_monitoring"
    ],
    "sampleSize": 1000,
    "validationTimeout": 300000
  },
  "compatibilityLayer": {
    "enabled": true,
    "fallbackStrategy": "hybrid",
    "gracePeriod": 7200000,
    "monitoring": true
  },
  "emergencyProcedures": [
    {
      "name": "Critical Migration Failure",
      "trigger": "error_rate > 0.1 OR health_score < 50",
      "steps": [
        "Immediate automatic rollback",
        "Notify emergency contacts",
        "Escalate to database administrator",
        "Create incident report"
      ],
      "contacts": [
        "oncall-engineer",
        "database-admin",
        "product-manager"
      ],
      "escalationTime": 300000
    },
    {
      "name": "Data Integrity Breach",
      "trigger": "data_integrity_score < 90",
      "steps": [
        "Pause migration immediately",
        "Lock database writes",
        "Notify security team",
        "Initiate data validation procedures"
      ],
      "contacts": [
        "security-team",
        "database-admin",
        "engineering-manager"
      ],
      "escalationTime": 180000
    }
  ]
};

export default PRODUCTION_MIGRATION_CONFIG;

/**
 * Production Deployment Configuration
 * 
 * This module provides comprehensive configuration for production deployment
 * including environment settings, safety thresholds, and deployment parameters.
 */

export interface ProductionConfig {
  environment: {
    name: string;
    firebaseProject: string;
    region: string;
    backupSchedule: string;
  };
  migration: {
    phasePercentages: number[];
    batchSize: number;
    delayBetweenBatches: number;
    maxRetries: number;
    rollbackThreshold: number;
  };
  monitoring: {
    healthCheckInterval: number;
    performanceThresholds: {
      maxNormalizationTime: number;
      minThroughput: number;
      maxErrorRate: number;
    };
    alerting: {
      slackWebhook?: string;
      emailNotifications: string[];
      pagerDutyKey?: string;
    };
  };
  safety: {
    requireManualConfirmation: boolean;
    autoRollbackEnabled: boolean;
    emergencyStopEnabled: boolean;
    dataValidationLevel: 'basic' | 'standard' | 'comprehensive';
  };
}

export const PRODUCTION_CONFIG: ProductionConfig = {
  environment: {
    name: 'production',
    firebaseProject: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'tradeya-45ede',
    region: 'us-central1',
    backupSchedule: '0 2 * * *', // Daily at 2 AM UTC
  },
  migration: {
    phasePercentages: [10, 50, 100],
    batchSize: 50,
    delayBetweenBatches: 5000, // 5 seconds
    maxRetries: 3,
    rollbackThreshold: 5, // 5% error rate triggers rollback
  },
  monitoring: {
    healthCheckInterval: 30000, // 30 seconds
    performanceThresholds: {
      maxNormalizationTime: 5, // 5ms max normalization time
      minThroughput: 50, // 50 ops/sec minimum
      maxErrorRate: 1, // 1% max error rate
    },
    alerting: {
      slackWebhook: process.env.SLACK_WEBHOOK_URL,
      emailNotifications: [
        'dev-team@tradeya.com',
        'ops-team@tradeya.com',
        'management@tradeya.com'
      ],
      pagerDutyKey: process.env.PAGERDUTY_API_KEY,
    },
  },
  safety: {
    requireManualConfirmation: true,
    autoRollbackEnabled: true,
    emergencyStopEnabled: true,
    dataValidationLevel: 'comprehensive',
  },
};

export const PRODUCTION_FIREBASE_CONFIG = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyCCr7wxWHJyv4C9pGOJ0Juf7latDmceTew',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'tradeya-45ede.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'tradeya-45ede',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'tradeya-45ede.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '476911238747',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:476911238747:web:e9b73b157f3fa63ba4897e',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-XNL1Y7CZWW'
};

export const PRODUCTION_ADMIN_CONFIG = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'tradeya-45ede',
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-550mg@tradeya-45ede.iam.gserviceaccount.com',
};

export const PRODUCTION_SECURITY_RULES = {
  firestore: {
    rules: `
      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          // Production-specific security rules with enhanced validation
          match /trades/{tradeId} {
            allow read, write: if request.auth != null 
              && (resource == null || request.auth.uid in resource.data.participants)
              && isValidTradeData(request.resource.data);
          }
          
          match /users/{userId} {
            allow read, write: if request.auth != null 
              && request.auth.uid == userId
              && isValidUserData(request.resource.data);
          }
          
          match /conversations/{conversationId} {
            allow read, write: if request.auth != null 
              && (resource == null || request.auth.uid in resource.data.participantIds)
              && isValidConversationData(request.resource.data);
          }
          
          match /collaborations/{collaborationId} {
            allow read: if request.auth != null;
            allow write: if request.auth != null 
              && (resource == null || request.auth.uid == resource.data.createdBy)
              && isValidCollaborationData(request.resource.data);
          }
          
          // Enhanced validation functions for production
          function isValidTradeData(data) {
            return data.keys().hasAll(['title', 'description', 'participants', 'status'])
              && data.title is string
              && data.title.size() > 0
              && data.title.size() <= 100
              && data.participants is list
              && data.participants.size() >= 2
              && data.status in ['pending', 'active', 'completed', 'cancelled'];
          }
          
          function isValidUserData(data) {
            return data.keys().hasAll(['email', 'displayName'])
              && data.email is string
              && data.email.matches('.*@.*\\..+')
              && data.displayName is string
              && data.displayName.size() > 0
              && data.displayName.size() <= 50;
          }
          
          function isValidConversationData(data) {
            return data.keys().hasAll(['participantIds', 'lastMessage'])
              && data.participantIds is list
              && data.participantIds.size() >= 2;
          }
          
          function isValidCollaborationData(data) {
            return data.keys().hasAll(['title', 'description', 'createdBy'])
              && data.title is string
              && data.title.size() > 0
              && data.title.size() <= 100;
          }
        }
      }
    `,
  },
  storage: {
    rules: `
      rules_version = '2';
      service firebase.storage {
        match /b/{bucket}/o {
          match /trades/{tradeId}/{allPaths=**} {
            allow read, write: if request.auth != null
              && isValidFileUpload(resource);
          }
          
          match /profiles/{userId}/{allPaths=**} {
            allow read: if request.auth != null;
            allow write: if request.auth != null
              && request.auth.uid == userId
              && isValidFileUpload(resource);
          }
          
          function isValidFileUpload(resource) {
            return resource.size < 10 * 1024 * 1024 // 10MB limit
              && resource.contentType.matches('image/.*|application/pdf');
          }
        }
      }
    `,
  },
};

export const PRODUCTION_BACKUP_CONFIG = {
  schedule: PRODUCTION_CONFIG.environment.backupSchedule,
  retention: {
    daily: 30,
    weekly: 12,
    monthly: 12,
  },
  collections: [
    'trades',
    'users',
    'messages',
    'conversations',
    'collaborations',
    'gamification',
    'challenges',
    'portfolios',
    'notifications'
  ],
};

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.VITE_CLOUDINARY_CLOUD_NAME || 'doqqhj2nt',
  apiKey: process.env.VITE_CLOUDINARY_API_KEY || '411756985482938',
  apiSecret: process.env.VITE_CLOUDINARY_API_SECRET,
  uploadPresets: {
    profile: process.env.VITE_CLOUDINARY_PROFILE_PRESET || 'TradeYa_Prof_Pic_Preset',
    banner: process.env.VITE_CLOUDINARY_BANNER_PRESET || 'TradeYa_Banner_Preset',
    portfolio: process.env.VITE_CLOUDINARY_PORTFOLIO_PRESET || 'TradeYa_Portfolio_Preset',
    project: process.env.VITE_CLOUDINARY_PROJECT_PRESET || 'TradeYa_Project_Preset'
  }
};

export default PRODUCTION_CONFIG;
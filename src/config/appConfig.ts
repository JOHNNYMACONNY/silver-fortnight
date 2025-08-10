/**
 * Application Configuration
 * 
 * Centralized configuration management to replace hardcoded values
 * throughout the application
 */

export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    baseUrl: string;
  };
  
  ui: {
    theme: {
      defaultMode: 'light' | 'dark' | 'system';
      enableSystemPreference: boolean;
    };
    animations: {
      enableReducedMotion: boolean;
      defaultDuration: number;
      defaultEasing: string;
    };
    layout: {
      maxContentWidth: string;
      sidebarWidth: string;
      headerHeight: string;
      footerHeight: string;
    };
    pagination: {
      defaultPageSize: number;
      maxPageSize: number;
      showSizeSelector: boolean;
    };
  };
  
  performance: {
    caching: {
      enableServiceWorker: boolean;
      cacheTimeout: number;
      maxCacheSize: number;
    };
    bundling: {
      enableCodeSplitting: boolean;
      enableTreeShaking: boolean;
      chunkSizeWarningLimit: number;
    };
    monitoring: {
      enablePerformanceTracking: boolean;
      enableErrorTracking: boolean;
      sampleRate: number;
    };
  };
  
  features: {
    chat: {
      enableRealtime: boolean;
      messageRetentionDays: number;
      maxMessageLength: number;
      enableFileUploads: boolean;
      maxFileSize: number;
    };
    trades: {
      enableAutoMatching: boolean;
      maxActiveTradesPerUser: number;
      tradeExpirationDays: number;
      enableRatings: boolean;
    };
    gamification: {
      enableXPSystem: boolean;
      enableAchievements: boolean;
      enableLeaderboards: boolean;
      xpMultiplier: number;
    };
    collaboration: {
      enableRealTimeEditing: boolean;
      maxCollaboratorsPerProject: number;
      enableVersionHistory: boolean;
      autoSaveInterval: number;
    };
  };
  
  security: {
    auth: {
      sessionTimeout: number;
      enableTwoFactor: boolean;
      passwordMinLength: number;
      enableSocialLogin: boolean;
    };
    api: {
      rateLimitRequests: number;
      rateLimitWindow: number;
      enableCORS: boolean;
      allowedOrigins: string[];
    };
    content: {
      enableContentModeration: boolean;
      enableProfanityFilter: boolean;
      maxUploadSize: number;
      allowedFileTypes: string[];
    };
  };
  
  integrations: {
    firebase: {
      enableAnalytics: boolean;
      enableCrashlytics: boolean;
      enablePerformanceMonitoring: boolean;
    };
    ai: {
      enableCodeReview: boolean;
      enableContentGeneration: boolean;
      enableSmartMatching: boolean;
      apiTimeout: number;
    };
  };
}

// Environment-specific configurations
const developmentConfig: AppConfig = {
  app: {
    name: 'TradeYa',
    version: '1.0.0-dev',
    environment: 'development',
    baseUrl: 'http://localhost:3000'
  },
  
  ui: {
    theme: {
      defaultMode: 'system',
      enableSystemPreference: true
    },
    animations: {
      enableReducedMotion: false,
      defaultDuration: 300,
      defaultEasing: 'ease-in-out'
    },
    layout: {
      maxContentWidth: '1200px',
      sidebarWidth: '280px',
      headerHeight: '64px',
      footerHeight: '120px'
    },
    pagination: {
      defaultPageSize: 10,
      maxPageSize: 50,
      showSizeSelector: true
    }
  },
  
  performance: {
    caching: {
      enableServiceWorker: true,
      cacheTimeout: 300000, // 5 minutes
      maxCacheSize: 50 * 1024 * 1024 // 50MB
    },
    bundling: {
      enableCodeSplitting: true,
      enableTreeShaking: true,
      chunkSizeWarningLimit: 500 * 1024 // 500KB
    },
    monitoring: {
      enablePerformanceTracking: true,
      enableErrorTracking: true,
      sampleRate: 1.0 // 100% in development
    }
  },
  
  features: {
    chat: {
      enableRealtime: true,
      messageRetentionDays: 30,
      maxMessageLength: 2000,
      enableFileUploads: true,
      maxFileSize: 10 * 1024 * 1024 // 10MB
    },
    trades: {
      enableAutoMatching: true,
      maxActiveTradesPerUser: 10,
      tradeExpirationDays: 30,
      enableRatings: true
    },
    gamification: {
      enableXPSystem: true,
      enableAchievements: true,
      enableLeaderboards: true,
      xpMultiplier: 1.0
    },
    collaboration: {
      enableRealTimeEditing: true,
      maxCollaboratorsPerProject: 10,
      enableVersionHistory: true,
      autoSaveInterval: 30000 // 30 seconds
    }
  },
  
  security: {
    auth: {
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      enableTwoFactor: false,
      passwordMinLength: 8,
      enableSocialLogin: true
    },
    api: {
      rateLimitRequests: 1000,
      rateLimitWindow: 60 * 1000, // 1 minute
      enableCORS: true,
      allowedOrigins: ['http://localhost:3000', 'http://localhost:5173']
    },
    content: {
      enableContentModeration: false,
      enableProfanityFilter: false,
      maxUploadSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    }
  },
  
  integrations: {
    firebase: {
      enableAnalytics: false,
      enableCrashlytics: false,
      enablePerformanceMonitoring: true
    },
    ai: {
      enableCodeReview: true,
      enableContentGeneration: true,
      enableSmartMatching: true,
      apiTimeout: 30000 // 30 seconds
    }
  }
};

const productionConfig: AppConfig = {
  ...developmentConfig,
  app: {
    ...developmentConfig.app,
    environment: 'production',
    baseUrl: 'https://tradeya-45ede.web.app'
  },
  
  performance: {
    ...developmentConfig.performance,
    caching: {
      ...developmentConfig.performance.caching,
      cacheTimeout: 3600000, // 1 hour
      maxCacheSize: 100 * 1024 * 1024 // 100MB
    },
    monitoring: {
      ...developmentConfig.performance.monitoring,
      sampleRate: 0.1 // 10% in production
    }
  },
  
  security: {
    ...developmentConfig.security,
    auth: {
      ...developmentConfig.security.auth,
      enableTwoFactor: true
    },
    api: {
      ...developmentConfig.security.api,
      allowedOrigins: ['https://tradeya-45ede.web.app']
    },
    content: {
      ...developmentConfig.security.content,
      enableContentModeration: true,
      enableProfanityFilter: true
    }
  },
  
  integrations: {
    ...developmentConfig.integrations,
    firebase: {
      enableAnalytics: true,
      enableCrashlytics: true,
      enablePerformanceMonitoring: true
    }
  }
};

// Get configuration based on environment
function getConfig(): AppConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'staging':
      return {
        ...productionConfig,
        app: {
          ...productionConfig.app,
          environment: 'staging',
          baseUrl: 'https://staging.tradeya.app'
        }
      };
    default:
      return developmentConfig;
  }
}

// Export the configuration
export const config = getConfig();

// Utility functions for common configuration access
export const isProduction = () => config.app.environment === 'production';
export const isDevelopment = () => config.app.environment === 'development';
export const isStaging = () => config.app.environment === 'staging';

export const getFeatureFlag = (feature: keyof AppConfig['features']) => config.features[feature];
export const getUIConfig = () => config.ui;
export const getPerformanceConfig = () => config.performance;
export const getSecurityConfig = () => config.security;

// Type-safe configuration access
export const useConfig = () => config;

export default config;

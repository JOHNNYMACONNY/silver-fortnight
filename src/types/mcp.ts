// MCP Browser Tools types
export interface MCPBrowserTools {
  getConsoleErrors: () => {
    subscribe: (callback: (error: any) => void) => void;
  };
  getNetworkErrors: () => {
    subscribe: (callback: (error: any) => void) => void;
  };
  getNetworkLogs: () => {
    subscribe: (callback: (log: any) => void) => void;
  };
}

// Network log types
export interface NetworkRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
}

export interface NetworkResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: any;
}

export interface NetworkLog {
  type: 'request' | 'response' | 'error';
  timestamp: number;
  request: NetworkRequest;
  response?: NetworkResponse;
  error?: Error;
  message?: string; // Error message for error type logs
}

// Console log types
export interface ConsoleLog {
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  details?: any;
}
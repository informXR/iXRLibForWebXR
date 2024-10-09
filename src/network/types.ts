import { AxiosRequestConfig } from 'axios';
import { Agent } from 'https';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryableStatuses: number[];
}

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retryConfig?: RetryConfig;
  httpsAgent?: Agent;
}

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type ApiErrorResponse = {
  data: any;
  status: number;
  statusText: string;
};

// New types for API requests and responses
export interface AuthenticationRequestSchema {
  appId: string;
  orgId: string;
  deviceId: string;
  authSecret: string;
  userId?: string;
  tags?: string[];
  sessionId?: string;
  partner?: string;
  ipAddress?: string;
  deviceModel?: string;
  geolocation?: Record<string, any>;
  osVersion?: string;
  xrdmVersion?: string;
  appVersion?: string;
}

export interface AuthenticationResponseSchema {
  token: string;
  secret: string;
}

export interface EventSchemaNested {
  timestamp: string;
  name: string;
  meta?: Record<string, any>;
  [key: string]: any;
}

export interface EventSchema {
  data: EventSchemaNested[];
}

export interface NestedLogSchema {
  timestamp: string;
  logLevel?: string;
  text?: string;
  meta?: Record<string, any>;
  [key: string]: any;
}

export interface LogSchema {
  data: NestedLogSchema[];
}

export interface TelemetryNestedSchema {
  timestamp: string;
  name: string;
  data: Record<string, any>;
  [key: string]: any;
}

export interface TelemetrySchema {
  data: TelemetryNestedSchema[];
}

export interface MessageSchema {
  role: string;
  content: string;
}

export interface PromptSchema {
  prompt: string;
  llmProvider?: string;
  pastMessages?: MessageSchema[];
}

export interface NestedStorageSchema {
  timestamp: string;
  keepPolicy?: string;
  name: string;
  data: Record<string, any>[];
  origin?: string;
  sessionData?: boolean;
  [key: string]: any;
}

export interface StorageSchema {
  data: NestedStorageSchema[];
}

// API client method types
export interface ApiClient {
  get: <T>(url: string, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  delete: <T>(url: string, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  auth: {
    token: (authData: AuthenticationRequestSchema) => Promise<void>;
    ping: () => Promise<ApiResponse<void>>;
  };
  config: {
    get: () => Promise<ApiResponse<any>>;
  };
  collect: {
    event: (data: EventSchema) => Promise<ApiResponse<{ status: string }>>;
    log: (data: LogSchema) => Promise<ApiResponse<{ status: string }>>;
    telemetry: (data: TelemetrySchema) => Promise<ApiResponse<{ status: string }>>;
  };
  services: {
    llm: (data: PromptSchema) => Promise<ApiResponse<any>>;
  };
  storage: {
    store: (data: StorageSchema) => Promise<ApiResponse<void>>;
    get: (params?: { name?: string; origin?: string; tagsAny?: string[]; tagsAll?: string[]; userOnly?: boolean }) => Promise<ApiResponse<StorageSchema>>;
    reset: (params?: { sessionOnly?: boolean; name?: string; userOnly?: boolean }) => Promise<ApiResponse<{ status: string }>>;
    getConfig: () => Promise<ApiResponse<any>>;
  };
}

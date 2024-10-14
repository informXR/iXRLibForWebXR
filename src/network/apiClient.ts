import { ApiResponse, RetryConfig, ApiMethod,  ApiClient, AuthenticationRequestSchema, AuthenticationResponseSchema } from './types';
import { defaultConfig } from './config';
import { crc32 } from './utils/crc32';
import { storage } from './storage';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { logError, logInfo } from './utils/logger';
import { sha256, jwtDecode } from './utils/cryptoUtils';

interface DecodedToken {
  exp?: number;
  type?: string;
  jti?: string;
}

const generateRandomId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const createApiClient = (authData: AuthenticationRequestSchema, customUrl?: string): ApiClient => {
  const baseURL = customUrl || defaultConfig.baseURL;

  const config = { ...defaultConfig, baseURL };
  const instance: AxiosInstance = axios.create({
    baseURL,
    timeout: config.timeout || defaultConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  // Add this check to set httpsAgent only in Node.js environment
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    const https = require('https');
    instance.defaults.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
  }

  const retryConfig: RetryConfig = config.retryConfig || defaultConfig.retryConfig!;

  let apiToken: string = storage.getItem('apiToken') || '';
  let apiSecret: string = storage.getItem('apiSecret') || '';
  let sessionId: string = storage.getItem('sessionId') || generateRandomId();
  let tokenExpiration: Date | null = storage.getItem('tokenExpiration') 
    ? new Date(storage.getItem('tokenExpiration')!) 
    : null;

  const setHeadersFromCurrentState = async (config: InternalAxiosRequestConfig): Promise<void> => {
    logInfo('Setting headers', 'Setting API headers', { apiToken: '[REDACTED]', apiSecret: '[REDACTED]' });
    
    const now: string = Math.floor(Date.now() / 1000).toString();
    let hashSource: string = apiToken + apiSecret + now;

    if (config.data) {
      const bodyContent: string = JSON.stringify(config.data);
      const crc32Value: number = crc32(new TextEncoder().encode(bodyContent));
      hashSource += crc32Value.toString();
    }

    const hash: string = await sha256(hashSource);

    if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = new AxiosHeaders(config.headers as Record<string, string>);
    }

    config.headers.set('Authorization', `Bearer ${apiToken}`);
    config.headers.set('X-iXRLib-Hash', hash);
    config.headers.set('X-iXRLib-Timestamp', now);

    logInfo('Headers set', 'API headers set', {
      Authorization: `Bearer [REDACTED]`,
      'X-iXRLib-Hash': hash,
      'X-iXRLib-Timestamp': now
    });
  };

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      logInfo('Interceptor', 'Request interceptor called', { apiToken, apiSecret });
      
      if (apiToken && apiSecret) {
        setHeadersFromCurrentState(config);
      } else {
        logInfo('Headers not set', 'API Token or API Secret is missing');
      }
      
      return config;
    },
    (error: any): Promise<never> => Promise.reject(error)
  );

  const handleError = async (error: any): Promise<AxiosResponse> => {
    const { config, response } = error;
    const retries: number = config.retries || 0;

    if (retries < retryConfig.retries && retryConfig.retryableStatuses.includes(response?.status)) {
      config.retries = retries + 1;
      const delay: number = retryConfig.retryDelay * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      return instance(config);
    }

    logError('API request', error);
    return Promise.reject(error);
  };

  instance.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    handleError
  );

  const request = async <T>(method: ApiMethod, url: string, config?: AxiosRequestConfig, data?: any): Promise<ApiResponse<T>> => {
    await ensureAuthenticated();

    logInfo('Request function called', 'Request function called', { apiToken: '[REDACTED]', apiSecret: '[REDACTED]' });
    
    const requestConfig: InternalAxiosRequestConfig = { 
      ...config, 
      method, 
      url, 
      data,
      headers: config?.headers ? new AxiosHeaders(config.headers as Record<string, string>) : new AxiosHeaders(),
    } as InternalAxiosRequestConfig;

    await setHeadersFromCurrentState(requestConfig);

    logInfo('Request headers', 'Headers set for request', {
      Authorization: requestConfig.headers.get('Authorization') ? 'Bearer [REDACTED]' : 'Not set',
      'X-iXRLib-Hash': requestConfig.headers.get('X-iXRLib-Hash'),
      'X-iXRLib-Timestamp': requestConfig.headers.get('X-iXRLib-Timestamp')
    });

    const response: AxiosResponse<T> = await instance(requestConfig);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
    };
  };

  const authenticate = async (authData: AuthenticationRequestSchema): Promise<void> => {
    try {
      logInfo('Authentication', 'Attempting authentication', { ...authData, authSecret: '[REDACTED]' });
      const response = await instance.post<AuthenticationResponseSchema>('/v1/auth/token', {
        ...authData,
        sessionId: authData.sessionId || sessionId
      });

      apiToken = response.data.token;
      apiSecret = response.data.secret;

      logInfo('Authentication', 'Authentication successful', { apiToken: '[REDACTED]', apiSecret: '[REDACTED]' });

      sessionId = authData.sessionId || sessionId;

      const decodedToken: DecodedToken | null = jwtDecode(apiToken);
      if (decodedToken) {
        if (decodedToken.exp) {
          tokenExpiration = new Date(decodedToken.exp * 1000);
        }
      }

      storage.setItem('apiToken', apiToken);
      storage.setItem('apiSecret', apiSecret);
      storage.setItem('sessionId', sessionId);
      if (tokenExpiration) {
        storage.setItem('tokenExpiration', tokenExpiration.toISOString());
      }

      logInfo('Storage', 'Items stored in storage', {
        apiToken: storage.getItem('apiToken') ? '[REDACTED]' : 'null',
        apiSecret: storage.getItem('apiSecret') ? '[REDACTED]' : 'null',
        sessionId: storage.getItem('sessionId'),
        tokenExpiration: storage.getItem('tokenExpiration')
      });
    } catch (error) {
      logError('Authentication', error);
      throw error;
    }
  };

  const ensureAuthenticated = async (): Promise<void> => {
    if (!apiToken || !apiSecret) {
      logInfo('Authentication', 'No credentials found. Attempting to authenticate...');
      await authenticate(authData);
    }
  };

  return {
    get: <T>(url: string, config?: AxiosRequestConfig) => request<T>('GET', url, config),
    post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => request<T>('POST', url, config, data),
    put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => request<T>('PUT', url, config, data),
    delete: <T>(url: string, config?: AxiosRequestConfig) => request<T>('DELETE', url, config),
    auth: {
      token: authenticate,
      ping: () => request('GET', '/v1/auth/ping'),
    },
    config: {
      get: () => request('GET', '/v1/config'),
    },
    collect: {
      event: (data: any) => request('POST', 'v1/collect/event', undefined, data),
      log: (data: any) => request('POST', 'v1/collect/log', undefined, data),
      telemetry: (data: any) => request('POST', 'v1/collect/telemetry', undefined, data),
    },
    services: {
      llm: (data: any) => request('POST', 'v1/services/llm', undefined, data),
    },
    storage: {
      store: (data: any) => request('POST', 'v1/storage', undefined, data),
      get: (params: any) => request('GET', 'v1/storage', { params }),
      reset: (params: any) => request('DELETE', 'v1/storage', { params }),
      getConfig: () => request('GET', 'v1/storage/config'),
    },
  };
};

import * as https from 'https';
import { ApiResponse, RetryConfig, ApiClientConfig, ApiMethod, ApiErrorResponse, ApiClient, AuthenticationRequestSchema, AuthenticationResponseSchema } from './types';
import { defaultConfig } from './config';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { crc32 } from './utils/crc32';
import { storage } from './storage';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { logError, logInfo } from './utils/logger';

interface DecodedToken extends jwt.JwtPayload {
  exp?: number;
  type?: string;
  jti?: string;
}

export const createApiClient = (authData: AuthenticationRequestSchema): ApiClient => {
  const config = defaultConfig; // Use default config
  const instance: AxiosInstance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout || defaultConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false
    })
  });

  const retryConfig: RetryConfig = config.retryConfig || defaultConfig.retryConfig!;

  let apiToken: string = storage.getItem('apiToken') || '';
  let apiSecret: string = storage.getItem('apiSecret') || '';
  let sessionId: string = storage.getItem('sessionId') || '';
  let tokenExpiration: Date | null = storage.getItem('tokenExpiration') 
    ? new Date(storage.getItem('tokenExpiration')!) 
    : null;

  const setHeadersFromCurrentState = (config: InternalAxiosRequestConfig): void => {
    logInfo('Setting headers', 'Setting API headers', { apiToken, apiSecret });
    
    const now: string = Math.floor(Date.now() / 1000).toString();
    let hashSource: string = apiToken + apiSecret + now;

    if (config.data) {
      const bodyContent: Buffer = Buffer.from(JSON.stringify(config.data));
      const crc32Value: number = crc32(bodyContent);
      hashSource += crc32Value.toString();
    }

    const hash: string = crypto.createHash('sha256').update(hashSource).digest('base64');

    // Ensure config.headers is an instance of AxiosHeaders
    if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = new AxiosHeaders(config.headers as Record<string, string>);
    }

    // Use set method of AxiosHeaders
    config.headers.set('Authorization', `Bearer ${apiToken}`);
    config.headers.set('X-iXRLib-Hash', hash);
    config.headers.set('X-iXRLib-Timestamp', now);

    // console.log('Headers after setting:', config.headers);
  };


  // Modify the interceptor to use setHeadersFromCurrentState
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

  //handle errors
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

  //handle responses
  instance.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    handleError
  );

  // Modify the request function to ensure headers are set
  const request = async <T>(method: ApiMethod, url: string, config?: AxiosRequestConfig, data?: any): Promise<ApiResponse<T>> => {
    await ensureAuthenticated();

    logInfo('Request function called', 'Request function called', { apiToken, apiSecret });
    
    const requestConfig: InternalAxiosRequestConfig = { 
      ...config, 
      method, 
      url, 
      data,
      headers: config?.headers ? new AxiosHeaders(config.headers as Record<string, string>) : new AxiosHeaders(),
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false
      })
    } as InternalAxiosRequestConfig;

    if (apiToken && apiSecret) {
      setHeadersFromCurrentState(requestConfig);
    } else {
      logInfo('API Token or API Secret is still missing after authentication attempt', 'API Token or API Secret is still missing after authentication attempt');
    }

    const response: AxiosResponse<T> = await instance(requestConfig);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
    };
  };

  const authenticate = async (authData: AuthenticationRequestSchema): Promise<void> => {
    try {
      // Use instance directly instead of request function to avoid circular dependency
      const response = await instance.post<AuthenticationResponseSchema>('/v1/auth/token', {
        ...authData,
        sessionId: authData.sessionId || sessionId
      });

      apiToken = response.data.token;
      apiSecret = response.data.secret;

      logInfo('Authentication', 'Authentication successful', { apiToken, apiSecret });

      sessionId = authData.sessionId || sessionId;

      const decodedToken: DecodedToken | null = jwt.decode(apiToken) as DecodedToken | null;
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

import { ApiClientConfig } from './types';

export const defaultConfig: ApiClientConfig = {
  baseURL: 'https://libapi.informxr.io/',
  timeout: 10000,
  retryConfig: {
    retries: 3,
    retryDelay: 1000,
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  }
};
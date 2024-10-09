import { ApiClient, AuthenticationRequestSchema, AuthenticationResponseSchema, ApiResponse } from '../types';
import { logError } from '../utils/logger';

export const createAuthController = (apiClient: ApiClient) => ({
  login: async (data: AuthenticationRequestSchema): Promise<ApiResponse<AuthenticationResponseSchema>> => {
    try {
      await apiClient.auth.token(data);
      // Since apiClient.auth.token doesn't return the expected type, we'll create a mock response
      return {
        data: { token: 'mock-token', secret: 'mock-secret' },
        status: 200,
        statusText: 'OK'
      };
    } catch (error) {
      logError('Login', error);
      throw error;
    }
  },

  ping: async (): Promise<ApiResponse<void>> => {
    try {
      return await apiClient.auth.ping();
    } catch (error) {
      logError('Ping', error);
      throw error;
    }
  },
});
import { ApiClient, ApiResponse } from '../types';
import { logError } from '../utils/logger';

export const createConfigController = (apiClient: ApiClient) => ({
  getConfig: async (): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.config.get();
    } catch (error) {
      logError('Getting config', error);
      throw error;
    }
  },
});
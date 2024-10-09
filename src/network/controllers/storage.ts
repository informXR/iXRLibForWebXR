import { ApiClient, StorageSchema, ApiResponse } from '../types';
import { logError } from '../utils/logger';

export const createStorageController = (apiClient: ApiClient) => ({
  storeData: async (data: StorageSchema): Promise<ApiResponse<void>> => {
    try {
      return await apiClient.storage.store(data);
    } catch (error) {
      logError('Storing data', error);
      throw error;
    }
  },

  getData: async (params?: { name?: string; origin?: string; tagsAny?: string[]; tagsAll?: string[]; userOnly?: boolean }): Promise<ApiResponse<StorageSchema>> => {
    try {
      return await apiClient.storage.get(params);
    } catch (error) {
      logError('Getting data', error);
      throw error;
    }
  },

  resetData: async (params?: { sessionOnly?: boolean; name?: string; userOnly?: boolean }): Promise<ApiResponse<{ status: string }>> => {
    try {
      return await apiClient.storage.reset(params);
    } catch (error) {
      logError('Resetting data', error);
      throw error;
    }
  },

  getConfig: async (): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.storage.getConfig();
    } catch (error) {
      logError('Getting storage config', error);
      throw error;
    }
  },
});
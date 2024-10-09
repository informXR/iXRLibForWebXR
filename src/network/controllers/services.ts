import { ApiClient, PromptSchema, ApiResponse } from '../types';
import { logError } from '../utils/logger';

export const createServicesController = (apiClient: ApiClient) => ({
  submitPrompt: async (data: PromptSchema): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.services.llm(data);
    } catch (error) {
      logError('Submitting prompt', error);
      throw error;
    }
  },
});
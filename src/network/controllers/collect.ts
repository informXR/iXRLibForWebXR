import { ApiClient, EventSchema, LogSchema, TelemetrySchema, ApiResponse } from '../types';
import { logError } from '../utils/logger';

export const createCollectController = (apiClient: ApiClient) => ({
  storeEvent: async (data: EventSchema): Promise<ApiResponse<{ status: string }>> => {
    try {
      return await apiClient.collect.event(data);
    } catch (error) {
      logError('Failed to store event', error);
      throw error;
    }
  },

  storeLog: async (data: LogSchema): Promise<ApiResponse<{ status: string }>> => {
    try {
      return await apiClient.collect.log(data);
    } catch (error) {
      logError('Failed to store log', error);
      throw error;
    }
  },

  storeTelemetry: async (data: TelemetrySchema): Promise<ApiResponse<{ status: string }>> => {
    try {
      return await apiClient.collect.telemetry(data);
    } catch (error) {
      logError('Failed to store telemetry', error);
      throw error;
    }
  },
});
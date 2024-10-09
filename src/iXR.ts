/// <reference lib="dom" />

import { createApiClient } from './network/apiClient';
import { AuthenticationRequestSchema, EventSchema, LogSchema, TelemetrySchema, PromptSchema, StorageSchema, ApiResponse } from './network/types';
import { getUserIP } from './network/utils/ipUtils';
import { createAuthController } from './network/controllers/auth';
import { createCollectController } from './network/controllers/collect';
import { createServicesController } from './network/controllers/services';
import { createStorageController } from './network/controllers/storage';
import { logError, logInfo } from './network/utils/logger';

declare const window: Window & typeof globalThis;

export interface AuthDataWithRequiredAppId {
  appId: string;
  orgId?: string;
  deviceId?: string;
  deviceModel?: string;
  authSecret?: string;
  ipAddress?: string;
  tags?: string[];
  geolocation?: any; 
}

export interface iXRInstance {
  Event: (name: string, metaString: string) => Promise<ApiResponse<{ status: string }>>;
  LogInfo: (message: string) => Promise<ApiResponse<{ status: string }>>;
  LogError: (message: string) => Promise<ApiResponse<{ status: string }>>;
  LogWarning: (message: string) => Promise<ApiResponse<{ status: string }>>;
  Telemetry: (name: string, data: Record<string, any>) => Promise<ApiResponse<{ status: string }>>;
  Ping: () => Promise<ApiResponse<void>>;
  AIProxy: (prompt: string, llmProvider?: string, pastMessages?: Array<{role: string, content: string}>) => Promise<ApiResponse<any>>;
  StoreData: (name: string, data: Record<string, any>, keepPolicy?: string, origin?: string, sessionData?: boolean) => Promise<ApiResponse<void>>;
  GetData: (params?: { name?: string; origin?: string; tagsAny?: string[]; tagsAll?: string[]; userOnly?: boolean }) => Promise<ApiResponse<StorageSchema>>;
  ResetData: (params?: { sessionOnly?: boolean; name?: string; userOnly?: boolean }) => Promise<ApiResponse<{ status: string }>>;
  GetStorageConfig: () => Promise<ApiResponse<any>>;

  // New Event Wrapper Functions
  EventLevelStart: (levelName: string, meta?: Record<string, string>) => Promise<ApiResponse<{ status: string }>>;
  EventLevelComplete: (levelName: string, score: number, meta?: Record<string, string>) => Promise<ApiResponse<{ status: string }>>;
  EventAssessmentStart: (assessmentName: string, meta?: Record<string, string>) => Promise<ApiResponse<{ status: string }>>;
  EventAssessmentComplete: (assessmentName: string, score: number, result: ResultOptions, meta?: Record<string, string>) => Promise<ApiResponse<{ status: string }>>;
  EventObjectiveStart: (objectiveName: string, meta?: Record<string, string>) => Promise<ApiResponse<{ status: string }>>;
  EventObjectiveComplete: (objectiveName: string, score: number, result: ResultOptions, meta?: Record<string, string>) => Promise<ApiResponse<{ status: string }>>;
  EventInteractionStart: (interactionName: string, meta?: Record<string, string>) => Promise<ApiResponse<{ status: string }>>;
  EventInteractionComplete: (interactionName: string, score: number, meta?: Record<string, string>) => Promise<ApiResponse<{ status: string }>>;

  // Updated and new Storage Methods
  SetStorageEntry: (data: Record<string, string>, name?: string, keepLatest?: boolean, origin?: string, sessionData?: boolean) => Promise<ApiResponse<void>>;
  GetStorageEntry: (name?: string, origin?: string, tagsAny?: string[], tagsAll?: string[], userOnly?: boolean) => Promise<ApiResponse<Record<string, string>>>;
  RemoveStorageEntry: (name?: string) => Promise<ApiResponse<{ status: string }>>;
  GetAllStorageEntries: () => Promise<ApiResponse<Record<string, Record<string, string>>>>;
}

export enum ResultOptions {
  Null,
  Pass,
  Fail,
  Complete,
  Incomplete
}

async function getUserIPFallback(): Promise<string> {
  return '0.0.0.0'; // Fallback IP address for non-browser environments
}

export async function iXRInit(authData: AuthDataWithRequiredAppId): Promise<iXRInstance> {
  try {
    if (!authData.appId) {
      throw new Error('appId is required and must be provided directly to iXRInit');
    }

    const urlAuthData = await getAuthDataFromUrl();
    
    // Merge the provided authData with URL auth data, prioritizing provided authData
    const mergedAuthData: AuthDataWithRequiredAppId = { ...urlAuthData, ...authData };

    console.log('Merged auth data:', mergedAuthData);

    if (!mergedAuthData.ipAddress) {
      try {
        mergedAuthData.ipAddress = typeof window !== 'undefined' ? await getUserIP() : await getUserIPFallback();
        logInfo('IP Address', 'IP address obtained', { ipAddress: mergedAuthData.ipAddress });
      } catch (error) {
        logError('Getting IP address', error);
        mergedAuthData.ipAddress = '0.0.0.0'; // Fallback IP address
      }
    }

    // Ensure all required fields are present for AuthenticationRequestSchema
    const fullAuthData: AuthenticationRequestSchema = {
      appId: mergedAuthData.appId,
      orgId: mergedAuthData.orgId || '',
      deviceId: mergedAuthData.deviceId || '',
      authSecret: mergedAuthData.authSecret || '',
      deviceModel: mergedAuthData.deviceModel || '',
      ipAddress: mergedAuthData.ipAddress || '',
    };

    console.log('Full auth data being used:', fullAuthData);

    // Check if all required fields are present
    const missingFields = Object.entries(fullAuthData)
      .filter(([key, value]) => value === '')
      .map(([key]) => key);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const apiClient = createApiClient(fullAuthData);

    const authController = createAuthController(apiClient);
    const collectController = createCollectController(apiClient);
    const servicesController = createServicesController(apiClient);
    const storageController = createStorageController(apiClient);

    async function initialize(): Promise<void> {
      try {
        await authController.login(fullAuthData);
      } catch (error) {
        logError('Initializing iXRLib', error);
      }
    }

    function parseMetaString(metaString: string): Record<string, string> {
      const meta: Record<string, string> = {};
      const pairs = metaString.split(',');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
          meta[key.trim()] = value.trim();
        }
      }
      return meta;
    }

    async function Event(name: string, metaString: string): Promise<ApiResponse<{ status: string }>> {
      const meta = parseMetaString(metaString);
      const eventData: EventSchema = {
        data: [
          {
            timestamp: new Date().toISOString(),
            name,
            meta
          }
        ]
      };

      try {
        return await collectController.storeEvent(eventData);
      } catch (error) {
        logError('Sending event', error);
        throw error;
      }
    }

    async function log(level: string, message: string): Promise<ApiResponse<{ status: string }>> {
      const logData: LogSchema = {
        data: [
          {
            timestamp: new Date().toISOString(),
            logLevel: level,
            text: message
          }
        ]
      };

      try {
        const response = await collectController.storeLog(logData);
        logInfo('Log sent', 'Log data sent successfully', logData);
        return response;
      } catch (error) {
        logError('Sending log', error);
        throw error;
      }
    }

    async function LogInfo(message: string): Promise<ApiResponse<{ status: string }>> {
      return await log('INFO', message);
    }

    async function LogError(message: string): Promise<ApiResponse<{ status: string }>> {
      try {
        return await log('ERROR', message);
      } catch (error) {
        logError('LogError', error);
        throw error;
      }
    }

    async function LogWarning(message: string): Promise<ApiResponse<{ status: string }>> {
      return await log('WARNING', message);
    }

    async function Telemetry(name: string, data: Record<string, any>): Promise<ApiResponse<{ status: string }>> {
      const telemetryData: TelemetrySchema = {
        data: [
          {
            timestamp: new Date().toISOString(),
            name,
            data
          }
        ]
      };

      try {
        return await collectController.storeTelemetry(telemetryData);
      } catch (error) {
        logError('Sending telemetry', error);
        throw error;
      }
    }

    async function Ping(): Promise<ApiResponse<void>> {
      try {
        return await authController.ping();
      } catch (error) {
        logError('Pinging server', error);
        throw error;
      }
    }

    async function AIProxy(prompt: string, llmProvider?: string, pastMessages?: Array<{role: string, content: string}>): Promise<ApiResponse<any>> {
      const promptData: PromptSchema = {
        prompt,
        llmProvider,
        pastMessages
      };

      try {
        return await servicesController.submitPrompt(promptData);
      } catch (error) {
        logError('Submitting LLM prompt', error);
        throw error;
      }
    }

    async function StoreData(name: string, data: Record<string, any>, keepPolicy?: string, origin?: string, sessionData?: boolean): Promise<ApiResponse<void>> {
      const storageData: StorageSchema = {
        data: [
          {
            timestamp: new Date().toISOString(),
            keepPolicy,
            name,
            data: [data],
            origin,
            sessionData
          }
        ]
      };

      try {
        return await storageController.storeData(storageData);
      } catch (error) {
        logError('Storing data', error);
        throw error;
      }
    }

    async function GetData(params?: { name?: string; origin?: string; tagsAny?: string[]; tagsAll?: string[]; userOnly?: boolean }): Promise<ApiResponse<StorageSchema>> {
      try {
        return await storageController.getData(params);
      } catch (error) {
        logError('Getting data', error);
        throw error;
      }
    }

    async function ResetData(params?: { sessionOnly?: boolean; name?: string; userOnly?: boolean }): Promise<ApiResponse<{ status: string }>> {
      try {
        return await storageController.resetData(params);
      } catch (error) {
        logError('Resetting data', error);
        throw error;
      }
    }

    async function GetStorageConfig(): Promise<ApiResponse<any>> {
      try {
        return await storageController.getConfig();
      } catch (error) {
        logError('Getting storage config', error);
        throw error;
      }
    }


    async function EventLevelStart(levelName: string, meta?: Record<string, string>): Promise<ApiResponse<{ status: string }>> {
      const eventName = `level_start_${levelName}`;
      const metaString = meta ? Object.entries(meta).map(([k, v]) => `${k}=${v}`).join(',') : '';
      return Event(eventName, metaString);
    }

    async function EventLevelComplete(levelName: string, score: number, meta?: Record<string, string>): Promise<ApiResponse<{ status: string }>> {
      const eventName = `level_complete_${levelName}`;
      const metaWithScore = { ...meta, score: score.toString() };
      const metaString = Object.entries(metaWithScore).map(([k, v]) => `${k}=${v}`).join(',');
      return Event(eventName, metaString);
    }

    async function EventAssessmentStart(assessmentName: string, meta?: Record<string, string>): Promise<ApiResponse<{ status: string }>> {
      const eventName = `assessment_start_${assessmentName}`;
      const metaString = meta ? Object.entries(meta).map(([k, v]) => `${k}=${v}`).join(',') : '';
      return Event(eventName, metaString);
    }

    async function EventAssessmentComplete(assessmentName: string, score: number, result: ResultOptions = ResultOptions.Null, meta?: Record<string, string>): Promise<ApiResponse<{ status: string }>> {
      const eventName = `assessment_complete_${assessmentName}`;
      const metaWithScoreAndResult = { ...meta, score: score.toString(), result: ResultOptions[result] };
      const metaString = Object.entries(metaWithScoreAndResult).map(([k, v]) => `${k}=${v}`).join(',');
      return Event(eventName, metaString);
    }


    async function EventObjectiveStart(objectiveName: string, meta?: Record<string, string>): Promise<ApiResponse<{ status: string }>> {
      const eventName = `objective_start_${objectiveName}`;
      const metaString = meta ? Object.entries(meta).map(([k, v]) => `${k}=${v}`).join(',') : '';
      return Event(eventName, metaString);
    }

    async function EventObjectiveComplete(objectiveName: string, score: number, result: ResultOptions = ResultOptions.Null, meta?: Record<string, string>): Promise<ApiResponse<{ status: string }>> {
      const eventName = `objective_complete_${objectiveName}`;
      const metaWithScoreAndResult = { ...meta, score: score.toString(), result: ResultOptions[result] };
      const metaString = Object.entries(metaWithScoreAndResult).map(([k, v]) => `${k}=${v}`).join(',');
      return Event(eventName, metaString);
    }


    async function EventInteractionStart(interactionName: string, meta?: Record<string, string>): Promise<ApiResponse<{ status: string }>> {
      const eventName = `interaction_start_${interactionName}`;
      const metaString = meta ? Object.entries(meta).map(([k, v]) => `${k}=${v}`).join(',') : '';
      return Event(eventName, metaString);
    }

    async function EventInteractionComplete(interactionName: string, score: number, meta?: Record<string, string>): Promise<ApiResponse<{ status: string }>> {
      const eventName = `interaction_complete_${interactionName}`;
      const metaWithScore = { ...meta, score: score.toString() };
      const metaString = Object.entries(metaWithScore).map(([k, v]) => `${k}=${v}`).join(',');
      return Event(eventName, metaString);
    }

    async function SetStorageEntry(data: Record<string, string>, name: string = "state", keepLatest: boolean = true, origin?: string, sessionData: boolean = false): Promise<ApiResponse<void>> {
      const storageData: StorageSchema = {
        data: [
          {
            timestamp: new Date().toISOString(),
            keepPolicy: keepLatest ? 'keepLatest' : 'append',
            name,
            data: [data],
            origin,
            sessionData
          }
        ]
      };

      try {
        return await storageController.storeData(storageData);
      } catch (error) {
        logError('Setting storage entry', error);
        throw error;
      }
    }

    async function GetStorageEntry(name: string = "state", origin?: string, tagsAny?: string[], tagsAll?: string[], userOnly: boolean = false): Promise<ApiResponse<Record<string, string>>> {
      try {
        const response = await storageController.getData({ name, origin, tagsAny, tagsAll, userOnly });
        if (response.data && response.data.data && response.data.data.length > 0) {
          return { ...response, data: response.data.data[0].data[0] };
        }
        return { ...response, data: {} };
      } catch (error) {
        logError('Getting storage entry', error);
        throw error;
      }
    }

    async function RemoveStorageEntry(name: string = "state"): Promise<ApiResponse<{ status: string }>> {
      try {
        return await storageController.resetData({ name });
      } catch (error) {
        logError('Removing storage entry', error);
        throw error;
      }
    }

    async function GetAllStorageEntries(): Promise<ApiResponse<Record<string, Record<string, string>>>> {
      try {
        const response = await storageController.getData();
        const allEntries: Record<string, Record<string, string>> = {};
        if (response.data && response.data.data) {
          response.data.data.forEach(entry => {
            allEntries[entry.name] = entry.data[0];
          });
        }
        return { ...response, data: allEntries };
      } catch (error) {
        logError('Getting all storage entries', error);
        throw error;
      }
    }

    await initialize(); // Wait for initialization to complete

    const iXRInstance: iXRInstance = {
      Event,
      LogInfo,
      LogError,
      LogWarning,
      Telemetry,
      Ping,
      AIProxy,
      StoreData,
      GetData,
      ResetData,
      GetStorageConfig,
      EventLevelStart,
      EventLevelComplete,
      EventAssessmentStart,
      EventAssessmentComplete,
      EventObjectiveStart,
      EventObjectiveComplete,
      EventInteractionStart,
      EventInteractionComplete,
      SetStorageEntry,
      GetStorageEntry,
      RemoveStorageEntry,
      GetAllStorageEntries
    };

    return iXRInstance;
  } catch (error) {
    logError('Creating iXR instance', error);
    throw error;
  }
}

async function getAuthDataFromUrl(): Promise<Partial<AuthenticationRequestSchema>> {
  if (typeof window === 'undefined' || !window.location) {
    console.log('Window or window.location is undefined');
    return {};
  }

  const urlParams = new URLSearchParams(window.location.search);
  console.log('URL search params:', urlParams.toString());

  const authData: Partial<AuthenticationRequestSchema> = {};
  const authParams: (keyof AuthenticationRequestSchema)[] = ['orgId', 'orgId', 'authSecret', 'deviceId', 'deviceModel', 'ipAddress', 'tags', 'geolocation'];

  for (const param of authParams) {
    const ixrValue = urlParams.get(`ixr_${param.toLowerCase()}`);
    const xrdmValue = urlParams.get(`xrdm_${param.toLowerCase()}`);
    const value = ixrValue !== null ? ixrValue : xrdmValue;
    
    console.log(`Checking for ${param}: ${value}`);
    if (value) {
      if (param === 'tags') {
        authData[param] = value.split(',');
      } else if (param === 'geolocation') {
        try {
          authData[param] = JSON.parse(value);
        } catch (error) {
          logError('Parsing geolocation', error);
        }
      } else {
        (authData[param] as any) = value;
      }
    }
  }

  console.log('Parsed auth data from URL:', authData);
  return authData;
}

function redirectWithoutAuthParams(): void {
  if (typeof window !== 'undefined' && window.location && window.history && window.history.replaceState) {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    
    // Create a new URLSearchParams object to store non-auth params
    const newParams = new URLSearchParams();
    
    // Iterate through all params and keep only those not starting with 'xrdm_' or 'ixr_'
    for (const [key, value] of params.entries()) {
      if (!key.startsWith('xrdm_') && !key.startsWith('ixr_')) {
        newParams.append(key, value);
      }
    }
    
    // Update the URL with the new params
    url.search = newParams.toString();
    window.history.replaceState({}, '', url.toString());
  }
}
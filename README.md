# iXRLibForWebXR

iXRLibForWebXR is a JavaScript/TypeScript library for integrating XR analytics and services into web applications.

## Installation

Install using npm:

```bash
npm install ixrlibforwebxr
```

## Quick Start

```typescript
import { iXRInit } from 'ixrlibforwebxr';

async function main() {
  const authData = {
    appId: 'your-app-id',
    orgId: 'your-org-id',
    deviceId: 'web-xr',
    authSecret: 'your-auth-secret'
  };

  const iXR = await iXRInit(authData);

  // Log an event
  await iXR.Event('user_action', 'action=click,target=button');

  // Log info
  await iXR.LogInfo('User completed onboarding');

  // Send telemetry data
  await iXR.Telemetry('performance_metrics', { fps: 60, latency: 20 });
}

main();
```

## Key Features

- Event tracking
- Logging (Info, Warning, Error)
- Telemetry data collection
- AI/LLM integration
- Data storage and retrieval
- Authentication and session management

## API Reference

### iXRInit(authData: AuthenticationRequestSchema): Promise<iXRInstance>

Creates and initializes an iXR instance.

### iXRInstance Methods

- `Event(name: string, metaString: string): Promise<ApiResponse<{ status: string }>>`
- `LogInfo(message: string): Promise<ApiResponse<{ status: string }>>`
- `LogWarning(message: string): Promise<ApiResponse<{ status: string }>>`
- `LogError(message: string): Promise<ApiResponse<{ status: string }>>`
- `Telemetry(name: string, data: Record<string, any>): Promise<ApiResponse<{ status: string }>>`
- `Ping(): Promise<ApiResponse<void>>`
- `AIProxy(prompt: string, llmProvider?: string, pastMessages?: Array<{role: string, content: string}>): Promise<ApiResponse<any>>`
- `StoreData(name: string, data: Record<string, any>, keepPolicy?: string, origin?: string, sessionData?: boolean): Promise<ApiResponse<void>>`
- `GetData(params?: { name?: string; origin?: string; tagsAny?: string[]; tagsAll?: string[]; userOnly?: boolean }): Promise<ApiResponse<StorageSchema>>`
- `ResetData(params?: { sessionOnly?: boolean; name?: string; userOnly?: boolean }): Promise<ApiResponse<{ status: string }>>`
- `GetStorageConfig(): Promise<ApiResponse<any>>`

## Authentication

To use iXRLibForWebXR, you need to provide authentication data when creating an iXR instance. The required fields are:

- `appId`: Your application ID
- `orgId`: Your organization ID
- `deviceId`: A unique identifier for the device or session
- `authSecret`: Your authentication secret

Optional fields include `userId`, `tags`, `sessionId`, `partner`, `ipAddress`, `deviceModel`, `geolocation`, `osVersion`, `xrdmVersion`, and `appVersion`.

## Event Tracking

Use the `Event` method to track user actions and custom events:

```typescript
await iXR.Event('button_click', 'action=submit,page=checkout');
```

## Logging

iXRLibForWebXR provides three logging levels:

```typescript
await iXR.LogInfo('User logged in successfully');
await iXR.LogWarning('Low storage space detected');
await iXR.LogError('Failed to process payment');
```

## Telemetry

Send custom telemetry data using the `Telemetry` method:

```typescript
await iXR.Telemetry('performance_metrics', { fps: 60, memory_usage: 512 });
```

## AI/LLM Integration

Use the `AIProxy` method to interact with AI language models:

```typescript
const response = await iXR.AIProxy('Translate "Hello" to French', 'gpt-3.5-turbo');
```

## Data Storage

Store and retrieve custom data:

```typescript
await iXR.StoreData('user_progress', { level: 5, score: 1000 }, 'keepLatest');
const data = await iXR.GetData({ name: 'user_progress' });
```

## Best Practices

1. Initialize the iXR instance early in your application lifecycle.
2. Use meaningful event names and metadata for better analytics.
3. Handle errors gracefully, especially for network-dependent operations.
4. Use appropriate log levels (Info, Warning, Error) for different scenarios.
5. Leverage the storage API for persisting user data across sessions.

## Support

For issues, feature requests, or questions, please open an issue on our GitHub repository.

## License

Apache 2.0
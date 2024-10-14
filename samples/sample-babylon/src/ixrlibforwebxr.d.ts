declare module 'ixrlibforwebxr/dist/iXR' {
  export interface iXRInstance {
    LogInfo(message: string): Promise<any>;
    // Add other methods as needed
  }

  export function iXRInit(config: { appId: string }): Promise<iXRInstance>;
}

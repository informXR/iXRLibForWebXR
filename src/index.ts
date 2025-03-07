import { iXRLibInit } from "./iXRLibAnalytics";
import { iXRLibStorage } from "./iXRLibStorage";
import { iXRLibAsync } from "./iXRLibAsync";
import { iXRLibSend } from "./iXRLibSend";
import { ConfigurationManager, DateTime, iXRResult, PythonDictStrings, StringList, TimeSpan } from './network/utils/DotNetishTypes';

// Initialize all static members
iXRLibInit.InitStatics();
iXRLibStorage.InitStatics();
iXRLibAsync.InitStatics();

class iXRLibBaseSetup {
    public static SetAppConfig(customConfig?: string): void
    {
        const defaultConfig: string = '<?xml version="1.0" encoding="utf-8" ?>' +
            '<configuration>' +
                '<appSettings>' +
                    '<add key="REST_URL" value="https://dev-libapi.informxr.io/v1/"/>' +
                    '<add key="SendRetriesOnFailure" value="3"/>' +
                    '<!-- Bandwidth config parameters. -->' +
                    '<add key="SendRetryInterval" value="00:00:03"/>' +
                    '<add key="SendNextBatchWait" value="00:00:30"/>' +
                    '<!-- 0 = infinite, i.e. never send remainders = always send exactly EventsPerSendAttempt. -->' +
                    '<add key="StragglerTimeout" value="00:00:15"/>' +
                    '<!-- 0 = Send all not-already-sent. -->' +
                    '<add key="EventsPerSendAttempt" value="4"/>' +
                    '<add key="LogsPerSendAttempt" value="4"/>' +
                    '<add key="TelemetryEntriesPerSendAttempt" value="4"/>' +
                    '<add key="StorageEntriesPerSendAttempt" value="4"/>' +
                    '<!-- 0 = infinite, i.e. never prune. -->' +
                    '<add key="PruneSentItemsOlderThan" value="12:00:00"/>' +
                    '<add key="MaximumCachedItems" value="1024"/>' +
                    '<add key="RetainLocalAfterSent" value="false"/>' +
                '</appSettings>' +
            '</configuration>';

        const szAppConfig = customConfig || defaultConfig;
        console.log(`Using ${customConfig ? 'user-defined' : 'default'} config`);
        ConfigurationManager.DebugSetAppConfig(szAppConfig);
    }

    // Add any other base setup methods here
    public static InitializeAll(): void {
        iXRLibBaseSetup.SetAppConfig();
        // Add any other initialization steps needed
    }
}

// Export the main library objects that consumers will need
export {
    iXRLibInit,
    iXRLibStorage,
    iXRLibAsync,
    iXRLibSend,
    iXRLibBaseSetup,
    PythonDictStrings as DictStrings
};

// Create a global instance for direct access
//if (typeof window !== 'undefined') {
//    (window as any).iXR = iXRLibBaseSetup;
//}

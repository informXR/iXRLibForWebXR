import { iXRLibInit } from "./iXRLibAnalytics";
import { iXRLibStorage } from "./iXRLibStorage";
import { iXRLibAsync } from "./iXRLibAsync";
import { ConfigurationManager, DateTime, iXRResult, PythonDictStrings, StringList, TimeSpan } from './network/utils/DotNetishTypes';

// Initialize all static members
iXRLibInit.InitStatics();
iXRLibStorage.InitStatics();
iXRLibAsync.InitStatics();

export class iXRLibBaseSetup {
    public static SetAppConfig(): void
    {
        var szAppConfig:	string = '<?xml version="1.0" encoding="utf-8" ?>' +
            '<configuration>' +
                '<appSettings>' +
                    '<add key="REST_URL" value="http://192.168.5.24:9000/v1/"/>' +
                    '<!--<add key="REST_URL" value="http://192.168.5.2:19080/"/>-->' +
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
}; 
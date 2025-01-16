import { iXRLibClient } from "./iXRLibClient";
import { iXRAIProxy, iXRDbContext, iXRLibConfiguration, iXRStorage, iXRXXXContainer } from "./iXRLibCoreModel";
import { iXRResult, PythonDictStrings, TimeSpan } from "./network/utils/DotNetishTypes";
import { iXRLibAnalytics, iXRLibInit } from "./iXRLibAnalytics"

// --- MJP:  templatize these?
type iXRLibAnalyticsAIProxyCallback = (ixrAIProxy: iXRAIProxy, eResult: iXRResult, szExceptionMessage: string) => void;
type iXRLibAnalyticsStorageCallback = (ixrStorage: iXRStorage, eResult: iXRResult, szExceptionMessage: string) => void;
// ---
export class iXRLibStorage
{
	public static m_ixrLibConfiguration:	iXRLibConfiguration;
	// ---
	public static InitStatics(): void
	{
		this.m_ixrLibConfiguration = new iXRLibConfiguration();
	}
	// MJP:  Retaining this in comments to remind myself of this approach which may come in handy for something else though I am standardizing on InitStatics() for all statics.
	//public static get m_ixrLibConfiguration(): iXRLibConfiguration {if (!iXRLibStorage.v_ixrLibConfiguration) {iXRLibStorage.v_ixrLibConfiguration = new iXRLibConfiguration();} return iXRLibStorage.v_ixrLibConfiguration;}
	// ---
	/// <summary>
	/// GET "/config" endpoint and merge with m_ixrLibConfiguration read locally.
	///		Note the (potential) catch-22:  at least the REST_URL entry MUST be
	///		set in the App.config on the headset so this knows WHAT backend.
	///		Also, this is done after auth.
	/// </summary>
	/// <param name="bLookForAuthMechanism">true = copy iXRLibStorage.m_ixrLibConfiguration.m_dictAuthMechanism into iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism.
	///		That is, this is part of an auth at the specific point (first Authenticate()) where we need to obtain extra-auth-data.
	///		false = not only do not copy it but destroy it as it is not needed and would gum up the works on the backend.
	/// </param>
	/// <returns>iXRResult status code.</returns>
	public static async ReadConfigFromBackend(bLookForAuthMechanism: boolean): Promise<iXRResult>
	{
		var	eRet:	iXRResult = await iXRLibClient.GetIXRConfig(iXRLibStorage.m_ixrLibConfiguration);

		if (eRet === iXRResult.eOk)
		{
			if (bLookForAuthMechanism)
			{
				iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism = iXRLibStorage.m_ixrLibConfiguration.m_dictAuthMechanism;
			}
			else
			{
				iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism.clear();
				iXRLibStorage.m_ixrLibConfiguration.m_dictAuthMechanism.clear();
			}
		}
		// ---
		return eRet;
	}
	/// <summary>
	/// GET "/storage" endpoint
	/// </summary>
	/// <returns></returns>
	public static async ReadStorageFromBackend(): Promise<iXRResult>
	{
		var	ixrStorage:	iXRXXXContainer<iXRStorage, PythonDictStrings, false> = new iXRXXXContainer<iXRStorage, PythonDictStrings, false>(iXRStorage, PythonDictStrings);

		return iXRLibClient.GetIXRStorage(ixrStorage);
	}
	// --- Configuration fields.
	public static get_RestUrl(): string { return iXRLibStorage.m_ixrLibConfiguration.GetRestUrl(); }
	public static set_RestUrl(szValue: string): void { iXRLibStorage.m_ixrLibConfiguration.SetRestUrl(szValue); }
	// ---
	public static get_SendRetriesOnFailure(): number { return iXRLibStorage.m_ixrLibConfiguration.m_nSendRetriesOnFailure; }
	public static set_SendRetriesOnFailure(nValue: number): void { iXRLibStorage.m_ixrLibConfiguration.m_nSendRetriesOnFailure = nValue; }
	// ---
	public static get_SendRetryInterval(): TimeSpan { return iXRLibStorage.m_ixrLibConfiguration.m_tsSendRetryInterval; }
	public static set_SendRetryInterval(tsValue: TimeSpan): void { iXRLibStorage.m_ixrLibConfiguration.m_tsSendRetryInterval = tsValue; }
	// ---
	public static get_SendNextBatchWait(): TimeSpan { return iXRLibStorage.m_ixrLibConfiguration.m_tsSendNextBatchWait; }
	public static set_SendNextBatchWait(tsValue: TimeSpan): void { iXRLibStorage.m_ixrLibConfiguration.m_tsSendNextBatchWait = tsValue; }
	// ---
	public static get_StragglerTimeout(): TimeSpan { return iXRLibStorage.m_ixrLibConfiguration.m_tsStragglerTimeout; }
	public static set_StragglerTimeout(tsValue: TimeSpan): void { iXRLibStorage.m_ixrLibConfiguration.m_tsStragglerTimeout = tsValue; }
	// ---
	public static get_EventsPerSendAttempt(): number { return iXRLibStorage.m_ixrLibConfiguration.m_nEventsPerSendAttempt; }
	public static set_EventsPerSendAttempt(nValue: number): void { iXRLibStorage.m_ixrLibConfiguration.m_nEventsPerSendAttempt = nValue; }
	// ---
	public static get_LogsPerSendAttempt(): number { return iXRLibStorage.m_ixrLibConfiguration.m_nLogsPerSendAttempt; }
	public static set_LogsPerSendAttempt(nValue: number): void { iXRLibStorage.m_ixrLibConfiguration.m_nLogsPerSendAttempt = nValue; }
	// ---
	public static get_TelemetryEntriesPerSendAttempt(): number { return iXRLibStorage.m_ixrLibConfiguration.m_nTelemetryEntriesPerSendAttempt; }
	public static set_TelemetryEntriesPerSendAttempt(nValue: number): void { iXRLibStorage.m_ixrLibConfiguration.m_nTelemetryEntriesPerSendAttempt = nValue; }
	// ---
	public static get_StorageEntriesPerSendAttempt(): number { return iXRLibStorage.m_ixrLibConfiguration.m_nStorageEntriesPerSendAttempt; }
	public static set_StorageEntriesPerSendAttempt(nValue: number): void { iXRLibStorage.m_ixrLibConfiguration.m_nStorageEntriesPerSendAttempt = nValue; }
	// ---
	public static get_PruneSentItemsOlderThan(): TimeSpan { return iXRLibStorage.m_ixrLibConfiguration.m_tsPruneSentItemsOlderThan; }
	public static set_PruneSentItemsOlderThan(tsValue: TimeSpan): void { iXRLibStorage.m_ixrLibConfiguration.m_tsPruneSentItemsOlderThan = tsValue; }
	// ---
	public static get_MaximumCachedItems(): number { return iXRLibStorage.m_ixrLibConfiguration.m_nMaximumCachedItems; }
	public static set_MaximumCachedItems(nValue: number): void { iXRLibStorage.m_ixrLibConfiguration.m_nMaximumCachedItems = nValue; }
	// ---
	public static get_RetainLocalAfterSent(): boolean { return iXRLibStorage.m_ixrLibConfiguration.m_bRetainLocalAfterSent; }
	public static set_RetainLocalAfterSent(bValue: boolean): void { iXRLibStorage.m_ixrLibConfiguration.m_bRetainLocalAfterSent = bValue; }
	// ---
	public static get_ReAuthenticateBeforeTokenExpires() { return iXRLibStorage.m_ixrLibConfiguration.m_bReAuthenticateBeforeTokenExpires; }
	public static set_ReAuthenticateBeforeTokenExpires(bValue: boolean): void { iXRLibStorage.m_ixrLibConfiguration.m_bReAuthenticateBeforeTokenExpires = bValue; }
	// ---
	public static get_UseDatabase() { return iXRLibStorage.m_ixrLibConfiguration.m_bUseDatabase; }
	public static set_UseDatabase(bValue: boolean): void { iXRLibStorage.m_ixrLibConfiguration.m_bUseDatabase = bValue; }
	// ---
	public static get_AuthMechanism(): PythonDictStrings { return iXRLibStorage.m_ixrLibConfiguration.m_dictAuthMechanism; }
	public static set_AuthMechanism(dictValue: PythonDictStrings): void { iXRLibStorage.m_ixrLibConfiguration.m_dictAuthMechanism = dictValue; }
	// ---
	public static ReadConfig(): boolean { return iXRLibStorage.m_ixrLibConfiguration.ReadConfig(); }
	// --- End Configuration fields.
	// --- Environment / storage entry functions.
	//		For 1.0 release, will construct an iXRDbContext on the fly and do the operation.  Seems like it can be that way in perpetuity
	//		as reading/writing config and storage entries would not be done that often and is not a speed-critical operation (and there should
	//		never be that many of them).
	// Default name 'state'
	public static async GetEntryAsString0(): Promise<string>
	{
		var	dbContext:	iXRDbContext = new iXRDbContext(false);
		// ---
		return await dbContext.StorageGetEntryAsString0();
	}
	public static async GetEntryAsString1(szName: string): Promise<string>
	{
		var	dbContext:	iXRDbContext = new iXRDbContext(false);
		// ---
		return await dbContext.StorageGetEntryAsString1(szName);
	}
	public static async GetEntryRaw0(): Promise<PythonDictStrings | null>
	{
		var	dbContext:	iXRDbContext = new iXRDbContext(false);
		// ---
		return await dbContext.StorageGetEntry0();
	}
	public static async GetEntryRaw1(szName: string): Promise<PythonDictStrings | null>
	{
		var	dbContext:	iXRDbContext = new iXRDbContext(false);
		// ---
		return await dbContext.StorageGetEntry1(szName);
	}
	// Default name 'state'
	public static async SetEntry0(szdictData: string, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): Promise<iXRResult>
	{
		var	dbContext:	iXRDbContext = new iXRDbContext(false);
		// ---
		return await dbContext.StorageSetEntry0(szdictData, bKeepLatest, szOrigin, bSessionData);
	}
	public static async SetEntry1(szName: string, szdictData: string, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): Promise<iXRResult>
	{
		var	dbContext:	iXRDbContext = new iXRDbContext(false);
		// ---
		return await dbContext.StorageSetEntry1(szName, szdictData, bKeepLatest, szOrigin, bSessionData);
	}
	// Default name 'state'
	public static async SetEntry2(dictData: PythonDictStrings, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): Promise<iXRResult>
	{
		var	dbContext:	iXRDbContext = new iXRDbContext(false);
		// ---
		return await dbContext.StorageSetEntry2(dictData, bKeepLatest, szOrigin, bSessionData);
	}
	public static async SetEntry3(szName: string, dictData: PythonDictStrings, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): Promise<iXRResult>
	{
		var	dbContext:	iXRDbContext = new iXRDbContext(false);
		// ---
		return await dbContext.StorageSetEntry3(szName, dictData, bKeepLatest, szOrigin, bSessionData);
	}
	// Default name 'state'
	public static async RemoveEntry4(): Promise<iXRResult>
	{
		var	dbContext:	iXRDbContext = new iXRDbContext(false);
		// ---
		return await dbContext.StorageRemoveEntry0();
	}
	public static async RemoveEntry5(szName: string): Promise<iXRResult>
	{
		var	dbContext:	iXRDbContext = new iXRDbContext(false);
		// ---
		return await dbContext.StorageRemoveEntry1(szName);
	}
	public static async RemoveMultipleEntries(bSessionOnly: boolean): Promise<iXRResult>
	{
		var	dbContext:	iXRDbContext = new iXRDbContext(false);
		// ---
		return await dbContext.StorageRemoveMultipleEntries(bSessionOnly);
	}
	// --- END Environment / state data functions.
	public static async AddEntrySynchronous(ixrStorage: iXRStorage): Promise<iXRResult>
	{
		return await iXRLibAnalytics.AddXXXTask<iXRStorage>(ixrStorage, iXRStorage, "IXRStorage", iXRLibClient.PostIXRStorage, true, false, null);
	}
	public static async AddEntry(ixrStorage: iXRStorage, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsStorageCallback): Promise<iXRResult>
	{
		iXRLibAnalytics.DiagnosticWriteLine("Going to call DeleteStorage().");
		// Notice the = capture... so pfnStatusCallback propagates by copy into the thread.
		return iXRLibAnalytics.m_ixrLibAsync.AddTask((pObject: any): Promise<iXRResult> => { return iXRLibAnalytics.AddXXXTask<iXRStorage>(pObject, iXRStorage, "IXRStorage", iXRLibClient.PostIXRStorage, true, bNoCallbackOnSuccess, pfnStatusCallback).then((eRet: iXRResult) => { return eRet; }).catch((eRet: iXRResult) => { return eRet; }); },
			ixrStorage,
			(pObject: any) => void { /*delete (iXRStorage*)pObject;*/ });
	}
};

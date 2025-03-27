import { AbxrLibClient } from "./AbxrLibClient";
import { AbxrAIProxy, AbxrDbContext, AbxrLibConfiguration, AbxrStorage, AbxrXXXContainer, DbSetStorage } from "./AbxrLibCoreModel";
import { AbxrResult, AbxrDictStrings, TimeSpan } from "./network/utils/DotNetishTypes";
import { AbxrLibAnalytics, AbxrLibInit } from "./AbxrLibAnalytics"

// --- MJP:  templatize these?
type AbxrLibAnalyticsAIProxyCallback = (abxrAIProxy: AbxrAIProxy, eResult: AbxrResult, szExceptionMessage: string) => void;
type AbxrLibAnalyticsStorageCallback = (abxrStorage: AbxrStorage, eResult: AbxrResult, szExceptionMessage: string) => void;
// ---
export class AbxrLibStorage
{
	public static m_abxrLibConfiguration:	AbxrLibConfiguration;
	// ---
	public static InitStatics(): void
	{
		this.m_abxrLibConfiguration = new AbxrLibConfiguration();
	}
	// MJP:  Retaining this in comments to remind myself of this approach which may come in handy for something else though I am standardizing on InitStatics() for all statics.
	//public static get m_abxrLibConfiguration(): AbxrLibConfiguration {if (!AbxrLibStorage.v_abxrLibConfiguration) {AbxrLibStorage.v_abxrLibConfiguration = new AbxrLibConfiguration();} return AbxrLibStorage.v_abxrLibConfiguration;}
	// ---
	/// <summary>
	/// GET "/config" endpoint and merge with m_abxrLibConfiguration read locally.
	///		Note the (potential) catch-22:  at least the REST_URL entry MUST be
	///		set in the App.config on the headset so this knows WHAT backend.
	///		Also, this is done after auth.
	/// </summary>
	/// <param name="bLookForAuthMechanism">true = copy AbxrLibStorage.m_abxrLibConfiguration.m_dictAuthMechanism into AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism.
	///		That is, this is part of an auth at the specific point (first Authenticate()) where we need to obtain extra-auth-data.
	///		false = not only do not copy it but destroy it as it is not needed and would gum up the works on the backend.
	/// </param>
	/// <returns>AbxrResult status code.</returns>
	public static async ReadConfigFromBackend(bLookForAuthMechanism: boolean): Promise<AbxrResult>
	{
		var	eRet:	AbxrResult = await AbxrLibClient.GetABXRConfig(AbxrLibStorage.m_abxrLibConfiguration);

		if (eRet === AbxrResult.eOk)
		{
			if (bLookForAuthMechanism)
			{
				AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism = Object.assign({}, AbxrLibStorage.m_abxrLibConfiguration.m_dictAuthMechanism);
			}
			else
			{
				AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism.clear();
				AbxrLibStorage.m_abxrLibConfiguration.m_dictAuthMechanism.clear();
			}
		}
		// ---
		return eRet;
	}
	/// <summary>
	/// GET "/storage" endpoint
	/// </summary>
	/// <returns></returns>
	public static async ReadStorageFromBackend(): Promise<AbxrResult>
	{
		var	abxrStorage:	AbxrXXXContainer<AbxrStorage, AbxrDictStrings, false> = new AbxrXXXContainer<AbxrStorage, AbxrDictStrings, false>(AbxrStorage, AbxrDictStrings);

		return AbxrLibClient.GetABXRStorage(abxrStorage);
	}
	// --- Configuration fields.
	public static get_RestUrl(): string { return AbxrLibStorage.m_abxrLibConfiguration.GetRestUrl(); }
	public static set_RestUrl(szValue: string): void { AbxrLibStorage.m_abxrLibConfiguration.SetRestUrl(szValue); }
	// ---
	public static get_SendRetriesOnFailure(): number { return AbxrLibStorage.m_abxrLibConfiguration.m_nSendRetriesOnFailure; }
	public static set_SendRetriesOnFailure(nValue: number): void { AbxrLibStorage.m_abxrLibConfiguration.m_nSendRetriesOnFailure = nValue; }
	// ---
	public static get_SendRetryInterval(): TimeSpan { return AbxrLibStorage.m_abxrLibConfiguration.m_tsSendRetryInterval; }
	public static set_SendRetryInterval(tsValue: TimeSpan): void { AbxrLibStorage.m_abxrLibConfiguration.m_tsSendRetryInterval = tsValue; }
	// ---
	public static get_SendNextBatchWait(): TimeSpan { return AbxrLibStorage.m_abxrLibConfiguration.m_tsSendNextBatchWait; }
	public static set_SendNextBatchWait(tsValue: TimeSpan): void { AbxrLibStorage.m_abxrLibConfiguration.m_tsSendNextBatchWait = tsValue; }
	// ---
	public static get_StragglerTimeout(): TimeSpan { return AbxrLibStorage.m_abxrLibConfiguration.m_tsStragglerTimeout; }
	public static set_StragglerTimeout(tsValue: TimeSpan): void { AbxrLibStorage.m_abxrLibConfiguration.m_tsStragglerTimeout = tsValue; }
	// ---
	public static get_PositionCapturePeriodicity(): number { return AbxrLibStorage.m_abxrLibConfiguration.m_dPositionCapturePeriodicity; }
	public static set_PositionCapturePeriodicity(dValue: number): void { AbxrLibStorage.m_abxrLibConfiguration.m_dPositionCapturePeriodicity = dValue; }
	// ---
	public static get_FrameRateCapturePeriodicity(): number { return AbxrLibStorage.m_abxrLibConfiguration.m_dFrameRateCapturePeriodicity; }
	public static set_FrameRateCapturePeriodicity(dValue: number): void { AbxrLibStorage.m_abxrLibConfiguration.m_dFrameRateCapturePeriodicity = dValue; }
	// ---
	public static get_TelemetryCapturePeriodicity(): number { return AbxrLibStorage.m_abxrLibConfiguration.m_dTelemetryCapturePeriodicity; }
	public static set_TelemetryCapturePeriodicity(dValue: number): void { AbxrLibStorage.m_abxrLibConfiguration.m_dTelemetryCapturePeriodicity = dValue; }
	// ---
	public static get_EventsPerSendAttempt(): number { return AbxrLibStorage.m_abxrLibConfiguration.m_nEventsPerSendAttempt; }
	public static set_EventsPerSendAttempt(nValue: number): void { AbxrLibStorage.m_abxrLibConfiguration.m_nEventsPerSendAttempt = nValue; }
	// ---
	public static get_LogsPerSendAttempt(): number { return AbxrLibStorage.m_abxrLibConfiguration.m_nLogsPerSendAttempt; }
	public static set_LogsPerSendAttempt(nValue: number): void { AbxrLibStorage.m_abxrLibConfiguration.m_nLogsPerSendAttempt = nValue; }
	// ---
	public static get_TelemetryEntriesPerSendAttempt(): number { return AbxrLibStorage.m_abxrLibConfiguration.m_nTelemetryEntriesPerSendAttempt; }
	public static set_TelemetryEntriesPerSendAttempt(nValue: number): void { AbxrLibStorage.m_abxrLibConfiguration.m_nTelemetryEntriesPerSendAttempt = nValue; }
	// ---
	public static get_StorageEntriesPerSendAttempt(): number { return AbxrLibStorage.m_abxrLibConfiguration.m_nStorageEntriesPerSendAttempt; }
	public static set_StorageEntriesPerSendAttempt(nValue: number): void { AbxrLibStorage.m_abxrLibConfiguration.m_nStorageEntriesPerSendAttempt = nValue; }
	// ---
	public static get_PruneSentItemsOlderThan(): TimeSpan { return AbxrLibStorage.m_abxrLibConfiguration.m_tsPruneSentItemsOlderThan; }
	public static set_PruneSentItemsOlderThan(tsValue: TimeSpan): void { AbxrLibStorage.m_abxrLibConfiguration.m_tsPruneSentItemsOlderThan = tsValue; }
	// ---
	public static get_MaximumCachedItems(): number { return AbxrLibStorage.m_abxrLibConfiguration.m_nMaximumCachedItems; }
	public static set_MaximumCachedItems(nValue: number): void { AbxrLibStorage.m_abxrLibConfiguration.m_nMaximumCachedItems = nValue; }
	// ---
	public static get_RetainLocalAfterSent(): boolean { return AbxrLibStorage.m_abxrLibConfiguration.m_bRetainLocalAfterSent; }
	public static set_RetainLocalAfterSent(bValue: boolean): void { AbxrLibStorage.m_abxrLibConfiguration.m_bRetainLocalAfterSent = bValue; }
	// ---
	public static get_ReAuthenticateBeforeTokenExpires() { return AbxrLibStorage.m_abxrLibConfiguration.m_bReAuthenticateBeforeTokenExpires; }
	public static set_ReAuthenticateBeforeTokenExpires(bValue: boolean): void { AbxrLibStorage.m_abxrLibConfiguration.m_bReAuthenticateBeforeTokenExpires = bValue; }
	// ---
	public static get_UseDatabase() { return AbxrLibStorage.m_abxrLibConfiguration.m_bUseDatabase; }
	public static set_UseDatabase(bValue: boolean): void { AbxrLibStorage.m_abxrLibConfiguration.m_bUseDatabase = bValue; }
	// ---
	public static get_AuthMechanism(): AbxrDictStrings { return AbxrLibStorage.m_abxrLibConfiguration.m_dictAuthMechanism; }
	public static set_AuthMechanism(dictValue: AbxrDictStrings): void { AbxrLibStorage.m_abxrLibConfiguration.m_dictAuthMechanism = dictValue; }
	// ---
	public static ReadConfig(): boolean { return AbxrLibStorage.m_abxrLibConfiguration.ReadConfig(); }
	// --- End Configuration fields.
	// --- Environment / storage entry functions.
	//		For 1.0 release, will construct an AbxrDbContext on the fly and do the operation.  Seems like it can be that way in perpetuity
	//		as reading/writing config and storage entries would not be done that often and is not a speed-critical operation (and there should
	//		never be that many of them).
	// Default name 'state'
	public static async GetEntryAsString(szName: string = DbSetStorage.DEFAULTNAME): Promise<string> 
	{
		const dbContext: AbxrDbContext = new AbxrDbContext(false);
		return await dbContext.StorageGetEntryAsString(szName);
	}
	// Merge GetEntryRaw0 and GetEntryRaw1
	public static async GetEntryRaw(szName: string = DbSetStorage.DEFAULTNAME): Promise<AbxrDictStrings | null> 
	{
		const dbContext: AbxrDbContext = new AbxrDbContext(false);
		return await dbContext.StorageGetEntry(szName);
	}
	// Merge all SetEntry functions (0,1,2,3)
	public static async SetEntry(
		data: string | AbxrDictStrings,
		bKeepLatest: boolean,
		szOrigin: string,
		bSessionData: boolean,
		szName: string = DbSetStorage.DEFAULTNAME
	): Promise<AbxrResult> {
		const dbContext: AbxrDbContext = new AbxrDbContext(false);
		return await dbContext.StorageSetEntry(
			data,
			bKeepLatest,
			szOrigin,
			bSessionData,
			szName
		);
	}
	// Merge RemoveEntry4 and RemoveEntry5
	public static async RemoveEntry(szName: string = DbSetStorage.DEFAULTNAME): Promise<AbxrResult> 
	{
		const dbContext:	AbxrDbContext = new AbxrDbContext(false);
		// ---
		return await dbContext.StorageRemoveEntry(szName);
	}
	public static async RemoveMultipleEntries(bSessionOnly: boolean): Promise<AbxrResult> 
	{
		const dbContext: AbxrDbContext = new AbxrDbContext(false);
		return await dbContext.StorageRemoveMultipleEntries(bSessionOnly);
	}
	// --- END Environment / state data functions.
	public static async AddEntry(abxrStorage: AbxrStorage): Promise<AbxrResult>
	{
		return await AbxrLibAnalytics.AddXXXTask<AbxrStorage>(abxrStorage, AbxrStorage, "ABXRStorage", AbxrLibClient.PostABXRStorage, true, false, null);
	}
	// public static async AddEntryDeferred(abxrStorage: AbxrStorage, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsStorageCallback): Promise<AbxrResult>
	// {
	// 	AbxrLibAnalytics.DiagnosticWriteLine("Going to call DeleteStorage().");
	// 	// Notice the = capture... so pfnStatusCallback propagates by copy into the thread.
	// 	return AbxrLibAnalytics.m_abxrLibAsync.AddTask((pObject: any): Promise<AbxrResult> => { return AbxrLibAnalytics.AddXXXTask<AbxrStorage>(pObject, AbxrStorage, "ABXRStorage", AbxrLibClient.PostABXRStorage, true, bNoCallbackOnSuccess, pfnStatusCallback).then((eRet: AbxrResult) => { return eRet; }).catch((eRet: AbxrResult) => { return eRet; }); },
	// 		abxrStorage,
	// 		(pObject: any) => void { /*delete (AbxrStorage*)pObject;*/ });
	// }
};

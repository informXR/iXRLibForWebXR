/// <summary>
/// API for sending objects to backend.

import { AbxrLibAnalytics } from "./AbxrLibAnalytics";
import { AbxrLibClient } from "./AbxrLibClient";
import { AbxrEvent, AbxrLog, AbxrTelemetry, LogLevel } from "./AbxrLibCoreModel";
import { DateTime, InteractionType, InteractionTypeToString, AbxrResult, AbxrDictStrings, ResultOptions, ResultOptionsToString, TimeSpan } from "./network/utils/DotNetishTypes";

// --- MJP:  templatize these?
export type AbxrLibAnalyticsLogCallback = (abxrLog: AbxrLog, eResult: AbxrResult, szExceptionMessage: string) => void;
export type AbxrLibAnalyticsEventCallback = (abxrEvent: AbxrEvent, eResult: AbxrResult, szExceptionMessage: string) => void;
export type AbxrLibAnalyticsTelemetryCallback = (abxrTelemetry: AbxrTelemetry, eResult: AbxrResult, szExceptionMessage: string) => void;
// ---
/// </summary>
export class AbxrLibSend
{
	// --- (C++ dll and C# dll) versions of LogXXX().
	private static async Log(eLogLevel: LogLevel, szText: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	{
		var	abxrLog:	AbxrLog = new AbxrLog().Construct(eLogLevel, szText, dictMeta);

		return await AbxrLibSend.AddLog(abxrLog);
	}
	// private static LogDeferred(eLogLevel: LogLevel, szText: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	// {
	// 	var	abxrLog:	AbxrLog = new AbxrLog().Construct(eLogLevel, szText, dictMeta);

	// 	return AbxrLibSend.AddLogDeferred(abxrLog, true, null);
	// }
	// ---
	public static async LogDebug(szText: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	{
		return await AbxrLibSend.Log(LogLevel.eDebug, szText, dictMeta);
	}
	// public static LogDebugDeferred(szText: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	// {
	// 	return AbxrLibSend.LogDeferred(LogLevel.eDebug, szText, dictMeta);
	// }
	public static async LogInfo(szText: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	{
		return await AbxrLibSend.Log(LogLevel.eInfo, szText, dictMeta);
	}
	// public static LogInfoDeferred(szText: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	// {
	// 	return AbxrLibSend.LogDeferred(LogLevel.eInfo, szText, dictMeta);
	// }
	public static async LogWarn(szText: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	{
		return await AbxrLibSend.Log(LogLevel.eWarn, szText, dictMeta);
	}
	// public static LogWarnDeferred(szText: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	// {
	// 	return AbxrLibSend.LogDeferred(LogLevel.eWarn, szText, dictMeta);
	// }
	public static async LogError(szText: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	{
		return await AbxrLibSend.Log(LogLevel.eError, szText, dictMeta);
	}
	// public static LogErrorDeferred(szText: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	// {
	// 	return AbxrLibSend.LogDeferred(LogLevel.eError, szText, dictMeta);
	// }
	public static async LogCritical(szText: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	{
		return await AbxrLibSend.Log(LogLevel.eCritical, szText, dictMeta);
	}
	// public static LogCriticalDeferred(szText: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	// {
	// 	return AbxrLibSend.LogDeferred(LogLevel.eCritical, szText, dictMeta);
	// }
	// --- End (C++ dll and C# dll) versions of LogXXX().
	// --- API (C++ dll and C# dll) versions of AbxrLibSend.Event().
	public static async Event(szName: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	{
		var	abxrEvent: AbxrEvent = new AbxrEvent().Construct(szName, dictMeta);

		return await AbxrLibSend.EventCore(abxrEvent);
	}
	// public static async EventDeferred(szName: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	// {
	// 	var	abxrEvent:	AbxrEvent = new AbxrEvent().Construct(szName, dictMeta);

	// 	return await AbxrLibSend.EventCoreDeferred(abxrEvent, true, null);
	// }
	// Convenient wrappers for particular forms of events.
	// Note these are all blocking because everything is in this TypeScript implementation.  In the C++ they call the EventDeferred() variations to not chunk the main thread.
	public static async EventAssessmentStart(szAssessmentName: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	{
		dictMeta.set("verb", "started");
		dictMeta.set("assessment_name", szAssessmentName);
		// Store the start time.
		//AbxrEvent.m_csDictProtect.lock();
		AbxrEvent.m_dictAssessmentStartTimes.set(szAssessmentName, new DateTime().FromUnixTime(DateTime.Now()));	// MJPQ:  Just use default ctor?
		//AbxrEvent.m_csDictProtect.unlock();
		// ---
		return await AbxrLibSend.Event("assessment_start", dictMeta);
	}
	public static async EventAssessmentComplete(szAssessmentName: string, szScore: string, eResultOptions: ResultOptions, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	{
		var	rpStartTime:	{vRet: DateTime} = {vRet: new DateTime()};
		var	bGotValue:		boolean;

		dictMeta.set("verb", "completed");
		dictMeta.set("assessment_name", szAssessmentName);
		dictMeta.set("score", szScore);
		dictMeta.set("result_options", ResultOptionsToString(eResultOptions));
		// Calculate and add duration if start time exists, otherwise use "0".
		//AbxrEvent.m_csDictProtect.lock();
		bGotValue = AbxrEvent.m_dictAssessmentStartTimes.TryGetValue(szAssessmentName, rpStartTime);
		//AbxrEvent.m_csDictProtect.unlock();
		if (bGotValue)
		{
			var	tsDuration:	TimeSpan = new TimeSpan().FromUnixTime(DateTime.Now() - rpStartTime.vRet.ToUnixTime());

			dictMeta.set("duration", tsDuration.ToString());
			// ---
			//AbxrEvent.m_csDictProtect.lock();
			AbxrEvent.m_dictAssessmentStartTimes.Remove(szAssessmentName);
			//AbxrEvent.m_csDictProtect.unlock();
		}
		else
		{
			dictMeta.set("duration", "0");
		}
		// ---
		return await AbxrLibSend.Event("assessment_complete", dictMeta);
	}
	public static async EventObjectiveStart(szObjectiveName: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	{
		dictMeta.set("verb", "started");
		dictMeta.set("objective_name", szObjectiveName);
		// Store the start time.
		//AbxrEvent.m_csDictProtect.lock();
		AbxrEvent.m_dictObjectiveStartTimes.set(szObjectiveName, new DateTime().FromUnixTime(DateTime.Now()));	// MJPQ:  Just use default ctor?
		//AbxrEvent.m_csDictProtect.unlock();
		// ---
		return await AbxrLibSend.Event("objective_start", dictMeta);
	}
	public static async EventObjectiveComplete(szObjectiveName: string, szScore: string, eResultOptions: ResultOptions, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	{
		var	rpStartTime:	{vRet: DateTime} = {vRet: new DateTime()};
		var	bGotValue:		boolean;

		dictMeta.set("verb", "completed");
		dictMeta.set("objective_name", szObjectiveName);
		dictMeta.set("score", szScore);
		dictMeta.set("result_options", ResultOptionsToString(eResultOptions));
		// Calculate and add duration if start time exists, otherwise use "0".
		//AbxrEvent.m_csDictProtect.lock();
		bGotValue = AbxrEvent.m_dictObjectiveStartTimes.TryGetValue(szObjectiveName, rpStartTime);
		//AbxrEvent.m_csDictProtect.unlock();
		if (bGotValue)
		{
			var	tsDuration:	TimeSpan = new TimeSpan().FromUnixTime(DateTime.Now() - rpStartTime.vRet.ToUnixTime());

			dictMeta.set("duration", tsDuration.ToString());
			// ---
			//AbxrEvent.m_csDictProtect.lock();
			AbxrEvent.m_dictObjectiveStartTimes.Remove(szObjectiveName);
			//AbxrEvent.m_csDictProtect.unlock();
		}
		else
		{
			dictMeta.set("duration", "0");
		}
		// ---
		return await AbxrLibSend.Event("objective_complete", dictMeta);
	}
	public static async EventInteractionStart(szInteractionName: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	{
		dictMeta.set("verb", "started");
		dictMeta.set("interaction_name", szInteractionName);
		// ---
		//AbxrEvent.m_csDictProtect.lock();
		AbxrEvent.m_dictInteractionStartTimes.set(szInteractionName, new DateTime().FromUnixTime(DateTime.Now()));	// MJPQ:  Just use default ctor?
		//AbxrEvent.m_csDictProtect.unlock();
		// ---
		return await AbxrLibSend.Event("interaction_start", dictMeta);
	}
	// Modified EventInteractionComplete methods.
	public static async EventInteractionComplete(szInteractionName: string, szResult: string, szResultDetails: string, eInteractionType: InteractionType, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	{
		var	rpStartTime:	{vRet: DateTime} = {vRet: new DateTime()};
		var	bGotValue:		boolean;

		dictMeta.set("verb", "completed");
		dictMeta.set("interaction_name", szInteractionName);
		dictMeta.set("result", szResult);
		dictMeta.set("result_details", szResultDetails);
		dictMeta.set("lms_type", InteractionTypeToString(eInteractionType));
		//AbxrEvent.m_csDictProtect.lock();
		bGotValue = AbxrEvent.m_dictInteractionStartTimes.TryGetValue(szInteractionName, rpStartTime);
		//AbxrEvent.m_csDictProtect.unlock();
		if (bGotValue)
		{
			var	tsDuration:	TimeSpan = new TimeSpan().FromUnixTime(DateTime.Now() - rpStartTime.vRet.ToUnixTime());

			dictMeta.set("duration", tsDuration.ToString());
			// ---
			//AbxrEvent.m_csDictProtect.lock();
			AbxrEvent.m_dictInteractionStartTimes.Remove(szInteractionName);
			//AbxrEvent.m_csDictProtect.unlock();
		}
		else
		{
			dictMeta.set("duration", "0");
		}
		// Add assessment_name if there's only one AbxrEvent.m_dictAssessmentStartTimes value.
		//AbxrEvent.m_csDictProtect.lock();
		if (AbxrEvent.m_dictAssessmentStartTimes.Count() === 1)
		{
			dictMeta.set("assessment_name", AbxrEvent.m_dictAssessmentStartTimes.entries().next().value?.[1].ToString() ?? "");
		}
		//AbxrEvent.m_csDictProtect.unlock();
		// ---
		return await AbxrLibSend.Event("interaction_complete", dictMeta);
	}
	public static async EventLevelStart(szLevelName: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	{
		dictMeta.set("verb", "started");
		dictMeta.set("level_name", szLevelName);
		// ---
		//AbxrEvent.m_csDictProtect.lock();
		AbxrEvent.m_dictLevelStartTimes.set(szLevelName, new DateTime().FromUnixTime(DateTime.Now()));	// MJPQ:  Just use default ctor?
		//AbxrEvent.m_csDictProtect.unlock();
		// ---
		return await AbxrLibSend.Event("level_start", dictMeta);
	}
	public static async EventLevelComplete(szLevelName: string, szScore: string, dictMeta: AbxrDictStrings): Promise<AbxrResult>
	{
		var	rpStartTime:	{vRet: DateTime} = {vRet: new DateTime()};
		var	bGotValue:		boolean;

		dictMeta.set("verb", "completed");
		dictMeta.set("level_name", szLevelName);
		dictMeta.set("score", szScore);
		// Calculate and add duration if start time exists, otherwise use "0".
		//AbxrEvent.m_csDictProtect.lock();
		bGotValue = AbxrEvent.m_dictLevelStartTimes.TryGetValue(szLevelName, rpStartTime);
		//AbxrEvent.m_csDictProtect.unlock();
		if (bGotValue)
		{
			var	tsDuration:	TimeSpan = new TimeSpan().FromUnixTime(DateTime.Now() - rpStartTime.vRet.ToUnixTime());

			dictMeta.set("duration", tsDuration.ToString());
			// ---
			//AbxrEvent.m_csDictProtect.lock();
			AbxrEvent.m_dictLevelStartTimes.Remove(szLevelName);
			//AbxrEvent.m_csDictProtect.unlock();
		}
		else
		{
			dictMeta.set("duration", "0");
		}
		// ---
		return await AbxrLibSend.Event("level_complete", dictMeta);
	}
	// --- End API (C++ dll and C# dll) versions of AbxrLibSend.Event().
	// ---
	// --- API (C++ dll and C# dll) versions of AddTelemetryEntry().
	public static async AddTelemetryEntry(szName: string, dictData: AbxrDictStrings): Promise<AbxrResult>
	{
		var	abxrTelemetryEntry:	AbxrTelemetry = new AbxrTelemetry().Construct(szName, dictData);

		return await AbxrLibSend.AddTelemetryEntryCore(abxrTelemetryEntry);
	}
	// public static AddTelemetryEntryDeferred(szName: string, dictData: AbxrDictStrings): Promise<AbxrResult>
	// {
	// 	var	abxrTelemetryEntry:	AbxrTelemetry = new AbxrTelemetry().Construct(szName, dictData);

	// 	return AbxrLibSend.AddTelemetryEntryCoreDeferred(abxrTelemetryEntry, true, null);
	// }
	// --- End API (C++ dll and C# dll) versions of AddTelemetryEntry().
	// ---
	// --- Core AddXXX() functions called by the API functions.
	//		These are deliberately public... users who are using the C++ lib directly may find it
	//		expedient/elegant to construct their own objects and call these directly.
	public static async AddLog(abxrLog: AbxrLog): Promise<AbxrResult>
	{
		return await AbxrLibAnalytics.AddXXXTask<AbxrLog>(abxrLog, AbxrLog, "ABXRLogs", AbxrLibClient.PostABXRLogs, false, false, null);
	}
	// public static AddLogDeferred(abxrLog: AbxrLog, bNoCallbackOnSuccess: boolean, pfnStatusCallback?: AbxrLibAnalyticsLogCallback | null): Promise<AbxrResult>
	// {
	// 	AbxrLibAnalytics.DiagnosticWriteLine("Going to call AddLog().");
	// 	// Notice the = capture... so pfnStatusCallback propagates by copy into the thread. <- Comment from C++... irrelevant here but leaving it to document that this is a port from C++.
	// 	return AbxrLibAnalytics.m_abxrLibAsync.AddTask((pObject: any): Promise<AbxrResult> => { return AbxrLibAnalytics.AddXXXTask<AbxrLog>(pObject as AbxrLog, AbxrLog, "ABXRLogs", AbxrLibClient.PostABXRLogs, false, bNoCallbackOnSuccess, pfnStatusCallback as AbxrLibAnalyticsLogCallback | null).then((eRet: AbxrResult) => { return eRet; }).catch((eRet: AbxrResult) => { return eRet; }); },
	// 		abxrLog,
	// 		(pObject: any): void => { /*delete (AbxrLog*)pObject;*/ });
	// }
	// ---
	public static async EventCore(abxrEvent: AbxrEvent): Promise<AbxrResult>
	{
		return await AbxrLibAnalytics.AddXXXTask<AbxrEvent>(abxrEvent, AbxrEvent, "ABXREvents", AbxrLibClient.PostABXREvents, false, false, null);
	}
	// public static EventCoreDeferred(abxrEvent: AbxrEvent, bNoCallbackOnSuccess: boolean, pfnStatusCallback?: AbxrLibAnalyticsEventCallback | null): Promise<AbxrResult>
	// {
	// 	AbxrLibAnalytics.DiagnosticWriteLine("Going to call AbxrLibSend.Event().");
	// 	// Notice the = capture... so pfnStatusCallback propagates by copy into the thread. <- Comment from C++... irrelevant here but leaving it to document that this is a port from C++.
	// 	return AbxrLibAnalytics.m_abxrLibAsync.AddTask((pObject: any): Promise<AbxrResult> => { return AbxrLibAnalytics.AddXXXTask<AbxrEvent>(pObject as AbxrEvent, AbxrEvent, "ABXREvents", AbxrLibClient.PostABXREvents, false, bNoCallbackOnSuccess, pfnStatusCallback as AbxrLibAnalyticsEventCallback | null).then((eRet: AbxrResult) => { return eRet; }).catch((eRet: AbxrResult) => { return eRet; }); },
	// 		abxrEvent,
	// 		(pObject: any): void => { /*delete (AbxrEvent*)pObject;*/ });
	// }
	// ---
	public static async AddTelemetryEntryCore(abxrTelemetry: AbxrTelemetry): Promise<AbxrResult>
	{
		return await AbxrLibAnalytics.AddXXXTask<AbxrTelemetry>(abxrTelemetry, AbxrTelemetry, "ABXRTelemetry", AbxrLibClient.PostABXRTelemetry, false, false, null);
	}
	// public static AddTelemetryEntryCoreDeferred(abxrTelemetry: AbxrTelemetry, bNoCallbackOnSuccess: boolean, pfnStatusCallback?: AbxrLibAnalyticsTelemetryCallback | null): Promise<AbxrResult>
	// {
	// 	AbxrLibAnalytics.DiagnosticWriteLine("Going to call AddTelemetry().");
	// 	//DebugMessage.WriteLine("Adding telemetry entry named ", abxrTelemetry.m_szName, " at time ", new DateTime().ToLocalTimeString());
	// 	// Notice the = capture... so pfnStatusCallback propagates by copy into the thread. <- Comment from C++... irrelevant here but leaving it to document that this is a port from C++.
	// 	return AbxrLibAnalytics.m_abxrLibAsync.AddTask((pObject: object): Promise<AbxrResult> => { return AbxrLibAnalytics.AddXXXTask<AbxrTelemetry>(pObject as AbxrTelemetry, AbxrTelemetry, "ABXRTelemetry", AbxrLibClient.PostABXRTelemetry, false, bNoCallbackOnSuccess, pfnStatusCallback as AbxrLibAnalyticsTelemetryCallback | null).then((eRet: AbxrResult) => { return eRet; }).catch((eRet: AbxrResult) => { return eRet; }); },
	// 		abxrTelemetry,
	// 		(pObject: any): void => { /*delete (AbxrTelemetry*)pObject;*/ });
	// }
};

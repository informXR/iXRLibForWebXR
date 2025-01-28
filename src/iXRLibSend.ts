/// <summary>
/// API for sending objects to backend.

import { iXRLibAnalytics } from "./iXRLibAnalytics";
import { iXRLibClient } from "./iXRLibClient";
import { iXREvent, iXRLog, iXRTelemetry, LogLevel } from "./iXRLibCoreModel";
import { DateTime, InteractionType, InteractionTypeToString, iXRResult, PythonDictStrings, ResultOptions, ResultOptionsToString, TimeSpan } from "./network/utils/DotNetishTypes";

// --- MJP:  templatize these?
export type iXRLibAnalyticsLogCallback = (ixrLog: iXRLog, eResult: iXRResult, szExceptionMessage: string) => void;
export type iXRLibAnalyticsEventCallback = (ixrEvent: iXREvent, eResult: iXRResult, szExceptionMessage: string) => void;
export type iXRLibAnalyticsTelemetryCallback = (ixrTelemetry: iXRTelemetry, eResult: iXRResult, szExceptionMessage: string) => void;
// ---
/// </summary>
export class iXRLibSend
{
	// --- (C++ dll and C# dll) versions of LogXXX().
	private static async LogSynchronous(eLogLevel: LogLevel, szText: string): Promise<iXRResult>
	{
		var	ixrLog:	iXRLog = new iXRLog().Construct(eLogLevel, szText);

		return await iXRLibSend.AddLogSynchronous(ixrLog);
	}
	private static Log(eLogLevel: LogLevel, szText: string): Promise<iXRResult>
	{
		var	ixrLog:	iXRLog = new iXRLog().Construct(eLogLevel, szText);

		return iXRLibSend.AddLog(ixrLog, true, null);
	}
	// ---
	public static async LogDebugSynchronous(szText: string): Promise<iXRResult>
	{
		return await iXRLibSend.LogSynchronous(LogLevel.eDebug, szText);
	}
	public static LogDebug(szText: string): Promise<iXRResult>
	{
		return iXRLibSend.Log(LogLevel.eDebug, szText);
	}
	public static async LogInfoSynchronous(szText: string): Promise<iXRResult>
	{
		return await iXRLibSend.LogSynchronous(LogLevel.eInfo, szText);
	}
	public static LogInfo(szText: string): Promise<iXRResult>
	{
		return iXRLibSend.Log(LogLevel.eInfo, szText);
	}
	public static async LogWarnSynchronous(szText: string): Promise<iXRResult>
	{
		return await iXRLibSend.LogSynchronous(LogLevel.eWarn, szText);
	}
	public static LogWarn(szText: string): Promise<iXRResult>
	{
		return iXRLibSend.Log(LogLevel.eWarn, szText);
	}
	public static async LogErrorSynchronous(szText: string): Promise<iXRResult>
	{
		return await iXRLibSend.LogSynchronous(LogLevel.eError, szText);
	}
	public static LogError(szText: string): Promise<iXRResult>
	{
		return iXRLibSend.Log(LogLevel.eError, szText);
	}
	public static async LogCriticalSynchronous(szText: string): Promise<iXRResult>
	{
		return await iXRLibSend.LogSynchronous(LogLevel.eCritical, szText);
	}
	public static LogCritical(szText: string): Promise<iXRResult>
	{
		return iXRLibSend.Log(LogLevel.eCritical, szText);
	}
	// --- End (C++ dll and C# dll) versions of LogXXX().
	// --- API (C++ dll and C# dll) versions of iXRLibSend.Event().
	public static async EventSynchronous(szName: string, dictMeta: PythonDictStrings): Promise<iXRResult>
	{
		var	ixrEvent: iXREvent = new iXREvent().Construct(szName, dictMeta);

		return await iXRLibSend.EventSynchronousCore(ixrEvent);
	}
	public static async Event(szName: string, dictMeta: PythonDictStrings): Promise<iXRResult>
	{
		var	ixrEvent:	iXREvent = new iXREvent().Construct(szName, dictMeta);

		return await iXRLibSend.EventCore(ixrEvent, true, null);
	}
	// Convenient wrappers for particular forms of events.
	public static async EventAssessmentStart(szAssessmentName: string, dictMeta: PythonDictStrings): Promise<iXRResult>
	{
		dictMeta.set("verb", "started");
		dictMeta.set("assessment_name", szAssessmentName);
		// Store the start time.
		//iXREvent.m_csDictProtect.lock();
		iXREvent.m_dictAssessmentStartTimes.set(szAssessmentName, new DateTime().FromUnixTime(DateTime.Now()));	// MJPQ:  Just use default ctor?
		//iXREvent.m_csDictProtect.unlock();
		// ---
		return await iXRLibSend.Event("assessment_start", dictMeta);
	}
	public static async EventAssessmentComplete(szAssessmentName: string, szScore: string, eResultOptions: ResultOptions, dictMeta: PythonDictStrings): Promise<iXRResult>
	{
		var	rpStartTime:	{vRet: DateTime} = {vRet: new DateTime()};
		var	bGotValue:		boolean;

		dictMeta.set("verb", "completed");
		dictMeta.set("assessment_name", szAssessmentName);
		dictMeta.set("score", szScore);
		dictMeta.set("result_options", ResultOptionsToString(eResultOptions));
		// Calculate and add duration if start time exists, otherwise use "0".
		//iXREvent.m_csDictProtect.lock();
		bGotValue = iXREvent.m_dictAssessmentStartTimes.TryGetValue(szAssessmentName, rpStartTime);
		//iXREvent.m_csDictProtect.unlock();
		if (bGotValue)
		{
			var	tsDuration:	TimeSpan = new TimeSpan().FromUnixTime(DateTime.Now() - rpStartTime.vRet.ToUnixTime());

			dictMeta.set("duration", tsDuration.ToString());
			// ---
			//iXREvent.m_csDictProtect.lock();
			iXREvent.m_dictAssessmentStartTimes.Remove(szAssessmentName);
			//iXREvent.m_csDictProtect.unlock();
		}
		else
		{
			dictMeta.set("duration", "0");
		}
		// ---
		return await iXRLibSend.Event("assessment_complete", dictMeta);
	}
	public static async EventObjectiveStart(szObjectiveName: string, dictMeta: PythonDictStrings): Promise<iXRResult>
	{
		dictMeta.set("verb", "started");
		dictMeta.set("objective_name", szObjectiveName);
		// Store the start time.
		//iXREvent.m_csDictProtect.lock();
		iXREvent.m_dictObjectiveStartTimes.set(szObjectiveName, new DateTime().FromUnixTime(DateTime.Now()));	// MJPQ:  Just use default ctor?
		//iXREvent.m_csDictProtect.unlock();
		// ---
		return await iXRLibSend.Event("objective_start", dictMeta);
	}
	public static async EventObjectiveComplete(szObjectiveName: string, szScore: string, eResultOptions: ResultOptions, dictMeta: PythonDictStrings): Promise<iXRResult>
	{
		var	rpStartTime:	{vRet: DateTime} = {vRet: new DateTime()};
		var	bGotValue:		boolean;

		dictMeta.set("verb", "completed");
		dictMeta.set("objective_name", szObjectiveName);
		dictMeta.set("score", szScore);
		dictMeta.set("result_options", ResultOptionsToString(eResultOptions));
		// Calculate and add duration if start time exists, otherwise use "0".
		//iXREvent.m_csDictProtect.lock();
		bGotValue = iXREvent.m_dictObjectiveStartTimes.TryGetValue(szObjectiveName, rpStartTime);
		//iXREvent.m_csDictProtect.unlock();
		if (bGotValue)
		{
			var	tsDuration:	TimeSpan = new TimeSpan().FromUnixTime(DateTime.Now() - rpStartTime.vRet.ToUnixTime());

			dictMeta.set("duration", tsDuration.ToString());
			// ---
			//iXREvent.m_csDictProtect.lock();
			iXREvent.m_dictObjectiveStartTimes.Remove(szObjectiveName);
			//iXREvent.m_csDictProtect.unlock();
		}
		else
		{
			dictMeta.set("duration", "0");
		}
		// ---
		return await iXRLibSend.Event("objective_complete", dictMeta);
	}
	public static async EventInteractionStart(szInteractionName: string, dictMeta: PythonDictStrings): Promise<iXRResult>
	{
		dictMeta.set("verb", "started");
		dictMeta.set("interaction_name", szInteractionName);
		// ---
		//iXREvent.m_csDictProtect.lock();
		iXREvent.m_dictInteractionStartTimes.set(szInteractionName, new DateTime().FromUnixTime(DateTime.Now()));	// MJPQ:  Just use default ctor?
		//iXREvent.m_csDictProtect.unlock();
		// ---
		return await iXRLibSend.Event("interaction_start", dictMeta);
	}
	// Modified EventInteractionComplete methods.
	public static async EventInteractionComplete(szInteractionName: string, szResult: string, szResultDetails: string, eInteractionType: InteractionType, dictMeta: PythonDictStrings): Promise<iXRResult>
	{
		var	rpStartTime:	{vRet: DateTime} = {vRet: new DateTime()};
		var	bGotValue:		boolean;

		dictMeta.set("verb", "completed");
		dictMeta.set("interaction_name", szInteractionName);
		dictMeta.set("result", szResult);
		dictMeta.set("result_details", szResultDetails);
		dictMeta.set("lms_type", InteractionTypeToString(eInteractionType));
		//iXREvent.m_csDictProtect.lock();
		bGotValue = iXREvent.m_dictInteractionStartTimes.TryGetValue(szInteractionName, rpStartTime);
		//iXREvent.m_csDictProtect.unlock();
		if (bGotValue)
		{
			var	tsDuration:	TimeSpan = new TimeSpan().FromUnixTime(DateTime.Now() - rpStartTime.vRet.ToUnixTime());

			dictMeta.set("duration", tsDuration.ToString());
			// ---
			//iXREvent.m_csDictProtect.lock();
			iXREvent.m_dictInteractionStartTimes.Remove(szInteractionName);
			//iXREvent.m_csDictProtect.unlock();
		}
		else
		{
			dictMeta.set("duration", "0");
		}
		// Add assessment_name if there's only one iXREvent.m_dictAssessmentStartTimes value.
		//iXREvent.m_csDictProtect.lock();
		if (iXREvent.m_dictAssessmentStartTimes.Count() === 1)
		{
			dictMeta.set("assessment_name", iXREvent.m_dictAssessmentStartTimes.entries().next().value?.[1].ToString() ?? "");
		}
		//iXREvent.m_csDictProtect.unlock();
		// ---
		return await iXRLibSend.Event("interaction_complete", dictMeta);
	}
	public static async EventLevelStart(szLevelName: string, dictMeta: PythonDictStrings): Promise<iXRResult>
	{
		dictMeta.set("verb", "started");
		dictMeta.set("level_name", szLevelName);
		// ---
		//iXREvent.m_csDictProtect.lock();
		iXREvent.m_dictLevelStartTimes.set(szLevelName, new DateTime().FromUnixTime(DateTime.Now()));	// MJPQ:  Just use default ctor?
		//iXREvent.m_csDictProtect.unlock();
		// ---
		return await iXRLibSend.Event("level_start", dictMeta);
	}
	public static async EventLevelComplete(szLevelName: string, szScore: string, dictMeta: PythonDictStrings): Promise<iXRResult>
	{
		var	rpStartTime:	{vRet: DateTime} = {vRet: new DateTime()};
		var	bGotValue:		boolean;

		dictMeta.set("verb", "completed");
		dictMeta.set("level_name", szLevelName);
		dictMeta.set("score", szScore);
		// Calculate and add duration if start time exists, otherwise use "0".
		//iXREvent.m_csDictProtect.lock();
		bGotValue = iXREvent.m_dictLevelStartTimes.TryGetValue(szLevelName, rpStartTime);
		//iXREvent.m_csDictProtect.unlock();
		if (bGotValue)
		{
			var	tsDuration:	TimeSpan = new TimeSpan().FromUnixTime(DateTime.Now() - rpStartTime.vRet.ToUnixTime());

			dictMeta.set("duration", tsDuration.ToString());
			// ---
			//iXREvent.m_csDictProtect.lock();
			iXREvent.m_dictLevelStartTimes.Remove(szLevelName);
			//iXREvent.m_csDictProtect.unlock();
		}
		else
		{
			dictMeta.set("duration", "0");
		}
		// ---
		return await iXRLibSend.Event("level_complete", dictMeta);
	}
	// --- End API (C++ dll and C# dll) versions of iXRLibSend.Event().
	// ---
	// --- API (C++ dll and C# dll) versions of AddTelemetryEntry().
	public static async AddTelemetryEntrySynchronous(szName: string, dictData: PythonDictStrings): Promise<iXRResult>
	{
		var	ixrTelemetryEntry:	iXRTelemetry = new iXRTelemetry().Construct(szName, dictData);

		return await iXRLibSend.AddTelemetryEntrySynchronousCore(ixrTelemetryEntry);
	}
	public static AddTelemetryEntry(szName: string, dictData: PythonDictStrings): Promise<iXRResult>
	{
		var	ixrTelemetryEntry:	iXRTelemetry = new iXRTelemetry().Construct(szName, dictData);

		return iXRLibSend.AddTelemetryEntryCore(ixrTelemetryEntry, true, null);
	}
	// --- End API (C++ dll and C# dll) versions of AddTelemetryEntry().
	// ---
	// --- Core AddXXX() functions called by the API functions.
	//		These are deliberately public... users who are using the C++ lib directly may find it
	//		expedient/elegant to construct their own objects and call these directly.
	public static async AddLogSynchronous(ixrLog: iXRLog): Promise<iXRResult>
	{
		return await iXRLibAnalytics.AddXXXTask<iXRLog>(ixrLog, iXRLog, "IXRLogs", iXRLibClient.PostIXRLogs, false, false, null);
	}
	public static AddLog(ixrLog: iXRLog, bNoCallbackOnSuccess: boolean, pfnStatusCallback?: iXRLibAnalyticsLogCallback | null): Promise<iXRResult>
	{
		iXRLibAnalytics.DiagnosticWriteLine("Going to call AddLog().");
		// Notice the = capture... so pfnStatusCallback propagates by copy into the thread. <- Comment from C++... irrelevant here but leaving it to document that this is a port from C++.
		return iXRLibAnalytics.m_ixrLibAsync.AddTask((pObject: any): Promise<iXRResult> => { return iXRLibAnalytics.AddXXXTask<iXRLog>(pObject as iXRLog, iXRLog, "IXRLogs", iXRLibClient.PostIXRLogs, false, bNoCallbackOnSuccess, pfnStatusCallback as iXRLibAnalyticsLogCallback | null).then((eRet: iXRResult) => { return eRet; }).catch((eRet: iXRResult) => { return eRet; }); },
			ixrLog,
			(pObject: any): void => { /*delete (iXRLog*)pObject;*/ });
	}
	// ---
	public static async EventSynchronousCore(ixrEvent: iXREvent): Promise<iXRResult>
	{
		return await iXRLibAnalytics.AddXXXTask<iXREvent>(ixrEvent, iXREvent, "IXREvents", iXRLibClient.PostIXREvents, false, false, null);
	}
	public static EventCore(ixrEvent: iXREvent, bNoCallbackOnSuccess: boolean, pfnStatusCallback?: iXRLibAnalyticsEventCallback | null): Promise<iXRResult>
	{
		iXRLibAnalytics.DiagnosticWriteLine("Going to call iXRLibSend.Event().");
		// Notice the = capture... so pfnStatusCallback propagates by copy into the thread. <- Comment from C++... irrelevant here but leaving it to document that this is a port from C++.
		return iXRLibAnalytics.m_ixrLibAsync.AddTask((pObject: any): Promise<iXRResult> => { return iXRLibAnalytics.AddXXXTask<iXREvent>(pObject as iXREvent, iXREvent, "IXREvents", iXRLibClient.PostIXREvents, false, bNoCallbackOnSuccess, pfnStatusCallback as iXRLibAnalyticsEventCallback | null).then((eRet: iXRResult) => { return eRet; }).catch((eRet: iXRResult) => { return eRet; }); },
			ixrEvent,
			(pObject: any): void => { /*delete (iXREvent*)pObject;*/ });
	}
	// ---
	public static async AddTelemetryEntrySynchronousCore(ixrTelemetry: iXRTelemetry): Promise<iXRResult>
	{
		return await iXRLibAnalytics.AddXXXTask<iXRTelemetry>(ixrTelemetry, iXRTelemetry, "IXRTelemetry", iXRLibClient.PostIXRTelemetry, false, false, null);
	}
	public static AddTelemetryEntryCore(ixrTelemetry: iXRTelemetry, bNoCallbackOnSuccess: boolean, pfnStatusCallback?: iXRLibAnalyticsTelemetryCallback | null): Promise<iXRResult>
	{
		iXRLibAnalytics.DiagnosticWriteLine("Going to call AddTelemetry().");
		//DebugMessage.WriteLine("Adding telemetry entry named ", ixrTelemetry.m_szName, " at time ", new DateTime().ToLocalTimeString());
		// Notice the = capture... so pfnStatusCallback propagates by copy into the thread. <- Comment from C++... irrelevant here but leaving it to document that this is a port from C++.
		return iXRLibAnalytics.m_ixrLibAsync.AddTask((pObject: object): Promise<iXRResult> => { return iXRLibAnalytics.AddXXXTask<iXRTelemetry>(pObject as iXRTelemetry, iXRTelemetry, "IXRTelemetry", iXRLibClient.PostIXRTelemetry, false, bNoCallbackOnSuccess, pfnStatusCallback as iXRLibAnalyticsTelemetryCallback | null).then((eRet: iXRResult) => { return eRet; }).catch((eRet: iXRResult) => { return eRet; }); },
			ixrTelemetry,
			(pObject: any): void => { /*delete (iXRTelemetry*)pObject;*/ });
	}
};

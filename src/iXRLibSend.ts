/// <summary>
/// API for sending objects to backend.

import { iXRLibAnalytics } from "./iXRLibAnalytics";
import { iXRLibClient } from "./iXRLibClient";
import { iXREvent, iXRLog, iXRTelemetry, LogLevel } from "./iXRLibCoreModel";
import { DateTime, iXRResult, PythonDictStrings, ResultOptions, ResultOptionsToString, TimeSpan } from "./network/utils/DotNetishTypes";

// --- MJP:  templatize these?
type iXRLibAnalyticsLogCallback = (ixrLog: iXRLog, eResult: iXRResult, szExceptionMessage: string) => void;
type iXRLibAnalyticsEventCallback = (ixrEvent: iXREvent, eResult: iXRResult, szExceptionMessage: string) => void;
type iXRLibAnalyticsTelemetryCallback = (ixrTelemetry: iXRTelemetry, eResult: iXRResult, szExceptionMessage: string) => void;
// ---
/// </summary>
export class iXRLibSend
{
	// --- (C++ dll and C# dll) versions of LogXXX().
	private static LogSynchronous(eLogLevel: LogLevel, szText: string): iXRResult
	{
		var	ixrLog:	iXRLog = new iXRLog().Construct(eLogLevel, szText);

		return iXRLibSend.AddLogSynchronous(ixrLog);
	}
	private static Log(eLogLevel: LogLevel, szText: string): iXRResult
	{
		var	ixrLog:	iXRLog = new iXRLog().Construct(eLogLevel, szText);

		return iXRLibSend.AddLog(ixrLog, true, null);
	}
	// ---
	public static LogDebugSynchronous(szText: string): iXRResult
	{
		return iXRLibSend.LogSynchronous(LogLevel.eDebug, szText);
	}
	public static LogDebug(szText: string): iXRResult
	{
		return iXRLibSend.Log(LogLevel.eDebug, szText);
	}
	public static LogInfoSynchronous(szText: string): iXRResult
	{
		return iXRLibSend.LogSynchronous(LogLevel.eInfo, szText);
	}
	public static LogInfo(szText: string): iXRResult
	{
		return iXRLibSend.Log(LogLevel.eInfo, szText);
	}
	public static LogWarnSynchronous(szText: string): iXRResult
	{
		return iXRLibSend.LogSynchronous(LogLevel.eWarn, szText);
	}
	public static LogWarn(szText: string): iXRResult
	{
		return iXRLibSend.Log(LogLevel.eWarn, szText);
	}
	public static LogErrorSynchronous(szText: string): iXRResult
	{
		return iXRLibSend.LogSynchronous(LogLevel.eError, szText);
	}
	public static LogError(szText: string): iXRResult
	{
		return iXRLibSend.Log(LogLevel.eError, szText);
	}
	public static LogCriticalSynchronous(szText: string): iXRResult
	{
		return iXRLibSend.LogSynchronous(LogLevel.eCritical, szText);
	}
	public static LogCritical(szText: string): iXRResult
	{
		return iXRLibSend.Log(LogLevel.eCritical, szText);
	}
	// --- End (C++ dll and C# dll) versions of LogXXX().
	// --- API (C++ dll and C# dll) versions of iXRLibSend.Event().
	public static EventSynchronous(szName: string, dictMeta: PythonDictStrings): iXRResult
	{
		var	ixrEvent: iXREvent = new iXREvent().Construct(szName, dictMeta);

		return iXRLibSend.EventSynchronous(ixrEvent);
	}
	public static Event(szName: string, dictMeta: PythonDictStrings): iXRResult
	{
		var	ixrEvent:	iXREvent = new iXREvent().Construct(szName, dictMeta);

		return iXRLibSend.Event(ixrEvent, true, null);
	}
	// Convenient wrappers for particular forms of events.
	public static EventAssessmentStart(szAssessmentName: string, dictMeta: PythonDictStrings): iXRResult
	{
		dictMeta["verb"] = "started";
		dictMeta["assessment_name"] = szAssessmentName;
		// Store the start time.
		iXREvent.m_csDictProtect.lock();
		iXREvent.m_dictAssessmentStartTimes[szAssessmentName] = DateTime.Now();
		iXREvent.m_csDictProtect.unlock();
		// ---
		return iXRLibSend.Event("assessment_start", dictMeta);
	}
	public static EventAssessmentComplete(szAssessmentName: string, szScore: string, eResultOptions: ResultOptions, dictMeta: PythonDictStrings): iXRResult
	{
		var	dtStartTime:	DateTime = new DateTime();
		var	bGotValue:		boolean;

		dictMeta["verb"] = "completed";
		dictMeta["assessment_name"] = szAssessmentName;
		dictMeta["score"] = szScore;
		dictMeta["result_options"] = ResultOptionsToString(eResultOptions);
		// Calculate and add duration if start time exists, otherwise use "0".
		iXREvent.m_csDictProtect.lock();
		bGotValue = iXREvent.m_dictAssessmentStartTimes.TryGetValue(szAssessmentName, dtStartTime);
		iXREvent.m_csDictProtect.unlock();
		if (bGotValue)
		{
			var	tsDuration:	TimeSpan = DateTime.Now() - dtStartTime;

			dictMeta["duration"] = tsDuration.ToString();
			// ---
			iXREvent.m_csDictProtect.lock();
			iXREvent.m_dictAssessmentStartTimes.Remove(szAssessmentName);
			iXREvent.m_csDictProtect.unlock();
		}
		else
		{
			dictMeta["duration"] = "0";
		}
		// ---
		return iXRLibSend.Event("assessment_complete", dictMeta);
	}
	public static EventObjectiveStart(szObjectiveName: string, dictMeta: PythonDictStrings): iXRResult
	{
		dictMeta["verb"] = "started";
		dictMeta["objective_name"] = szObjectiveName;
		// Store the start time.
		iXREvent.m_csDictProtect.lock();
		iXREvent.m_dictObjectiveStartTimes[szObjectiveName] = DateTime.Now();
		iXREvent.m_csDictProtect.unlock();
		// ---
		return iXRLibSend.Event("objective_start", dictMeta);
	}
	public static EventObjectiveComplete(szObjectiveName: string, szScore: string, eResultOptions: ResultOptions, dictMeta: PythonDictStrings): iXRResult
	{
		var	dtStartTime:	DateTime = new DateTime();
		var	bGotValue:		boolean;

		dictMeta["verb"] = "completed";
		dictMeta["objective_name"] = szObjectiveName;
		dictMeta["score"] = szScore;
		dictMeta["result_options"] = ResultOptionsToString(eResultOptions);
		// Calculate and add duration if start time exists, otherwise use "0".
		iXREvent.m_csDictProtect.lock();
		bGotValue = iXREvent.m_dictObjectiveStartTimes.TryGetValue(szObjectiveName, dtStartTime);
		iXREvent.m_csDictProtect.unlock();
		if (bGotValue)
		{
			var	tsDuration:	TimeSpan = DateTime.Now() - dtStartTime;

			dictMeta["duration"] = tsDuration.ToString();
			// ---
			iXREvent.m_csDictProtect.lock();
			iXREvent.m_dictObjectiveStartTimes.Remove(szObjectiveName);
			iXREvent.m_csDictProtect.unlock();
		}
		else
		{
			dictMeta["duration"] = "0";
		}
		// ---
		return iXRLibSend.Event("objective_complete", dictMeta);
	}
	public static EventInteractionStart(szInteractionName: string, dictMeta: PythonDictStrings): iXRResult
	{
		dictMeta["verb"] = "started";
		dictMeta["interaction_name"] = szInteractionName;
		// ---
		iXREvent.m_csDictProtect.lock();
		iXREvent.m_dictInteractionStartTimes[szInteractionName] = DateTime.Now();
		iXREvent.m_csDictProtect.unlock();
		// ---
		return iXRLibSend.Event("interaction_start", dictMeta);
	}
	// Modified EventInteractionComplete methods.
	public static EventInteractionComplete(szInteractionName: string, szResult: string, szResultDetails: string, eInteractionType: InteractionType, dictMeta: PythonDictStrings): iXRResult
	{
		var	dtStartTime:	DateTime = new DateTime();
		var	bGotValue:		boolean;

		dictMeta["verb"] = "completed";
		dictMeta["interaction_name"] = szInteractionName;
		dictMeta["result"] = szResult;
		dictMeta["result_details"] = szResultDetails;
		dictMeta["lms_type"] = InteractionTypeToString(eInteractionType);
		iXREvent.m_csDictProtect.lock();
		bGotValue = iXREvent.m_dictInteractionStartTimes.TryGetValue(szInteractionName, dtStartTime);
		iXREvent.m_csDictProtect.unlock();
		if (bGotValue)
		{
			var	tsDuration:	TimeSpan = DateTime.Now() - dtStartTime;

			dictMeta["duration"] = tsDuration.ToString();
			// ---
			iXREvent.m_csDictProtect.lock();
			iXREvent.m_dictInteractionStartTimes.Remove(szInteractionName);
			iXREvent.m_csDictProtect.unlock();
		}
		else
		{
			dictMeta["duration"] = "0";
		}
		// Add assessment_name if there's only one iXREvent.m_dictAssessmentStartTimes value.
		iXREvent.m_csDictProtect.lock();
		if (iXREvent.m_dictAssessmentStartTimes.Count() == 1)
		{
			dictMeta["assessment_name"] = iXREvent.m_dictAssessmentStartTimes.begin()->first;
		}
		iXREvent.m_csDictProtect.unlock();
		// ---
		return iXRLibSend.Event("interaction_complete", dictMeta);
	}
	public static EventLevelStart(szLevelName: string, dictMeta: PythonDictStrings): iXRResult
	{
		dictMeta["verb"] = "started";
		dictMeta["level_name"] = szLevelName;
		// ---
		iXREvent.m_csDictProtect.lock();
		iXREvent.m_dictLevelStartTimes[szLevelName] = DateTime.Now();
		iXREvent.m_csDictProtect.unlock();
		// ---
		return iXRLibSend.Event("level_start", dictMeta);
	}
	public static EventLevelComplete(szLevelName: string, szScore: string, dictMeta: PythonDictStrings): iXRResult
	{
		var	dtStartTime:	DateTime = new DateTime();
		var	bGotValue:		boolean;

		dictMeta["verb"] = "completed";
		dictMeta["level_name"] = szLevelName;
		dictMeta["score"] = szScore;
		// Calculate and add duration if start time exists, otherwise use "0".
		iXREvent.m_csDictProtect.lock();
		bGotValue = iXREvent.m_dictLevelStartTimes.TryGetValue(szLevelName, dtStartTime);
		iXREvent.m_csDictProtect.unlock();
		if (bGotValue)
		{
			var	tsDuration:	TimeSpan = DateTime.Now() - dtStartTime;

			dictMeta["duration"] = tsDuration.ToString();
			iXREvent.m_dictLevelStartTimes.Remove(szLevelName);
		}
		else
		{
			dictMeta["duration"] = "0";
		}
		// ---
		return iXRLibSend.Event("level_complete", dictMeta);
	}
	// --- End API (C++ dll and C# dll) versions of iXRLibSend.Event().
	// ---
	// --- API (C++ dll and C# dll) versions of AddTelemetryEntry().
	public static AddTelemetryEntrySynchronous(szName: string, dictData: PythonDictStrings): iXRResult
	{
		var	ixrTelemetryEntry:	iXRTelemetry = new iXRTelemetry().Construct(szName, dictData);

		return iXRLibSend.AddTelemetryEntrySynchronous(ixrTelemetryEntry);
	}
	public static AddTelemetryEntry(szName: string, dictData: PythonDictStrings): iXRResult
	{
		var	ixrTelemetryEntry:	iXRTelemetry = new iXRTelemetry().Construct(szName, dictData);

		return iXRLibSend.AddTelemetryEntry(ixrTelemetryEntry, true, null);
	}
	// --- End API (C++ dll and C# dll) versions of AddTelemetryEntry().
	// ---
	// --- Core AddXXX() functions called by the API functions.
	//		These are deliberately public... users who are using the C++ lib directly may find it
	//		expedient/elegant to construct their own objects and call these directly.
	public static AddLogSynchronous(ixrLog: iXRLog): iXRResult
	{
		return iXRLibAnalytics.AddXXXTask<iXRLog, iXRLibAnalyticsLogCallback, iXRLibStorage>(ixrLog, "IXRLogs", iXRLibClient.PostIXRLogs, false, false, null);
	}
	public static AddLog(ixrLog: iXRLog, bNoCallbackOnSuccess: boolean, pfnStatusCallback?: iXRLibAnalyticsLogCallback): iXRResult
	{
		iXRLibAnalytics.DiagnosticWriteLine("Going to call AddLog().");
		// Notice the = capture... so pfnStatusCallback propagates by copy into the thread. <- Comment from C++... irrelevant here but leaving it to document that this is a port from C++.
		return iXRLibAnalytics.m_ixrLibAsync.AddTask((pObject: object) => iXRResult { return iXRLibAnalytics.AddXXXTask<iXRLog, iXRLibAnalyticsLogCallback, iXRLibStorage>(pObject, "IXRLogs", iXRLibClient.PostIXRLogs, false, bNoCallbackOnSuccess, pfnStatusCallback); },
			ixrLog,
			(pObject: object) => void { /*delete (iXRLog*)pObject;*/ });
	}
	// ---
	public static EventSynchronous(ixrEvent: iXREvent): iXRResult
	{
		return iXRLibAnalytics.AddXXXTask<iXREvent, iXRLibAnalyticsEventCallback, iXRLibStorage>(ixrEvent, "IXREvents", iXRLibClient.PostIXREvents, false, false, null);
	}
	public static Event(ixrEvent: iXREvent, bNoCallbackOnSuccess: boolean, pfnStatusCallback?: iXRLibAnalyticsEventCallback): iXRResult
	{
		iXRLibAnalytics.DiagnosticWriteLine("Going to call iXRLibSend.Event().");
		// Notice the = capture... so pfnStatusCallback propagates by copy into the thread. <- Comment from C++... irrelevant here but leaving it to document that this is a port from C++.
		return iXRLibAnalytics.m_ixrLibAsync.AddTask((pObject: object) => iXRResult { return iXRLibAnalytics.AddXXXTask<iXREvent, iXRLibAnalyticsEventCallback, iXRLibStorage>(pObject, "IXREvents", iXRLibClient.PostIXREvents, false, bNoCallbackOnSuccess, pfnStatusCallback); },
			ixrEvent,
			(pObject: object) => void { /*delete (iXREvent*)pObject;*/ });
	}
	// ---
	public static AddTelemetryEntrySynchronous(iXRTelemetry& ixrTelemetry): iXRResult
	{
		return iXRLibAnalytics.AddXXXTask<iXRTelemetry, iXRLibAnalyticsTelemetryCallback, iXRLibStorage>(ixrTelemetry, "IXRTelemetry", iXRLibClient.PostIXRTelemetry, false, false, null);
	}
	public static AddTelemetryEntry(iXRTelemetry& ixrTelemetry, bNoCallbackOnSuccess: boolean, const iXRLibAnalyticsTelemetryCallback& pfnStatusCallback): iXRResult
	{
		iXRLibAnalytics.DiagnosticWriteLine("Going to call AddTelemetry().");
		DebugMessage.WriteLine("Adding telemetry entry named ", ixrTelemetry.m_szName, " at time ", DateTime.Now().ToLocalTimeString());
		// Notice the = capture... so pfnStatusCallback propagates by copy into the thread. <- Comment from C++... irrelevant here but leaving it to document that this is a port from C++.
		return iXRLibAnalytics.m_ixrLibAsync.AddTask((pObject: object) => iXRResult { return iXRLibAnalytics.AddXXXTask<iXRTelemetry, iXRLibAnalyticsTelemetryCallback, iXRLibStorage>(pObject, "IXRTelemetry", iXRLibClient.PostIXRTelemetry, false, bNoCallbackOnSuccess, pfnStatusCallback); },
			ixrTelemetry,
			(pObject: object) => void { /*delete (iXRTelemetry*)pObject;*/ });
	}
};

/// <summary>
/// Everything (or nearly) that is in db and will POST/PUT/ETC to remote has a Guid and a timestamp.

import { iXRLibClient } from "./iXRLibClient";
import { iXRLibStorage } from "./iXRLibStorage";
import { atobool, atol, DATEMAXVALUE, DEFAULTNAME, EnsureSingleEndingCharacter, IsClass, /*Factory,MJPQ*/ SUID } from "./network/types";
import { DataObjectBase, DbContext, DbSet, DumpCategory, FieldProperties, FieldPropertiesRecordContainer, FieldPropertyFlags, JsonFieldType } from "./network/utils/DataObjectBase";
import { ConfigurationManager, DateTime, Dictionary, iXRResult, PythonDictStrings, StringList, TimeSpan } from "./network/utils/DotNetishTypes";
import { DatabaseResult, DbSuccess } from "./network/utils/iXRLibSQLite";
import { HTTP_URL, URLParser } from "./network/utils/URLParser";

/// </summary>
export class iXRBase extends DataObjectBase
{
	protected static m_bUseCapturedTimeStamp:	boolean;
	protected static m_nCapturedTimeStamp:		number;
	// ---
	public static InitStatics(): void
	{
		this.m_bUseCapturedTimeStamp = false;
		this.m_nCapturedTimeStamp = DATEMAXVALUE;
	}
	public m_guidId:			SUID;
	public m_guidParentId:		SUID;
	// "Standard" timestamp... gets transmitted as text, subject to vagaries, should not be used for grouping objects that depend on precise comparison.
	public m_dtTimeStamp:		DateTime;
	// A precise version of the timestamp that is declared as integer so it will only be subject to precise integer operations rather than time calculations which can introduce imprecisions.
	// Note how this is not strictly Unix time... Unix time is seconds.  In order for this to guarantee the precision we want, it needs to be same resolution as the clock from which it is converted.
	// This field is motivated by the backend grouping objects by timestamp, which is reckless when using the m_dtTimeStamp due to the adulterations to which it can be subject when converted back
	// and forth from string etc.  The fact that it is not a standards-compliant timestamp is irrelevant as this field is really more of a poor-man's-guid for grouping objects that is based on timestamp.
	public m_nTimeStamp:		number;
	public m_bSyncedWithCloud:	boolean;	// On the cloud db, this is always true.  On the device, false indicates exists only in device-local SQLite db... needs update or create in cloud db to sync.
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
		{m_guidId: new FieldProperties("Id", FieldPropertyFlags.bfPrimaryKey)},
		{m_guidParentId: new FieldProperties("parentId", FieldPropertyFlags.bfParentKey)},
		{m_dtTimeStamp: new FieldProperties("timestamp")},
		{m_nTimeStamp: new FieldProperties("preciseTimestamp")},
		{m_bSyncedWithCloud: new FieldProperties("syncedWithCloud")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return iXRBase.m_mapProperties;
	}
	// ---
	constructor()
	{
		super();
		// ---
		this.m_guidId = new SUID();
		this.m_guidParentId = new SUID();
		this.m_dtTimeStamp = new DateTime().FromUnixTime(DATEMAXVALUE);
		this.m_nTimeStamp = DATEMAXVALUE;
		this.m_bSyncedWithCloud = false;	// On the cloud db, this is always true.  On the device, false indicates exists only in device-local SQLite db... needs update or create in cloud db to sync.
		// ---
		if (iXRBase.m_bUseCapturedTimeStamp)
		{
			this.m_dtTimeStamp.FromInt64(iXRBase.m_nCapturedTimeStamp);
			this.m_nTimeStamp = iXRBase.m_nCapturedTimeStamp;
		}
		else
		{
			this.m_dtTimeStamp = new DateTime().FromUnixTime(DateTime.Now());
			this.m_nTimeStamp = this.m_dtTimeStamp.ToInt64();
		}
	}
	// ---
	public static CaptureTimeStamp(): void
	{
		this.m_bUseCapturedTimeStamp = true;
		this.m_nCapturedTimeStamp = DateTime.Now();
	}
	public static UnCaptureTimeStamp(): void
	{
		this.m_bUseCapturedTimeStamp = false;
	}
	// ---
	public ShouldDump(szFieldName: string, eJsonFieldType: JsonFieldType, eDumpCategory: DumpCategory): boolean // virtual
	{
		switch (eDumpCategory)
		{
		case DumpCategory.eDumpingJsonForBackend:
			return (szFieldName !== "Id" &&
				szFieldName !== "parentId" &&
				szFieldName !== "syncedWithCloud");
		default:
			break;
		}
		return true;
	}
};

/// <summary>
/// Makes it easy to capture timestamp over a scope so all objects created/added in that scope get identical timestamp.
/// </summary>
export class CaptureTimeStampLifetime
{
	constructor()
	{
		iXRBase.CaptureTimeStamp();
	}
	dispose(): void
	{
		iXRBase.UnCaptureTimeStamp();
	}
};

/// <summary>
/// Global configuration options to govern network behaviour etc.
///		Reason it is inheriting from DataObjectBase is to make it easy to inherit from it
///		in TestData.h to have it in the JSON consumed by that code.
/// </summary>
/// This started out in iXRLibAnalytics.h where it arguably belongs among its native society
/// of associated objects.  But, it can be obtained from the backend and therefore needed by
/// iXRLibClient.h so it needs to be here.
export class iXRLibConfiguration extends DataObjectBase
{
	protected m_szRestUrl:						string;		// |_Would be cool to use __declspec(property) but that does not port to Linux.
	protected m_urlRestUrl:						HTTP_URL;	// | Using accessor instead.
	// ---
	public m_nSendRetriesOnFailure:				number;
	public m_tsSendRetryInterval:				TimeSpan;
	public m_tsSendNextBatchWait:				TimeSpan;
	public m_tsStragglerTimeout:				TimeSpan;
	public m_nEventsPerSendAttempt:				number;
	public m_nLogsPerSendAttempt:				number;
	public m_nTelemetryEntriesPerSendAttempt:	number;
	public m_nStorageEntriesPerSendAttempt:		number;
	public m_tsPruneSentItemsOlderThan:			TimeSpan;
	public m_nMaximumCachedItems:				number;
	public m_bRetainLocalAfterSent:				boolean;
	// Thread will wake up periodically and if this is configured and the token expiration is looming, it will
	// preemptively reauthenticate rather than waiting for auth error to prompt relogin.
	public m_bReAuthenticateBeforeTokenExpires: boolean;
	// Slimey hack to get us past first release.  Hopefully I'll take it out completely after we solve (hopefully) the
	// file issues (App.config, SQLite) on Android.  When false, this is a "limp along" mode that sends everything
	// immediately without cacheing to db.  Upon further contemplation, it is actually a good feature, but still,
	// hopefully default true will be an option someday; now I am saying default false is the slimey hack.
	public m_bUseDatabase:						boolean;
	// Extra data that (if not empty from backend after first auth) has to be requested from the user to be submitted
	// in a followup call to auth by being copied into the auth environment/session property of the same name after
	// being filled in.  Scorm interactionid is the initial motivation.
	public m_dictAuthMechanism:					PythonDictStrings;
	// ---
	constructor()
	{
		super();
		// ---
		this.m_szRestUrl = "";				// |_Would be cool to use __declspec(property) but that does not port to Linux.
		this.m_urlRestUrl = new HTTP_URL();	// | Using accessor instead.
		this.m_nSendRetriesOnFailure = 3;
		this.m_tsSendRetryInterval = TimeSpan.Parse("00:00:03");
		this.m_tsSendNextBatchWait = TimeSpan.Parse("00:00:30");
		this.m_tsStragglerTimeout = TimeSpan.Parse("00:00:15");
		this.m_nEventsPerSendAttempt = 16;
		this.m_nLogsPerSendAttempt = 16;
		this.m_nTelemetryEntriesPerSendAttempt = 16;
		this.m_nStorageEntriesPerSendAttempt = 16;
		this.m_tsPruneSentItemsOlderThan = TimeSpan.Parse("1.00:00:00");
		this.m_nMaximumCachedItems = 1024;
		this.m_bRetainLocalAfterSent = false;
		this.m_bReAuthenticateBeforeTokenExpires = true;
		this.m_bUseDatabase = false;
		this.m_dictAuthMechanism = new PythonDictStrings();
		// ---
		// Default URL... can be overriden by App.config or accessors in C# and C++.
		this.SetRestUrl("https://libapi.informxr.io/");
	}
	public SetRestUrl(szRestUrl: string): void
	{
		this.m_szRestUrl = szRestUrl;
		this.m_urlRestUrl = URLParser.Parse(this.m_szRestUrl);
	}
	public GetRestUrl(): string
	{
		return this.m_szRestUrl;
	}
	public GetRestUrlObject(): HTTP_URL
	{
		return this.m_urlRestUrl;
	}
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
		{m_szRestUrl: new FieldProperties("rest_url")},
		{m_nSendRetriesOnFailure: new FieldProperties("send_retries_on_failure")},
	 	{m_tsSendRetryInterval: new FieldProperties("send_retry_interval")},
	 	{m_tsSendNextBatchWait: new FieldProperties("send_next_batch_wait")},
	 	{m_tsStragglerTimeout: new FieldProperties("straggler_timeout")},
	 	{m_nEventsPerSendAttempt: new FieldProperties("events_per_send_attempt")},
	 	{m_nLogsPerSendAttempt: new FieldProperties("logs_per_send_attempt")},
	 	{m_nTelemetryEntriesPerSendAttempt: new FieldProperties("telemetry_entries_per_send_attempt")},
	 	{m_nStorageEntriesPerSendAttempt: new FieldProperties("storage_entries_per_send_attempt")},
	 	{m_tsPruneSentItemsOlderThan: new FieldProperties("prune_sent_items_older_than")},
	 	{m_nMaximumCachedItems: new FieldProperties("maximum_cached_items")},
	 	{m_bRetainLocalAfterSent: new FieldProperties("retain_local_after_sent")},
	 	{m_bReAuthenticateBeforeTokenExpires: new FieldProperties("reauthenticate_before_token_expires")},
	 	{m_bUseDatabase: new FieldProperties("use_database")},
	 	{m_dictAuthMechanism: new FieldProperties("auth_mechanism")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return iXRBase.m_mapProperties;
	}
	// ---
	/// <summary>
	/// Read App.config which is a standard C# App.config.
	/// </summary>
	/// <returns>Success or failure</returns>
	public ReadConfig(): boolean
	{
		try
		{
			// MJP TODO: Auth to REST service?  Content creator vs Customer.
			// MJP TODO: LMS (Learning Management System) integration.
			this.m_szRestUrl = ConfigurationManager.AppSettings("REST_URL", "");
			this.m_szRestUrl = EnsureSingleEndingCharacter(this.m_szRestUrl, '/');
			this.m_urlRestUrl = URLParser.Parse(this.m_szRestUrl);
			this.m_nSendRetriesOnFailure = atol(ConfigurationManager.AppSettings("SendRetriesOnFailure", "3"));
			// --- Bandwidth config parameters.
			this.m_tsSendRetryInterval = TimeSpan.Parse(ConfigurationManager.AppSettings("SendRetryInterval", "00:00:03"));
			this.m_tsSendNextBatchWait = TimeSpan.Parse(ConfigurationManager.AppSettings("SendNextBatchWait", "00:00:30"));
			// 0 = infinite, i.e. never send remainders = always send exactly EventsPerSendAttempt.
			this.m_tsStragglerTimeout = TimeSpan.Parse(ConfigurationManager.AppSettings("StragglerTimeout", "00:00:15"));
			// 0 = Send all not already sent.
			this.m_nEventsPerSendAttempt = atol(ConfigurationManager.AppSettings("EventsPerSendAttempt", "16"));
			// 0 = infinite, i.e. never prune.
			this.m_tsPruneSentItemsOlderThan = TimeSpan.Parse(ConfigurationManager.AppSettings("PruneSentItemsOlderThan", "0"));
			this.m_nMaximumCachedItems = atol(ConfigurationManager.AppSettings("MaximumCachedItems", "1024"));
			this.m_bRetainLocalAfterSent = atobool(ConfigurationManager.AppSettings("RetainLocalAfterSent", "false"));
			this.m_bReAuthenticateBeforeTokenExpires = atobool(ConfigurationManager.AppSettings("ReAuthenticateBeforeTokenExpires", "true"));
			this.m_bUseDatabase = atobool(ConfigurationManager.AppSettings("UseDatabase", "false"));
			// Note the absence here of getting "AuthMechanism".  Unless something changes, that should be exclusively supplied by backend GET config.
		}
		catch (error)
		{
			console.log("Error: ", error);
			// ---
			return false;
		}
		// ---
		return true;
	}
	public RESTConfigured(): boolean
	{
		return (this.m_szRestUrl.length > 0);
	}
};

/// <summary>
/// Application object... from "Database Models" doc... Represents the software application in use.
/// </summary>
export class iXRApplication extends iXRBase
{
	public m_szAppId:			string;
	public m_szDeviceUserId:	string;
	public m_szDeviceId:		string;
	public m_szLogLevel:		string;
	public m_szData:			string;
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
		{m_szAppId: new FieldProperties("appId")},
		{m_szDeviceUserId: new FieldProperties("deviceUserId")},
		{m_szDeviceId: new FieldProperties("deviceId")},
		{m_szLogLevel: new FieldProperties("logLevel")},
		{m_szData: new FieldProperties("data")}));
	// ---
	constructor()
	{
		super();
		// ---
		this.m_szAppId = "";
		this.m_szDeviceUserId = "";
		this.m_szDeviceId = "";
		this.m_szLogLevel = "";
		this.m_szData = "";
	}
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return iXRBase.m_mapProperties;
	}
	// --- TESTS.
// #ifdef _DEBUG
// 	void FakeUpSomeRandomCrap();
// #endif // _DEBUG
};

// ---

/// <summary>
/// LocationData contained by Event.
/// </summary>
export class iXRLocationData extends iXRBase
{
	public m_dX:	number;
	public m_dY:	number;
	public m_dZ:	number;
	// ---
	constructor()
	{
		super();
		// ---
		this.m_dX = 0.0;
		this.m_dY = 0.0;
		this.m_dZ = 0.0;
	}
	Construct(dX: number, dY: number, dZ: number): iXRLocationData
	{
		this.m_dX = dX;
		this.m_dY = dY;
		this.m_dZ = dZ;
		// ---
		return this;
	}
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_dX: new FieldProperties("x")},
	 	{m_dY: new FieldProperties("y")},
	 	{m_dZ: new FieldProperties("z")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return iXRLocationData.m_mapProperties;
	}
	// ---
	public ShouldDump(szFieldName: string, eJsonFieldType: JsonFieldType, eDumpCategory: DumpCategory): boolean // virtual
	{
		switch (eDumpCategory)
		{
		case DumpCategory.eDumpingJsonForBackend:
			if (szFieldName === "timestamp")
			{
				return false;
			}
		default:
			break;
		}
		return super.ShouldDump(szFieldName, eJsonFieldType, eDumpCategory);
	}
	// ---
// #ifdef _DEBUG
// 	void FakeUpSomeRandomCrap();
// #endif // _DEBUG
};

/// <summary>
/// Suggested log level enum.  Can use this or just pass in a uint and let it mean whatever is desired.
/// </summary>
export enum LogLevel
{
	eDebug,
	eInfo,
	eWarn,
	eError,
	eCritical
};
export function LogLevelToString(eLogLevel: LogLevel): string
{
	switch (eLogLevel)
	{
	case LogLevel.eDebug:
		return "Debug";
	case LogLevel.eInfo:
		return "Info";
	case LogLevel.eWarn:
		return "Warn";
	case LogLevel.eError:
		return "Error";
	case LogLevel.eCritical:
		return "Critical";
	default:
		break;
	}
	return "";
}
export function StringToLogLevel(szLogLevel: string): LogLevel
{
	const msz: [string, LogLevel][] =
	[
		["Debug", LogLevel.eDebug],
		["Info", LogLevel.eInfo],
		["Warn", LogLevel.eWarn],
		["Error", LogLevel.eError],
		["Critical", LogLevel.eCritical]
	];

	for (let it of msz)
	{
		if (it[0] === szLogLevel)
		{
			return it[1];
		}
	}
	return LogLevel.eDebug;
}

/// <summary>
/// General purpose... for developer to log whatever they want to log.
/// </summary>
export class iXRLog extends iXRBase
{
	public m_szLogLevel:	string;
	public m_szText:		string;
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_szLogLevel: new FieldProperties("logLevel")},
	 	{m_szText: new FieldProperties("text")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return iXRLog.m_mapProperties;
	}
	// ---
	constructor()
	{
		super();
		// ---
		this.m_szLogLevel = "";
		this.m_szText = "";
	}
	public Construct(eLogLevel: LogLevel, szText: string): iXRLog
	{
		this.m_szLogLevel = LogLevelToString(eLogLevel);
		this.m_szText = szText;
		// ---
		return this;
	}
	// --- TESTS.
// #ifdef _DEBUG
// 	void FakeUpSomeRandomCrap();
// 	void FakeUpSomeRandomCrap(bool bDontWorryAboutThisEventHasThisJustNeedItHereSoTheTemplateInstantiates)
// 	{
// 		FakeUpSomeRandomCrap();
// 	}
// #endif // _DEBUG
};

/// <summary>
/// Metrics and position tracking.
/// </summary>
export class iXRTelemetry extends iXRBase
{
	public m_szName:			string;				// Consider the x, y, z case vvv ... (x, y, z) of what?  This is the "what"... can be empty when self-evident like battery level.
	public m_dictData:			PythonDictStrings;	// General purpose... could be {"batteryLevel": "67.0"}, {"x":"34", "y":"67", "z":"26"}...
	public m_objInAppLocation:	iXRLocationData;
	// ---
	constructor()
	{
		super();
		// ---
		this.m_szName = "";
		this.m_dictData = new PythonDictStrings();
		this.m_objInAppLocation = new iXRLocationData();
	}
	public Construct(szName: string, dictData: PythonDictStrings): iXRTelemetry
	{
		this.m_szName = szName;
		this.m_dictData = dictData;
		// ---
		return this;
	}
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
 		{m_szName: new FieldProperties("name")},
 		{m_dictData: new FieldProperties("data")},
		// ---
 		{m_objInAppLocation: new FieldProperties("inAppLocation", FieldPropertyFlags.bfChild)}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return iXRTelemetry.m_mapProperties;
	}
// 	// --- TESTS.
// #ifdef _DEBUG
// 	void FakeUpSomeRandomCrap();
// 	void FakeUpSomeRandomCrap(bool bDontWorryAboutThisEventHasThisJustNeedItHereSoTheTemplateInstantiates)
// 	{
// 		FakeUpSomeRandomCrap();
// 	}
// #endif // _DEBUG
};

/// <summary>
/// Message to/from the user of the headset.
///		Sent immediately, no local cacheing to db.  But the send still uses SendRetriesOnFailure/SendRetryInterval.
///		Does NOT exist in database schema (iXRDbContext below).
/// </summary>
export class iXRAIProxy extends iXRBase
{
	public m_szPrompt:			string;				// String type value.
	public m_dictPastMessages:	PythonDictStrings;	// The history of chat (if needed).
	public m_szLLMProvider:		string;				// (Optional) a string type value that can be used to choose a specific pre-defined chatbot.
	// ---
	constructor()
	{
		super();
		// ---
		this.m_szPrompt = "";
		this.m_dictPastMessages = new PythonDictStrings();
		this.m_szLLMProvider = "";
	}
	/// <summary>
	/// For passing past messages in as comma-separated list.
	/// </summary>
	/// <param name="szPrompt">Prompt.</param>
	/// <param name="szPastMessages">Past messages as comma-separated list.</param>
	/// <param name="szLMMProvider">LMM Provider.</param>
	public Construct0(szPrompt: string, szPastMessages: string, szLMMProvider: string): iXRAIProxy
	{
		this.m_szPrompt = szPrompt;
		this.m_dictPastMessages = new PythonDictStrings().Construct(szPastMessages);
		this.m_szLLMProvider = szLMMProvider;
		// ---
		return this;
	}
	/// <summary>
	/// For passing past messages in as what it is... PythonDictStrings.
	/// </summary>
	/// <param name="szPrompt">Prompt.</param>
	/// <param name="szPastMessages">Past messages.</param>
	/// <param name="szLMMProvider">LMM Provider.</param>
	public Construct1(szPrompt: string, dictPastMessages: PythonDictStrings, szLMMProvider: string): iXRAIProxy
	{
		this.m_szPrompt = szPrompt;
		this.m_dictPastMessages = dictPastMessages;
		this.m_szLLMProvider = szLMMProvider;
		// ---
		return this;
	}
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
 		{m_szPrompt: new FieldProperties("prompt")},
 		{m_dictPastMessages: new FieldProperties("pastMessages")},
 		{m_szLLMProvider: new FieldProperties("llmProvider")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return iXRAIProxy.m_mapProperties;
	}
// 	// --- TESTS.
// #ifdef _DEBUG
// 	void FakeUpSomeRandomCrap();
// 	void FakeUpSomeRandomCrap(bool bDontWorryAboutThisEventHasThisJustNeedItHereSoTheTemplateInstantiates)
// 	{
// 		FakeUpSomeRandomCrap();
// 	}
// #endif // _DEBUG
};

/// <summary>
/// Event object... from "ixrlib Spec 2023" doc... the main event object that will be profligately POST/PUT/ETCed to the backend for data analytics.
///		These are proactively added by the content creator, i.e. NOT automatically obtained by us from the platform, headset-OS, other API, etc.
/// </summary>
export class iXREvent extends iXRBase
{
	// static std.recursive_mutex				m_csDictProtect;
	// MJPQ:  This is a massive pain if I have to do this in the constructor to avoid that "cannot read property of undefined" error.
	public static m_dictAssessmentStartTimes:	Dictionary<string, DateTime>;
	public static m_dictObjectiveStartTimes:	Dictionary<string, DateTime>;
	public static m_dictInteractionStartTimes:	Dictionary<string, DateTime>;
	public static m_dictLevelStartTimes:		Dictionary<string, DateTime>;
	// ---
	public static InitStatics(): void
	{
		iXREvent.m_dictAssessmentStartTimes = new Dictionary<string, DateTime>();
		iXREvent.m_dictObjectiveStartTimes = new Dictionary<string, DateTime>();
		iXREvent.m_dictInteractionStartTimes = new Dictionary<string, DateTime>();
		iXREvent.m_dictLevelStartTimes = new Dictionary<string, DateTime>();
	}
	// ---
	m_szName:			string;
	m_dictMeta:			PythonDictStrings;
	m_szEnvironment:	string;
	// ---
	constructor()
	{
		super();
		// ---
		this.m_szName = "";
		this.m_dictMeta = new PythonDictStrings();
		this.m_szEnvironment = "";
	}
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_szName: new FieldProperties("name")},
	 	{m_dictMeta: new FieldProperties("meta")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return iXREvent.m_mapProperties;
	}
	// ---
	public Construct(szName: string, dictMeta: PythonDictStrings) : iXREvent
	{
		this.m_szName = szName;
		this.m_dictMeta = dictMeta;
		// ---
		return this;
	}
	// --- TESTS.
// #ifdef _DEBUG
// 	void FakeUpSomeCrap();
// 	void FakeUpSomeDifferentCrap();
// 	void FakeUpSomeRandomCrap();
// 	void FakeUpSomeRandomCrap(bool bWantChildObjects);
// #endif // _DEBUG
};

/// <summary>
/// Backend Event endpoint wants an object called "data" that contains the list of events.
///		This is that container object.  Uses the GenerateJsonAlternate() mechanism to dump
///		a list of iXREvent pointers instead of this child list which is therefore just a
///		placeholder in that case.
/// </summary>
/// <typeparam name="T">Type of object being contained.</typeparam>
/// <typeparam name="T_CONTAINS">Type of object inside T that also has to be on its own for when Python makes it an object instead of an array in the JSON.</typeparam>
/// <typeparam name="bWantTimeStamp">Want timestamp when dumping JSON for backend.</typeparam>
export class iXRXXXContainer<T extends DataObjectBase, T_CONTAINS, bTWantTimestamp extends boolean> extends iXRBase
{
	public m_tIXRXXX:		T_CONTAINS;	// This is here to catch the data when Python is representing it as an object rather than array.
	public m_dspIXRXXXs:	DbSet<T>;	// The main data.
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_tIXRXXX: new FieldProperties("data")},
		// ---
	 	{m_dspIXRXXXs: new FieldProperties("data", FieldPropertyFlags.bfChildList)}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return iXRXXXContainer.m_mapProperties;
	}
	// ---
	constructor(tTypeOfT: any, tTypeOfT_CONTAINS: any, public bWantTimestamp: bTWantTimestamp = false as bTWantTimestamp)
	{
		super();
		if (IsClass(tTypeOfT_CONTAINS))
		{
			this.m_tIXRXXX = new tTypeOfT_CONTAINS();
		}
		else
		{
			this.m_tIXRXXX = tTypeOfT_CONTAINS;
		}
		this.m_dspIXRXXXs = new DbSet<T>(tTypeOfT);
	}
	public ShouldDump(szFieldName: string, eJsonFieldType: JsonFieldType, eDumpCategory: DumpCategory) : boolean // virtual
	{
		//const bWantTimestamp:	bTWantTimestamp;

		if (eJsonFieldType === JsonFieldType.eField && szFieldName === "data")
		{
			return false;
		}
		switch (eDumpCategory)
		{
		case DumpCategory.eDumpingJsonForBackend:
			if (szFieldName === "timestamp")
			{
				return this.bWantTimestamp;
			}
			break;
		default:
			break;
		}
		return super.ShouldDump(szFieldName, eJsonFieldType, eDumpCategory);
	}
	// --- TESTS.
// #ifdef _DEBUG
// 	void FakeUpSomeRandomCrap()
// 	{
// 		m_dspIXRXXXs.emplace_front().FakeUpSomeRandomCrap();
// 	}
// 	void FakeUpSomeRandomCrap(bool bDontWorryAboutThisEventHasThisJustNeedItHereSoTheTemplateInstantiates)
// 	{
// 		FakeUpSomeRandomCrap();
// 	}
// #endif
};

/// <summary>
/// Backend Storage endpoint wants to wrap scalars in "data":{<the-scalar>}.
///		This is that container object.
/// </summary>
/// <typeparam name="T"></typeparam>
export class iXRXXXScalarContainer<T extends iXRBase> extends iXRBase
{
	public m_tIXRXXX:	T = {} as T;
	// ---
	// iXRXXXScalarContainer<T>() = default;
	// iXRXXXScalarContainer<T>(const T& t) :
	// 	m_tIXRXXX(t)
	// {
	// }
	// iXRXXXScalarContainer<T>(T&& t) :
	// 	m_tIXRXXX(t)
	// {
	// }
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
		{m_tIXRXXX: new FieldProperties("data", FieldPropertyFlags.bfChild)}));
	// ---
	constructor(tTypeOfT: any)
	{
		super();
		this.m_tIXRXXX = new tTypeOfT();
	}
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return iXRXXXScalarContainer.m_mapProperties;
	}
	// ---
	public ShouldDump(szFieldName: string, eJsonFieldType: JsonFieldType, eDumpCategory: DumpCategory): boolean // virtual
	{
		switch (eDumpCategory)
		{
		case DumpCategory.eDumpingJsonForBackend:
			if (szFieldName === "timestamp")
			{
				return false;
			}
		default:
			break;
		}
		return super.ShouldDump(szFieldName, eJsonFieldType, eDumpCategory);
	}
};

// ---

/// <summary>
/// Backend has this in a double-nested "data" structure.  That is why this is here, this is the inner one.
/// </summary>
export class iXRStorageData extends iXRBase
{
	public m_cdictData:	PythonDictStrings;
	// ---
	constructor()
	{
		super();
		// ---
		this.m_cdictData = new PythonDictStrings();
	}
	public Construct0(dictData: PythonDictStrings) : iXRStorageData
	{
		this.m_cdictData = dictData;
		// ---
		return this;
	}
	public Construct1(szdictData: string) : iXRStorageData
	{
		this.m_cdictData = new PythonDictStrings().Construct(szdictData);
		// ---
		return this;
	}
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_cdictData: new FieldProperties("data")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return iXRStorageData.m_mapProperties;
	}
	// --- TESTS.
// #ifdef _DEBUG
// 	void FakeUpSomeRandomCrap();
// 	void FakeUpSomeRandomCrap(bool bDontWorryAboutThisEventHasThisJustNeedItHereSoTheTemplateInstantiates)
// 	{
// 		FakeUpSomeRandomCrap();
// 	}
// #endif
};

/// <summary>
/// Inherit from container template that handles the array vs single object bollocks from Python.
///		Mainly to shorten the name of the thing and have FinalizeParse().  Would be cool if
///		FinalizeParse() could be in iXRXXXContainer<> but the other things that use iXRXXXContainer<>
///		bum that up due to T_CONTAINS.  Would like to clean that up.  If I manage to, I'll revisit this.
/// </summary>
export class StorageContainer extends iXRXXXContainer<iXRStorageData, PythonDictStrings, true>
{
	constructor()
	{
		super(iXRStorageData, PythonDictStrings, true);
	}
	FinalizeParse() : void // virtual
	{
		if (this.m_dspIXRXXXs.empty())
		{
			this.m_dspIXRXXXs.Add(new iXRStorageData().Construct0(this.m_tIXRXXX));
		}
	}
};

/// <summary>
/// Mainly state, but more general than that... whatever user wants but principally state info.
/// </summary>
export class iXRStorage extends iXRBase
{
	public m_szKeepPolicy:	string;						// "keepLatest" or "appendHistory"
	public m_szName:		string;
	public m_dsData:		DbSet<StorageContainer>;	// Accommodates backend wanting this nested... on this end, always exactly one item in it.
	public m_szOrigin:		string;						// Optional, but if not blank, must be "system" or "user"
	public m_bSessionData:	boolean;
	public m_lszTags:		StringList;
	// ---
	constructor()
	{
		super();
		this.m_szKeepPolicy = "appendHistory";
		this.m_szName = "";
		this.m_dsData = new DbSet<StorageContainer>(StorageContainer);
		this.m_szOrigin = "";
		this.m_bSessionData = false;
		this.m_lszTags = new StringList();
	}
	Construct0(bKeepLatest: boolean, szName: string, dictData: PythonDictStrings, szOrigin: string, bSessionData: boolean) : iXRStorage
	{
		this.m_szKeepPolicy = (bKeepLatest) ? "keepLatest" : "appendHistory";
		this.m_szName = szName;
		this.m_szOrigin = szOrigin;
		this.m_bSessionData = bSessionData;
		this.m_dsData.clear();
		this.m_dsData.Add(new StorageContainer).m_dspIXRXXXs.Add(new iXRStorageData().Construct0(dictData));
		// ---
		return this;
	}
	Construct1(bKeepLatest: boolean, szName: string, szdictData: string, szOrigin: string, bSessionData: boolean) : iXRStorage
	{
		this.m_szKeepPolicy = (bKeepLatest) ? "keepLatest" : "appendHistory";
		this.m_szName = szName;
		this.m_szOrigin = szOrigin;
		this.m_bSessionData = bSessionData;
		this.m_dsData.clear();
		this.m_dsData.Add(new StorageContainer).m_dspIXRXXXs.Add(new iXRStorageData().Construct1(szdictData));
		// ---
		return this;
	}
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_szKeepPolicy: new FieldProperties("keepPolicy")},
	 	{m_szName: new FieldProperties("name")},
	 	{m_szOrigin: new FieldProperties("origin")},
	 	{m_bSessionData: new FieldProperties("sessionData")},
	 	{m_lszTags: new FieldProperties("tags")},
		// ---
	 	{m_dsData: new FieldProperties("data", FieldPropertyFlags.bfChildList)}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return iXRStorage.m_mapProperties;
	}
	// --- TESTS.
// #ifdef _DEBUG
// 	void FakeUpSomeRandomCrap();
// 	void FakeUpSomeRandomCrap(bool bDontWorryAboutThisEventHasThisJustNeedItHereSoTheTemplateInstantiates)
// 	{
// 		FakeUpSomeRandomCrap();
// 	}
// #endif // _DEBUG
};

/// <summary>
/// Functionality for iXRStorage list... do NOT ever add data members to this as the actual instance needs
///		to be a DbSet<iXRStorage> so compile-time childobjectlistproperty type deduction works properly.
/// </summary>
export class DbSetStorage extends DbSet<iXRStorage>
{
	public static DEFAULTNAME:	string;
	// ---
	public static InitStatics(): void
	{
		this.DEFAULTNAME = "state";
	}
	// Default name 'state'
	public GetEntry0(): iXRStorage | null
	{
		return this.GetEntry1(DEFAULTNAME);
	}
	public GetEntry1(szName: string): iXRStorage | null
	{
		for (let ixd of this.values())
		{
			if (ixd.m_szName === szName)
			{
				return ixd;
			}
		}
		return null;
	}
	// ---
	// Default name 'state'
	public async SetEntry0(dictData: PythonDictStrings, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): Promise<iXRResult>
	{
		return await this.SetEntry1(DEFAULTNAME, dictData, bKeepLatest, szOrigin, bSessionData);
	}
	public async SetEntry1(szName: string, dictData: PythonDictStrings, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): Promise<iXRResult>
	{
		for (let ixd of this.values())
		{
			if (ixd.m_szName === szName)
			{
				if (!ixd.m_dsData.empty() && !ixd.m_dsData[0].m_dspIXRXXXs.empty())
				{
					ixd.m_dsData[0].m_dspIXRXXXs[0].m_cdictData = dictData;
				}
				// ---
				return iXRLibStorage.AddEntrySynchronous(ixd);
			}
		}
		// --- MJP:  for now, coding just the synchronous case.  As these are environment variables, blocking main thread should not be a big deal.
		const ixrs = new iXRStorage().Construct0(bKeepLatest, szName, dictData, szOrigin, bSessionData);
		super.push(ixrs)
		// ---
		return await iXRLibStorage.AddEntrySynchronous(ixrs);
	}
	// Default name 'state'
	public async SetEntry2(szdictData: string, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): Promise<iXRResult>
	{
		return await this.SetEntry3(DEFAULTNAME, szdictData, bKeepLatest, szOrigin, bSessionData);
	}
	public async SetEntry3(szName: string, szdictData: string, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): Promise<iXRResult>
	{
		for (let ixd of this.values())
		{
			if (ixd.m_szName === szName)
			{
				if (!ixd.m_dsData.empty() && !ixd.m_dsData[0].m_dspIXRXXXs.empty())
				{
					ixd.m_dsData[0].m_dspIXRXXXs[0].m_cdictData = new PythonDictStrings().Construct(szdictData);
				}
				// ---
				return iXRLibStorage.AddEntrySynchronous(ixd);
			}
		}
		// --- MJP:  for now, coding just the synchronous case.  As these are environment variables, blocking main thread should not be a big deal.
		const ixrs = new iXRStorage().Construct0(bKeepLatest, szName, new PythonDictStrings().Construct(szdictData), szOrigin, bSessionData);
		super.push(ixrs)
		// ---
		return await iXRLibStorage.AddEntrySynchronous(ixrs);
	}
	// ---
	// Default name 'state'
	public async RemoveEntry0(dbContext: iXRDbContext): Promise<iXRResult>
	{
		// As name is explicit, "state", passing false in for bSessionOnly (backend considers
		// true to be default but since it is named, want anything with that name gone).
		return await this.RemoveEntry1(dbContext, DEFAULTNAME);
	}
	public async RemoveEntry1(dbContext: iXRDbContext, szName: string): Promise<iXRResult>
	{
		var	eRet:				iXRResult;
		var	szResponse:			string = "";
		var	bChangedSomething:	boolean = false;

		// Delete from backend.
		eRet = await iXRLibClient.DeleteIXRStorageEntry(szName, {szResponse: ""});
		// ---
		if (eRet === iXRResult.eOk)
		{
			// Reflect what we just did on backend in device-local db.
			for (let it of this.values())
			{
				// If you look at the backend, there is a boolean userOnly flag whose specification is:
				//	true = Delete data for the user only across all devices for the current app.
				//	false = Delete data for the user on the current device only.
				// Note how there is no third clause with that in it... all the entries in the db are
				// on this device and therefore are all to be deleted for either value of that flag.
				if (it.m_szName === szName)
				{
					super.erase(it);
					bChangedSomething = true;
				}
			}
			if (bChangedSomething)
			{
				if (!DbSuccess(dbContext.SaveChanges()))
				{
					eRet = iXRResult.eDeleteObjectsFailedDatabase;
				}
			}
			// ---
			return eRet;
		}
		// ---
		return iXRResult.eObjectNotFound;
	}
	public async RemoveMultipleEntries(dbContext: iXRDbContext, bSessionOnly: boolean): Promise<iXRResult>
	{
		var	eRet:				iXRResult;
		var	szResponse:			string = "";
		var	bChangedSomething:	boolean = false;

		// Delete from backend.
		eRet = await iXRLibClient.DeleteMultipleIXRStorageEntries(bSessionOnly, {szResponse});
		// ---
		if (eRet === iXRResult.eOk)
		{
			// Reflect what we just did on backend in device-local db.
			for (let it of this.values())
			{
				// If you look at the backend, there is a boolean userOnly flag whose specification is:
				//	true = Delete data for the user only across all devices for the current app.
				//	false = Delete data for the user on the current device only.
				// Note how there is no third clause with that in it... all the entries in the db are
				// on this device and therefore are all to be deleted for either value of that flag.
				if (!bSessionOnly || it.m_bSessionData)
				{
					super.erase(it);
					bChangedSomething = true;
				}
			}
			if (bChangedSomething)
			{
				if (!DbSuccess(dbContext.SaveChanges()))
				{
					eRet = iXRResult.eDeleteObjectsFailedDatabase;
				}
			}
			// ---
			return eRet;
		}
		// ---
		return iXRResult.eObjectNotFound;
	}
};

/// <summary>
/// Last (configured) errors as last resort for those who do not want to call
/// synchronous and wait for error or call asynchronous and handle callback.
/// </summary>
export class iXRErrors extends iXRBase
{
	m_szErrorString:	string;
	// ---
	constructor()
	{
		super();
		// ---
		this.m_szErrorString = "";
	}
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_szErrorString: new FieldProperties("errorString")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return iXRErrors.m_mapProperties;
	}
};

/// <summary>
/// The Entity-Framework-ish database object.
/// </summary>
export class iXRDbContext extends DbContext
{
	m_dsIXRApplications:	DbSet<iXRApplication>;
	m_dsIXRLogs:			DbSet<iXRLog>;
	m_dsIXRTelemetry:		DbSet<iXRTelemetry>;
	m_dsIXREvents:			DbSet<iXREvent>;	// Table name IXREvents.
	m_dsIXRStorage:			DbSet<iXRStorage>;	// State info, etc.
	m_szDbPath:				string;
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
		// ---
	 	{m_dsIXRApplications: new FieldProperties("IXRApplications", FieldPropertyFlags.bfChildList)},
	 	{m_dsIXRLogs: new FieldProperties("IXRLogs", FieldPropertyFlags.bfChildList)},
	 	{m_dsIXRTelemetry: new FieldProperties("IXRTelemetry", FieldPropertyFlags.bfChildList)},
	 	{m_dsIXREvents: new FieldProperties("IXREvents", FieldPropertyFlags.bfChildList)},
	 	{m_dsIXRStorage: new FieldProperties("IXRStorage", FieldPropertyFlags.bfChildList)}));
	// ---
	// iXRDbContext() :
	// 	iXRDbContext(false)
	// {
	// }
	constructor(bDeleteIfExists: boolean)
	{
		super();
		// ---
		this.m_dsIXRApplications = new DbSet<iXRApplication>(iXRApplication);
		this.m_dsIXRLogs = new DbSet<iXRLog>(iXRLog);
		this.m_dsIXRTelemetry = new DbSet<iXRTelemetry>(iXRTelemetry);
		this.m_dsIXREvents = new DbSet<iXREvent>(iXREvent);
		this.m_dsIXRStorage = new DbSet<iXRStorage>(iXRStorage);
		this.m_szDbPath = "";
		// ---
	// 	m_szDbPath = NormalizePath("InformXR.db").c_str();
	// 	if (bDeleteIfExists)
	// 	{
	// 		std.filesystem.path	fpDbPath(m_szDbPath.c_str());

	// 		if (std.filesystem.exists(fpDbPath))
	// 		{
	// 			std.filesystem.remove(fpDbPath);
	// 		}
	// 	}
	// 	ConstructGuts();
	}
	// iXRDbContext(const mstringb& szDbPath) :
	// 	iXRDbContext(szDbPath, false)
	// {
	// }
	// iXRDbContext(const mstringb& szDbPath, bool bDeleteIfExists)
	// {
	// 	std.filesystem.path	fpDbPath(szDbPath.c_str());

	// 	m_szDbPath = szDbPath;
	// 	if (bDeleteIfExists)
	// 	{
	// 		if (std.filesystem.exists(fpDbPath))
	// 		{
	// 			std.filesystem.remove(fpDbPath);
	// 		}
	// 	}
	// 	Construct();
	// }
	// DatabaseResult CreateSchema(SqliteDbConnection& db);
	// DatabaseResult LoadAll(SqliteDbConnection& db)
	// {
	// 	DatabaseResult	eRet = DatabaseResult.eOk,
	// 					eTestRet;

	// 	// We first get the number of child list properties.
	// 	constexpr size_t nbChildObjectListProperties = std.tuple_size<decltype(iXRDbContext.childobjectlistproperties)>.value;
	// 	// Recursively load them.
	// 	for_sequence(std.make_index_sequence<nbChildObjectListProperties>{}, [&](auto i)
	// 	{
	// 		// Get the property.
	// 		constexpr auto	objChildListProperty = std.get<i>(iXRDbContext.childobjectlistproperties);
	// 		// Call this recursively.
	// 		eTestRet = ExecuteSqlSelect(db, objChildListProperty.name, "SELECT %s FROM %s", {}, this->*(objChildListProperty.member));
	// 		if (!DbSuccess(eTestRet))
	// 		{
	// 			eRet = eTestRet;
	// 		}
	// 	});
	// 	// ---
	// 	return eRet;
	// }
	// --- Functions supporting adding/changing/deleting iXRStorage objects.  These objects are "more global" than the other
	//		objects, more like environment variables, hence enjoy pride of place as such.
	// DatabaseResult LoadStorageEntries()
	// {
	// 	return ExecuteSqlSelect(m_db, "iXRStorage", "SELECT %s FROM %s", {}, m_dsIXRStorage);
	// }
	public LoadStorageEntriesIfNecessary(): DatabaseResult
	{
	// 	if (m_dsIXRStorage.Count() === 0)
	// 	{
	// 		return ExecuteSqlSelect(m_db, "iXRStorage", "SELECT %s FROM %s", {}, m_dsIXRStorage);
	// 	}
		return DatabaseResult.eOk;
	}
	// Default name 'state'
	public StorageGetEntry0(): PythonDictStrings | null
	{
		var pixrs:	iXRStorage | null;

		this.LoadStorageEntriesIfNecessary();
		pixrs = (this.m_dsIXRStorage as DbSetStorage).GetEntry0();
		// ---
		return (pixrs && !pixrs.m_dsData.empty() && !pixrs.m_dsData[0].m_dspIXRXXXs.empty()) ? pixrs.m_dsData[0].m_dspIXRXXXs[0].m_cdictData : null;
	}
	public StorageGetEntry1(szName: string): PythonDictStrings | null
	{
		var	pixrs: iXRStorage | null;

		this.LoadStorageEntriesIfNecessary();
		pixrs = (this.m_dsIXRStorage as DbSetStorage).GetEntry1(szName);
		// ---
		return (pixrs && !pixrs.m_dsData.empty() && !pixrs.m_dsData[0].m_dspIXRXXXs.empty()) ? pixrs.m_dsData[0].m_dspIXRXXXs[0].m_cdictData : null;
	}
	// Default name 'state'
	public StorageGetEntryAsString0(): string
	{
		var	szRet:	string = "";
		var	pixrs:	iXRStorage | null;

		this.LoadStorageEntriesIfNecessary();
		pixrs = (this.m_dsIXRStorage as DbSetStorage).GetEntry0();
		if (pixrs && !pixrs.m_dsData.empty() && !pixrs.m_dsData[0].m_dspIXRXXXs.empty())
		{
			szRet = pixrs.m_dsData[0].m_dspIXRXXXs[0].m_cdictData.ToString();
		}
		// ---
		return szRet;
	}
	public StorageGetEntryAsString1(szName: string): string
	{
		var	szRet:	string = "";
		var	pixrs:	iXRStorage | null;

		this.LoadStorageEntriesIfNecessary();
		pixrs = (this.m_dsIXRStorage as DbSetStorage).GetEntry1(szName);
		if (pixrs && !pixrs.m_dsData.empty() && !pixrs.m_dsData[0].m_dspIXRXXXs.empty())
		{
			szRet = pixrs.m_dsData[0].m_dspIXRXXXs[0].m_cdictData.ToString();
		}
		// ---
		return szRet;
	}
	// Default name 'state'
	public async StorageSetEntry0(szData: string, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): Promise<iXRResult>
	{
		this.LoadStorageEntriesIfNecessary();
		// ---
		return (this.m_dsIXRStorage as DbSetStorage).SetEntry0(new PythonDictStrings().Construct(szData), bKeepLatest, szOrigin, bSessionData);
	}
	public async StorageSetEntry1(szName: string, szData: string, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): Promise<iXRResult>
	{
		this.LoadStorageEntriesIfNecessary();
		// ---
		return (this.m_dsIXRStorage as DbSetStorage).SetEntry3(szName, szData, bKeepLatest, szOrigin, bSessionData);
	}
	// Default name 'state'
	public async StorageSetEntry2(dictData: PythonDictStrings, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): Promise<iXRResult>
	{
		this.LoadStorageEntriesIfNecessary();
		// ---
		return (this.m_dsIXRStorage as DbSetStorage).SetEntry0(dictData, bKeepLatest, szOrigin, bSessionData);
	}
	public async StorageSetEntry3(szName: string, dictData: PythonDictStrings, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): Promise<iXRResult>
	{
		this.LoadStorageEntriesIfNecessary();
		// ---
		return (this.m_dsIXRStorage as DbSetStorage).SetEntry1(szName, dictData, bKeepLatest, szOrigin, bSessionData);
	}
	// Default name 'state'
	public async StorageRemoveEntry0(): Promise<iXRResult>
	{
		this.LoadStorageEntriesIfNecessary();
		// ---
		return await(this.m_dsIXRStorage as DbSetStorage).RemoveEntry0(this);
	}
	public async StorageRemoveEntry1(szName: string): Promise<iXRResult>
	{
		this.LoadStorageEntriesIfNecessary();
		// ---
		return await(this.m_dsIXRStorage as DbSetStorage).RemoveEntry1(this, szName);
	}
	public async StorageRemoveMultipleEntries(bSessionOnly: boolean): Promise<iXRResult>
	{
		this.LoadStorageEntriesIfNecessary();
		// ---
		return await(this.m_dsIXRStorage as DbSetStorage).RemoveMultipleEntries(this, bSessionOnly);
	}
	// --- END Functions supporting adding/changing/deleting iXRStorage objects.
	private ConstructGuts(): void
	{
		// if (m_db.ConnectSQLite(m_szDbPath) === DatabaseResult.eOk)
		// {
		// 	if (!m_db.HasSchema())
		// 	{
		// 		CreateSchema(m_db);
		// 	}
		// }
	}
	public SaveChanges(): DatabaseResult // virtual
	{
		//return iXRLib.SaveChanges(m_db, null, this);
		return DatabaseResult.eOk;
	}
	// Return dictionary
	public getAllData(): PythonDictStrings
	{
		return new PythonDictStrings();
	}
	// --- TESTS.
// #ifdef _DEBUG
// 	void FakeUpSomeRandomCrap();
// #endif // _DEBUG
};

/// <summary>
/// Get all the REST endpoints in one place mapped to type being POSTed.
/// </summary>
/// <typeparam name="T">Type being POSTed.</typeparam>
/// <typeparam name="iXRLibConfiguration">Pass in iXRLibConfiguration where this is instantiated... resolves forward-referencing catch-22.</typeparam>
/// <returns>REST endpoint string const.</returns>
export function RESTEndpointFromType<T>() : string
{
	const tDraft = {} as T;

	if (tDraft instanceof iXREvent)
	{
		return "collect/event";
	}
	else if (tDraft instanceof iXRLog)
	{
		return "collect/log";
	}
	else if (tDraft instanceof iXRTelemetry)
	{
		return "collect/telemetry";
	}
	else if (tDraft instanceof iXRAIProxy)
	{
		return "services/llm";
	}
	else if (tDraft instanceof iXRLibConfiguration)
	{
		return "storage/config";
	}
	else if (tDraft instanceof iXRStorage)
	{
		return "storage";
	}
	return "dev/null";
}

// The AI suggests these and since this seems to have to be revisited ad infinitum, going to document them with comments.
// function RESTEndpointFromType<T>(): string
// {
// 	// Map types to their REST endpoints
// 	if ((T as any) === iXREvent) return "events";
// 	if ((T as any) === iXRLog) return "logs";
// 	if ((T as any) === iXRTelemetry) return "telemetry";
// 	if ((T as any) === iXRStorage) return "storage";
// 	if ((T as any) === iXRAIProxy) return "ai/proxy";
// 	return "";
// }

// function RESTEndpointFromType<T extends iXRBase>(): string
// {
// 	switch (T.name)
// 	{
// 		case 'iXREvent': return 'events';
// 		case 'iXRLog': return 'logs';
// 		case 'iXRTelemetry': return 'telemetry';
// 		case 'iXRStorage': return 'storage';
// 		case 'iXRAIProxy': return 'ai/proxy';
// 		default: return '';
// 	}
// }

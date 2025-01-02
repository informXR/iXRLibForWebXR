/// <summary>
/// Everything (or nearly) that is in db and will POST/PUT/ETC to remote has a Guid and a timestamp.

import { iXRLibClient } from "./iXRLibClient";
import { iXRLibStorage } from "./iXRLibStorage";
import { atobool, atol, DATEMAXVALUE, DEFAULTNAME, SUID } from "./network/types";
import { DataObjectBase, DbContext, DbSet, DumpCategory, FieldProperties, FieldPropertiesRecordContainer, FieldPropertyFlags, JsonFieldType } from "./network/utils/DataObjectBase";
import { ConfigurationManager, DateTime, Dictionary, iXRResult, PythonDictStrings, StringList, TimeSpan } from "./network/utils/DotNetishTypes";
import { DatabaseResult, DbSuccess } from "./network/utils/iXRLibSQLite";

/// </summary>
export class iXRBase extends DataObjectBase
{
	protected static m_bUseCapturedTimeStamp:	boolean = false;
	protected static m_nCapturedTimeStamp:		number = DATEMAXVALUE;
	// ---
	public m_guidId:			SUID = new SUID();
	public m_guidParentId:		SUID = new SUID();
	// "Standard" timestamp... gets transmitted as text, subject to vagaries, should not be used for grouping objects that depend on precise comparison.
	public m_dtTimeStamp:		DateTime = new DateTime().FromUnixTime(DATEMAXVALUE);
	// A precise version of the timestamp that is declared as integer so it will only be subject to precise integer operations rather than time calculations which can introduce imprecisions.
	// Note how this is not strictly Unix time... Unix time is seconds.  In order for this to guarantee the precision we want, it needs to be same resolution as the clock from which it is converted.
	// This field is motivated by the backend grouping objects by timestamp, which is reckless when using the m_dtTimeStamp due to the adulterations to which it can be subject when converted back
	// and forth from string etc.  The fact that it is not a standards-compliant timestamp is irrelevant as this field is really more of a poor-man's-guid for grouping objects that is based on timestamp.
	public m_nTimeStamp:		number = DATEMAXVALUE;
	public m_bSyncedWithCloud:	boolean = false;	// On the cloud db, this is always true.  On the device, false indicates exists only in device-local SQLite db... needs update or create in cloud db to sync.
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
		{m_guidId: new FieldProperties("Id", FieldPropertyFlags.bfPrimaryKey)},
		{m_guidParentId: new FieldProperties("parentId", FieldPropertyFlags.bfParentKey)},
		{m_dtTimeStamp: new FieldProperties("timestamp")},
		{m_dtTimeStamp: new FieldProperties("preciseTimestamp")},
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
	dispose()
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
	protected m_szRestUrl:						string = "";		// |_Would be cool to use __declspec(property) but that does not port to Linux.
	protected m_urlRestUrl:						URLParser.HTTP_URL;	// | Using accessor instead.
	// ---
	public m_nSendRetriesOnFailure:				number = 3;
	public m_tsSendRetryInterval:				TimeSpan = TimeSpan.Parse("00:00:03");
	public m_tsSendNextBatchWait:				TimeSpan = TimeSpan.Parse("00:00:30");
	public m_tsStragglerTimeout:				TimeSpan = TimeSpan.Parse("00:00:15");
	public m_nEventsPerSendAttempt:				number = 16;
	public m_nLogsPerSendAttempt:				TimeSpan = new TimeSpan().Construct2(16);
	public m_nTelemetryEntriesPerSendAttempt:	number = 16;
	public m_nStorageEntriesPerSendAttempt:		number = 16;
	public m_tsPruneSentItemsOlderThan:			TimeSpan = TimeSpan.Parse("1.00:00:00");
	public m_nMaximumCachedItems:				number = 1024;
	public m_bRetainLocalAfterSent:				boolean = false;
	// Thread will wake up periodically and if this is configured and the token expiration is looming, it will
	// preemptively reauthenticate rather than waiting for auth error to prompt relogin.
	public m_bReAuthenticateBeforeTokenExpires: boolean = true;
	// Slimey hack to get us past first release.  Hopefully I'll take it out completely after we solve (hopefully) the
	// file issues (App.config, SQLite) on Android.  When false, this is a "limp along" mode that sends everything
	// immediately without cacheing to db.  Upon further contemplation, it is actually a good feature, but still,
	// hopefully default true will be an option someday; now I am saying default false is the slimey hack.
	public m_bUseDatabase:						boolean = false;
	// Extra data that (if not empty from backend after first auth) has to be requested from the user to be submitted
	// in a followup call to auth by being copied into the auth environment/session property of the same name after
	// being filled in.  Scorm interactionid is the initial motivation.
	public m_dictAuthMechanism:					PythonDictStrings = new PythonDictStrings();
	// ---
	iXRLibConfiguration()
	{
		// Default URL... can be overriden by App.config or accessors in C# and C++.
		this.SetRestUrl("https://libapi.informxr.io/");
	}
	public SetRestUrl(szRestUrl: string): void
	{
		this.m_szRestUrl = szRestUrl;
		this.m_urlRestUrl = URLParser.Parse(m_szRestUrl);
	}
	public GetRestUrl(): string
	{
		return this.m_szRestUrl;
	}
	public GetRestUrlObject(): URLParser.HTTP_URL
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
			this.m_szRestUrl.EnsureSingleEndingCharacter('/');
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
			// iXRLibClient.WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
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
	public m_szAppId:			string = "";
	public m_szDeviceUserId:	string = "";
	public m_szDeviceId:		string = "";
	public m_szLogLevel:		string = "";
	public m_szData:			string = "";
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
		{m_szAppId: new FieldProperties("appId")},
		{m_szDeviceUserId: new FieldProperties("deviceUserId")},
		{m_szDeviceId: new FieldProperties("deviceId")},
		{m_szLogLevel: new FieldProperties("logLevel")},
		{m_szData: new FieldProperties("data")}));
	// ---
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
	public m_dX:	number = 0.0;
	public m_dY:	number = 0.0;
	public m_dZ:	number = 0.0;
	// ---
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
	public m_szLogLevel:	string = "";
	public m_szText:		string = "";
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
	public m_szName:			string = "";									// Consider the x, y, z case vvv ... (x, y, z) of what?  This is the "what"... can be empty when self-evident like battery level.
	public m_dictData:			PythonDictStrings = new PythonDictStrings();	// General purpose... could be {"batteryLevel": "67.0"}, {"x":"34", "y":"67", "z":"26"}...
	public m_objInAppLocation:	iXRLocationData = new iXRLocationData();
	// ---
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
	public m_szPrompt:			string = "";									// String type value.
	public m_dictPastMessages:	PythonDictStrings = new PythonDictStrings();	// The history of chat (if needed).
	public m_szLLMProvider:		string = "";									// (Optional) a string type value that can be used to choose a specific pre-defined chatbot.
	// ---
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
	public static m_dictAssessmentStartTimes:	Dictionary<string, DateTime> = new Dictionary<string, DateTime>;
	public static m_dictObjectiveStartTimes:	Dictionary<string, DateTime> = new Dictionary<string, DateTime>;
	public static m_dictInteractionStartTimes:	Dictionary<string, DateTime> = new Dictionary<string, DateTime>;
	public static m_dictLevelStartTimes:		Dictionary<string, DateTime> = new Dictionary<string, DateTime>;
	// ---
	m_szName:			string = "";
	m_dictMeta:			PythonDictStrings = new PythonDictStrings();
	m_szEnvironment:	string = "";
	// ---
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
export class iXRXXXContainer<T extends iXRBase, T_CONTAINS, bTWantTimestamp extends boolean> extends iXRBase
{
	// public m_tIXRXXX:		T_CONTAINS = new T_CONTAINS();	// This is here to catch the data when Python is representing it as an object rather than array.
	public m_tIXRXXX:		T_CONTAINS = {} as T_CONTAINS;	// This is here to catch the data when Python is representing it as an object rather than array.
	public m_dspIXRXXXs:	DbSet<T> = new DbSet<T>(T);		// The main data.
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
	constructor(public bWantTimestamp: bTWantTimestamp = false as bTWantTimestamp)
	{
		super();
	}
	public ShouldDump(szFieldName: string, eJsonFieldType: JsonFieldType, eDumpCategory: DumpCategory) : boolean // virtual
	{
		const bWantTimestamp:	bTWantTimestamp;

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
		{m_tIXRXXX: new FieldProperties("data")}));
	// ---
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
	public m_cdictData:	PythonDictStrings = new PythonDictStrings();
	// ---
	Construct0(dictData: PythonDictStrings) : iXRStorageData
	{
		this.m_cdictData = dictData;
		// ---
		return this;
	}
	Construct1(szdictData: string) : iXRStorageData
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
	FinalizeParse() : void // virtual
	{
		if (this.m_dspIXRXXXs.empty())
		{
			this.m_dspIXRXXXs.push(this.m_tIXRXXX);
		}
	}
};

/// <summary>
/// Mainly state, but more general than that... whatever user wants but principally state info.
/// </summary>
export class iXRStorage extends iXRBase
{
	m_szKeepPolicy:	string = "";			// "keepLatest" or "appendHistory"
	m_szName:		string = "";
	m_dsData:		DbSet<StorageContainer> = new DbSet<StorageContainer>(StorageContainer);	// Accommodates backend wanting this nested... on this end, always exactly one item in it.
	m_szOrigin:		string = "";			// Optional, but if not blank, must be "system" or "user"
	m_bSessionData:	boolean = false;
	m_lszTags:		StringList = new StringList();
	// ---	
	constructor()
	{
		super();
		this.m_szKeepPolicy = "appendHistory";
	}
	Construct0(bKeepLatest: boolean, szName: string, dictData: PythonDictStrings, szOrigin: string, bSessionData: boolean) : iXRStorage
	{
		this.m_szKeepPolicy = (bKeepLatest) ? "keepLatest" : "appendHistory";
		this.m_szName = szName;
		this.m_szOrigin = szOrigin;
		this.m_bSessionData = bSessionData;
		this.m_dsData.clear();
		this.m_dsData.push().m_dspIXRXXXs.push(dictData);
		// ---
		return this;
	}
	Construct1(bKeepLatest: boolean, szName: string, szdictData: string, szOrigin: string, bSessionData: string) : iXRStorage
	{
		this.m_szKeepPolicy = (bKeepLatest) ? "keepLatest" : "appendHistory";
		this.m_szName = szName;
		this.m_szOrigin = szOrigin;
		this.m_bSessionData = bSessionData;
		this.m_dsData.clear();
		this.m_dsData.push().m_dspIXRXXXs.push(szdictData);
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
	const DEFAULTNAME:	string = "state";
	// ---
	// Default name 'state'
	public GetEntry0(): iXRStorage|null
	{
		return this.GetEntry1(DEFAULTNAME);
	}
	public GetEntry1(szName: string): iXRStorage|null
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
		if (eRet == iXRResult.eOk)
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
	public RemoveMultipleEntries(dbContext: iXRDbContext, bSessionOnly: boolean): iXRResult
	{
		var	eRet:				iXRResult;
		var	szResponse:			string = "";
		var	bChangedSomething:	boolean = false;

		// Delete from backend.
		eRet = iXRLibClient.DeleteMultipleIXRStorageEntries(bSessionOnly, szResponse);
		// ---
		if (eRet == iXRResult.eOk)
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
	m_szErrorString:	string = "";
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
	m_dsIXRApplications:	DbSet<iXRApplication> = new DbSet<iXRApplication>(iXRApplication);
	m_dsIXRLogs:			DbSet<iXRLog> = new DbSet<iXRLog>(iXRLog);
	m_dsIXRTelemetry:		DbSet<iXRTelemetry> = new DbSet<iXRTelemetry>(iXRTelemetry);
	m_dsIXREvents:			DbSet<iXREvent> = new DbSet<iXREvent>(iXREvent);		// Table name IXREvents.
	m_dsIXRStorage:			DbSet<iXRStorage> = new DbSet<iXRStorage>(iXRStorage);	// State info, etc.
	m_szDbPath:				string = "";
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
	// 	if (m_dsIXRStorage.Count() == 0)
	// 	{
	// 		return ExecuteSqlSelect(m_db, "iXRStorage", "SELECT %s FROM %s", {}, m_dsIXRStorage);
	// 	}
		return DatabaseResult.eOk;
	}
	// Default name 'state'
	public StorageGetEntry0(): PythonDictStrings
	{
		var pixrs:	iXRStorage;

		this.LoadStorageEntriesIfNecessary();
		pixrs = this.m_dsIXRStorage.GetEntry0();
		// ---
		return (pixrs != null && pixrs != undefined && !pixrs.m_dsData.empty() && !pixrs.m_dsData[0].m_dspIXRXXXs.empty()) ? pixrs.m_dsData[0].m_dspIXRXXXs[0].m_cdictData : null;
	}
	public StorageGetEntry1(szName: string): PythonDictStrings
	{
		var	pixrs: iXRStorage;

		this.LoadStorageEntriesIfNecessary();
		pixrs = this.m_dsIXRStorage.GetEntry1(szName);
		// ---
		return (pixrs != null && pixrs != undefined && !pixrs.m_dsData.empty() && !pixrs.m_dsData[0].m_dspIXRXXXs.empty()) ? pixrs.m_dsData[0].m_dspIXRXXXs[0].m_cdictData : null;
	}
	// Default name 'state'
	public StorageGetEntryAsString0(): string
	{
		var	szRet:	string = "";
		var	pixrs:	iXRStorage;

		this.LoadStorageEntriesIfNecessary();
		pixrs = this.m_dsIXRStorage.GetEntry();
		if (pixrs != null && pixrs != undefined && !pixrs.m_dsData.empty() && !pixrs.m_dsData[0].m_dspIXRXXXs.empty())
		{
			szRet = pixrs.m_dsData[0].m_dspIXRXXXs[0].m_cdictData.ToString();
		}
		// ---
		return szRet;
	}
	public StorageGetEntryAsString1(szName: string): string
	{
		var	szRet:	string = "";
		var	pixrs:	iXRStorage;

		this.LoadStorageEntriesIfNecessary();
		pixrs = this.m_dsIXRStorage.GetEntry1(szName);
		if (pixrs != null && pixrs != undefined && !pixrs.m_dsData.empty() && !pixrs.m_dsData[0].m_dspIXRXXXs.empty())
		{
			szRet = pixrs.m_dsData[0].m_dspIXRXXXs[0].m_cdictData.ToString();
		}
		// ---
		return szRet;
	}
	// Default name 'state'
	public StorageSetEntry0(szData: string, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): iXRResult
	{
		this.LoadStorageEntriesIfNecessary();
		// ---
		return this.m_dsIXRStorage.SetEntry(szData, bKeepLatest, szOrigin, bSessionData);
	}
	public StorageSetEntry1(szName: string, szData: string, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): iXRResult
	{
		this.LoadStorageEntriesIfNecessary();
		// ---
		return this.m_dsIXRStorage.SetEntry(szName, szData, bKeepLatest, szOrigin, bSessionData);
	}
	// Default name 'state'
	public StorageSetEntry2(dictData: PythonDictStrings, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): iXRResult
	{
		this.LoadStorageEntriesIfNecessary();
		// ---
		return this.m_dsIXRStorage.SetEntry(dictData, bKeepLatest, szOrigin, bSessionData);
	}
	public StorageSetEntry3(szName: string, dictData: PythonDictStrings, bKeepLatest: boolean, szOrigin: string, bSessionData: boolean): iXRResult
	{
		this.LoadStorageEntriesIfNecessary();
		// ---
		return this.m_dsIXRStorage.SetEntry(szName, dictData, bKeepLatest, szOrigin, bSessionData);
	}
	// Default name 'state'
	public StorageRemoveEntry0(): iXRResult
	{
		this.LoadStorageEntriesIfNecessary();
		// ---
		return this.m_dsIXRStorage.RemoveEntry(this);
	}
	public StorageRemoveEntry1(szName: string): iXRResult
	{
		this.LoadStorageEntriesIfNecessary();
		// ---
		return this.m_dsIXRStorage.RemoveEntry(this, szName);
	}
	public StorageRemoveMultipleEntries(bSessionOnly: boolean): iXRResult
	{
		this.LoadStorageEntriesIfNecessary();
		// ---
		return this.m_dsIXRStorage.RemoveMultipleEntries(this, bSessionOnly);
	}
	// --- END Functions supporting adding/changing/deleting iXRStorage objects.
	private ConstructGuts(): void
	{
		// if (m_db.ConnectSQLite(m_szDbPath) == DatabaseResult.eOk)
		// {
		// 	if (!m_db.HasSchema())
		// 	{
		// 		CreateSchema(m_db);
		// 	}
		// }
	}
	public SaveChanges(): DatabaseResult // virtual
	{
		return iXRLib.SaveChanges(m_db, null, *this);
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
function RESTEndpointFromType<T>() : string
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

/// <summary>
/// Everything (or nearly) that is in db and will POST/PUT/ETC to remote has a Guid and a timestamp.

import { PythonDictStrings } from "./network/utils/DotNetishTypes";

/// </summary>
export class iXRBase extends DataObjectBase
{
protected:
	static bool		m_bUseCapturedTimeStamp;
	static int64_t	m_nCapturedTimeStamp;
public:
	// ---
	SUID			m_guidId,
					m_guidParentId;
	// "Standard" timestamp... gets transmitted as text, subject to vagaries, should not be used for grouping objects that depend on precise comparison.
	DateTime		m_dtTimeStamp;
	// A precise version of the timestamp that is declared as integer so it will only be subject to precise integer operations rather than time calculations which can introduce imprecisions.
	// Note how this is not strictly Unix time... Unix time is seconds.  In order for this to guarantee the precision we want, it needs to be same resolution as the clock from which it is converted.
	// This field is motivated by the backend grouping objects by timestamp, which is reckless when using the m_dtTimeStamp due to the adulterations to which it can be subject when converted back
	// and forth from string etc.  The fact that it is not a standards-compliant timestamp is irrelevant as this field is really more of a poor-man's-guid for grouping objects that is based on timestamp.
	int64_t			m_nTimeStamp;
	bool			m_bSyncedWithCloud = false;	// On the cloud db, this is always true.  On the device, false indicates exists only in device-local SQLite db... needs update or create in cloud db to sync.
	// ---
	constexpr static auto properties = std.tuple_cat(std.make_tuple(
		property(&iXRBase.m_guidId, "Id", ColumnAttributeBF(ColumnAttribute.bfPrimaryKey)),
		property(&iXRBase.m_guidParentId, "parentId", ColumnAttributeBF(ColumnAttribute.bfParentKey)),
		property(&iXRBase.m_dtTimeStamp, "timestamp"),
		property(&iXRBase.m_nTimeStamp, "preciseTimestamp"),
		property(&iXRBase.m_bSyncedWithCloud, "syncedWithCloud")
	));
	// ---
	iXRBase()
	{
		if (m_bUseCapturedTimeStamp)
		{
			m_dtTimeStamp.FromInt64(m_nCapturedTimeStamp);
			m_nTimeStamp = m_nCapturedTimeStamp;
		}
		else
		{
			m_dtTimeStamp = DateTime.Now();
			m_nTimeStamp = m_dtTimeStamp.ToInt64();
		}
	}
	virtual ~iXRBase() = default;
	// ---
	static void CaptureTimeStamp()
	{
		m_bUseCapturedTimeStamp = true;
		m_nCapturedTimeStamp = DateTime.Now().ToInt64();
	}
	static void UnCaptureTimeStamp()
	{
		m_bUseCapturedTimeStamp = false;
	}
	// ---
	virtual bool ShouldDump(const char* szFieldName, const JsonFieldType eJsonFieldType, const DumpCategory eDumpCategory) const
	{
		switch (eDumpCategory)
		{
		case DumpCategory.eDumpingJsonForBackend:
			return (strcmp(szFieldName, "Id") != 0 &&
				strcmp(szFieldName, "parentId") != 0 &&
				strcmp(szFieldName, "syncedWithCloud") != 0);
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
	CaptureTimeStampLifetime()
	{
		iXRBase.CaptureTimeStamp();
	}
	~CaptureTimeStampLifetime()
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
	using super = DataObjectBase;
	// ---
protected:
	mstringb			m_szRestUrl;	// |_Would be cool to use __declspec(property) but that does not port to Linux.
	URLParser.HTTP_URL	m_urlRestUrl;	// | Using accessor instead.
public:
	size_t				m_nSendRetriesOnFailure = 3;
	TimeSpan			m_tsSendRetryInterval = { 0, 0, 3 };
	TimeSpan			m_tsSendNextBatchWait = { 0, 0, 30 };
	TimeSpan			m_tsStragglerTimeout = { 0, 0, 15 };
	size_t				m_nEventsPerSendAttempt = 16;
	size_t				m_nLogsPerSendAttempt = 16;
	size_t				m_nTelemetryEntriesPerSendAttempt = 16;
	size_t				m_nStorageEntriesPerSendAttempt = 16;
	TimeSpan			m_tsPruneSentItemsOlderThan = { 1, 0, 0, 0 };
	size_t				m_nMaximumCachedItems = 1024;
	bool				m_bRetainLocalAfterSent = false;
	// Thread will wake up periodically and if this is configured and the token expiration is looming, it will
	// preemptively reauthenticate rather than waiting for auth error to prompt relogin.
	bool				m_bReAuthenticateBeforeTokenExpires = true;
	// Slimey hack to get us past first release.  Hopefully I'll take it out completely after we solve (hopefully) the
	// file issues (App.config, SQLite) on Android.  When false, this is a "limp along" mode that sends everything
	// immediately without cacheing to db.  Upon further contemplation, it is actually a good feature, but still,
	// hopefully default true will be an option someday; now I am saying default false is the slimey hack.
	bool				m_bUseDatabase = false;
	// Extra data that (if not empty from backend after first auth) has to be requested from the user to be submitted
	// in a followup call to auth by being copied into the auth environment/session property of the same name after
	// being filled in.  Scorm interactionid is the initial motivation.
	PythonDictStrings	m_dictAuthMechanism;
	// ---
	iXRLibConfiguration()
	{
		// Default URL... can be overriden by App.config or accessors in C# and C++.
		SetRestUrl("https://libapi.informxr.io/");
	}
	void SetRestUrl(const mstringb& szRestUrl)
	{
		m_szRestUrl = szRestUrl;
		m_urlRestUrl = URLParser.Parse(m_szRestUrl);
	}
	const mstringb& GetRestUrl() const
	{
		return m_szRestUrl;
	}
	const URLParser.HTTP_URL& GetRestUrlObject() const
	{
		return m_urlRestUrl;
	}
	// ---
	constexpr static auto properties = std.tuple_cat(super.properties, std.make_tuple(
		property(&iXRLibConfiguration.m_szRestUrl, "rest_url"),
		property(&iXRLibConfiguration.m_szRestUrl, "restUrl", ColumnAttributeBF(ColumnAttribute.bfBackendAccommodation)),
		// ---
		property(&iXRLibConfiguration.m_nSendRetriesOnFailure, "send_retries_on_failure"),
		property(&iXRLibConfiguration.m_nSendRetriesOnFailure, "sendRetriesOnFailure", ColumnAttributeBF(ColumnAttribute.bfBackendAccommodation)),
		// ---
		property(&iXRLibConfiguration.m_tsSendRetryInterval, "send_retry_interval"),
		property(&iXRLibConfiguration.m_tsSendRetryInterval, "sendRetryInterval", ColumnAttributeBF(ColumnAttribute.bfBackendAccommodation)),
		// ---
		property(&iXRLibConfiguration.m_tsSendNextBatchWait, "send_next_batch_wait"),
		property(&iXRLibConfiguration.m_tsSendNextBatchWait, "sendNextBatchWait", ColumnAttributeBF(ColumnAttribute.bfBackendAccommodation)),
		// ---
		property(&iXRLibConfiguration.m_tsStragglerTimeout, "straggler_timeout"),
		property(&iXRLibConfiguration.m_tsStragglerTimeout, "stragglerTimeout", ColumnAttributeBF(ColumnAttribute.bfBackendAccommodation)),
		// ---
		property(&iXRLibConfiguration.m_nEventsPerSendAttempt, "events_per_send_attempt"),
		property(&iXRLibConfiguration.m_nEventsPerSendAttempt, "eventsPerSendAttempt", ColumnAttributeBF(ColumnAttribute.bfBackendAccommodation)),
		// ---
		property(&iXRLibConfiguration.m_nLogsPerSendAttempt, "logs_per_send_attempt"),
		property(&iXRLibConfiguration.m_nLogsPerSendAttempt, "logsPerSendAttempt", ColumnAttributeBF(ColumnAttribute.bfBackendAccommodation)),
		// ---
		property(&iXRLibConfiguration.m_nTelemetryEntriesPerSendAttempt, "telemetry_entries_per_send_attempt"),
		property(&iXRLibConfiguration.m_nTelemetryEntriesPerSendAttempt, "telemetryEntriesPerSendAttempt", ColumnAttributeBF(ColumnAttribute.bfBackendAccommodation)),
		// ---
		property(&iXRLibConfiguration.m_nStorageEntriesPerSendAttempt, "storage_entries_per_send_attempt"),
		property(&iXRLibConfiguration.m_nStorageEntriesPerSendAttempt, "storageEntriesPerSendAttempt", ColumnAttributeBF(ColumnAttribute.bfBackendAccommodation)),
		// ---
		property(&iXRLibConfiguration.m_tsPruneSentItemsOlderThan, "prune_sent_items_older_than"),
		property(&iXRLibConfiguration.m_tsPruneSentItemsOlderThan, "pruneSentItemsOlderThan", ColumnAttributeBF(ColumnAttribute.bfBackendAccommodation)),
		// ---
		property(&iXRLibConfiguration.m_nMaximumCachedItems, "maximum_cached_items"),
		property(&iXRLibConfiguration.m_nMaximumCachedItems, "maximumCachedItems", ColumnAttributeBF(ColumnAttribute.bfBackendAccommodation)),
		// ---
		property(&iXRLibConfiguration.m_bRetainLocalAfterSent, "retain_local_after_sent"),
		property(&iXRLibConfiguration.m_bRetainLocalAfterSent, "retainLocalAfterSent", ColumnAttributeBF(ColumnAttribute.bfBackendAccommodation)),
		// ---
		property(&iXRLibConfiguration.m_bReAuthenticateBeforeTokenExpires, "reauthenticate_before_token_expires"),
		property(&iXRLibConfiguration.m_bReAuthenticateBeforeTokenExpires, "reauthenticateBeforeTokenExpires", ColumnAttributeBF(ColumnAttribute.bfBackendAccommodation)),
		// ---
		property(&iXRLibConfiguration.m_bUseDatabase, "use_database"),
		property(&iXRLibConfiguration.m_bUseDatabase, "useDatabase", ColumnAttributeBF(ColumnAttribute.bfBackendAccommodation)),
		// ---
		property(&iXRLibConfiguration.m_dictAuthMechanism, "auth_mechanism"),
		property(&iXRLibConfiguration.m_dictAuthMechanism, "authMechanism", ColumnAttributeBF(ColumnAttribute.bfBackendAccommodation))
	));
	// ---
	bool ReadConfig();
	bool RESTConfigured()
	{
		return (m_szRestUrl.length() > 0);
	}
};
/// <summary>
/// Application object... from "Database Models" doc... Represents the software application in use.
/// </summary>
export class iXRApplication extends iXRBase
{
	using super = iXRBase;
	// ---
	mstringb	m_szAppId;
	mstringb	m_szDeviceUserId;
	mstringb	m_szDeviceId;
	mstringb	m_szLogLevel;
	mstringb	m_szData;
	// ---
	constexpr static auto properties = std.tuple_cat(super.properties, std.make_tuple(
		property(&iXRApplication.m_szAppId, "appId"),
		property(&iXRApplication.m_szDeviceUserId, "deviceUserId"),
		property(&iXRApplication.m_szDeviceId, "deviceId"),
		property(&iXRApplication.m_szLogLevel, "logLevel"),
		property(&iXRApplication.m_szData, "data")
	));
	// --- TESTS.
#ifdef _DEBUG
	void FakeUpSomeRandomCrap();
#endif // _DEBUG
};
// ---
/// <summary>
/// LocationData contained by Event.
/// </summary>
export class iXRLocationData extends iXRBase
{
	using super = iXRBase;
	// ---
	double	m_dX = 0.0,
			m_dY = 0.0,
			m_dZ = 0.0;
	// ---
	iXRLocationData() = default;
	iXRLocationData(const double dX, const double dY, const double dZ) :
		m_dX(dX),
		m_dY(dY),
		m_dZ(dZ)
	{
	}
	// ---
	constexpr static auto properties = std.tuple_cat(super.properties, std.make_tuple(
		property(&iXRLocationData.m_dX, "x"),
		property(&iXRLocationData.m_dY, "y"),
		property(&iXRLocationData.m_dZ, "z")
	));
	// ---
	virtual bool ShouldDump(const char* szFieldName, const JsonFieldType eJsonFieldType, const DumpCategory eDumpCategory) const
	{
		switch (eDumpCategory)
		{
		case DumpCategory.eDumpingJsonForBackend:
			if (strcmp(szFieldName, "timestamp") == 0)
			{
				return false;
			}
		default:
			break;
		}
		return super.ShouldDump(szFieldName, eJsonFieldType, eDumpCategory);
	}
	// ---
#ifdef _DEBUG
	void FakeUpSomeRandomCrap();
#endif // _DEBUG
};
/// <summary>
/// Suggested log level enum.  Can use this or just pass in a uint and let it mean whatever is desired.
/// </summary>
enum class LogLevel
{
	eDebug,
	eInfo,
	eWarn,
	eError,
	eCritical
};
constexpr const char* LogLevelToString(const LogLevel eLogLevel)
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
inline LogLevel StringToLogLevel(const char* szLogLevel)
{
	static std.map<const char*, LogLevel> msz =
	{
		{"Debug", LogLevel.eDebug},
		{"Info", LogLevel.eInfo},
		{"Warn", LogLevel.eWarn},
		{"Error", LogLevel.eError},
		{"Critical", LogLevel.eCritical},
	};
	std.map<const char*, LogLevel>.const_iterator it = msz.find(szLogLevel);

	if (it != msz.end())
	{
		return it->second;
	}
	return LogLevel.eDebug;
}
/// <summary>
/// General purpose... for developer to log whatever they want to log.
/// </summary>
export class iXRLog extends iXRBase
{
	using super = iXRBase;
	// ---
	mstringb	m_szLogLevel;
	mstringb	m_szText;
	// ---
	constexpr static auto properties = std.tuple_cat(super.properties, std.make_tuple(
		property(&iXRLog.m_szLogLevel, "logLevel"),
		property(&iXRLog.m_szText, "text")
	));
	// ---
	iXRLog()
	{
	}
	iXRLog(LogLevel eLogLevel, const mstringb& szText) :
		m_szLogLevel(LogLevelToString(eLogLevel)),
		m_szText(szText)
	{
	}
	iXRLog(uint32_t nLogLevel, const mstringb& szText) :
		m_szLogLevel(LogLevelToString((LogLevel)nLogLevel)),
		m_szText(szText)
	{
	}
	// --- TESTS.
#ifdef _DEBUG
	void FakeUpSomeRandomCrap();
	void FakeUpSomeRandomCrap(bool bDontWorryAboutThisEventHasThisJustNeedItHereSoTheTemplateInstantiates)
	{
		FakeUpSomeRandomCrap();
	}
#endif // _DEBUG
};
/// <summary>
/// Metrics and position tracking.
/// </summary>
export class iXRTelemetry extends iXRBase
{
	using super = iXRBase;
	// ---
	mstringb			m_szName;			// Consider the x, y, z case vvv ... (x, y, z) of what?  This is the "what"... can be empty when self-evident like battery level.
	PythonDictStrings	m_dictData;			// General purpose... could be {"batteryLevel": "67.0"}, {"x":"34", "y":"67", "z":"26"}...
	iXRLocationData		m_objInAppLocation;
	// ---
	iXRTelemetry() = default;
	iXRTelemetry(const mstringb& szName, const PythonDictStrings& dictData) :
		m_szName(szName),
		m_dictData(dictData)
	{
	}
	constexpr static auto properties = std.tuple_cat(super.properties, std.make_tuple(
		property(&iXRTelemetry.m_szName, "name"),
		property(&iXRTelemetry.m_dictData, "data")
	));
	constexpr static auto childobjectproperties = std.tuple_cat(super.childobjectproperties, std.make_tuple(
		childobjectproperty(&iXRTelemetry.m_objInAppLocation, "inAppLocation")
	));
	// --- TESTS.
#ifdef _DEBUG
	void FakeUpSomeRandomCrap();
	void FakeUpSomeRandomCrap(bool bDontWorryAboutThisEventHasThisJustNeedItHereSoTheTemplateInstantiates)
	{
		FakeUpSomeRandomCrap();
	}
#endif // _DEBUG
};
/// <summary>
/// Message to/from the user of the headset.
///		Sent immediately, no local cacheing to db.  But the send still uses SendRetriesOnFailure/SendRetryInterval.
///		Does NOT exist in database schema (iXRDbContext below).
/// </summary>
export class iXRAIProxy extends iXRBase
{
	using super = iXRBase;
	// ---
	mstringb			m_szPrompt;			// String type value.
	PythonDictStrings	m_dictPastMessages;	// The history of chat (if needed).
	mstringb			m_szLLMProvider;	// (Optional) a string type value that can be used to choose a specific pre-defined chatbot.
	// ---
	iXRAIProxy() = default;
	/// <summary>
	/// For passing past messages in as comma-separated list.
	/// </summary>
	/// <param name="szPrompt">Prompt.</param>
	/// <param name="szPastMessages">Past messages as comma-separated list.</param>
	/// <param name="szLMMProvider">LMM Provider.</param>
	iXRAIProxy(const mstringb& szPrompt, const mstringb& szPastMessages, const mstringb& szLMMProvider) :
		m_szPrompt(szPrompt),
		m_dictPastMessages(szPastMessages),
		m_szLLMProvider(szLMMProvider)
	{
	}
	/// <summary>
	/// For passing past messages in as what it is... PythonDictStrings.
	/// </summary>
	/// <param name="szPrompt">Prompt.</param>
	/// <param name="szPastMessages">Past messages.</param>
	/// <param name="szLMMProvider">LMM Provider.</param>
	iXRAIProxy(const mstringb& szPrompt, const PythonDictStrings& dictPastMessages, const mstringb& szLMMProvider) :
		m_szPrompt(szPrompt),
		m_dictPastMessages(dictPastMessages),
		m_szLLMProvider(szLMMProvider)
	{
	}
	// ---
	constexpr static auto properties = std.tuple_cat(super.properties, std.make_tuple(
		property(&iXRAIProxy.m_szPrompt, "prompt"),
		property(&iXRAIProxy.m_dictPastMessages, "pastMessages"),
		property(&iXRAIProxy.m_szLLMProvider, "llmProvider")
	));
	// --- TESTS.
#ifdef _DEBUG
	void FakeUpSomeRandomCrap();
	void FakeUpSomeRandomCrap(bool bDontWorryAboutThisEventHasThisJustNeedItHereSoTheTemplateInstantiates)
	{
		FakeUpSomeRandomCrap();
	}
#endif // _DEBUG
};

/// <summary>
/// Event object... from "ixrlib Spec 2023" doc... the main event object that will be profligately POST/PUT/ETCed to the backend for data analytics.
///		These are proactively added by the content creator, i.e. NOT automatically obtained by us from the platform, headset-OS, other API, etc.
/// </summary>
export class iXREvent extends iXRBase
{
	static std.recursive_mutex				m_csDictProtect;
	static Dictionary<mstringb, DateTime>	m_dictAssessmentStartTimes;
	static Dictionary<mstringb, DateTime>	m_dictObjectiveStartTimes;
	static Dictionary<mstringb, DateTime>	m_dictInteractionStartTimes;
	static Dictionary<mstringb, DateTime>	m_dictLevelStartTimes;
	// ---
	m_szName:			string = "";
	m_dictMeta:			PythonDictStrings = new PythonDictStrings();
	m_szEnvironment:	string = "";
	// ---
	// constexpr static auto properties = std.tuple_cat(super.properties, std.make_tuple(
	// 	property(&iXREvent.m_szName, "name"),
	// 	property(&iXREvent.m_dictMeta, "meta")
	// ));
	// ---
	public Construct(szName: string, dictMeta: PythonDictStrings) : void
	{
		m_szName = szName;
		m_dictMeta = dictMeta;
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
export class iXRXXXContainer<T, T_CONTAINS, bWantTimestamp = false> extends iXRBase
{
	m_tIXRXXX:		T_CONTAINS = new T_CONTAINS();	// This is here to catch the data when Python is representing it as an object rather than array.
	m_dspIXRXXXs:	DbSet<T> = new DbSet<T>();		// The main data.
	// ---
	// constexpr static auto properties = std.tuple_cat(super.properties, std.make_tuple(
	// 	property(&iXRXXXContainer<T, T_CONTAINS, bWantTimestamp>.m_tIXRXXX, "data")
	// ));
	// constexpr static auto childobjectlistproperties = std.tuple_cat(super.childobjectlistproperties, std.make_tuple(
	// 	childobjectlistproperty(&iXRXXXContainer<T, T_CONTAINS, bWantTimestamp>.m_dspIXRXXXs, "data")
	// ));
	// ---
	public ShouldDump(szFieldName: string, eJsonFieldType: JsonFieldType, eDumpCategory: DumpCategory) : boolean // virtual
	{
		if (eJsonFieldType === JsonFieldType.eField && szFieldName === "data")
		{
			return false;
		}
		switch (eDumpCategory)
		{
		case DumpCategory.eDumpingJsonForBackend:
			if (strcmp(szFieldName, "timestamp") == 0)
			{
				return bWantTimestamp;
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
//template <typename T> export class iXRXXXScalarContainer extends iXRBase
//{
//	using super = iXRBase;
//	// ---
//	T	m_tIXRXXX;
//	// ---
//	iXRXXXScalarContainer<T>() = default;
//	iXRXXXScalarContainer<T>(const T& t) :
//		m_tIXRXXX(t)
//	{
//	}
//	iXRXXXScalarContainer<T>(T&& t) :
//		m_tIXRXXX(t)
//	{
//	}
//	// ---
//	constexpr static auto properties = std.tuple_cat(super.properties, std.make_tuple(
//		property(&iXRXXXScalarContainer<T>.m_tIXRXXX, "data")
//	));
//	// ---
//	virtual bool ShouldDump(const char* szFieldName, const JsonFieldType eJsonFieldType, const DumpCategory eDumpCategory) const
//	{
//		switch (eDumpCategory)
//		{
//		case DumpCategory.eDumpingJsonForBackend:
//			if (strcmp(szFieldName, "timestamp") == 0)
//			{
//				return false;
//			}
//		default:
//			break;
//		}
//		return super.ShouldDump(szFieldName, eJsonFieldType, eDumpCategory);
//	}
//};

// ---

/// <summary>
/// Backend has this in a double-nested "data" structure.  That is why this is here, this is the inner one.
/// </summary>
export class iXRStorageData extends iXRBase
{
	m_cdictData:	PythonDictStrings = new PythonDictStrings();
	// ---
	Construct(dictData: PythonDictStrings) : void
	{
		m_cdictData = dictData;
	}
	Construct(szdictData: string) : void
		m_cdictData(szdictData)
	{
	}
	// ---
	// constexpr static auto properties = std.tuple_cat(super.properties, std.make_tuple(
	// 	property(&iXRStorageData.m_cdictData, "data")
	// ));
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
		if (m_dspIXRXXXs.empty())
		{
			m_dspIXRXXXs.emplace_front(m_tIXRXXX);
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
	m_dsData:		DbSet<StorageContainer> = new DbSet<StorageContainer>();	// Accommodates backend wanting this nested... on this end, always exactly one item in it.
	m_szOrigin:		string = "";			// Optional, but if not blank, must be "system" or "user"
	m_bSessionData:	boolean = false;
	m_lszTags:		StringList = new StringList();
	// ---	
	constructor()
	{
		m_szKeepPolicy = "appendHistory";
	}
	Construct(bKeepLatest: boolean, szName: string, dictData: PythonDictStrings, szOrigin: string, bSessionData: boolean) : void
	{
		m_szKeepPolicy = (bKeepLatest) ? "keepLatest" : "appendHistory";
		m_szName = szName;
		m_szOrigin = szOrigin;
		m_bSessionData = bSessionData;
		m_dsData.clear();
		m_dsData.push().m_dspIXRXXXs.push(dictData);
	}
	Construct(bKeepLatest: boolean, szName: string, szdictData: string, szOrigin: string, bSessionData: string) : void
	{
		m_szKeepPolicy = (bKeepLatest) ? "keepLatest" : "appendHistory";
		m_szName = szName;
		m_szOrigin = szOrigin;
		m_bSessionData = bSessionData;
		m_dsData.clear();
		m_dsData.push().m_dspIXRXXXs.push(szdictData);
	}
	// ---
	// constexpr static auto properties = std.tuple_cat(super.properties, std.make_tuple(
	// 	property(&iXRStorage.m_szKeepPolicy, "keepPolicy"),
	// 	property(&iXRStorage.m_szName, "name"),
	// 	property(&iXRStorage.m_szOrigin, "origin"),
	// 	property(&iXRStorage.m_bSessionData, "sessionData"),
	// 	property(&iXRStorage.m_lszTags, "tags")
	// ));
	// constexpr static auto childobjectlistproperties = std.tuple_cat(super.childobjectlistproperties, std.make_tuple(
	// 	childobjectlistproperty(&iXRStorage.m_dsData, "data")
	// ));
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
	const mstringb	DEFAULTNAME = "state";
	// ---
	// Default name 'state'
	iXRStorage* GetEntry()
	{
		return GetEntry(DEFAULTNAME);
	}
	iXRStorage* GetEntry(const mstringb& szName);
	// ---
	// Default name 'state'
	iXRResult SetEntry(const PythonDictStrings& dictData, const bool bKeepLatest, const mstringb& szOrigin, const bool bSessionData)
	{
		return SetEntry(DEFAULTNAME, dictData, bKeepLatest, szOrigin, bSessionData);
	}
	iXRResult SetEntry(const mstringb& szName, const PythonDictStrings& dictData, const bool bKeepLatest, const mstringb& szOrigin, const bool bSessionData);
	// Default name 'state'
	iXRResult SetEntry(const mstringb& szdictData, const bool bKeepLatest, const mstringb& szOrigin, const bool bSessionData)
	{
		return SetEntry(DEFAULTNAME, szdictData, bKeepLatest, szOrigin, bSessionData);
	}
	iXRResult SetEntry(const mstringb& szName, const mstringb& szdictData, const bool bKeepLatest, const mstringb& szOrigin, const bool bSessionData);
	// ---
	// Default name 'state'
	iXRResult RemoveEntry(iXRDbContext& dbContext)
	{
		// As name is explicit, "state", passing false in for bSessionOnly (backend considers
		// true to be default but since it is named, want anything with that name gone).
		return RemoveEntry(dbContext, DEFAULTNAME);
	}
	iXRResult RemoveEntry(iXRDbContext& dbContext, const mstringb& szName);
	iXRResult RemoveMultipleEntries(iXRDbContext& dbContext, const bool bSessionOnly);
};

/// <summary>
/// Last (configured) errors as last resort for those who do not want to call
/// synchronous and wait for error or call asynchronous and handle callback.
/// </summary>
export class iXRErrors extends iXRBase
{
	m_szErrorString:	string = "";
	// ---
	// constexpr static auto properties = std.tuple_cat(super.properties, std.make_tuple(
	// 	property(&iXRErrors.m_szErrorString, "errorString")
	// ));
};

/// <summary>
/// The Entity-Framework-ish database object.
/// </summary>
export class iXRDbContext extends DbContext
{
	m_dsIXRApplications:	DbSet<iXRApplication> = new DbSet<iXRApplication>();
	m_dsIXRLogs:			DbSet<iXRLog> = new DbSet<iXRLog>();
	m_dsIXRTelemetry:		DbSet<iXRTelemetry> = new DbSet<iXRTelemetry>();
	m_dsIXREvents:			DbSet<iXREvent> = new DbSet<iXREvent>();		// Table name IXREvents.
	m_dsIXRStorage:			DbSet<iXRStorage> = new DbSet<iXRStorage>();		// State info, etc.
	m_szDbPath:				string = "";
	// ---
	// constexpr static auto childobjectlistproperties = std.tuple_cat(super.childobjectlistproperties, std.make_tuple(
	// 	childobjectlistproperty(&iXRDbContext.m_dsIXRApplications, "IXRApplications"),
	// 	childobjectlistproperty(&iXRDbContext.m_dsIXRLogs, "IXRLogs"),
	// 	childobjectlistproperty(&iXRDbContext.m_dsIXRTelemetry, "IXRTelemetry"),
	// 	childobjectlistproperty(&iXRDbContext.m_dsIXREvents, "IXREvents"),
	// 	childobjectlistproperty(&iXRDbContext.m_dsIXRStorage, "IXRStorage")
	// ));
	// ---
	// iXRDbContext() :
	// 	iXRDbContext(false)
	// {
	// }
	// iXRDbContext(bool bDeleteIfExists)
	// {
	// 	m_szDbPath = NormalizePath("InformXR.db").c_str();
	// 	if (bDeleteIfExists)
	// 	{
	// 		std.filesystem.path	fpDbPath(m_szDbPath.c_str());

	// 		if (std.filesystem.exists(fpDbPath))
	// 		{
	// 			std.filesystem.remove(fpDbPath);
	// 		}
	// 	}
	// 	Construct();
	// }
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
	DatabaseResult LoadStorageEntriesIfNecessary()
	{
	// 	if (m_dsIXRStorage.Count() == 0)
	// 	{
	// 		return ExecuteSqlSelect(m_db, "iXRStorage", "SELECT %s FROM %s", {}, m_dsIXRStorage);
	// 	}
		return DatabaseResult.eOk;
	}
	// Default name 'state'
	PythonDictStrings* StorageGetEntry()
	{
		iXRStorage	*pixrs;

		LoadStorageEntriesIfNecessary();
		pixrs = reinterpret_cast<DbSetStorage*>(&m_dsIXRStorage)->GetEntry();
		// ---
		return (pixrs != nullptr && !pixrs->m_dsData.empty() && !pixrs->m_dsData.begin()->m_dspIXRXXXs.empty()) ? &pixrs->m_dsData.begin()->m_dspIXRXXXs.begin()->m_cdictData : nullptr;
	}
	PythonDictStrings* StorageGetEntry(const mstringb& szName)
	{
		iXRStorage	*pixrs;

		LoadStorageEntriesIfNecessary();
		pixrs = reinterpret_cast<DbSetStorage*>(&m_dsIXRStorage)->GetEntry(szName);
		// ---
		return (pixrs != nullptr && !pixrs->m_dsData.empty() && !pixrs->m_dsData.begin()->m_dspIXRXXXs.empty()) ? &pixrs->m_dsData.begin()->m_dspIXRXXXs.begin()->m_cdictData : nullptr;
	}
	// Default name 'state'
	mstringb StorageGetEntryAsString()
	{
		mstringb	szRet;
		iXRStorage	*pixrs;

		LoadStorageEntriesIfNecessary();
		pixrs = reinterpret_cast<DbSetStorage*>(&m_dsIXRStorage)->GetEntry();
		if (pixrs != nullptr && !pixrs->m_dsData.empty() && !pixrs->m_dsData.begin()->m_dspIXRXXXs.empty())
		{
			szRet = pixrs->m_dsData.begin()->m_dspIXRXXXs.begin()->m_cdictData.ToString();
		}
		// ---
		return szRet;
	}
	mstringb StorageGetEntryAsString(const mstringb& szName)
	{
		mstringb	szRet;
		iXRStorage	*pixrs;

		LoadStorageEntriesIfNecessary();
		pixrs = reinterpret_cast<DbSetStorage*>(&m_dsIXRStorage)->GetEntry(szName);
		if (pixrs != nullptr && !pixrs->m_dsData.empty() && !pixrs->m_dsData.begin()->m_dspIXRXXXs.empty())
		{
			szRet = pixrs->m_dsData.begin()->m_dspIXRXXXs.begin()->m_cdictData.ToString();
		}
		// ---
		return szRet;
	}
	// Default name 'state'
	iXRResult StorageSetEntry(const mstringb& szData, const bool bKeepLatest, const mstringb& szOrigin, const bool bSessionData)
	{
		LoadStorageEntriesIfNecessary();
		// ---
		return reinterpret_cast<DbSetStorage*>(&m_dsIXRStorage)->SetEntry(szData, bKeepLatest, szOrigin, bSessionData);
	}
	iXRResult StorageSetEntry(const mstringb& szName, const mstringb& szData, const bool bKeepLatest, const mstringb& szOrigin, const bool bSessionData)
	{
		LoadStorageEntriesIfNecessary();
		// ---
		return reinterpret_cast<DbSetStorage*>(&m_dsIXRStorage)->SetEntry(szName, szData, bKeepLatest, szOrigin, bSessionData);
	}
	// Default name 'state'
	iXRResult StorageSetEntry(const PythonDictStrings& dictData, const bool bKeepLatest, const mstringb& szOrigin, const bool bSessionData)
	{
		LoadStorageEntriesIfNecessary();
		// ---
		return reinterpret_cast<DbSetStorage*>(&m_dsIXRStorage)->SetEntry(dictData, bKeepLatest, szOrigin, bSessionData);
	}
	iXRResult StorageSetEntry(const mstringb& szName, const PythonDictStrings& dictData, const bool bKeepLatest, const mstringb& szOrigin, const bool bSessionData)
	{
		LoadStorageEntriesIfNecessary();
		// ---
		return reinterpret_cast<DbSetStorage*>(&m_dsIXRStorage)->SetEntry(szName, dictData, bKeepLatest, szOrigin, bSessionData);
	}
	// Default name 'state'
	iXRResult StorageRemoveEntry()
	{
		LoadStorageEntriesIfNecessary();
		// ---
		return reinterpret_cast<DbSetStorage*>(&m_dsIXRStorage)->RemoveEntry(*this);
	}
	iXRResult StorageRemoveEntry(const mstringb& szName)
	{
		LoadStorageEntriesIfNecessary();
		// ---
		return reinterpret_cast<DbSetStorage*>(&m_dsIXRStorage)->RemoveEntry(*this, szName);
	}
	iXRResult StorageRemoveMultipleEntries(const bool bSessionOnly)
	{
		LoadStorageEntriesIfNecessary();
		// ---
		return reinterpret_cast<DbSetStorage*>(&m_dsIXRStorage)->RemoveMultipleEntries(*this, bSessionOnly);
	}
	// --- END Functions supporting adding/changing/deleting iXRStorage objects.
private:
	void Construct()
	{

		if (m_db.ConnectSQLite(m_szDbPath) == DatabaseResult.eOk)
		{
			if (!m_db.HasSchema())
			{
				CreateSchema(m_db);
			}
		}
	}
public:
	virtual DatabaseResult SaveChanges()
	{
		return iXRLib.SaveChanges(m_db, nullptr, *this);
	}
	// Return dictionary
	PythonDictStrings getAllData()
	{
		return PythonDictStrings();
	}
	// --- TESTS.
#ifdef _DEBUG
	void FakeUpSomeRandomCrap();
#endif // _DEBUG
};

/// <summary>
/// Get all the REST endpoints in one place mapped to type being POSTed.
/// </summary>
/// <typeparam name="T">Type being POSTed.</typeparam>
/// <typeparam name="iXRLibConfiguration">Pass in iXRLibConfiguration where this is instantiated... resolves forward-referencing catch-22.</typeparam>
/// <returns>REST endpoint string const.</returns>
RESTEndpointFromType<typename T, typename iXRLibConfiguration>() : string
{
	if (T instanceof iXREvent)
	{
		return "collect/event";
	}
	else if (T instanceof iXRLog>)
	{
		return "collect/log";
	}
	else if (T instanceof iXRTelemetry>)
	{
		return "collect/telemetry";
	}
	else if (T instanceof iXRAIProxy>)
	{
		return "services/llm";
	}
	else if (T instanceof iXRLibConfiguration>)
	{
		return "storage/config";
	}
	else if (T instanceof iXRStorage>)
	{
		return "storage";
	}
	return "dev/null";
}

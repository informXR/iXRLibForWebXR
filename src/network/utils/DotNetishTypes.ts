/// <summary>
/// Main return code for library operations.
///		In here as it is needed by Task.
///		Co-maintained with the one in iXRInterop.cs.

import { DATEMAXVALUE, DATEMINVALUE } from "../types";

/// <summary>
/// Main return code for library operations.
///		In here as it is needed by Task.
///		Co-maintained with the one in iXRInterop.cs.
/// </summary>
export enum iXRResult
{
    // --- Unity compatible.
    eOk,						// Analytics API result: Success.
    eNotInitialized,			// Analytics API result: Analytics not initialized.
    eAnalyticsDisabled,			// Analytics API result: Analytics is disabled.
    eTooManyItems,				// Analytics API result: Too many parameters.
    eSizeLimitReached,			// Analytics API result: Argument size limit.
    eTooManyRequests,			// Analytics API result: Too many requests.
    eInvalidData,				// Analytics API result: Invalid argument value.
    eUnsupportedPlatform,		// Analytics API result: This platform doesn't support Analytics.
    // --- end Unity compatible.
    eEnableEventFailed,			// Really bad... the dictionary insert failed, system out of memory.
    eEventNotEnabled,			// User attempting to fire an event that has not been registered/enabled.
    eEventCached,				// Attempt to fire event could not reach cloud, so it got stored into local db.
    eSendEventFailed,			// General failure of iXRLibSend.Event().
    ePostObjectsFailed,			// General failure of iXRLibAnalytics.PostIXREvents().
    ePostObjectsFailedNetworkError,
    ePostObjectsBadJsonResponse,
    eDeleteObjectsFailed,		// General failure of iXRLibAnalytics.DeleteIXREvents().
    eDeleteObjectsFailedNetworkError,
    eDeleteObjectsFailedDatabase,
    eDeleteObjectsBadJsonResponse,
    eAuthenticateFailed,
    eAuthenticateFailedNetworkError,
    eCouldNotObtainAuthSecret,	// ReAuthenticate().
    eCorruptJson,
    eSetEnvironmentDataFailed,
    eObjectNotFound
};

export function iXRResultToString(eRet: iXRResult): string
{
    switch (eRet)
    {
    case iXRResult.eNotInitialized:
        return "Not Initialized";
    case iXRResult.eAnalyticsDisabled:
        return "Analytics Disabled";
    case iXRResult.eTooManyItems:
        return "Too Many Items";
    case iXRResult.eSizeLimitReached:
        return "Size Limit Reached";
    case iXRResult.eTooManyRequests:
        return "Too Many Requests";
    case iXRResult.eInvalidData:
        return "Invalid Data";
    case iXRResult.eUnsupportedPlatform:
        return "Unsupported Platform";
    case iXRResult.eEnableEventFailed:
        return "Enable Event Failed";
    case iXRResult.eEventNotEnabled:
        return "Event Not Enabled";
    case iXRResult.eEventCached:
        return "Event Cached";
    case iXRResult.eSendEventFailed:
        return "Send Event Failed";
    case iXRResult.ePostObjectsFailed:
        return "Post Objects Failed";
    case iXRResult.ePostObjectsFailedNetworkError:
        return "Post Objects Failed Network Error";
    case iXRResult.ePostObjectsBadJsonResponse:
        return "Post Objects Bad Json Response";
    case iXRResult.eDeleteObjectsFailed:
        return "Delete Objects Failed";
    case iXRResult.eDeleteObjectsFailedNetworkError:
        return "Delete Objects Failed Network Error";
    case iXRResult.eDeleteObjectsFailedDatabase:
        return "Delete Objects Failed Database";
    case iXRResult.eDeleteObjectsBadJsonResponse:
        return "Delete Objects Bad Json Response";
    case iXRResult.eAuthenticateFailed:
        return "Authenticate Failed";
    case iXRResult.eAuthenticateFailedNetworkError:
        return "Authenticate Failed Network Error";
    case iXRResult.eCouldNotObtainAuthSecret:
        return "Could Not Obtain Auth Secret";
    case iXRResult.eCorruptJson:
        return "Corrupt JSON";
    case iXRResult.eSetEnvironmentDataFailed:
        return "Set Environment Data Failed";
    case iXRResult.eObjectNotFound:
        return "Object Not Found";
    default:
        return "Ok";
    }
    return "Ok";
}

/// <summary>
/// Used by EventInteractionComplete() as I write this... initially inspired by Scorm but set-union of all LMSes we support.
///		In here directly underneath iXRResult as it similarly occurs at all levels (including iXR.cs in iXRLibForUnity).
///		Co-maintained with the one in iXRInterop.cs.
/// </summary>
export enum InteractionType
{
    eNull,
    eBool,
    eSelect,
    eText,
    eRating,
    eNumber
};

export function InteractionTypeToString(eRet: InteractionType): string
{
    switch (eRet)
    {
    case InteractionType.eBool:
        return "Bool";
    case InteractionType.eSelect:
        return "Select";
    case InteractionType.eText:
        return "Text";
    case InteractionType.eRating:
        return "Rating";
    case InteractionType.eNumber:
        return "Number";
    default:
        break;
    }
    return "Null";
}

/// <summary>
/// In EventXXXComplete() functions.
///		Co-maintained with the one in iXRInterop.cs.
/// </summary>
export enum ResultOptions
{
    eNull,
    ePass,
    eFail,
    eComplete,
    eIncomplete
};

export function ResultOptionsToString(eRet: ResultOptions): string
{
    switch (eRet)
    {
    case ResultOptions.eNull:
        return "Null";
    case ResultOptions.ePass:
        return "Pass";
    case ResultOptions.eFail:
        return "Fail";
    case ResultOptions.eComplete:
        return "Complete";
    case ResultOptions.eIncomplete:
        return "Incomplete";
    default:
        break;
    }
    return "Null";
}

/// <summary>
/// Result of JSON parsing operation(s).
/// </summary>
export enum JsonResult
{
	eOk,
	eBadJsonStructure,
	eMissingField,
	eExtraneousField,
	eFieldTypeNotSupported,
	eSingleObjectWhereListExpected,
	eListWhereSingleObjectExpected,
	eBoolFromDoubleNotSupported,
	eSUIDFromBoolNotSupported,
	eSUIDFromIntNotSupported,
	eSUIDFromDoubleNotSupported,
	eDictFromBoolNotSupported,
	eDictFromIntNotSupported,
	eDictFromDoubleNotSupported,
	eStringListFromBoolNotSupported,
	eStringListFromIntNotSupported,
	eStringListFromDoubleNotSupported,
	eDateTimeFromBoolNotSupported,
	eDateTimeFromIntNotSupported,
	eDateTimeFromDoubleNotSupported,
	eTimeSpanFromBoolNotSupported,
	eTimeSpanFromIntNotSupported,
	eTimeSpanFromDoubleNotSupported,
	eBinaryFromBoolNotSupported,
	eBinaryFromIntNotSupported,
	eBinaryFromDoubleNotSupported,
	eDoubleFromBoolNotSupported
};

export function JsonSuccess(eRet: JsonResult): boolean
{
	return (eRet === JsonResult.eOk);
}

export function JsonResultToString(eRet: JsonResult): string
{
	switch (eRet)
	{
	case JsonResult.eBadJsonStructure:
		return "Bad JSON Structure";
	case JsonResult.eMissingField:
		return "Missing Field";
	case JsonResult.eExtraneousField:
		return "Extraneous Field";
	case JsonResult.eFieldTypeNotSupported:
		return "Field Type Not Supported";
	case JsonResult.eSingleObjectWhereListExpected:
		return "Single Object Where List Expected";
	case JsonResult.eListWhereSingleObjectExpected:
		return "List Where Single Object Expected";
	case JsonResult.eBoolFromDoubleNotSupported:
		return "Bool From Double Not Supported";
	case JsonResult.eSUIDFromBoolNotSupported:
		return "SUID From Bool Not Supported";
	case JsonResult.eSUIDFromIntNotSupported:
		return "SUID From Int Not Supported";
	case JsonResult.eSUIDFromDoubleNotSupported:
		return "SUID From Double Not Supported";
	case JsonResult.eDictFromBoolNotSupported:
		return "Dict From Bool Not Supported";
	case JsonResult.eDictFromIntNotSupported:
		return "Dict From Int Not Supported";
	case JsonResult.eDictFromDoubleNotSupported:
		return "Dict From Double Not Supported";
	case JsonResult.eStringListFromBoolNotSupported:
		return "StringList From Bool Not Supported";
	case JsonResult.eStringListFromIntNotSupported:
		return "StringList From Int Not Supported";
	case JsonResult.eStringListFromDoubleNotSupported:
		return "StringList From Double Not Supported";
	case JsonResult.eDateTimeFromBoolNotSupported:
		return "DateTime From Bool Not Supported";
	case JsonResult.eDateTimeFromIntNotSupported:
		return "DateTime From Int Not Supported";
	case JsonResult.eDateTimeFromDoubleNotSupported:
		return "DateTime From Double Not Supported";
	case JsonResult.eBinaryFromBoolNotSupported:
		return "Binary From Bool Not Supported";
	case JsonResult.eBinaryFromIntNotSupported:
		return "Binary From Int Not Supported";
	case JsonResult.eBinaryFromDoubleNotSupported:
		return "Binary From Double Not Supported";
	case JsonResult.eDoubleFromBoolNotSupported:
		return "Double From Bool Not Supported";
	default:
		return "Ok";
	}
	return "Ok";
}

/// <summary>
/// Lean and mean Appconfig reader.
/// Assumes App.config is in current directory.
/// </summary>
// MJP:  writing this comment in the middle of porting... probably not going to need this as it implies reading a file.  Get rid of it when sure.
// export class ConfigurationManager
// {
// 	static mstringb AppSettings(const char* szFieldName, const char* szDefaultValue)
// 	{
// 		mstringb	szAppConfig;

// 		if (szAppConfig.LoadFromFile("App.config"))
// 		{
// 			csrstringb	csrszRegex;
// 			// ---
// 			csrszRegex.Format(R"(<add[\s]+key[\s]*=[\s]*"%s"[\s]+value[\s]*=[\s]*".*"[\s]*[/]?[\s]*>)", szFieldName);
// 			// ---
// 			std::vector<mstringb>	vszMatches;

// 			// Filter out any HTML comments.
// 			CSREGEXB::ProgressiveMatch(szAppConfig, { R"(<\!\-\-.*\-\->)" }, { { true, R"(.*)" } }, vszMatches);
// 			for (const mstringb& sz : vszMatches)
// 			{
// 				szAppConfig.Replace(sz, "");
// 			}
// 			// Now do the "real" match.
// 			CSREGEXB::DeepMatch(szAppConfig, { csrszRegex, R"(value[\s]*=[\s]*".*"[\s]*[/]?[\s]*>)" }, R"(value[\s]*=[\s]*")", R"("[\s]*[/]?[\s]*>)", vszMatches);
// 			if (vszMatches.size() > 0)
// 			{
// 				return vszMatches[0];
// 			}
// 		}
// 		// ---
// 		return szDefaultValue;
// 	}
// };

/// <summary>
/// Data type that makes it easy to port C# Duration... double representation of seconds.  Easy to load/save to db,
///		debug, and easy enough to convert for adding to DateTime (below).
/// </summary>
export class TimeSpan : public std::chrono::duration<double>
{
	TimeSpan() :
		std::chrono::duration<double>(0.0)
	{
	}
	TimeSpan(size_t nHours, size_t nMinutes, size_t nSeconds) :
		super(std::chrono::duration_cast<std::chrono::duration<double>>(std::chrono::hours(nHours)) +
			std::chrono::duration_cast<std::chrono::duration<double>>(std::chrono::minutes(nMinutes)) +
			std::chrono::duration_cast<std::chrono::duration<double>>(std::chrono::seconds(nSeconds)))
	{
	}
	TimeSpan(size_t nDays, size_t nHours, size_t nMinutes, size_t nSeconds) :
#ifndef _UNIX
		super(std::chrono::duration_cast<std::chrono::duration<double>>(std::chrono::days(nDays)) +
#else
		super(std::chrono::duration_cast<std::chrono::duration<double>>(std::chrono::hours(nDays * 24)) +
#endif // _UNIX
			std::chrono::duration_cast<std::chrono::duration<double>>(std::chrono::hours(nHours)) +
			std::chrono::duration_cast<std::chrono::duration<double>>(std::chrono::minutes(nMinutes)) +
			std::chrono::duration_cast<std::chrono::duration<double>>(std::chrono::seconds(nSeconds)))
	{
	}
	TimeSpan(const double& d) :
		super(dseconds(d))
	{
	}
	// Handles results of DateTime arithmetic.
	TimeSpan(const std::chrono::system_clock::duration& dtDuration)
	{
		super::operator=(std::chrono::duration_cast<std::chrono::system_clock::duration, double, std::ratio<1, 1>>(dtDuration));
	}
	operator double()
	{
		return *reinterpret_cast<double*>(this);
	}
	operator const double() const
	{
		return *reinterpret_cast<const double*>(this);
	}
	static TimeSpan Zero()
	{
		std::chrono::duration<double>	ret = std::chrono::duration<double>::zero();

		return *reinterpret_cast<TimeSpan*>(&ret);
	}
	template <typename CHAR> static TimeSpan Parse(const basic_mstring<CHAR>& sz)
	{
		TimeSpan				tsRet;
		std::vector<mstringb>	vszMatches;

		if (CIREGEXB::ProgressiveMatch(sz, {}, {
			{true, R"([\d])"}, {false, R"(\.)"},
			{true, R"([\d]{2})"}, {false, R"(:)"},
			{true, R"([\d]{2})"}, {false, R"(:)"},
			{true, R"([\d]{2})"} }, vszMatches) && vszMatches.size() == 4)
		{
			// D.HH:MM:SS.
			tsRet = TimeSpan(atol(vszMatches[0]), atol(vszMatches[1]), atol(vszMatches[2]), atol(vszMatches[3]));
		}
		else if (CIREGEXB::ProgressiveMatch(sz, {}, {
			{true, R"([\d]{2})"}, {false, R"(:)"},
			{true, R"([\d]{2})"}, {false, R"(:)"},
			{true, R"([\d]{2})"} }, vszMatches) && vszMatches.size() == 3)
		{
			// HH:MM:SS.
			tsRet = TimeSpan(atol(vszMatches[0]), atol(vszMatches[1]), atol(vszMatches[2]));
		}
		else
		{
			tsRet = TimeSpan::Zero();
		}
		// ---
		return tsRet;
	}
	mstringb ToString() const
	{
		mstringb	szRet;

		szRet.Format("%f", (double)*this);
		// ---
		return szRet;
	}
};

/// <summary>
/// Datatype that makes it easy to port C# DateTime.
/// </summary>
export class DateTime extends Date
{
    public static Now() : number
    {
        return super.now();
    }
    public static MaxValue() : DateTime
    {
        // Let them deal with the headset apocalypse when the y2224 bug happens.
        const dt = new DateTime();
        dt.setFullYear(DATEMAXVALUE);
        // ---
        return dt;
    }
    public static MinValue() : DateTime
    {
        const dt = new DateTime();
        dt.setFullYear(DATEMINVALUE);
        // ---
        return dt;
    }
    /// <summary>
    /// Core constructor.
    ///		Constructs to local time... i.e. ToLocalTimeString() will yield exactly what was constructed here
    ///		whereas ToUtcTimeString() will timezone-convert from what is passed in here.
    /// </summary>
    /// <param name="nYear">Year, i.e. 1957 indicates the year 1957</param>
    /// <param name="nMonth">1-based</param>
    /// <param name="nDay">1-based</param>
    /// <param name="nHour">0-based</param>
    /// <param name="nMinute">0-based</param>
    /// <param name="nSecond">0-based</param>
    /// <param name="nMilliseconds">0-based</param>
    constructor(nYear?: number, nMonth?: number, nDay?: number, nHour?: number, nMinute?: number, nSecond?: number, nMilliseconds?: number)
    {
        super();
        // this = new DateConstructor(nYear, nMonth, nDay, nHour, nMinute, nSecond, nMilliseconds);
    }
    // ---
    public ToLocalTimeString(): string
    {
        return '';
    }
    public ToUtcTimeString(): string
    {
        return '';
    }
    public ToString(): string
    {
        return this.ToUtcTimeString();
    }
    public ToUnixTime(): string
    {
        return '';
    }
    public ToInt64(): string
    {
        return '';
    }
    public ToUnixTimeAsString(): string
    {
        return '';
    }
    public FromUnixTime(nTime: number): void
    {
        // *this = std::chrono::system_clock::from_time_t(nTime);
    }
    public FromInt64(nTime: number): void
    {
        // *(int64_t*)this = nTime;
    }
    // Cannot overload static and non-static, hence this slight inelegancy.
    public static ConvertUnixTime(nTime: number): DateTime
    {
        var dt = new DateTime();

        // dt.FromUnixTime(nTime);
        // ---
        return dt;
    }
    // Calls core constructor therefore follows same convention (local / UTC)... referring to constructor
    // rather than saying what the constructor does here as it is too easy to forget to update this as
    // any change to the constructor is likely to be a hasty fix.
    public static Parse(sz: string): DateTime
    {
        return new Date(super.parse(sz)) as DateTime;
    }
};

/// <summary>
/// Datatype that makes it easy to port C# Dictionary<>-using code.
/// </summary>
/// <typeparam name="KEY">Key type.</typeparam>
/// <typeparam name="VALUE">Value type.</typeparam>
export class Dictionary<KEY, VALUE> extends Map<KEY, VALUE>
{
	// private m_vItems: Map<KEY, VALUE>;
	// private m_vItems: { [key: KEY]: VALUE };
	// ---
	constructor()
	{
		this = {};
	}
	Add(kKey: KEY, vValue: VALUE): void
	{
		super.set(key, vValue);
	}
	Remove(kKey: KEY): bool
	{
		return this.delete(kKey);
	}
	Count(): number
	{
		return this.size();
	}
	TryGetValue(kKey: KEY, OUT VALUE& vRet): bool
	{
		typename super::iterator	it = super::find(kKey);

		if (it != super::end())
		{
			vRet = it->second;
			// ---
			return true;
		}
		// ---
		return false;
	}
	template <typename CHAR> basic_mstring<CHAR> ToStringT() const
	{
		typename super::const_iterator	it;
		basic_mstring<CHAR>				szRet;

		for (it = super::begin(); it != super::end(); it++)
		{
			if (!szRet.empty())
			{
				szRet << CHAR(',');
			}
			szRet << static_cast<const KEY&>(it->first);
			szRet << CHAR('=');
			szRet << static_cast<const VALUE&>(it->second);
		}
		// ---
		return szRet;
	}
	mstringb ToString() const
	{
		return ToStringT<char>();
	}
	mstring16 ToString16() const
	{
		//return ToStringT<char16_t>();
		// This ultrastink springs from the Android compiler's utter refusal to instantiate the template on char16_t.
		// I tried every kind of casting and declare a CHAR[2] and copy ',' into it, etc and to no avail.  Then I tried
		// simply inlining a char16_t-specific implementation with u',' for the commas... same error.  The good way
		// works on every other compiler.
		return mstring16(ToStringT<char>());
	}
	JsonResult LoadFromJson(const json& jsontree)
	{
		JsonResult	eRet = JsonResult::eOk,
					eTestRet;

		super::clear();
		for (detail::iteration_proxy_value<detail::iter_impl<const json>> it = jsontree.items().begin(); it != jsontree.items().end(); ++it)
		{
			eTestRet = LoadFromJsonGuts(it.value());
			if (eTestRet != JsonResult::eOk)
			{
				eRet = eTestRet;
			}
		}
		// ---
		return eRet;
	}
private:
	JsonResult LoadFromJsonGuts(const json& jsontree)
	{
		JsonResult	eRet = JsonResult::eOk;

		for (detail::iteration_proxy_value<detail::iter_impl<const json>> it = jsontree.items().begin(); it != jsontree.items().end(); ++it)
		{
			Add(KEY(it.key().c_str()), VALUE(((const std::string)(it.value())).c_str()));
		}
		// ---
		return eRet;
	}
};

/// <summary>
/// The specific Dictionary<mstringb, mstringb>, which makes it easy to convert comma-separated string to dictionary of strings.
/// </summary>
struct PythonDictStrings : public Dictionary<mstringb, mstringb>
{
	using super = Dictionary<mstringb, mstringb>;
	// ---
	PythonDictStrings() = default;
	PythonDictStrings(const mstringb& szCommaSeparatedNameEqualsValueList)
	{
		CommaSeparatedStringToDictionary(szCommaSeparatedNameEqualsValueList);
	}
private:
	void CommaSeparatedStringToDictionary(const mstringb& szDict)
	{
		std::vector<mstringb>			vsz;
		mstringb						szKey,
										szValue;
		std::vector<mstringb>::iterator	it;

		super::clear();
		szDict.Split(',', vsz, false, false);
		for (it = vsz.begin(); it != vsz.end();)
		{
			std::vector<mstringb>	vszEquals;

			(*it++).Split('=', vszEquals, false, false);
			if (vszEquals.size() >= 1)
			{
				szKey = vszEquals[0].Trim();
				szValue = (vszEquals.size() >= 2) ? vszEquals[1].Trim() : mstringb("");
				super::Add(szKey, szValue);
			}
		}
	}
};

/// <summary>
/// For having a primary datatype among the self-describing datatypes (DataObjectBase.h).
/// </summary>
struct StringList : public std::list<mstringb>
{
	using super = std::list<mstringb>;
	// ---
	mbinary	m_mbBinaryData;	// Makes it easy to handle BLOB conversions from database... i.e. pass this object into the Type-overloaded column bindings.
	// ---
	StringList() = default;
	StringList(const mstringb& szCommaSeparatedList)
	{
		CommaSeparatedStringToStringList(szCommaSeparatedList);
	}
	// ---
	void SerializeToBinary()
	{
		typename super::const_iterator	it;

		m_mbBinaryData.clear();
		for (it = super::begin(); it != super::end(); it++)
		{
			m_mbBinaryData << true;
			m_mbBinaryData << *it;
		}
		m_mbBinaryData << false;
	}
	void DeserializeFromBinary()
	{
		bool		bNode;
		mstringb	value;

		super::clear();
		m_mbBinaryData.ResetSerializationState();
		do
		{
			m_mbBinaryData >> bNode;
			if (bNode)
			{
				m_mbBinaryData >> value;
				super::emplace_back(value);
			}
		} while (bNode);
	}
	JsonResult LoadFromJson(const json& jsontree)
	{
		JsonResult	eRet = JsonResult::eOk,
					eTestRet;

		super::clear();
		for (detail::iteration_proxy_value<detail::iter_impl<const json>> it = jsontree.items().begin(); it != jsontree.items().end(); ++it)
		{
			eTestRet = LoadFromJsonGuts(it.value());
			if (eTestRet != JsonResult::eOk)
			{
				eRet = eTestRet;
			}
		}
		// ---
		return eRet;
	}
	template <typename CHAR> basic_mstring<CHAR> ToStringT() const
	{
		typename super::const_iterator	it;
		std::basic_stringstream<CHAR>	szRet;

		for (it = super::begin(); it != super::end(); it++)
		{
			if (szRet.peek() != decltype(szRet)::traits_type::eof())
			{
				szRet << CHAR(',');
			}
			szRet << *it;
		}
		// ---
		return basic_mstring<CHAR>(szRet.str().c_str());
	}
	mstringb ToString() const
	{
		return ToStringT<char>();
	}
	mstring16 ToString16() const
	{
//			return ToStringT<char16_t>();
		// This ultrastink springs from the Android compiler's utter refusal to instantiate the template on char16_t.
		// I tried every kind of casting and declare a CHAR[2] and copy ',' into it, etc and to no avail.  Then I tried
		// simply inlining a char16_t-specific implementation with u',' for the commas... same error.  The good way
		// works on every other compiler.
		return mstring16(ToStringT<char>());
	}
private:
	JsonResult LoadFromJsonGuts(const json& jsontree)
	{
		JsonResult	eRet = JsonResult::eOk;

		for (detail::iteration_proxy_value<detail::iter_impl<const json>> it = jsontree.items().begin(); it != jsontree.items().end(); ++it)
		{
			super::emplace_back(mstringb(((const std::string)(it.value())).c_str()));
		}
		// ---
		return eRet;
	}
	void CommaSeparatedStringToStringList(const mstringb& szStringList)
	{
		std::vector<mstringb>			vsz;
		mstringb						szKey,
										szValue;
		std::vector<mstringb>::iterator	it;

		super::clear();
		szStringList.Split(',', vsz, false, false);
		for (it = vsz.begin(); it != vsz.end();)
		{
			super::emplace_back(*it++);
		}
	}
};

/// <summary>
/// Analogous to .NET Random object.
/// </summary>
struct Random
{
	Random()
	{
		std::srand((unsigned)std::chrono::duration_cast<std::chrono::nanoseconds>(std::chrono::high_resolution_clock::now().time_since_epoch()).count());
	}
	unsigned Next(const unsigned nModulo)
	{
		return std::rand() % nModulo;
	}
	unsigned Next(const unsigned nFirst, const unsigned nLast)
	{
		return (nLast <= nFirst) ? nFirst : std::rand() % (nLast - nFirst) + nFirst;
	}
	void NextBytes(mbinary& mbBytes)
	{
		std::transform(mbBytes.begin(), mbBytes.end(), mbBytes.begin(), [](uint8_t b){ return std::rand(); });
	}
};

/// <summary>
/// Analogous to .NET Task with just enough functionality for our purposes... basically just needs
///		to encapsulate a function pointer and its data and be able to call it synchronously.
/// </summary>
struct Task
{
	std::function<iXRResult(void*)>	m_pfnTask = nullptr;	// The task to be done.
	void							*m_pObject = nullptr;	// The task data, iXREvent, list of events, etc.
	std::function<void(void*)>		m_pfnCleanup = nullptr;	// How to clean up m_pObject.
	// ---
	Task() = default;
	Task(const std::function<iXRResult(void*)>& pfnTask, void* pObject, const std::function<void(void*)>& pfnCleanup) :
		m_pfnTask(pfnTask),
		m_pObject(pObject),
		m_pfnCleanup(pfnCleanup)
	{
	}
	void RunSynchronously()
	{
		m_pfnTask(m_pObject);
		m_pfnCleanup(m_pObject);
	}
};

/// <summary>
/// Analogous to .NET Queue<> with enough functionality for our purposes (Queue of Task).
/// </summary>
/// <typeparam name="T">Type of object being queued</typeparam>
template <typename T> struct Queue : public std::deque<T>
{
	using super = std::deque<T>;
	// ---
	T& Enqueue(T&& t)
	{
		return super::emplace_back(t);
	}
	T Dequeue()
	{
		if (super::size() > 0)
		{
			T	t = super::front();

			super::pop_front();
			// ---
			return t;
		}
		return T();
	}
};

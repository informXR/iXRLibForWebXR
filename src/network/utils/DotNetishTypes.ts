/// <summary>
/// Main return code for library operations.
///		In here as it is needed by Task.
///		Co-maintained with the one in AbxrInterop.cs.

import { atol, DATEMAXVALUE, DATEMINVALUE, Regex } from "../types";

/// <summary>
/// Main return code for library operations.
///		In here as it is needed by Task.
///		Co-maintained with the one in AbxrInterop.cs.
/// </summary>
export enum AbxrResult
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
	eSendEventFailed,			// General failure of AbxrLibSend.Event().
	ePostObjectsFailed,			// General failure of AbxrLibAnalytics.PostABXREvents().
	ePostObjectsFailedNetworkError,
	ePostObjectsBadJsonResponse,
	eDeleteObjectsFailed,		// General failure of AbxrLibAnalytics.DeleteABXREvents().
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

export function AbxrResultToString(eRet: AbxrResult): string
{
    switch (eRet)
    {
    case AbxrResult.eNotInitialized:
        return "Not Initialized";
    case AbxrResult.eAnalyticsDisabled:
        return "Analytics Disabled";
    case AbxrResult.eTooManyItems:
        return "Too Many Items";
    case AbxrResult.eSizeLimitReached:
        return "Size Limit Reached";
    case AbxrResult.eTooManyRequests:
        return "Too Many Requests";
    case AbxrResult.eInvalidData:
        return "Invalid Data";
    case AbxrResult.eUnsupportedPlatform:
        return "Unsupported Platform";
    case AbxrResult.eEnableEventFailed:
        return "Enable Event Failed";
    case AbxrResult.eEventNotEnabled:
        return "Event Not Enabled";
    case AbxrResult.eEventCached:
        return "Event Cached";
    case AbxrResult.eSendEventFailed:
        return "Send Event Failed";
    case AbxrResult.ePostObjectsFailed:
        return "Post Objects Failed";
    case AbxrResult.ePostObjectsFailedNetworkError:
        return "Post Objects Failed Network Error";
    case AbxrResult.ePostObjectsBadJsonResponse:
        return "Post Objects Bad Json Response";
    case AbxrResult.eDeleteObjectsFailed:
        return "Delete Objects Failed";
    case AbxrResult.eDeleteObjectsFailedNetworkError:
        return "Delete Objects Failed Network Error";
    case AbxrResult.eDeleteObjectsFailedDatabase:
        return "Delete Objects Failed Database";
    case AbxrResult.eDeleteObjectsBadJsonResponse:
        return "Delete Objects Bad Json Response";
    case AbxrResult.eAuthenticateFailed:
        return "Authenticate Failed";
    case AbxrResult.eAuthenticateFailedNetworkError:
        return "Authenticate Failed Network Error";
    case AbxrResult.eCouldNotObtainAuthSecret:
        return "Could Not Obtain Auth Secret";
    case AbxrResult.eCorruptJson:
        return "Corrupt JSON";
    case AbxrResult.eSetEnvironmentDataFailed:
        return "Set Environment Data Failed";
    case AbxrResult.eObjectNotFound:
        return "Object Not Found";
    default:
        return "Ok";
    }
    return "Ok";
}

/// <summary>
/// Used by EventInteractionComplete() as I write this... initially inspired by Scorm but set-union of all LMSes we support.
///		In here directly underneath AbxrResult as it similarly occurs at all levels (including Abxr.cs in AbxrLibForUnity).
///		Co-maintained with the one in AbxrInterop.cs.
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
///		Co-maintained with the one in AbxrInterop.cs.
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
export class ConfigurationManager
{
	public static m_szAppConfig:	string = "";
	// ---
	public static DebugSetAppConfig(szAppConfig: string): void
	{
		ConfigurationManager.m_szAppConfig = szAppConfig;
	}
	public static AppSettings(szFieldName: string, szDefaultValue: string): string
	{
		var szAppConfig:	string = ConfigurationManager.m_szAppConfig;

		// if (szAppConfig.LoadFromFile("App.config"))
		if (szAppConfig.length > 0)
		{
			var csrszRegex:	RegExp;
			// ---
			csrszRegex = new RegExp(`<add[\\s]+key[\\s]*=[\\s]*"${szFieldName}"[\\s]+value[\\s]*=[\\s]*".*?"[\\s]*[/]?[\\s]*>`);
			// ---
			var vszMatches:	string[] = [];

			// Filter out any HTML comments.  Note the non-greedy .*? which was not necessary in the C++ code.  Maybe back-port to C++ for consistency?
			vszMatches = Regex.ProgressiveMatch(szAppConfig, [ /<\!\-\-.*?\-\->/i ], [ [ true, /.*/i ] ]);
			for (const sz of vszMatches)
			{
				szAppConfig = szAppConfig.replace(sz, "");
			}
			// Now do the "real" match.
			vszMatches = Regex.DeepMatch(szAppConfig, [ csrszRegex, /value[\s]*=[\s]*".*"[\s]*[/]?[\s]*>/ ], /value[\s]*=[\s]*"/, /"[\s]*[/]?[\s]*>/);
			if (vszMatches.length > 0)
			{
				return vszMatches[0];
			}
		}
		// ---
		return szDefaultValue;
	}
};

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
// 			csrszRegex.Format(/<add[\s]+key[\s]*=[\s]*"%s"[\s]+value[\s]*=[\s]*".*"[\s]*[/]?[\s]*>/, szFieldName);
// 			// ---
// 			std::vector<mstringb>	vszMatches;

// 			// Filter out any HTML comments.
// 			Regex.ProgressiveMatch(szAppConfig, { /<\!\-\-.*\-\->/ }, { { true, /.*/ } }, vszMatches);
// 			for (const mstringb& sz : vszMatches)
// 			{
// 				szAppConfig.Replace(sz, "");
// 			}
// 			// Now do the "real" match.
// 			Regex.DeepMatch(szAppConfig, { csrszRegex, /value[\s]*=[\s]*".*"[\s]*[/]?[\s]*>/ }, /value[\s]*=[\s]*"/, /"[\s]*[/]?[\s]*>/, vszMatches);
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
export class TimeSpan
{
	private m_dtDate:	Date = new Date();
	// ---
	constructor()
	{
	}
	public Construct0(nHours: number, nMinutes: number, nSeconds: number): TimeSpan
	{
		this.m_dtDate = new Date((Math.floor(nHours) * 60.0 * 60.0 + Math.floor(nMinutes) * 60.0 + Math.floor(nSeconds)) * 1000.0);
		// ---
		return this;
	}
	public Construct1(nDays: number, nHours: number, nMinutes: number, nSeconds: number): TimeSpan
	{
		this.m_dtDate = new Date((Math.floor(nDays) * 24.0 * 60.0 * 60.0 + Math.floor(nHours) * 60.0 * 60.0 + Math.floor(nMinutes) * 60.0 + Math.floor(nSeconds)) * 1000.0);
		// ---
		return this;
	}
	public Construct2(d: number): TimeSpan
	{
		this.m_dtDate = new Date(d * 1000.0);
		// ---
		return this;
	}
	public ToInt64(): number
	{
		return this.m_dtDate.getTime() / 1000.0;
	}
	public get totalMilliseconds(): number
	{
		return this.m_dtDate.getTime();
	}
	public ToMilliseconds(): number
	{
		return this.m_dtDate.getTime();
	}
	// Handles results of DateTime arithmetic.
	// TimeSpan(const std::chrono::system_clock::duration& dtDuration)
	// {
	// 	super::operator=(std::chrono::duration_cast<std::chrono::system_clock::duration, double, std::ratio<1, 1>>(dtDuration));
	// }
	// operator double()
	// {
	// 	return *reinterpret_cast<double*>(this);
	// }
	// operator const double() const
	// {
	// 	return *reinterpret_cast<const double*>(this);
	// }
	public static Zero(): TimeSpan
	{
		return new TimeSpan().Construct2(0);
	}
	public static Parse(sz: string): TimeSpan
	{
		var tsRet:		TimeSpan = new TimeSpan();
		var vszMatches:	string[] = [];

		vszMatches = Regex.ProgressiveMatch(sz, [], [
			[true, /[\d]/i], [false, /\./i],
			[true, /[\d]{2}/i], [false, /:/i],
			[true, /[\d]{2}/i], [false, /:/i],
			[true, /[\d]{2}/i] ]);
		if (vszMatches.length === 4)
		{
			// D.HH:MM:SS.
			tsRet = new TimeSpan().Construct1(atol(vszMatches[0]), atol(vszMatches[1]), atol(vszMatches[2]), atol(vszMatches[3]));
		}
		else if (vszMatches.length === 1)
		{
			// Seconds.
			tsRet = new TimeSpan().Construct2(atol(vszMatches[0]));
		}
		else
		{
			vszMatches = Regex.ProgressiveMatch(sz, [], [
				[true, /[\d]{2}/i], [false, /:/i],
				[true, /[\d]{2}/i], [false, /:/i],
				[true, /[\d]{2}/i] ]);
			if (vszMatches.length === 3)
			{
				// HH:MM:SS.
				tsRet = new TimeSpan().Construct0(atol(vszMatches[0]), atol(vszMatches[1]), atol(vszMatches[2]));
			}
			else
			{
				tsRet = TimeSpan.Zero();
			}
		}
		// ---
		return tsRet;
	}
	public ToString(): string
	{
		var	szRet:	string = "";

		szRet = (this.m_dtDate.getMilliseconds() * 1000).toString();
		// ---
		return szRet;
	}
	public ToDateTime() : DateTime
	{
		return new Date(this.m_dtDate.getTime()) as DateTime;
	}
	public FromUnixTime(nTime: number): TimeSpan
	{
		this.m_dtDate = new Date(nTime * 1000.0);
		// ---
		return this;
	}
};

function FixedDigits(n: number, nDigits: number): string
{
	return n.toString().padStart(nDigits, '0');
}

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
		if (nYear !== undefined)
		{
			if (nMonth === undefined) nMonth = 0;
			if (nDay === undefined) nDay = 1;
			if (nHour === undefined) nHour = 0;
			if (nMinute === undefined) nMinute = 0;
			if (nSecond === undefined) nSecond = 0;
			if (nMilliseconds === undefined) nMilliseconds = 0;
			const dtLocalTime:	Date = new Date(nYear, nMonth, nDay, nHour, nMinute, nSecond, nMilliseconds);
			const dtUtcTime:	Date = new Date(dtLocalTime.getTime() + dtLocalTime.getTimezoneOffset() * 60000);
			// ---
			super(dtUtcTime);
		}
		else
		{
			super();
		}
	}
	// ---
	public ToLocalTimeString(): string
	{
		return super.toLocaleString();
	}
	public ToUtcTimeString(): string
	{
		return `${FixedDigits(this.getUTCFullYear(), 4)}-${FixedDigits(this.getUTCMonth() + 1, 2)}-${FixedDigits(this.getUTCDate(), 2)} ${FixedDigits(this.getUTCHours(), 2)}:${FixedDigits(this.getUTCMinutes(), 2)}:${FixedDigits(this.getUTCSeconds(), 2)}.${FixedDigits(this.getUTCMilliseconds(), 3)}`;
	}
	public ToString(): string
	{
		return this.ToUtcTimeString();
	}
	public ToUnixTime(): number
	{
		return super.getTime();
	}
	public ToInt64(): number
	{
		return super.getTime();
	}
	public ToUnixTimeAsString(): string
	{
		return Math.floor(super.getTime() / 1000).toString();
	}
	public FromUnixTime(nTime: number): DateTime
	{
		super.setTime(nTime);
		// ---
		return this;
	}
	public FromInt64(nTime: number): DateTime
	{
		super.setTime(nTime);
		// ---
		return this;
	}
	// Cannot overload static and non-static, hence this slight inelegancy.
	public static ConvertUnixTime(nTime: number): DateTime
	{
		var dt = new DateTime();

		dt.FromUnixTime(nTime);
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
		super();
		//this = {};
	}
	Add(kKey: KEY, vValue: VALUE): void
	{
		super.set(kKey, vValue);
	}
	Remove(kKey: KEY): boolean
	{
		return this.delete(kKey);
	}
	Count(): number
	{
		return this.size;
	}
	TryGetValue(kKey: KEY, refparam: {vRet: VALUE}): boolean
	{
		var	vValue = this.get(kKey);

		if (vValue != undefined)
		{
			refparam.vRet = vValue;
			// ---
			return true;
		}
		// ---
		return false;
	}
	ToString(): string
	{
		var	szRet : string = "";

		for (let entry of this.entries())
		{
			if (szRet.length > 0)
			{
				szRet += ',';
			}
			szRet += entry[0];
			szRet += '=';
			szRet += entry[1];
		}
		// ---
		return szRet;
	}
	LoadFromJson(): JsonResult
	{
		var	eRet = JsonResult.eOk,
			eTestRet: JsonResult;

		// super::clear();
		// for (detail::iteration_proxy_value<detail::iter_impl<const json>> it = jsontree.items().begin(); it != jsontree.items().end(); ++it)
		// {
		// 	eTestRet = LoadFromJsonGuts(it.value());
		// 	if (eTestRet != JsonResult::eOk)
		// 	{
		// 		eRet = eTestRet;
		// 	}
		// }
		// ---
		return eRet;
	}
	public JSONstringify(): string
	{
		const objThis:	object = Object.fromEntries(this);

		return JSON.stringify(objThis);
	}
// private:
// 	JsonResult LoadFromJsonGuts(const json& jsontree)
// 	{
// 		JsonResult	eRet = JsonResult::eOk;

// 		for (detail::iteration_proxy_value<detail::iter_impl<const json>> it = jsontree.items().begin(); it != jsontree.items().end(); ++it)
// 		{
// 			Add(KEY(it.key().c_str()), VALUE(((const std::string)(it.value())).c_str()));
// 		}
// 		// ---
// 		return eRet;
// 	}
};

/// <summary>
/// The specific Dictionary<mstringb, mstringb>, which makes it easy to convert comma-separated string to dictionary of strings.
/// </summary>
export class AbxrDictStrings extends Dictionary<string, string>
{
	constructor()
	{
		super();
	}
	Construct(szCommaSeparatedNameEqualsValueList: string): AbxrDictStrings
	{
		this.FromCommaSeparatedList(szCommaSeparatedNameEqualsValueList);
		// ---
		return this;
	}
	public FromCommaSeparatedList(szCommaSeparatedNameEqualsValueList: string): AbxrDictStrings
	{
		this.CommaSeparatedStringToDictionary(szCommaSeparatedNameEqualsValueList);
		// ---
		return this;
	}
	public GenerateJson(): string
	{
		var szRet:	string = "";

		for (const [key, value] of this.entries())
		{
			if (szRet.length > 0)
			{
				szRet += ',';
			}
			szRet += `"${key}":${AbxrDictStrings.StringIfNotNumber(value)}`;
		}
		// ---
		return `{${szRet}}`;
	}
	public static StringIfNotNumber(value: any): any
	{
		if (typeof value === 'string')
		{
			if (value.trim() !== '')
			{
				const nValue:	number = Number(value);

				if (!isNaN(nValue) && isFinite(nValue))
				{
					return nValue;
				}
			}
			return `"${value}"`;
		}
	}
	public FromJsonFieldValue(szJsonFieldValue: string): AbxrDictStrings
	{
		this.JsonFieldValueToDictionary(szJsonFieldValue);
		// ---
		return this;
	}
	// ---
	private CommaSeparatedStringToDictionary(szDict: string): void
	{
		var	vsz:		Array<string> = new Array<string>;
		var	szKey:		string = "",
			szValue:	string = "";

		this.clear();
		vsz = szDict.split(',');
		for (let sz of vsz.values())
		{
			var	vszEquals: Array<string> = new Array<string>;

			vszEquals = sz.split('=');
			if (vszEquals.length >= 1)
			{
				szKey = vszEquals[0].trim();
				szValue = (vszEquals.length >= 2) ? vszEquals[1].trim() : "";
				super.Add(szKey, szValue);
			}
		}
	}
	private JsonFieldValueToDictionary(szJsonFieldValue: string): void
	{
		const objThis:	object = JSON.parse(szJsonFieldValue);

		this.clear();
		for (const [key, value] of Object.entries(objThis))
		{
			super.Add(key, value);
		}
	}
};

/// <summary>
/// For having a primary datatype among the self-describing datatypes (DataObjectBase.h).
/// </summary>
export class StringList extends Array<string>
{
	constructor()
	{
		super();
	}
	// --- C#ish from C# port to C++.
	public emplace_back(sz: string): string
	{
		super.push(sz);
		// ---
		return sz;
	}
	public emplace_front(): string
	{
		var sz:	string = "";

		super.unshift(sz);
		// ---
		return sz;
	}
	FromCommaSeparatedList(szCommaSeparatedList: string): void
	{
		this.CommaSeparatedStringToStringList(szCommaSeparatedList);
	}
	// ---
	public JSONstringify(): string
	{
		return JSON.stringify(this);
	}
	LoadFromJson(): JsonResult
	{
		var	eRet = JsonResult.eOk,
			eTestRet: JsonResult;

		// super::clear();
		// for (detail::iteration_proxy_value<detail::iter_impl<const json>> it = jsontree.items().begin(); it != jsontree.items().end(); ++it)
		// {
		// 	eTestRet = LoadFromJsonGuts(it.value());
		// 	if (eTestRet != JsonResult::eOk)
		// 	{
		// 		eRet = eTestRet;
		// 	}
		// }
		// ---
		return eRet;
	}
	ToString(): string
	{
		var	szRet: string = "";

		for (let sz of this.entries())
		{
			if (szRet.length > 0)
			{
				szRet += ',';
			}
			szRet += sz;
		}
		// ---
		return szRet;
	}
	// ---
	private CommaSeparatedStringToStringList(szStringList: string): void
	{
		var	vsz: Array<string>;

		// No doubt better way to do this.
		while (this.length > 0)
		{
			this.pop();
		}
		vsz = szStringList.split(',');
		// Probably better way to do this as well, something similar to this.push(vsz.values()) which is unkosher apparently.
		for (let sz of vsz.values())
		{
			this.push(sz);
		}
	}
};

/// <summary>
/// Analogous to .NET Random object.
/// </summary>
export class Random
{
	public Next(nFirst?: number, nLast?: number): number
	{
		if (nFirst != null && nFirst != undefined)
		{
			if (nLast != null && nLast != undefined)
			{
				return (nLast <= nFirst) ? nFirst : Math.floor(Math.random() * (nLast - nFirst) + nFirst);
			}
			else
			{
				return Math.floor(Math.random() * nFirst);
			}
		}
		return 0;
	}
	NextBytes(mbBytes: Buffer): void
	{
		for (let b of mbBytes.values())
		{
			b = Math.floor(Math.random() * 256);
		}
	}
};

/// <summary>
/// Analogous to .NET Task with just enough functionality for our purposes... basically just needs
///		to encapsulate a function pointer and its data and be able to call it synchronously.
/// </summary>
export class Task
{
	m_pfnTask?: (pObject?: object) => void = undefined;		// The task to be done.
	m_pObject?: object = undefined;							// The task data, AbxrEvent, list of events, etc.
	m_pfnCleanup?: (pObject?: object) => void = undefined;	// How to clean up m_pObject.
	// ---
	constructor(pfnTask?: (pObject?: object) => void, pObject?: object, pfnCleanup?: (pObject?: object) => void)
	{
		this.m_pfnTask = pfnTask;
		this.m_pObject = pObject;
		this.m_pfnCleanup = pfnCleanup;
	}
	RunSynchronously(): void
	{
		if (this.m_pfnTask != undefined)
		{
			this.m_pfnTask(this.m_pObject);
		}
		if (this.m_pfnCleanup != undefined)
		{
			this.m_pfnCleanup(this.m_pObject);
		}
	}
};

/// <summary>
/// Analogous to .NET Queue<> with enough functionality for our purposes (Queue of Task).
/// </summary>
/// <typeparam name="T">Type of object being queued</typeparam>
//export class Queue<T> extends Array<T>
//{
//	public Enqueue(t: T): T
//	{
//		// Probably more efficient way to implement this.
//		return this[super.push(t) - 1];
//	}
//	Dequeue(): T
//	{
//		if (super.length > 0)
//		{
//			var	t: T|undefined = this.shift();
//			// ---
//			return (t) ? t : new T();
//		}
//		return new T();
//	}
//};

export class Queue<T>
{
	private items: T[] = [];
	// ---
	Enqueue(item: T): T
	{
		this.items.push(item);
		// ---
		return item;
	}
	Dequeue(): T | undefined
	{
		return this.items.shift();
	}
	Peek(): T | undefined
	{
		return this.items[0];
	}
	get length(): number
	{
		return this.items.length;
	}
	IsEmpty(): boolean
	{
		return this.items.length === 0;
	}
}

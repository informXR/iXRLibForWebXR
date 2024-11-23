/// <summary>
/// Main return code for library operations.
///		In here as it is needed by Task.
///		Co-maintained with the one in iXRInterop.cs.

import { DATEMAXVALUE, DATEMINVALUE } from "../types";

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

function InteractionTypeToString(eRet: InteractionType): string
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

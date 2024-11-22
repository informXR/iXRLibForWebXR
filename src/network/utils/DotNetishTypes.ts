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

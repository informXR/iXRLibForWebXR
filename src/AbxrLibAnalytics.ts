import { InitAllStatics, AbxrInitAllStatics } from './AbxrLibGlobal';
import { AbxrLibAsync } from './AbxrLibAsync';
import { AuthTokenDecodedJWT, AuthTokenRequest, AuthTokenResponseFailure, AuthTokenResponseSuccess, AbxrLibClient, Partner, PartnerToString, PostObjectsResponseFailure, PostObjectsResponseSuccess } from './AbxrLibClient';
import { AbxrAIProxy, AbxrBase, AbxrDbContext, AbxrLog, AbxrEvent, AbxrStorage, AbxrTelemetry, AbxrLibConfiguration, DbSetStorage } from './AbxrLibCoreModel';
import { AbxrLibStorage } from './AbxrLibStorage';
import { Base64, CurlHttp, DATEMAXVALUE, Sleep } from './network/types';
import { crc32 } from './network/utils/crc32';
import { sha256, SHA256 } from './network/utils/cryptoUtils';
import { DataObjectBase, DbSet, FieldPropertyFlags, LoadFromJson } from './network/utils/DataObjectBase';
import { AbxrResult, DateTime, TimeSpan, StringList, AbxrDictStrings, JsonResult } from './network/utils/DotNetishTypes';
import { DatabaseResult } from './network/utils/AbxrLibSQLite';
import { JWTDecode } from './network/utils/JWT';

/// <summary>
/// Object for authenticating with Abxr webservice.
/// </summary>
class Authentication
{
	public m_szApiToken:		string = "";	    	// JWT token obtained by authentication phase.  Goes into "Authentication:  Bearer" header.
	public m_szApiSecret:		string = "";	    	// Secret obtained by authentication phase.  Gets incorporated into SHA256 hash in X-AbxrLib-Hash.
	public m_szSessionId:		string = "";	    	// Current session-id to be re-used on re-login.
	public m_dtTokenExpiration:	DateTime;
	public m_szAppID:			string = "";
	public m_szOrgID:			string = "";
	public m_ePartner:			Partner;
	// ---
	public m_szAuthSecret:		string = "";			// Not exposed via properties or anything else, only available to AbxrLibInit for use in 2-stage authentication (dictAuthMechanism flows)... in C++, no friend classes in TypeScript so public.
	// ---
	public m_objAuthTokenRequest:	AuthTokenRequest;	// For setting the environment/session members of AuthTokenRequest as global properties that then get incorporated into the specific auth request on Authenticate().
	// ---
	public constructor()
	{
		this.m_dtTokenExpiration = new DateTime();
		this.m_dtTokenExpiration.setFullYear(DATEMAXVALUE);
		this.m_ePartner = Partner.eNone;
		// ---
		this.m_objAuthTokenRequest = new AuthTokenRequest();
	}
	// ---
	// Cat these together, then checksum then timestamp and hash it.
	// Headers for Hash, Timestamp, ApiToken, HardwareID.  Alternately or in addition to... JWT token?
	public async SetHeadersFromCurrentState(objRequest: CurlHttp, pbBodyContent: Buffer, bHasBody: boolean): Promise<void>
	{
		try
		{
			const dtNow:		DateTime = new DateTime();
			var szHashSource:	string = this.m_szApiToken + this.m_szApiSecret + dtNow.ToUnixTimeAsString();
			var szHash:			string = "";
			var nCrc32:			number;

			if (bHasBody)
			{
				nCrc32 = crc32(pbBodyContent);
				// MJPQ:  unsigned?
				szHashSource += nCrc32.toString();
			}
			// MJPQ:  Lovely that the line after this solves the problem but this SHOULD work and would be nice to know what the big secret is for TypeScript base64 functioning correctly.
			// szHash = Base64.Encode(await SHA256(szHashSource));
			szHash = await sha256(szHashSource);
			// ---
			objRequest.AddHttpAuthHeader("Bearer", this.m_szApiToken);
			objRequest.AddHttpHeader("X-AbxrLib-Hash", szHash);
			objRequest.AddHttpHeader("X-AbxrLib-Timestamp", dtNow.ToUnixTimeAsString());
		}
		catch (error)
		{
			console.log("Error: ", error);
		}
	}
	public TokenExpirationImminent(): boolean
	{
		return (DateTime.Now() + new TimeSpan().Construct0(0, 1, 0).totalMilliseconds >= this.m_dtTokenExpiration.getMilliseconds());
	}
}

/// <summary>
/// Object for setting up and cleaning up the library, and authenticating.
/// </summary>
export class AbxrLibInit
{
	//friend struct AbxrLibAnalyticsTests;
	// ---
	public static m_abxrLibAuthentication:	Authentication;
	// ---
	public static InitStatics(): void
	{
		this.m_abxrLibAuthentication = new Authentication();
	}
	// --- Initialization and its ancillaries.
	// Upon init/inclusion of the library we need to set the class variables.
	// Once we have the currentId set, we will also call GetAllData() so that its ready in cache right away.
	public static Start(): void
	{
		InitAllStatics();
		// ---
		if (!AbxrLibStorage.m_abxrLibConfiguration.ReadConfig())
		{
			AbxrLibAnalytics.m_listErrors.push("Could not read AppConfig.");
			AbxrLibAnalytics.DiagnosticWriteLine("Could not read AppConfig.");
		}
	}
	public static End(): void
	{
	}
	/// <summary>
	/// Hit the authentication endpoint with the passed in data and if successful, store the (token, secret)
	///		which will then get incorporated into the header information of every POST event call.
	/// </summary>
	/// <param name="szAppId">Identifies the application running on the headset</param>
	/// <param name="szOrgId">Identifies the organization that owns the application running on the headset</param>
	/// <param name="szCurrId">Current ID</param>
	/// <param name="szAuthSecret">Auth secret... obtained from, e.g., Arbor or whomever</param>
	/// <param name="szPartner">Blank if just Abxr, "arborxr" or whomever if partner... this is how backend knows to do further AuthSecret validation with partner.</param>
	/// <param name="bNewSession">true on initial authentication, false (use current) on reauthenticate.</param>
	/// <param name="bLookForAuthMechanism">true on initial authentication that uses AuthMechanism, i.e. need PIN from headset, false for standard single-step authentication.</param>
	/// <returns>AbxrResult enum</returns>
	private static async AuthenticateGuts(szAppId: string, szOrgId: string, szDeviceId: string, szAuthSecret: string, ePartner: Partner, bNewSession: boolean, bLookForAuthMechanism: boolean): Promise<AbxrResult>
	{
		var objAuthTokenRequest:	AuthTokenRequest = new AuthTokenRequest();
		var eRet:					AbxrResult = AbxrResult.eOk;
		var rpResponse:				{szResponse: string} = {szResponse: ""};

		// Stuff these into this object's property variables for future ReAuthenticate().
		this.set_AppID(szAppId);
		this.set_OrgID(szOrgId);
		if (!bNewSession)
		{
			// Using pre-existing session, countermand constructed new one.
			objAuthTokenRequest.m_szSessionId = AbxrLibInit.m_abxrLibAuthentication.m_szSessionId;
		}
		AbxrLibAnalytics.set_DeviceId(szDeviceId);
		this.set_Partner(ePartner);
		// Set the core auth fields.
		objAuthTokenRequest.m_szAppId = szAppId;
		objAuthTokenRequest.m_szOrgId = szOrgId;
		objAuthTokenRequest.m_szAuthSecret = szAuthSecret;
		objAuthTokenRequest.m_szDeviceId = szDeviceId;	// May also need UserId at some point.
		objAuthTokenRequest.m_szPartner = PartnerToString(ePartner);
		// Set the environment/session fields that come along for the ride in the auth payload.
		objAuthTokenRequest.m_szOsVersion = AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szOsVersion;
		objAuthTokenRequest.m_szIpAddress = AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szIpAddress;
		objAuthTokenRequest.m_szXrdmVersion = AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szXrdmVersion;
		objAuthTokenRequest.m_szAppVersion = AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szAppVersion;
		objAuthTokenRequest.m_szUnityVersion = AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szUnityVersion;
		objAuthTokenRequest.m_szDeviceModel = AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szDeviceModel;
		objAuthTokenRequest.m_szUserId = AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szUserId;
		objAuthTokenRequest.m_lszTags = AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_lszTags;
		objAuthTokenRequest.m_dictGeoLocation = AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_dictGeoLocation;
		objAuthTokenRequest.m_dictAuthMechanism = AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism;
		// ---
		eRet = await AbxrLibClient.PostAuthenticate(objAuthTokenRequest, rpResponse);
		if (eRet === AbxrResult.eOk)
		{
			var	eSuccessParse,
				eFailureParse,
				eJWTParse:						JsonResult;
			var	objAuthTokenResponseSuccess:	AuthTokenResponseSuccess = new AuthTokenResponseSuccess();
			var	objAuthTokenResponseFailure:	AuthTokenResponseFailure = new AuthTokenResponseFailure();
			var	objAuthTokenDecodedJWT:			AuthTokenDecodedJWT = new AuthTokenDecodedJWT();

			eSuccessParse = LoadFromJson(objAuthTokenResponseSuccess, rpResponse.szResponse);
			eFailureParse = LoadFromJson(objAuthTokenResponseFailure, rpResponse.szResponse);
			if (eSuccessParse === JsonResult.eBadJsonStructure || eFailureParse === JsonResult.eBadJsonStructure)
			{
				eRet = AbxrResult.eCorruptJson;
			}
			else if (eSuccessParse === JsonResult.eOk)
			{
				var	szJWT: string;

				AbxrLibInit.m_abxrLibAuthentication.m_szApiToken = objAuthTokenResponseSuccess.m_szToken;
				AbxrLibInit.m_abxrLibAuthentication.m_szApiSecret = objAuthTokenResponseSuccess.m_szApiSecret;
				// This is purely internal to this object... for two-step authentications using dictAuthMechanism so FinalAuthenticate() can use the same one used here.
				AbxrLibInit.m_abxrLibAuthentication.m_szAuthSecret = szAuthSecret;
				// Set current session only on successful login.
				AbxrLibInit.m_abxrLibAuthentication.m_szSessionId = objAuthTokenRequest.m_szSessionId;
				// --- AbxrLibInit.m_abxrLibAuthentication.m_szApiToken is a JWT token that contains, among other things, an "exp"
				//		field which is the Unix time of token expiration.
				szJWT = JWTDecode(AbxrLibInit.m_abxrLibAuthentication.m_szApiToken);
				eJWTParse = LoadFromJson(objAuthTokenDecodedJWT, szJWT);
				if (eJWTParse === JsonResult.eOk)
				{
					AbxrLibInit.m_abxrLibAuthentication.m_dtTokenExpiration.FromUnixTime(objAuthTokenDecodedJWT.m_utTokenExpiration);
				}
				else
				{
					// For now, silently shrug off not getting the token expiration.  At this stage of development,
					// it is excessively fastidious/brittle to fail due to this.
				}
				// --- While we are here, and now that we are authenticated, try and get the config from the backend.
				eRet = await AbxrLibStorage.ReadConfigFromBackend(bLookForAuthMechanism);
			}
			else
			{
				eRet = AbxrResult.eAuthenticateFailed;
			}
		}
		// ---
		return eRet;
	}
	/// <summary>
	/// Hit the authentication endpoint with the passed in data and if successful, store the (token, secret)
	///		which will then get incorporated into the header information of every POST event call.
	///		THIS IS DEFAULT or FIRST-STEP-of-EXTRA-AUTH CASE:  single Authenticate() with new session that ReAuthenticate() will reuse / First step of 2-step-extra-auth
	///		if we get back extra auth info from backend when issuing the request here.
	/// </summary>
	/// <param name="szAppId">Identifies the application running on the headset</param>
	/// <param name="szOrgId">Identifies the organization that owns the application running on the headset</param>
	/// <param name="szCurrId">Current ID</param>
	/// <param name="szAuthSecret">Auth secret... obtained from, e.g., Arbor or whomever</param>
	/// <param name="szPartner">Blank if just Abxr, "arborxr" or whomever if partner... this is how backend knows to do further AuthSecret validation with partner.</param>
	/// <returns>AbxrResult enum</returns>
	public static async Authenticate(szAppId: string, szOrgId: string, szDeviceId: string, szAuthSecret: string, ePartner: Partner): Promise<AbxrResult>
	{
		return await AbxrLibInit.AuthenticateGuts(szAppId, szOrgId, szDeviceId, szAuthSecret, ePartner, true, true);
	}
	/// <summary>
	/// Hit the authentication endpoint with the passed in data and if successful, store the (token, secret)
	///		which will then get incorporated into the header information of every POST event call.
	///		THIS IS SECOND/FINAL STEP OF EXTRAUTH CASE:  Authenticate() with session and m_dictExtraAuthData copied into the auth session field from Authenticate().
	/// </summary>
	/// <param name="szAppId">Identifies the application running on the headset</param>
	/// <param name="szOrgId">Identifies the organization that owns the application running on the headset</param>
	/// <param name="szCurrId">Current ID</param>
	/// <param name="szAuthSecret">Auth secret... obtained from, e.g., Arbor or whomever</param>
	/// <param name="szPartner">Blank if just Abxr, "arborxr" or whomever if partner... this is how backend knows to do further AuthSecret validation with partner.</param>
	/// <returns>AbxrResult enum</returns>
	public static async FinalAuthenticate(): Promise<AbxrResult>
	{
		return await AbxrLibInit.AuthenticateGuts(AbxrLibInit.get_AppID(), AbxrLibInit.get_OrgID(), AbxrLibAnalytics.get_DeviceId(), AbxrLibInit.m_abxrLibAuthentication.m_szAuthSecret, AbxrLibInit.get_Partner(), false, false);
	}
	/// <summary>
	/// Called by POST/PUT/WHATEVER objects to backend when backend returns an auth error.
	///		Attempt to acquire the latest secret via user-registered callback (if flagged)
	///		and then auth with it and the other variables used to Authenticate() initially
	///		(or set via properties) prior to calling this.
	/// </summary>
	/// <param name="bObtainAuthSecret">false = auth with current (appid, orgid, deviceid, authsecret), true = grab the authSecret with user-registered callback before attempting authentication.</param>
	/// <returns>AbxrResult enum.</returns>
	public static async ReAuthenticate(bObtainAuthSecret: boolean): Promise<AbxrResult>
	{
		var szAuthSecret: string;

		if (bObtainAuthSecret)
		{
			szAuthSecret = AbxrLibAnalytics.m_pfnGetAuthSecretCallback(AbxrLibAnalytics.m_pvGetAuthSecretCallbackData);
			if (!szAuthSecret || szAuthSecret === '')
			{
				return AbxrResult.eCouldNotObtainAuthSecret;
			}
			return await AbxrLibInit.AuthenticateGuts(AbxrLibInit.get_AppID(), AbxrLibInit.get_OrgID(), AbxrLibAnalytics.get_DeviceId(), szAuthSecret, AbxrLibInit.get_Partner(), false, false);
		}
		// ---
		return await AbxrLibInit.AuthenticateGuts(AbxrLibInit.get_AppID(), AbxrLibInit.get_OrgID(), AbxrLibAnalytics.get_DeviceId(), AbxrLibInit.get_ApiSecret(), AbxrLibInit.get_Partner(), false, false);
	}
	/// <summary>
	/// Wrapper for Core-core function to force send unsent objects synchronously.  Used to be inlined in ^^^ TimerCallback().
	///		Now we want it to be callable on its own for the user-goes-to-the-bog-then-resumes-playing workflow.
	/// </summary>
	/// <returns>AbxrResult enum.</returns>
	public static async ForceSendUnsent(): Promise<AbxrResult>
	{
		return await AbxrLibAnalytics.ForceSendUnsent();
	}
	// --- End Initialization and its ancillaries.
	// --- Authentication fields.
	public static get_ApiToken(): string { return AbxrLibInit.m_abxrLibAuthentication.m_szApiToken; }
	public static set_ApiToken(szApiToken: string): void { AbxrLibInit.m_abxrLibAuthentication.m_szApiToken = szApiToken; }
	// ---
	public static get_ApiSecret(): string { return AbxrLibInit.m_abxrLibAuthentication.m_szApiSecret; }
	public static set_ApiSecret(szApiSecret: string): void { AbxrLibInit.m_abxrLibAuthentication.m_szApiSecret = szApiSecret; }
	// --- ^^^ These 2 are obtained from the Authentication endpoint.  vvv These are AbxrAnalytics.m_abxrLibAuthentication fields that these properties can set for future (re)authentication.
	public static get_AppID(): string { return AbxrLibInit.m_abxrLibAuthentication.m_szAppID; }
	public static set_AppID(szAppID: string) { AbxrLibInit.m_abxrLibAuthentication.m_szAppID = szAppID; }
	// ---
	public static get_OrgID(): string { return AbxrLibInit.m_abxrLibAuthentication.m_szOrgID; }
	public static set_OrgID(szOrgID: string): void { AbxrLibInit.m_abxrLibAuthentication.m_szOrgID = szOrgID; }
	// ---
	public static get_TokenExpiration(): DateTime { return AbxrLibInit.m_abxrLibAuthentication.m_dtTokenExpiration; }
	public static set_TokenExpiration(dtTokenExpiration: DateTime): void { AbxrLibInit.m_abxrLibAuthentication.m_dtTokenExpiration = dtTokenExpiration; }
	// ---
	public static get_Partner(): Partner { return AbxrLibInit.m_abxrLibAuthentication.m_ePartner; }
	public static set_Partner(value: Partner): void { AbxrLibInit.m_abxrLibAuthentication.m_ePartner = value; }
	// --- Environment/session globals that get sent with the auth payload in Authenticate() functions.
	public static get_OsVersion(): string { return AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szOsVersion; }
	public static set_OsVersion(szOsVersion: string):void { AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szOsVersion = szOsVersion; }
	// ---
	public static get_IpAddress(): string { return AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szIpAddress; }
	public static set_IpAddress(szIpAddress: string): void { AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szIpAddress = szIpAddress; }
	// ---
	public static get_XrdmVersion(): string { return AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szXrdmVersion; }
	public static set_XrdmVersion(szXrdmVersion: string): void { AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szXrdmVersion = szXrdmVersion; }
	// ---
	public static get_AppVersion(): string { return AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szAppVersion; }
	public static set_AppVersion(szAppVersion: string): void { AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szAppVersion = szAppVersion; }
	// ---
	public static get_UnityVersion(): string { return AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szUnityVersion; }
	public static set_UnityVersion(szUnityVersion: string): void { AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szUnityVersion = szUnityVersion; }
	// ---
	public static get_DeviceModel(): string { return AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szDeviceModel; }
	public static set_DeviceModel(szDeviceModel: string) { AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szDeviceModel = szDeviceModel; }
	// ---
	public static get_UserId(): string { return AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szUserId; }
	public static set_UserId(szUserId: string) { AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_szUserId = szUserId; }
	// ---
	public static get_Tags(): StringList { return AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_lszTags; }
	public static set_Tags(lszTags: StringList): void { AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_lszTags = lszTags; }
	// ---
	public static get_GeoLocation(): AbxrDictStrings { return AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_dictGeoLocation; }
	public static set_GeoLocation(dictGeoLocation: AbxrDictStrings): void { AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_dictGeoLocation = dictGeoLocation; }
	// ---
	public static get_AuthMechanism(): AbxrDictStrings { return AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism; }
	public static set_AuthMechanism(dictAuthMechanism: AbxrDictStrings): void { AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism = dictAuthMechanism; }
	// --- End Authentication fields.
};

// --- API inspired in part by Unity.  https://docs.unity3d.com/ScriptReference/Analytics.Analytics.html.
// https://docs.unity.com/ugs/manual/analytics/manual/track-events.
/// <summary>
/// The main API object.
/// </summary>
// --- MJP:  templatize these?
export type AbxrLibAnalyticsGeneralCallback = (eResult: AbxrResult, szExceptionMessage: string) => void;
export type AbxrLibAnalyticsAIProxyCallback = (abxrAIProxy: AbxrAIProxy, eResult: AbxrResult, szExceptionMessage: string) => void;
export type AbxrLibAnalyticsStorageCallback = (abxrStorage: AbxrStorage, eResult: AbxrResult, szExceptionMessage: string) => void;
// ---
export type AbxrLibGetAuthSecretCallback = (pUserData: object | null) => string;
export type AbxrLibDiagnosticCallback = (szDiagnostic: string) => void;
// ---
export class AbxrLibAnalytics
{
	public static m_abxrLibAsync:					AbxrLibAsync;
	public static m_listErrors:						StringList;
	public static m_dtLastSuccessfulSend:			DateTime;						// State variable... for knowing when to wake up and send stragglers.
	public static m_bCheckForStragglers:			boolean;						// State variable... flip flops on send-main-chunks / send-stragglers.
	// Not C# callback mechanism.  Placeholder for now until we figure out how this is going to work with TypeScript.
	public static m_pfnGetAuthSecretCallback:		AbxrLibGetAuthSecretCallback;	// Give the client a hook for (re)authenticating... the call returns new authSecret that then gets used by (re)Authenticate() to auth with current (appId, orgId, deviceId, authSecret).
	public static m_pvGetAuthSecretCallbackData:	object | null;					// User data that gets passed to m_pfnAuthSecretCallback.
	// --- App.Config entries.
	// --- Information for encoding auth into HTTP headers.
    // --- Will be either userId or deviceId and currentId aliases whichever it is.  This is current global... snapshot in each ABXREvent as well.
	private static m_szUserId:						string;
	private static m_szDeviceId:					string;
	private static m_dssCurrentData:				AbxrDictStrings;  			 // where we will store the current data in memory for quick access.  MJP:  may already have implemented this as ABXRAnalytics.allEvents.
	// ---
	public static InitStatics(): void
	{
		AbxrLibAnalytics.m_abxrLibAsync = new AbxrLibAsync();
		AbxrLibAnalytics.m_listErrors = new StringList();
		AbxrLibAnalytics.m_dtLastSuccessfulSend = new DateTime();
		AbxrLibAnalytics.m_bCheckForStragglers = false;
		AbxrLibAnalytics.m_pfnGetAuthSecretCallback = AbxrLibAnalytics.DefaultGetAuthSecretCallback;
		AbxrLibAnalytics.m_pvGetAuthSecretCallbackData = null;
		AbxrLibAnalytics.m_szUserId = "";
		AbxrLibAnalytics.m_szDeviceId = "";
		AbxrLibAnalytics.m_dssCurrentData = new AbxrDictStrings();
	}
	//private static					m_dsbAllEvents = new Dictionary<mstringb, bool>;
	public static get_UserId(): string { return AbxrLibAnalytics.m_szUserId; }
	public static set_UserId(value: string): void { AbxrLibAnalytics.m_szUserId = value; }
	// ---
	public static get_DeviceId(): string { return AbxrLibAnalytics.m_szDeviceId; }
	public static set_DeviceId(value: string): void { AbxrLibAnalytics.m_szDeviceId = value; }	// https://docs.unity3d.com/ScriptReference/SystemInfo-deviceUniqueIdentifier.html
	// ---
	public static get_CurrentId(): string { return AbxrLibAnalytics.GetCurrentId(); }			// This may be a copy of userId or some other unique value we come up with.
	public static set_CurrentId(value: string): void { }
	// ---
	/// <summary>
	/// Not sure as I write this (during port) exactly how this is going to be used so this is a stub for now.
	/// </summary>
	/// <returns>Blank if no-op, return value from C# if C# provides a callback.</returns>
	public static DefaultGetAuthSecretCallback(pUserData: object | null): string
	{
		// ---
		return "";
	}
	// ---
    public static FinalUrl(szEndpoint: string): string
	{
		var szRet: string = AbxrLibStorage.m_abxrLibConfiguration.GetRestUrl();

		szRet += szEndpoint;
		// ---
		return szRet;
	}
	// Calculate this when we have "valid" userId or deviceId then it gets used thereafter on all relevant filtering.
	public static GetCurrentId(): string
	{
		return (this.m_szUserId.length > 0) ? this.m_szUserId : this.m_szDeviceId;
	}
    /// <summary>
    /// General TaskErrorReturn() that implements the callback logic on asynchronous calls.
    /// </summary>
    /// <param name="eResult">AbxrResult to return indicating status.</param>
    /// <param name="bNoCallbackOnSuccess">Only call callback on failures if this is true (and pfnStatusCallback not null).  False means always call (unless pfnCallback null).</param>
    /// <param name="pfnStatusCallback">Callback to call if this logic ^^^ computes.</param>
    /// <param name="szExceptionMessage">Message describing problem to be passed to the callback.</param>
    /// <returns>eResult</returns>
    /*private*/ public static TaskErrorReturn(eResult: AbxrResult, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsGeneralCallback, szExceptionMessage: string): AbxrResult
    {
        if (pfnStatusCallback !== null && pfnStatusCallback !== undefined)
        {
            if (!bNoCallbackOnSuccess || eResult !== AbxrResult.eOk)
            {
                pfnStatusCallback(eResult, szExceptionMessage);
            }
        }
        return eResult;
    }
	/// <summary>
	/// Type-specific TaskErrorReturn() template for asynchronous functions that need to include a specific object in the status callback.
	/// </summary>
	/// <typeparam name="T">Type of the specific object to include in the status callback.</typeparam>
	/// <typeparam name="CB">Callback type, generally 1-1 with object type, e.g. (AbxrEvent, AbxrLibAnalyticsEventCallback).</typeparam>
	/// <param name="eResult">AbxrResult to return indicating status.</param>
	/// <param name="abxrXXX">The specific object.</param>
	/// <param name="bNoCallbackOnSuccess">Only call callback on failures if this is true (and pfnStatusCallback not null).  False means always call (unless pfnCallback null).</param>
	/// <param name="pfnStatusCallback">Callback to call if this logic ^^^ computes.</param>
	/// <param name="szExceptionMessage">Message describing problem to be passed to the callback.</param>
	/// <returns>eResult</returns>
	private static TaskErrorReturnT<T>(eResult: AbxrResult, abxrXXX: T, bNoCallbackOnSuccess: boolean, pfnStatusCallback: ((abxrXXX: T, eResult: AbxrResult, szExceptionMessage: string) => void) | null, szExceptionMessage: string): AbxrResult
	{
		if (pfnStatusCallback !== null && pfnStatusCallback !== undefined)
		{
			if (!bNoCallbackOnSuccess || eResult !== AbxrResult.eOk)
			{
				pfnStatusCallback(abxrXXX, eResult, szExceptionMessage);
			}
		}
		return eResult;
	}
	/// <summary>
	/// The core Add<Event, Log, etc> function template that is called directly by Add<Event, Log, etc>() or indirectly by asynchronous Add<Event, Log, etc>Deferred().
	/// </summary>
	/// <typeparam name="T">Type of object to be added.</typeparam>
	/// <typeparam name="CB">Callback type, generally 1-1 with object type, e.g. (AbxrEvent, AbxrLibAnalyticsEventCallback).</typeparam>
	/// <typeparam name="AbxrLibStorage">Resolves forward reference catch-22.</typeparam>
	/// <param name="abxrT">T (Event, Log, etc) to add.</param>
	/// <(type)param name="tTypeOfT">Type of object to be deleted as an any due to TypeScript's screwiness w.r.t. generics.</typeparam>
	/// <param name="szTableName">Name of corresponding table in the database.</param>
	/// <param name="pfnPostABXRXXX">Pointer to function that sends a list of pointers to T which this function will calculate for sending to backend.</param>
	/// <param name="bOneAtATime">true = POST the objects one object per POST, false = POST them as one single POST with all objects in the body content.</param>
	/// <param name="bNoCallbackOnSuccess">true = Only call pfnStatusCallback on error, false = always call pfnStatusCallback (assuming pfnStatusCallback not null, do not call at all otherwise).</param>
	/// <param name="pfnStatusCallback">null = do not want status callback, else call according to ^^^.</param>
	/// <returns>As the call has not happened yet on return, this is the status of adding the task or failing to add it.</returns>
	/*private*/ public static async AddXXXTask<T extends AbxrBase>(abxrT: T, tTypeOfT: any, szTableName: string, pfnPostABXRXXX: (listpT: DbSet<T>, bOneAtATime: boolean, rpResponse: {szResponse: string}) => Promise<AbxrResult>, bOneAtATime: boolean, bNoCallbackOnSuccess: boolean, pfnStatusCallback: ((abxrXXX: T, eResult: AbxrResult, szExceptionMessage: string) => void) | null): Promise<AbxrResult>
	{
		var	nTrimCount:		number;
		var	dtNow:			DateTime = DateTime.ConvertUnixTime(DateTime.Now()),
			dtOlderThan:	DateTime = DateTime.ConvertUnixTime(dtNow.ToUnixTime() - (AbxrLibStorage.m_abxrLibConfiguration.m_tsPruneSentItemsOlderThan as TimeSpan).ToInt64());
		var	pdsABXRXXX:		DbSet<T> | null | undefined = null;
		var	eDb:			DatabaseResult;
		var	eRet:			AbxrResult = AbxrResult.eOk;

		try
		{
			var abxrDbContext:	AbxrDbContext = new AbxrDbContext(false);

			for (const [szField, objField] of Object.entries(abxrDbContext))
			{
				if (objField instanceof DbSet)
				{
					if (objField.ContainedType() === tTypeOfT)
					{
						pdsABXRXXX = objField;
						break;
					}
				}
			}
			// ---
			// newscope
			// {
			// 	ScopeThreadBlock	cs(m_csDB);

				pdsABXRXXX?.Add(abxrT);
				// if (AbxrLibStorage.m_abxrLibConfiguration.m_bUseDatabase)
				// {
				// 	eDb = abxrDbContext.SaveChanges();
				// }
			// }
			// If the un-pushed exceeds the limits (0 = ∞), trim out oldest necessary to get it under the limits.
			if (AbxrLibStorage.m_abxrLibConfiguration.m_nMaximumCachedItems > 0)
			{
				// ScopeThreadBlock	cs(m_csDB);

				// if (AbxrLibStorage.m_abxrLibConfiguration.m_bUseDatabase)
				// {
				// 	// Could be faster by obtaining the count with a SELECT COUNT... in a hurry to finish this port so doing it this way for now.
				// 	eDb = ExecuteSqlSelect(abxrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud !== 0 ORDER BY timestamp", {}, *pdsABXRXXX);
				// 	nTrimCount = pdsABXRXXX.Count() - AbxrLibStorage.m_abxrLibConfiguration.m_nMaximumCachedItems;
				// 	if (nTrimCount > 0)
				// 	{
				// 		pdsABXRXXX.RemoveRange(nTrimCount);
				// 		eDb = abxrDbContext.SaveChanges();
				// 	}
				// }
				// else
				{
					// If not using the db, simply remove everything that sent successfully.
					pdsABXRXXX = pdsABXRXXX?.filter(t => !t.m_bSyncedWithCloud) as DbSet<T>;
				}
			}
			// If pruneSentItemsOlderThan indicates a time (0 = ∞), trim older sent items.
			if (AbxrLibStorage.m_abxrLibConfiguration.m_tsPruneSentItemsOlderThan.ToInt64() > TimeSpan.Zero().ToInt64())
			{
				// ScopeThreadBlock	cs(m_csDB);

				// if (AbxrLibStorage.m_abxrLibConfiguration.m_bUseDatabase)
				// {
				// 	eDb = ExecuteSqlSelect(abxrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud !== 0 AND timestamp < ?", { {"timestamp", &dtOlderThan} }, *pdsABXRXXX);
				// 	if (pdsABXRXXX.Count() > 0)
				// 	{
				// 		pdsABXRXXX.RemoveRange();
				// 		eDb = abxrDbContext.SaveChanges();
				// 	}
				// }
				// else
				{
					// If not using the db, simply remove everything that sent successfully.
					pdsABXRXXX = pdsABXRXXX?.filter(t => { return !t.m_bSyncedWithCloud; }) as DbSet<T>;
				}
			}
			eRet = await AbxrLibAnalytics.SendUnsentXXXs<T>(abxrDbContext, pdsABXRXXX, tTypeOfT, szTableName, pfnPostABXRXXX, bOneAtATime, AbxrLibStorage.m_abxrLibConfiguration.m_nEventsPerSendAttempt, false);
			// ---
			// if (AbxrLibStorage.m_abxrLibConfiguration.m_bUseDatabase)
			// {
			// 	// ScopeThreadBlock	cs(m_csDB);

			// 	eDb = abxrDbContext.SaveChanges();
			// }
		}
		catch (error)
		{
			console.log("Error: ", error);
			//AbxrLibClient.WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
			// ---
			return AbxrLibAnalytics.TaskErrorReturnT<T>(AbxrResult.eSendEventFailed, abxrT, bNoCallbackOnSuccess, pfnStatusCallback, "Caught exception.");
		}
		// ---
		return AbxrLibAnalytics.TaskErrorReturnT<T>(eRet, abxrT, bNoCallbackOnSuccess, pfnStatusCallback, "");
	}
	/// <summary>
	/// The core Delete<Event, Log, etc> function template that is called directly by Delete<Event, Log, etc>() or indirectly by asynchronous Delete<Event, Log, etc>Deferred().
	/// </summary>
	/// <typeparam name="T">Type of object to be deleted.</typeparam>
	/// <typeparam name="CB">Callback type, generally 1-1 with object type, e.g. (AbxrEvent, AbxrLibAnalyticsEventCallback).</typeparam>
	/// <typeparam name="AbxrLibStorage">Resolves forward reference catch-22.</typeparam>
	/// <param name="abxrT">T (Event, Log, etc) to delete.</param>
	/// <(type)param name="tTypeOfT">Type of object to be deleted as an any due to TypeScript's screwiness w.r.t. generics.</typeparam>
	/// <param name="szTableName">Name of corresponding table in the database.</param>
	/// <param name="pfnPostABXRXXX">Pointer to function that sends a list of pointers to T which this function will calculate for sending to backend.</param>
	/// <param name="bNoCallbackOnSuccess">true = Only call pfnStatusCallback on error, false = always call pfnStatusCallback (assuming pfnStatusCallback not null, do not call at all otherwise).</param>
	/// <param name="pfnStatusCallback">null = do not want status callback, else call according to ^^^.</param>
	/// <returns>As the call has not happened yet on return, this is the status of adding the task or failing to add it.</returns>
	private static DeleteXXXTask<T extends AbxrBase>(abxrT: T, tTypeOfT: any, szTableName: string, pfnDeleteABXRXXX: (abxrT: T, rpResponse: {szResponse: string}) => AbxrResult, bNoCallbackOnSuccess: boolean, pfnStatusCallback: ((abxrXXX: T, eResult: AbxrResult, szExceptionMessage: string) => void) | null): AbxrResult
	{
		var	nTrimCount:		number;
		var	dtNow:			DateTime = DateTime.ConvertUnixTime(DateTime.Now()),
			dtOlderThan:	DateTime = DateTime.ConvertUnixTime(dtNow.ToUnixTime() - AbxrLibStorage.m_abxrLibConfiguration.m_tsPruneSentItemsOlderThan.ToDateTime().ToUnixTime());
		var	pdsABXRXXX:		DbSet<T> | null | undefined = null;
		var	eDb:			DatabaseResult;
		var	eRet:			AbxrResult = AbxrResult.eOk;

		try
		{
			var abxrDbContext:	AbxrDbContext = new AbxrDbContext(false);

			for (const [szField, objField] of Object.entries(abxrDbContext))
			{
				if (objField instanceof DbSet)
				{
					if (objField.ContainedType() === tTypeOfT)
					{
						pdsABXRXXX = objField;
						break;
					}
				}
			}
			// ---
			// newscope
			// {
			// 	ScopeThreadBlock	cs(m_csDB);

				pdsABXRXXX?.Add(abxrT);
				eDb = abxrDbContext.SaveChanges();
			// }
			// If the un-pushed exceeds the limits (0 = ∞), trim out oldest necessary to get it under the limits.
			// if (AbxrLibStorage.m_abxrLibConfiguration.m_nMaximumCachedItems > 0)
			// {
			// 	// ScopeThreadBlock	cs(m_csDB);

			// 	// Could be faster by obtaining the count with a SELECT COUNT... in a hurry to finish this port so doing it this way for now.
			// 	eDb = ExecuteSqlSelect(abxrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud !== 0 ORDER BY timestamp", {}, pdsABXRXXX);
			// 	nTrimCount = pdsABXRXXX?.Count() - AbxrLibStorage.m_abxrLibConfiguration.m_nMaximumCachedItems;
			// 	if (nTrimCount > 0)
			// 	{
			// 		pdsABXRXXX?.RemoveRange(nTrimCount);
			// 		eDb = abxrDbContext.SaveChanges();
			// 	}
			// }
			// If pruneSentItemsOlderThan indicates a time (0 = ∞), trim older sent items.
			// if (AbxrLibStorage.m_abxrLibConfiguration.m_tsPruneSentItemsOlderThan > TimeSpan.Zero())
			// {
			// 	// ScopeThreadBlock	cs(m_csDB);

			// 	eDb = ExecuteSqlSelect(abxrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud !== 0 AND timestamp < ?", { {"timestamp", &dtOlderThan} }, pdsABXRXXX);
			// 	if (pdsABXRXXX?.Count() > 0)
			// 	{
			// 		pdsABXRXXX?.RemoveRange();
			// 		eDb = abxrDbContext.SaveChanges();
			// 	}
			// }
			// ---
			// newscope
			// {
			// 	ScopeThreadBlock	cs(m_csDB);

				eDb = abxrDbContext.SaveChanges();
			// }
		}
		catch (error)
		{
			console.log("Error: ", error);
			//AbxrLibClient.WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
			// ---
			return AbxrLibAnalytics.TaskErrorReturnT<T>(AbxrResult.eSendEventFailed, abxrT, bNoCallbackOnSuccess, pfnStatusCallback, "Caught exception.");
		}
		// ---
		return AbxrLibAnalytics.TaskErrorReturnT<T>(eRet, abxrT, bNoCallbackOnSuccess, pfnStatusCallback, "");
	}
	/// <summary>
	/// Core unsent-event function template... for main chunks and stragglers, handles resends etc.
	/// </summary>
	/// <typeparam name="T">Type of straggler objects to be sent.</typeparam>
	/// <typeparam name="AbxrLibStorage">Resolves forward reference catch-22.</typeparam>
	/// <param name="abxrDbContext">Database object that contains all the AbxrLib object lists</param>
	/// <param name="dsABXRXXX">DbSet<T extends AbxrBase> passed in by caller so we use the same one as we want any changes in its state to bubble up to the caller... contains the objects to send.</param>
	/// <(type)param name="tTypeOfT">Type of object to be deleted as an any due to TypeScript's screwiness w.r.t. generics.</typeparam>
	/// <param name="szTableName">Name of corresponding table in the database.</param>
	/// <param name="pfnPostABXRXXX">Pointer to function that sends a list of pointers to T which this function will calculate for sending to backend.</param>
	/// <param name="bOneAtATime">true = POST the objects one object per POST, false = POST them as one single POST with all objects in the body content.</param>
	/// <param name="nConfiguredXXXPerSendAttempt">The corresponding how many T's per send attempt from AbxrLibConfiguration.</param>
	/// <param name="bSendingStragglers">true when being called by TimerCallback to drive Nagle-algorithmish-straggler-send, false when doing a main send</param>
	/// <returns>AbxrResult status code</returns>
	protected static async SendUnsentXXXs<T extends AbxrBase>(abxrDbContext: AbxrDbContext, dsABXRXXX: DbSet<T> | null, tTypeOfT: any, szTableName: string, pfnPostABXRXXX: (listpT: DbSet<T>, bOneAtATime: boolean, rpResponse: {szResponse: string}) => Promise<AbxrResult>, bOneAtATime: boolean, nConfiguredXXXPerSendAttempt: number, bSendingStragglers: boolean): Promise<AbxrResult>
	{
		var	eRet:		AbxrResult = AbxrResult.eOk,
			eTestRet:	AbxrResult = AbxrResult.eOk;

		// If we have enough new yet-to-be-pushed-to-REST items, then do that and mark as sent.
		if (AbxrLibStorage.m_abxrLibConfiguration.RESTConfigured())
		{
			var	dspObjectsToSend:	DbSet<T> | null | undefined = null;
			var	i:					number;
			var	bDoneSending:		boolean = false;
			var	eDb:				DatabaseResult;

			// if (AbxrLibStorage.m_abxrLibConfiguration.m_bUseDatabase)
			// {
				// ScopeThreadBlock	cs(m_csDB);

			// 	eDb = ExecuteSqlSelect(abxrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud === 0 ORDER BY timestamp", {}, dsABXRXXX);
			// }
			// While the remaining unpushed > eventsPerSendAttempt...
			while (!bDoneSending && (dsABXRXXX?.Count() ?? 0) > 0 && ((bSendingStragglers || (dsABXRXXX?.Count() ?? 0) >= nConfiguredXXXPerSendAttempt) || (!AbxrLibStorage.m_abxrLibConfiguration.m_bUseDatabase)))
			{
				// newscope
				// {
					// ScopeThreadBlock	cs(m_csDB);

					dspObjectsToSend = dsABXRXXX?.Take(nConfiguredXXXPerSendAttempt);
					// ---
					if (dspObjectsToSend?.size() === 0)
					{
						// I hope this code never gets executed.  I wrote it as a bandaid with a large comment
						// rivaling the blather volume of this comment detailing how it really stinks and I
						// hope I see the real problem someday then on further staring at the while clause,
						// I saw why empties could get sent and then fixed it.  And that should be that, so
						// why am I leaving this in?  Superstitiotology(tm).  There are 2 possible spacetimes:
						// 1) The spacetime where I take this out and there is still a hole in the logic.
						// 2) The spacetime where I leave it in and this code never gets executed.
						// If you are in spacetime-1, don't sweat it, you aren't reading this comment anyway.
						// ---
						// The meaning of this is "if we are about to send an empty list, do the tidy up as if
						// we just sent then break out of this loop."
						AbxrLibAnalytics.m_dtLastSuccessfulSend = DateTime.ConvertUnixTime(DateTime.Now());
						AbxrLibAnalytics.m_bCheckForStragglers = !bSendingStragglers;
						bDoneSending = true;
						break;
					}
				// }
				for (i = 0; i < AbxrLibStorage.m_abxrLibConfiguration.m_nSendRetriesOnFailure; i++)
				{
					try
					{
						var	rpResponse:	{szResponse: string} = {szResponse: ""};

						eTestRet = await pfnPostABXRXXX((dspObjectsToSend ?? new DbSet<T>(tTypeOfT)), bOneAtATime, rpResponse);
						if (eTestRet === AbxrResult.eOk)
						{
							var	eSuccessParse:		JsonResult,
								eFailureParse:		JsonResult;
							var	objResponseSuccess:	PostObjectsResponseSuccess = new PostObjectsResponseSuccess();
							var	objResponseFailure:	PostObjectsResponseFailure = new PostObjectsResponseFailure();

							eSuccessParse = LoadFromJson(objResponseSuccess, rpResponse.szResponse);
							eFailureParse = LoadFromJson(objResponseFailure, rpResponse.szResponse);
							if (eSuccessParse === JsonResult.eBadJsonStructure || eFailureParse === JsonResult.eBadJsonStructure)
							{
								eTestRet = AbxrResult.eCorruptJson;
							}
							else if (eSuccessParse === JsonResult.eOk)
							{
								// Do something with the data?  Haven't seen a success yet.  TODO.
								eTestRet = AbxrResult.eOk;
							}
							else
							{
								eTestRet = AbxrResult.eAuthenticateFailed;
							}
							if (eTestRet === AbxrResult.eOk)
							{
								// Succeeded... mark them as sent.
								if (dspObjectsToSend)
								{
									for (let pt of dspObjectsToSend)
									{
										pt.m_bSyncedWithCloud = true;
									}
								}
								// newscope
								// {
								// 	ScopeThreadBlock	cs(m_csDB);

									// if (AbxrLibStorage.m_abxrLibConfiguration.m_bUseDatabase)
									// {
									// 	abxrDbContext.SaveChanges();
									// 	eDb = ExecuteSqlSelect(abxrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud === 0 ORDER BY timestamp", {}, dsABXRXXX);
									// }
									// else
									{
										// If not using the db, simply remove everything that sent successfully.
										dsABXRXXX = dsABXRXXX?.filter(t => !t.m_bSyncedWithCloud) as DbSet<T>;
									}
									AbxrLibAnalytics.m_dtLastSuccessfulSend = DateTime.ConvertUnixTime(DateTime.Now());
									AbxrLibAnalytics.m_bCheckForStragglers = !bSendingStragglers;
									bDoneSending = true;
								// }
								break;
							}
							else
							{
								return eTestRet;
							}
						}
						else
						{
							await Sleep(AbxrLibStorage.m_abxrLibConfiguration.m_tsSendRetryInterval.ToInt64() * 1000);
						}
					}
					catch (error)
					{
						continue;
					}
				}
				if (!bDoneSending)
				{
					eRet = eTestRet;
					bDoneSending = true;
				}
			}
			// Delete sent from local-db if thusly configured.
			// if (AbxrLibStorage.m_abxrLibConfiguration.m_bUseDatabase)
			// {
			// 	if (!AbxrLibStorage.m_abxrLibConfiguration.m_bRetainLocalAfterSent)
			// 	{
			// 		ScopeThreadBlock	cs(m_csDB);

			// 		eDb = ExecuteSqlSelect(abxrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud !== 0", {}, dsABXRXXX);
			// 		dsABXRXXX.RemoveRange();
			// 		abxrDbContext.SaveChanges();
			// 	}
			// }
			// else
			{
				// If not using the db, simply remove everything that sent successfully.
				dsABXRXXX = dsABXRXXX?.filter(t => { return !t.m_bSyncedWithCloud; }) as DbSet<T>;
			}
		}
		// ---
		return eRet;
	}
	/// <summary>
	/// For immediately POSTing a single object to the backend with the send-retries-on-failure robustness but NONE of the db-cacheing, defer until later robustness.
	///		AIProxy is the object that instigated creation of this function.
	/// </summary>
	/// <typeparam name="T">Type of object being POSTed to backend.</typeparam>
	/// <typeparam name="CB">Type of object-specific callback when asynchronous and callback is desired.</typeparam>
	/// <typeparam name="AbxrLibStorage">Resolves forward reference catch-22.</typeparam>
	/// <param name="abxrT">The object to POST to backend.</param>
	/// <(type)param name="tTypeOfT">Type of object to be deleted as an any due to TypeScript's screwiness w.r.t. generics.</typeparam>
	/// <param name="pfnPostABXRXXX">Function pointer to function that POSTs list of objects (will always be list of one object when coming from here).</param>
	/// <param name="bOneAtATime">true = POST the objects one object per POST, false = POST them as one single POST with all objects in the body content.</param>
	/// <param name="bNoCallbackOnSuccess">When asynchronous and pfnStatusCallback not null, call always when this is false, only on failure when true.</param>
	/// <param name="pfnStatusCallback">null = no-op, not-null = callback in asynchronous case with respect to bNoCallbackOnSuccess.</param>
	/// <returns>AbxrResult status code.</returns>
	private static async AddXXXNoDbTask<T extends AbxrBase>(abxrT: T, tTypeOfT: any, pfnPostABXRXXX: (listpT: DbSet<T>, bOneAtATime: boolean, rpResponse: {szResponse: string}) => Promise<AbxrResult>, bOneAtATime: boolean, bNoCallbackOnSuccess: boolean, pfnStatusCallback: ((abxrXXX: T, eResult: AbxrResult, szExceptionMessage: string) => void) | null): Promise<AbxrResult>
	{
		var	eRet:	AbxrResult = AbxrResult.eOk;

		try
		{
			// If we have enough new yet-to-be-pushed-to-REST items, then do that and mark as sent.
			if (AbxrLibStorage.m_abxrLibConfiguration.RESTConfigured())
			{
				var	pObjectsToSend:	DbSet<T> = new DbSet<T>(tTypeOfT);
				var	i:				number;
				var	bDoneSending:	boolean = false;

				// While the remaining unpushed > eventsPerSendAttempt...
				pObjectsToSend.Add(abxrT);
				while (!bDoneSending)
				{
					for (i = 0; i < AbxrLibStorage.m_abxrLibConfiguration.m_nSendRetriesOnFailure; i++)
					{
						try
						{
							var	rpResponse:	{szResponse: string} = {szResponse: ""};

							if ((await pfnPostABXRXXX(pObjectsToSend, bOneAtATime, rpResponse)) === AbxrResult.eOk)
							{
								var	eSuccessParse:		JsonResult,
									eFailureParse:		JsonResult;
								var	objResponseSuccess:	PostObjectsResponseSuccess = new PostObjectsResponseSuccess();
								var	objResponseFailure: PostObjectsResponseFailure = new PostObjectsResponseFailure();
								var	eTestRet:			AbxrResult = AbxrResult.eOk;

								eSuccessParse = LoadFromJson(objResponseSuccess, rpResponse.szResponse);
								eFailureParse = LoadFromJson(objResponseFailure, rpResponse.szResponse);
								if (eSuccessParse === JsonResult.eBadJsonStructure || eFailureParse === JsonResult.eBadJsonStructure)
								{
									eTestRet = AbxrResult.eCorruptJson;
								}
								else if (eSuccessParse === JsonResult.eOk)
								{
									// Do something with the data?  Haven't seen a success yet.  TODO.
									eTestRet = AbxrResult.eOk;
								}
								else
								{
									eTestRet = AbxrResult.eAuthenticateFailed;
								}
								return eTestRet;
							}
							else
							{
								await Sleep(AbxrLibStorage.m_abxrLibConfiguration.m_tsSendRetryInterval.ToInt64() * 1000);
							}
						}
						catch (error)
						{
							continue;
						}
					}
				}
			}
		}
		catch (error)
		{
			return AbxrLibAnalytics.TaskErrorReturnT<T>(AbxrResult.eSendEventFailed, abxrT, bNoCallbackOnSuccess, pfnStatusCallback, `Caught exception: '${error}'.`);
		}
		// ---
		return AbxrLibAnalytics.TaskErrorReturnT<T>(eRet, abxrT, bNoCallbackOnSuccess, pfnStatusCallback, "");
	}
	/// <summary>
	/// Core-core function to force send unsent objects synchronously.  Used to be inlined in ^^^ TimerCallback().
	///		Now we want it to be callable on its own for the user-goes-to-the-bog-then-resumes-playing workflow.
	/// </summary>
	/// <returns>AbxrResult enum.</returns>
    public static async ForceSendUnsent(): Promise<AbxrResult>
	{
		var	eRet:			AbxrResult = AbxrResult.eOk,
			eTestRet:		AbxrResult = AbxrResult.eOk;
		var	abxrDbContext:	AbxrDbContext = new AbxrDbContext(false);

		eTestRet = await AbxrLibAnalytics.SendUnsentXXXs<AbxrEvent>(abxrDbContext, abxrDbContext.m_dsABXREvents, AbxrEvent, "ABXREvents", AbxrLibClient.PostABXREvents, false, AbxrLibStorage.m_abxrLibConfiguration.m_nEventsPerSendAttempt, true);
		if (eTestRet !== AbxrResult.eOk)
		{
			eRet = eTestRet;
		}
		eTestRet = await AbxrLibAnalytics.SendUnsentXXXs<AbxrLog>(abxrDbContext, abxrDbContext.m_dsABXRLogs, AbxrLog, "ABXRLogs", AbxrLibClient.PostABXRLogs, false, AbxrLibStorage.m_abxrLibConfiguration.m_nLogsPerSendAttempt, true);
		if (eTestRet !== AbxrResult.eOk)
		{
			eRet = eTestRet;
		}
		eTestRet = await AbxrLibAnalytics.SendUnsentXXXs<AbxrTelemetry>(abxrDbContext, abxrDbContext.m_dsABXRTelemetry, AbxrTelemetry, "ABXRTelemetry", AbxrLibClient.PostABXRTelemetry, false, AbxrLibStorage.m_abxrLibConfiguration.m_nTelemetryEntriesPerSendAttempt, true);
		if (eTestRet !== AbxrResult.eOk)
		{
			eRet = eTestRet;
		}
		eTestRet = await AbxrLibAnalytics.SendUnsentXXXs<AbxrStorage>(abxrDbContext, abxrDbContext.m_dsABXRStorage, AbxrStorage, "ABXRStorage", AbxrLibClient.PostABXRStorage, true, AbxrLibStorage.m_abxrLibConfiguration.m_nStorageEntriesPerSendAttempt, true);
		if (eTestRet !== AbxrResult.eOk)
		{
			eRet = eTestRet;
		}
		// ---
		return eRet;
	}
	// ---
	// Would be cool to have these be private but the dll Interface.cpp code makes that too much of a pain at this point, maybe revisit later.
	public static async SetHeadersFromCurrentStateStringBody(objRequest: CurlHttp, szBodyContent: string, bHasBody: boolean, bIncludeAuthHeaders: boolean): Promise<void>
	{
		await AbxrLibAnalytics.SetHeadersFromCurrentState(objRequest, Buffer.from(szBodyContent, "utf-8"), bHasBody, bIncludeAuthHeaders);
	}
	/// <summary>
	/// Prepping request for send.
	/// </summary>
	/// <param name="objRequest">The request being prepared</param>
	/// <param name="pbBodyContent">Body content where applicable (POST, PUT, ...)</param>
	/// <param name="bIncludeAuthHeaders">Include X-AbxrLib-xxx headers computed from Authenticate() data... i.e. false when Authenticate()ing</param>
	public static async SetHeadersFromCurrentState(objRequest: CurlHttp, pbBodyContent: Buffer, bHasBody: boolean, bIncludeAuthHeaders: boolean): Promise<void>
	{
		try
		{
			objRequest.AddHttpHeader("host", AbxrLibStorage.m_abxrLibConfiguration.GetRestUrlObject().HostAndPort());
			objRequest.AddHttpHeader("accept", "application/json");
			objRequest.AddHttpHeader("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; rv:109.0) Gecko/20100101 Firefox/119.0");
			objRequest.AddHttpHeader("accept-language", "en-US; q=0.5, en; q=0.5");
			objRequest.AddHttpHeader("accept-encoding", "gzip, deflate");
			objRequest.AddHttpHeader("Content-Type", "application/json");	// May need to parse pbBodyContent someday to distinguish Content-Type and Accept header settings.
			// ---
			if (bIncludeAuthHeaders)
			{
				await AbxrLibInit.m_abxrLibAuthentication.SetHeadersFromCurrentState(objRequest, pbBodyContent, bHasBody);
			}
		}
		catch (error)
		{
			console.log("Error: ", error);
		}
	}
	// --- API (C++ dll and C# dll) versions of AddAIProxy().
	public static async AddAIProxy0(szPrompt: string, szLMMProvider: string): Promise<AbxrResult>
	{
		var	abxrAIProxy:	AbxrAIProxy = new AbxrAIProxy().Construct0(szPrompt, "", szLMMProvider);

		return await AbxrLibAnalytics.AddAIProxy(abxrAIProxy);
	}
	public static async AddAIProxy1(szPrompt: string, szPastMessages: string, szLMMProvider: string): Promise<AbxrResult>
	{
		var	abxrAIProxy:	AbxrAIProxy = new AbxrAIProxy().Construct0(szPrompt, szPastMessages, szLMMProvider);

		return await AbxrLibAnalytics.AddAIProxy(abxrAIProxy);
	}
	public static async AddAIProxy2(szPrompt: string, dictPastMessages: AbxrDictStrings, szLMMProvider: string): Promise<AbxrResult>
	{
		var	abxrAIProxy:	AbxrAIProxy = new AbxrAIProxy().Construct1(szPrompt, dictPastMessages, szLMMProvider);

		return await AbxrLibAnalytics.AddAIProxy(abxrAIProxy);
	}
	// ---
	// public static AddAIProxyDeferred0(szPrompt: string, szLMMProvider: string): Promise<AbxrResult>
	// {
	// 	var	abxrAIProxy:	AbxrAIProxy = new AbxrAIProxy().Construct0(szPrompt, "", szLMMProvider);

	// 	return AbxrLibAnalytics.AddAIProxyDeferred(abxrAIProxy, true, null);
	// }
	// public static AddAIProxyDeferred1(szPrompt: string, szPastMessages: string, szLMMProvider: string): Promise<AbxrResult>
	// {
	// 	var	abxrAIProxy:	AbxrAIProxy = new AbxrAIProxy().Construct0(szPrompt, szPastMessages, szLMMProvider);

	// 	return AbxrLibAnalytics.AddAIProxyDeferred(abxrAIProxy, true, null);
	// }
	// public static AddAIProxyDeferred2(szPrompt: string, dictPastMessages: AbxrDictStrings, szLMMProvider: string): Promise<AbxrResult>
	// {
	// 	var	abxrAIProxy:	AbxrAIProxy = new AbxrAIProxy().Construct1(szPrompt, dictPastMessages, szLMMProvider);

	// 	return AbxrLibAnalytics.AddAIProxyDeferred(abxrAIProxy, true, null);
	// }
	// --- End API (C++ dll and C# dll) versions of AddAIProxy().
	public static async AddAIProxy(abxrAIProxy: AbxrAIProxy): Promise<AbxrResult>
	{
		return await AbxrLibAnalytics.AddXXXNoDbTask<AbxrAIProxy>(abxrAIProxy, AbxrAIProxy, AbxrLibClient.PostABXRAIProxyObjects, false, false, null);
	}
	// public static AddAIProxyDeferred(abxrAIProxy: AbxrAIProxy, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsAIProxyCallback | null): Promise<AbxrResult>
	// {
	// 	AbxrLibAnalytics.DiagnosticWriteLine("Going to call AddAIProxy().");
	// 	// Notice the = capture... so pfnStatusCallback propagates by copy into the thread.  Notice it is not needed in the typescript port colon paren.
	// 	return AbxrLibAnalytics.m_abxrLibAsync.AddTask((pObject: any): Promise<AbxrResult> => { return AbxrLibAnalytics.AddXXXNoDbTask<AbxrAIProxy>(pObject as AbxrAIProxy, AbxrAIProxy, AbxrLibClient.PostABXRAIProxyObjects, false, bNoCallbackOnSuccess, pfnStatusCallback).then((eRet: AbxrResult) => { return eRet; }).catch((eRet: AbxrResult) => { return eRet; }); },
	// 		abxrAIProxy,
	// 		(pObject: any): void => { /*delete (AbxrAIProxy*)pObject;*/ }
	// 	);
	// }
	// ---
	public static async AddAIProxyEntry(abxrAIProxy: AbxrAIProxy): Promise<AbxrResult>
	{
		return await AbxrLibAnalytics.AddXXXTask<AbxrAIProxy>(abxrAIProxy, AbxrAIProxy, "ABXRAIProxy", AbxrLibClient.PostABXRAIProxyObjects, false, false, null);
	}
	// public static AddAIProxyEntryDeferred(abxrAIProxy: AbxrAIProxy, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsAIProxyCallback): Promise<AbxrResult>
	// {
	// 	AbxrLibAnalytics.DiagnosticWriteLine("Going to call AddAIProxy().");
	// 	// Notice the = capture... so pfnStatusCallback propagates by copy into the thread.  Notice it is not needed in the typescript port colon paren.
	// 	return AbxrLibAnalytics.m_abxrLibAsync.AddTask((pObject: any): Promise<AbxrResult> => { return AbxrLibAnalytics.AddXXXTask<AbxrAIProxy>(pObject as AbxrAIProxy, AbxrAIProxy, "ABXRAIProxy", AbxrLibClient.PostABXRAIProxy, false, bNoCallbackOnSuccess, pfnStatusCallback).then((eRet: AbxrResult) => { return eRet; }).catch((eRet: AbxrResult) => { return eRet; }); },
	// 		abxrAIProxy,
	// 		(pObject: any): void => { /*delete (AbxrAIProxy*)pObject;*/ });
	// }
	// --- End Core AddXXX() functions called by the API functions.
	public static DefaultDiagnosticCallback(szLine: string): void
	{
	// #ifdef _DEBUG
	// 	AbxrLibAnalyticsTests.WriteLine(szLine);
	// #endif
	}
	public static DiagnosticWriteLine(szLine: string): void
	{
		console.log(szLine);
	}
};

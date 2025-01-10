import { iXRLibAsync } from './iXRLibAsync';
import { AuthTokenDecodedJWT, AuthTokenRequest, AuthTokenResponseFailure, AuthTokenResponseSuccess, iXRLibClient, Partner, PartnerToString, PostObjectsResponseFailure, PostObjectsResponseSuccess } from './iXRLibClient';
import { iXRAIProxy, iXRBase, iXRDbContext, iXRLog, iXREvent, iXRStorage, iXRTelemetry, iXRLibConfiguration } from './iXRLibCoreModel';
import { iXRLibStorage } from './iXRLibStorage';
import { Base64, CurlHttp, DATEMAXVALUE, Sleep } from './network/types';
import { crc32 } from './network/utils/crc32';
import { SHA256 } from './network/utils/cryptoUtils';
import { DataObjectBase, DbSet, FieldPropertyFlags, LoadFromJson } from './network/utils/DataObjectBase';
import { iXRResult, DateTime, TimeSpan, StringList, PythonDictStrings, JsonResult } from './network/utils/DotNetishTypes';
import { DatabaseResult } from './network/utils/iXRLibSQLite';
import { JWTDecode } from './network/utils/JWT';

/// <summary>
/// Object for authenticating with iXR webservice.
/// </summary>
class Authentication
{
	public m_szApiToken:		string = "";	    	// JWT token obtained by authentication phase.  Goes into "Authentication:  Bearer" header.
	public m_szApiSecret:		string = "";	    	// Secret obtained by authentication phase.  Gets incorporated into SHA256 hash in X-iXRLib-Hash.
	public m_szSessionId:		string = "";	    	// Current session-id to be re-used on re-login.
	public m_dtTokenExpiration:	DateTime;
	public m_szAppID:			string = "";
	public m_szOrgID:			string = "";
	public m_ePartner:			Partner;
	// ---
	public m_szAuthSecret:			string = "";		// Not exposed via properties or anything else, only available to iXRLibInit for use in 2-stage authentication (dictAuthMechanism flows)... in C++, no friend classes in TypeScript so public.
	// ---
	public m_objAuthTokenRequest:	AuthTokenRequest;	// For setting the environment/session members of AuthTokenRequest as global properties that then get incorporated into the specific auth request on Authenticate().
	// ---
	public constructor()
	{
		this.m_dtTokenExpiration = new DateTime();
		this.m_dtTokenExpiration.setFullYear(DATEMAXVALUE);
		this.m_ePartner = Partner.eNone;
		this.m_objAuthTokenRequest = new AuthTokenRequest();
	}
	// ---
	// Cat these together, then checksum then timestamp and hash it.
	// Headers for Hash, Timestamp, ApiToken, HardwareID.  Alternately or in addition to... JWT token?
	public async SetHeadersFromCurrentState(objRequest: CurlHttp, pbBodyContent: Buffer, bHasBody: boolean): Promise<void>
	{
		try
		{
			const dtNow:		DateTime = new DateTime(DateTime.Now());
			var szHashSource:	string = this.m_szApiToken + this.m_szApiSecret + dtNow.toISOString();
			var szHash:			string = "";
			var nCrc32:			number;

			if (bHasBody)
			{
				nCrc32 = crc32(pbBodyContent);
				// MJPQ:  unsigned?
				szHashSource += nCrc32.toString();
			}
			szHash = Base64.Encode(await SHA256(szHashSource));
			// ---
			objRequest.AddHttpAuthHeader("Bearer", this.m_szApiToken);
			objRequest.AddHttpHeader("X-iXRLib-Hash", szHash);
			objRequest.AddHttpHeader("X-iXRLib-Timestamp", dtNow.toISOString());
		}
		catch (error)
		{
			// iXRLibClient.WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
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
export class iXRLibInit
{
	//friend struct iXRLibAnalyticsTests;
	// ---
	public static m_ixrLibAuthentication:	Authentication;
	// ---
	public static InitStatics()
	{
		this.m_ixrLibAuthentication = new Authentication();
	}
	// --- Initialization and its ancillaries.
	// Upon init/inclusion of the library we need to set the class variables.
	// Once we have the currentId set, we will also call GetAllData() so that its ready in cache right away.
	public static Start(): void
	{
		if (!iXRLibStorage.m_ixrLibConfiguration.ReadConfig())
		{
			iXRLibAnalytics.m_listErrors.push("Could not read AppConfig.");
			iXRLibAnalytics.DiagnosticWriteLine("Could not read AppConfig.");
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
	/// <param name="szPartner">Blank if just iXR, "arborxr" or whomever if partner... this is how backend knows to do further AuthSecret validation with partner.</param>
	/// <param name="bNewSession">true on initial authentication, false (use current) on reauthenticate.</param>
	/// <param name="bLookForAuthMechanism">true on initial authentication that uses AuthMechanism, i.e. need PIN from headset, false for standard single-step authentication.</param>
	/// <returns>iXRResult enum</returns>
	private static async AuthenticateGuts(szAppId: string, szOrgId: string, szDeviceId: string, szAuthSecret: string, ePartner: Partner, bNewSession: boolean, bLookForAuthMechanism: boolean): Promise<iXRResult>
	{
		var objAuthTokenRequest:	AuthTokenRequest = new AuthTokenRequest();
		var eRet:					iXRResult = iXRResult.eOk;
		var szResponse:				string = "";

		// Stuff these into this object's property variables for future ReAuthenticate().
		this.set_AppID(szAppId);
		this.set_OrgID(szOrgId);
		if (!bNewSession)
		{
			// Using pre-existing session, countermand constructed new one.
			objAuthTokenRequest.m_szSessionId = iXRLibInit.m_ixrLibAuthentication.m_szSessionId;
		}
		iXRLibAnalytics.set_DeviceId(szDeviceId);
		this.set_Partner(ePartner);
		// Set the core auth fields.
		objAuthTokenRequest.m_szAppId = szAppId;
		objAuthTokenRequest.m_szOrgId = szOrgId;
		objAuthTokenRequest.m_szAuthSecret = szAuthSecret;
		objAuthTokenRequest.m_szDeviceId = szDeviceId;	// May also need UserId at some point.
		objAuthTokenRequest.m_szPartner = PartnerToString(ePartner);
		// Set the environment/session fields that come along for the ride in the auth payload.
		objAuthTokenRequest.m_szOsVersion = iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szOsVersion;
		objAuthTokenRequest.m_szIpAddress = iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szIpAddress;
		objAuthTokenRequest.m_szXrdmVersion = iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szXrdmVersion;
		objAuthTokenRequest.m_szAppVersion = iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szAppVersion;
		objAuthTokenRequest.m_szUnityVersion = iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szUnityVersion;
		objAuthTokenRequest.m_szDeviceModel = iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szDeviceModel;
		objAuthTokenRequest.m_szUserId = iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szUserId;
		objAuthTokenRequest.m_lszTags = iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_lszTags;
		objAuthTokenRequest.m_dictGeoLocation = iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictGeoLocation;
		objAuthTokenRequest.m_dictAuthMechanism = iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism;
		// ---
		eRet = await iXRLibClient.PostAuthenticate(objAuthTokenRequest, {szResponse});
		if (eRet === iXRResult.eOk)
		{
			var	eSuccessParse,
				eFailureParse,
				eJWTParse:						JsonResult;
			var	objAuthTokenResponseSuccess:	AuthTokenResponseSuccess = new AuthTokenResponseSuccess();
			var	objAuthTokenResponseFailure:	AuthTokenResponseFailure = new AuthTokenResponseFailure();
			var	objAuthTokenDecodedJWT:			AuthTokenDecodedJWT = new AuthTokenDecodedJWT();

			eSuccessParse = LoadFromJson(objAuthTokenResponseSuccess, szResponse);
			eFailureParse = LoadFromJson(objAuthTokenResponseFailure, szResponse);
			if (eSuccessParse === JsonResult.eBadJsonStructure || eFailureParse === JsonResult.eBadJsonStructure)
			{
				eRet = iXRResult.eCorruptJson;
			}
			else if (eSuccessParse === JsonResult.eOk)
			{
				var	szJWT: string;

				iXRLibInit.m_ixrLibAuthentication.m_szApiToken = objAuthTokenResponseSuccess.m_szToken;
				iXRLibInit.m_ixrLibAuthentication.m_szApiSecret = objAuthTokenResponseSuccess.m_szApiSecret;
				// This is purely internal to this object... for two-step authentications using dictAuthMechanism so FinalAuthenticate() can use the same one used here.
				iXRLibInit.m_ixrLibAuthentication.m_szAuthSecret = szAuthSecret;
				// Set current session only on successful login.
				iXRLibInit.m_ixrLibAuthentication.m_szSessionId = objAuthTokenRequest.m_szSessionId;
				// --- iXRLibInit.m_ixrLibAuthentication.m_szApiToken is a JWT token that contains, among other things, an "exp"
				//		field which is the Unix time of token expiration.
				szJWT = JWTDecode(iXRLibInit.m_ixrLibAuthentication.m_szApiToken);
				eJWTParse = LoadFromJson(objAuthTokenDecodedJWT, szJWT);
				if (eJWTParse === JsonResult.eOk)
				{
					iXRLibInit.m_ixrLibAuthentication.m_dtTokenExpiration.FromUnixTime(objAuthTokenDecodedJWT.m_utTokenExpiration);
				}
				else
				{
					// For now, silently shrug off not getting the token expiration.  At this stage of development,
					// it is excessively fastidious/brittle to fail due to this.
				}
				// --- While we are here, and now that we are authenticated, try and get the config from the backend.
				eRet = await iXRLibStorage.ReadConfigFromBackend(bLookForAuthMechanism);
			}
			else
			{
				eRet = iXRResult.eAuthenticateFailed;
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
	/// <param name="szPartner">Blank if just iXR, "arborxr" or whomever if partner... this is how backend knows to do further AuthSecret validation with partner.</param>
	/// <returns>iXRResult enum</returns>
	public static async Authenticate(szAppId: string, szOrgId: string, szDeviceId: string, szAuthSecret: string, ePartner: Partner): Promise<iXRResult>
	{
		return await iXRLibInit.AuthenticateGuts(szAppId, szOrgId, szDeviceId, szAuthSecret, ePartner, true, true);
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
	/// <param name="szPartner">Blank if just iXR, "arborxr" or whomever if partner... this is how backend knows to do further AuthSecret validation with partner.</param>
	/// <returns>iXRResult enum</returns>
	public static async FinalAuthenticate(): Promise<iXRResult>
	{
		return await iXRLibInit.AuthenticateGuts(iXRLibInit.get_AppID(), iXRLibInit.get_OrgID(), iXRLibAnalytics.get_DeviceId(), iXRLibInit.m_ixrLibAuthentication.m_szAuthSecret, iXRLibInit.get_Partner(), false, false);
	}
	/// <summary>
	/// Called by POST/PUT/WHATEVER objects to backend when backend returns an auth error.
	///		Attempt to acquire the latest secret via user-registered callback (if flagged)
	///		and then auth with it and the other variables used to Authenticate() initially
	///		(or set via properties) prior to calling this.
	/// </summary>
	/// <param name="bObtainAuthSecret">false = auth with current (appid, orgid, deviceid, authsecret), true = grab the authSecret with user-registered callback before attempting authentication.</param>
	/// <returns>iXRResult enum.</returns>
	public static async ReAuthenticate(bObtainAuthSecret: boolean): Promise<iXRResult>
	{
		var szAuthSecret: string;

		if (bObtainAuthSecret)
		{
			szAuthSecret = iXRLibAnalytics.m_pfnGetAuthSecretCallback(iXRLibAnalytics.m_pvGetAuthSecretCallbackData);
			if (!szAuthSecret || szAuthSecret === '')
			{
				return iXRResult.eCouldNotObtainAuthSecret;
			}
			return await iXRLibInit.AuthenticateGuts(iXRLibInit.get_AppID(), iXRLibInit.get_OrgID(), iXRLibAnalytics.get_DeviceId(), szAuthSecret, iXRLibInit.get_Partner(), false, false);
		}
		// ---
		return await iXRLibInit.AuthenticateGuts(iXRLibInit.get_AppID(), iXRLibInit.get_OrgID(), iXRLibAnalytics.get_DeviceId(), iXRLibInit.get_ApiSecret(), iXRLibInit.get_Partner(), false, false);
	}
	/// <summary>
	/// Wrapper for Core-core function to force send unsent objects synchronously.  Used to be inlined in ^^^ TimerCallback().
	///		Now we want it to be callable on its own for the user-goes-to-the-bog-then-resumes-playing workflow.
	/// </summary>
	/// <returns>iXRResult enum.</returns>
	public static async ForceSendUnsentSynchronous(): Promise<iXRResult>
	{
		return await iXRLibAnalytics.ForceSendUnsentSynchronous();
	}
	// --- End Initialization and its ancillaries.
	// --- Authentication fields.
	public static get_ApiToken(): string { return iXRLibInit.m_ixrLibAuthentication.m_szApiToken; }
	public static set_ApiToken(szApiToken: string): void { iXRLibInit.m_ixrLibAuthentication.m_szApiToken = szApiToken; }
	// ---
	public static get_ApiSecret(): string { return iXRLibInit.m_ixrLibAuthentication.m_szApiSecret; }
	public static set_ApiSecret(szApiSecret: string): void { iXRLibInit.m_ixrLibAuthentication.m_szApiSecret = szApiSecret; }
	// --- ^^^ These 2 are obtained from the Authentication endpoint.  vvv These are iXRAnalytics.m_ixrLibAuthentication fields that these properties can set for future (re)authentication.
	public static get_AppID(): string { return iXRLibInit.m_ixrLibAuthentication.m_szAppID; }
	public static set_AppID(szAppID: string) { iXRLibInit.m_ixrLibAuthentication.m_szAppID = szAppID; }
	// ---
	public static get_OrgID(): string { return iXRLibInit.m_ixrLibAuthentication.m_szOrgID; }
	public static set_OrgID(szOrgID: string): void { iXRLibInit.m_ixrLibAuthentication.m_szOrgID = szOrgID; }
	// ---
	public static get_TokenExpiration(): DateTime { return iXRLibInit.m_ixrLibAuthentication.m_dtTokenExpiration; }
	public static set_TokenExpiration(dtTokenExpiration: DateTime): void { iXRLibInit.m_ixrLibAuthentication.m_dtTokenExpiration = dtTokenExpiration; }
	// ---
	public static get_Partner(): Partner { return iXRLibInit.m_ixrLibAuthentication.m_ePartner; }
	public static set_Partner(value: Partner): void { iXRLibInit.m_ixrLibAuthentication.m_ePartner = value; }
	// --- Environment/session globals that get sent with the auth payload in Authenticate() functions.
	public static get_OsVersion(): string { return iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szOsVersion; }
	public static set_OsVersion(szOsVersion: string):void { iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szOsVersion = szOsVersion; }
	// ---
	public static get_IpAddress(): string { return iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szIpAddress; }
	public static set_IpAddress(szIpAddress: string): void { iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szIpAddress = szIpAddress; }
	// ---
	public static get_XrdmVersion(): string { return iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szXrdmVersion; }
	public static set_XrdmVersion(szXrdmVersion: string): void { iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szXrdmVersion = szXrdmVersion; }
	// ---
	public static get_AppVersion(): string { return iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szAppVersion; }
	public static set_AppVersion(szAppVersion: string): void { iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szAppVersion = szAppVersion; }
	// ---
	public static get_UnityVersion(): string { return iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szUnityVersion; }
	public static set_UnityVersion(szUnityVersion: string): void { iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szUnityVersion = szUnityVersion; }
	// ---
	public static get_DeviceModel(): string { return iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szDeviceModel; }
	public static set_DeviceModel(szDeviceModel: string) { iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szDeviceModel = szDeviceModel; }
	// ---
	public static get_UserId(): string { return iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szUserId; }
	public static set_UserId(szUserId: string) { iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_szUserId = szUserId; }
	// ---
	public static get_Tags(): StringList { return iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_lszTags; }
	public static set_Tags(lszTags: StringList): void { iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_lszTags = lszTags; }
	// ---
	public static get_GeoLocation(): PythonDictStrings { return iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictGeoLocation; }
	public static set_GeoLocation(dictGeoLocation: PythonDictStrings): void { iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictGeoLocation = dictGeoLocation; }
	// ---
	public static get_AuthMechanism(): PythonDictStrings { return iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism; }
	public static set_AuthMechanism(dictAuthMechanism: PythonDictStrings): void { iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism = dictAuthMechanism; }
	// --- End Authentication fields.
};

// --- API inspired in part by Unity.  https://docs.unity3d.com/ScriptReference/Analytics.Analytics.html.
// https://docs.unity.com/ugs/manual/analytics/manual/track-events.
/// <summary>
/// The main API object.
/// </summary>
// --- MJP:  templatize these?
type iXRLibAnalyticsGeneralCallback = (eResult: iXRResult, szExceptionMessage: string) => void;
type iXRLibAnalyticsAIProxyCallback = (ixrAIProxy: iXRAIProxy, eResult: iXRResult, szExceptionMessage: string) => void;
type iXRLibAnalyticsStorageCallback = (ixrStorage: iXRStorage, eResult: iXRResult, szExceptionMessage: string) => void;
// ---
type iXRLibGetAuthSecretCallback = (pUserData: object | null) => string;
type iXRLibDiagnosticCallback = (szDiagnostic: string) => void;
// ---
export class iXRLibAnalytics
{
	public static m_ixrLibAsync:					iXRLibAsync;
	public static m_listErrors:						StringList;
	public static m_dtLastSuccessfulSend:			DateTime;						// State variable... for knowing when to wake up and send stragglers.
	public static m_bCheckForStragglers:			boolean;						// State variable... flip flops on send-main-chunks / send-stragglers.
	// Not C# callback mechanism.  Placeholder for now until we figure out how this is going to work with TypeScript.
	public static m_pfnGetAuthSecretCallback:		iXRLibGetAuthSecretCallback;	// Give the client a hook for (re)authenticating... the call returns new authSecret that then gets used by (re)Authenticate() to auth with current (appId, orgId, deviceId, authSecret).
	public static m_pvGetAuthSecretCallbackData:	object | null;					// User data that gets passed to m_pfnAuthSecretCallback.
	// --- App.Config entries.
	// --- Information for encoding auth into HTTP headers.
    // --- Will be either userId or deviceId and currentId aliases whichever it is.  This is current global... snapshot in each IXREvent as well.
	private static m_szUserId:						string;
	private static m_szDeviceId:					string;
	private static m_dssCurrentData:				PythonDictStrings;  			 // where we will store the current data in memory for quick access.  MJP:  may already have implemented this as IXRAnalytics.allEvents.
	// ---
	public static InitStatics()
	{
		iXRLibAnalytics.m_ixrLibAsync = new iXRLibAsync();
		iXRLibAnalytics.m_listErrors = new StringList();
		iXRLibAnalytics.m_dtLastSuccessfulSend = new DateTime();
		iXRLibAnalytics.m_bCheckForStragglers = false;
		iXRLibAnalytics.m_pfnGetAuthSecretCallback = iXRLibAnalytics.DefaultGetAuthSecretCallback;
		iXRLibAnalytics.m_pvGetAuthSecretCallbackData = null;
		iXRLibAnalytics.m_szUserId = "";
		iXRLibAnalytics.m_szDeviceId = "";
		iXRLibAnalytics.m_dssCurrentData = new PythonDictStrings();
	}
	//private static					m_dsbAllEvents = new Dictionary<mstringb, bool>;
	public static get_UserId(): string { return iXRLibAnalytics.m_szUserId; }
	public static set_UserId(value: string): void { iXRLibAnalytics.m_szUserId = value; }
	// ---
	public static get_DeviceId(): string { return iXRLibAnalytics.m_szDeviceId; }
	public static set_DeviceId(value: string): void { iXRLibAnalytics.m_szDeviceId = value; }	// https://docs.unity3d.com/ScriptReference/SystemInfo-deviceUniqueIdentifier.html
	// ---
	public static get_CurrentId(): string { return iXRLibAnalytics.GetCurrentId(); }			// This may be a copy of userId or some other unique value we come up with.
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
		var szRet: string = iXRLibStorage.m_ixrLibConfiguration.GetRestUrl();

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
    /// <param name="eResult">iXRResult to return indicating status.</param>
    /// <param name="bNoCallbackOnSuccess">Only call callback on failures if this is true (and pfnStatusCallback not null).  False means always call (unless pfnCallback null).</param>
    /// <param name="pfnStatusCallback">Callback to call if this logic ^^^ computes.</param>
    /// <param name="szExceptionMessage">Message describing problem to be passed to the callback.</param>
    /// <returns>eResult</returns>
    private static TaskErrorReturn(eResult: iXRResult, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsGeneralCallback, szExceptionMessage: string): iXRResult
    {
        if (pfnStatusCallback !== null && pfnStatusCallback !== undefined)
        {
            if (!bNoCallbackOnSuccess || eResult !== iXRResult.eOk)
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
	/// <typeparam name="CB">Callback type, generally 1-1 with object type, e.g. (iXREvent, iXRLibAnalyticsEventCallback).</typeparam>
	/// <param name="eResult">iXRResult to return indicating status.</param>
	/// <param name="ixrXXX">The specific object.</param>
	/// <param name="bNoCallbackOnSuccess">Only call callback on failures if this is true (and pfnStatusCallback not null).  False means always call (unless pfnCallback null).</param>
	/// <param name="pfnStatusCallback">Callback to call if this logic ^^^ computes.</param>
	/// <param name="szExceptionMessage">Message describing problem to be passed to the callback.</param>
	/// <returns>eResult</returns>
	private static TaskErrorReturnT<T>(eResult: iXRResult, ixrXXX: T, bNoCallbackOnSuccess: boolean, pfnStatusCallback: ((ixrXXX: T, eResult: iXRResult, szExceptionMessage: string) => void) | null, szExceptionMessage: string): iXRResult
	{
		if (pfnStatusCallback !== null && pfnStatusCallback !== undefined)
		{
			if (!bNoCallbackOnSuccess || eResult !== iXRResult.eOk)
			{
				pfnStatusCallback(ixrXXX, eResult, szExceptionMessage);
			}
		}
		return eResult;
	}
	/// <summary>
	/// The core Add<Event, Log, etc> function template that is called directly by Add<Event, Log, etc>Synchronous() or indirectly by asynchronous Add<Event, Log, etc>().
	/// </summary>
	/// <typeparam name="T">Type of object to be added.</typeparam>
	/// <typeparam name="CB">Callback type, generally 1-1 with object type, e.g. (iXREvent, iXRLibAnalyticsEventCallback).</typeparam>
	/// <typeparam name="iXRLibStorage">Resolves forward reference catch-22.</typeparam>
	/// <param name="ixrT">T (Event, Log, etc) to add.</param>
	/// <(type)param name="tTypeOfT">Type of object to be deleted as an any due to TypeScript's screwiness w.r.t. generics.</typeparam>
	/// <param name="szTableName">Name of corresponding table in the database.</param>
	/// <param name="pfnPostIXRXXX">Pointer to function that sends a list of pointers to T which this function will calculate for sending to backend.</param>
	/// <param name="bOneAtATime">true = POST the objects one object per POST, false = POST them as one single POST with all objects in the body content.</param>
	/// <param name="bNoCallbackOnSuccess">true = Only call pfnStatusCallback on error, false = always call pfnStatusCallback (assuming pfnStatusCallback not null, do not call at all otherwise).</param>
	/// <param name="pfnStatusCallback">null = do not want status callback, else call according to ^^^.</param>
	/// <returns>As the call has not happened yet on return, this is the status of adding the task or failing to add it.</returns>
	/*private*/ public static async AddXXXTask<T extends iXRBase>(ixrT: T, tTypeOfT: any, szTableName: string, pfnPostIXRXXX: (listpT: DbSet<T>, bOneAtATime: boolean, refparam: {szResponse: string}) => Promise<iXRResult>, bOneAtATime: boolean, bNoCallbackOnSuccess: boolean, pfnStatusCallback: ((ixrXXX: T, eResult: iXRResult, szExceptionMessage: string) => void) | null): Promise<iXRResult>
	{
		var	nTrimCount:		number;
		var	dtNow:			DateTime = DateTime.ConvertUnixTime(DateTime.Now()),
			dtOlderThan:	DateTime = DateTime.ConvertUnixTime(dtNow.ToUnixTime() - iXRLibStorage.m_ixrLibConfiguration.m_tsPruneSentItemsOlderThan.ToDateTime().ToUnixTime());
		var	pdsIXRXXX:		DbSet<T> | null | undefined = null;
		var	eDb:			DatabaseResult;
		var	eRet:			iXRResult = iXRResult.eOk;

		try
		{
			var ixrDbContext:	iXRDbContext = new iXRDbContext(false);

			for (const [szField, objField] of Object.entries(iXRDbContext))
			{
				if (objField instanceof DbSet)
				{
					if (objField.ContainedType() === ixrT.constructor)	// MJP:  this is a bit of a hack... why not T?
					{
						pdsIXRXXX = objField;
						break;
					}
				}
			}
			// ---
			// newscope
			// {
			// 	ScopeThreadBlock	cs(m_csDB);

				pdsIXRXXX?.Add(ixrT);
				if (iXRLibStorage.m_ixrLibConfiguration.m_bUseDatabase)
				{
					eDb = ixrDbContext.SaveChanges();
				}
			// }
			// If the un-pushed exceeds the limits (0 = ∞), trim out oldest necessary to get it under the limits.
			if (iXRLibStorage.m_ixrLibConfiguration.m_nMaximumCachedItems > 0)
			{
				// ScopeThreadBlock	cs(m_csDB);

				// if (iXRLibStorage.m_ixrLibConfiguration.m_bUseDatabase)
				// {
				// 	// Could be faster by obtaining the count with a SELECT COUNT... in a hurry to finish this port so doing it this way for now.
				// 	eDb = ExecuteSqlSelect(ixrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud !== 0 ORDER BY timestamp", {}, *pdsIXRXXX);
				// 	nTrimCount = pdsIXRXXX.Count() - iXRLibStorage.m_ixrLibConfiguration.m_nMaximumCachedItems;
				// 	if (nTrimCount > 0)
				// 	{
				// 		pdsIXRXXX.RemoveRange(nTrimCount);
				// 		eDb = ixrDbContext.SaveChanges();
				// 	}
				// }
				// else
				{
					// If not using the db, simply remove everything that sent successfully.
					pdsIXRXXX = pdsIXRXXX?.filter(t => !t.m_bSyncedWithCloud) as DbSet<T>;
				}
			}
			// If pruneSentItemsOlderThan indicates a time (0 = ∞), trim older sent items.
			if (iXRLibStorage.m_ixrLibConfiguration.m_tsPruneSentItemsOlderThan.ToInt64() > TimeSpan.Zero().ToInt64())
			{
				// ScopeThreadBlock	cs(m_csDB);

				// if (iXRLibStorage.m_ixrLibConfiguration.m_bUseDatabase)
				// {
				// 	eDb = ExecuteSqlSelect(ixrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud !== 0 AND timestamp < ?", { {"timestamp", &dtOlderThan} }, *pdsIXRXXX);
				// 	if (pdsIXRXXX.Count() > 0)
				// 	{
				// 		pdsIXRXXX.RemoveRange();
				// 		eDb = ixrDbContext.SaveChanges();
				// 	}
				// }
				// else
				{
					// If not using the db, simply remove everything that sent successfully.
					pdsIXRXXX = pdsIXRXXX?.filter(t => { return !t.m_bSyncedWithCloud; }) as DbSet<T>;
				}
			}
			eRet = await iXRLibAnalytics.SendUnsentXXXs<T>(ixrDbContext, pdsIXRXXX, tTypeOfT, szTableName, pfnPostIXRXXX, bOneAtATime, iXRLibStorage.m_ixrLibConfiguration.m_nEventsPerSendAttempt, false);
			// ---
			if (iXRLibStorage.m_ixrLibConfiguration.m_bUseDatabase)
			{
				// ScopeThreadBlock	cs(m_csDB);

				eDb = ixrDbContext.SaveChanges();
			}
		}
		catch (error)
		{
			//iXRLibClient.WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
			// ---
			return iXRLibAnalytics.TaskErrorReturnT<T>(iXRResult.eSendEventFailed, ixrT, bNoCallbackOnSuccess, pfnStatusCallback, "Caught exception.");
		}
		// ---
		return iXRLibAnalytics.TaskErrorReturnT<T>(eRet, ixrT, bNoCallbackOnSuccess, pfnStatusCallback, "");
	}
	/// <summary>
	/// The core Delete<Event, Log, etc> function template that is called directly by Delete<Event, Log, etc>Synchronous() or indirectly by asynchronous Delete<Event, Log, etc>().
	/// </summary>
	/// <typeparam name="T">Type of object to be deleted.</typeparam>
	/// <typeparam name="CB">Callback type, generally 1-1 with object type, e.g. (iXREvent, iXRLibAnalyticsEventCallback).</typeparam>
	/// <typeparam name="iXRLibStorage">Resolves forward reference catch-22.</typeparam>
	/// <param name="ixrT">T (Event, Log, etc) to delete.</param>
	/// <(type)param name="tTypeOfT">Type of object to be deleted as an any due to TypeScript's screwiness w.r.t. generics.</typeparam>
	/// <param name="szTableName">Name of corresponding table in the database.</param>
	/// <param name="pfnPostIXRXXX">Pointer to function that sends a list of pointers to T which this function will calculate for sending to backend.</param>
	/// <param name="bNoCallbackOnSuccess">true = Only call pfnStatusCallback on error, false = always call pfnStatusCallback (assuming pfnStatusCallback not null, do not call at all otherwise).</param>
	/// <param name="pfnStatusCallback">null = do not want status callback, else call according to ^^^.</param>
	/// <returns>As the call has not happened yet on return, this is the status of adding the task or failing to add it.</returns>
	private static DeleteXXXTask<T extends iXRBase>(ixrT: T, tTypeOfT: any, szTableName: string, pfnDeleteIXRXXX: (ixrT: T, refparam: {szResponse: string}) => iXRResult, bNoCallbackOnSuccess: boolean, pfnStatusCallback: ((ixrXXX: T, eResult: iXRResult, szExceptionMessage: string) => void) | null): iXRResult
	{
		var	nTrimCount:		number;
		var	dtNow:			DateTime = DateTime.ConvertUnixTime(DateTime.Now()),
			dtOlderThan:	DateTime = DateTime.ConvertUnixTime(dtNow.ToUnixTime() - iXRLibStorage.m_ixrLibConfiguration.m_tsPruneSentItemsOlderThan.ToDateTime().ToUnixTime());
		var	pdsIXRXXX:		DbSet<T> | null | undefined = null;
		var	eDb:			DatabaseResult;
		var	eRet:			iXRResult = iXRResult.eOk;

		try
		{
			var ixrDbContext:	iXRDbContext = new iXRDbContext(false);

			for (const [szField, objField] of Object.entries(iXRDbContext))
			{
				if (objField instanceof DbSet)
				{
					if (objField.ContainedType() === tTypeOfT)
					{
						pdsIXRXXX = objField;
						break;
					}
				}
			}
			// ---
			// newscope
			// {
			// 	ScopeThreadBlock	cs(m_csDB);

				pdsIXRXXX?.Add(ixrT);
				eDb = ixrDbContext.SaveChanges();
			// }
			// If the un-pushed exceeds the limits (0 = ∞), trim out oldest necessary to get it under the limits.
			// if (iXRLibStorage.m_ixrLibConfiguration.m_nMaximumCachedItems > 0)
			// {
			// 	// ScopeThreadBlock	cs(m_csDB);

			// 	// Could be faster by obtaining the count with a SELECT COUNT... in a hurry to finish this port so doing it this way for now.
			// 	eDb = ExecuteSqlSelect(ixrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud !== 0 ORDER BY timestamp", {}, pdsIXRXXX);
			// 	nTrimCount = pdsIXRXXX?.Count() - iXRLibStorage.m_ixrLibConfiguration.m_nMaximumCachedItems;
			// 	if (nTrimCount > 0)
			// 	{
			// 		pdsIXRXXX?.RemoveRange(nTrimCount);
			// 		eDb = ixrDbContext.SaveChanges();
			// 	}
			// }
			// If pruneSentItemsOlderThan indicates a time (0 = ∞), trim older sent items.
			// if (iXRLibStorage.m_ixrLibConfiguration.m_tsPruneSentItemsOlderThan > TimeSpan.Zero())
			// {
			// 	// ScopeThreadBlock	cs(m_csDB);

			// 	eDb = ExecuteSqlSelect(ixrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud !== 0 AND timestamp < ?", { {"timestamp", &dtOlderThan} }, pdsIXRXXX);
			// 	if (pdsIXRXXX?.Count() > 0)
			// 	{
			// 		pdsIXRXXX?.RemoveRange();
			// 		eDb = ixrDbContext.SaveChanges();
			// 	}
			// }
			// ---
			// newscope
			// {
			// 	ScopeThreadBlock	cs(m_csDB);

				eDb = ixrDbContext.SaveChanges();
			// }
		}
		catch (error)
		{
			//iXRLibClient.WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
			// ---
			return iXRLibAnalytics.TaskErrorReturnT<T>(iXRResult.eSendEventFailed, ixrT, bNoCallbackOnSuccess, pfnStatusCallback, "Caught exception.");
		}
		// ---
		return iXRLibAnalytics.TaskErrorReturnT<T>(eRet, ixrT, bNoCallbackOnSuccess, pfnStatusCallback, "");
	}
	/// <summary>
	/// Core unsent-event function template... for main chunks and stragglers, handles resends etc.
	/// </summary>
	/// <typeparam name="T">Type of straggler objects to be sent.</typeparam>
	/// <typeparam name="iXRLibStorage">Resolves forward reference catch-22.</typeparam>
	/// <param name="ixrDbContext">Database object that contains all the iXRLib object lists</param>
	/// <param name="dsIXRXXX">DbSet<T extends iXRBase> passed in by caller so we use the same one as we want any changes in its state to bubble up to the caller... contains the objects to send.</param>
	/// <(type)param name="tTypeOfT">Type of object to be deleted as an any due to TypeScript's screwiness w.r.t. generics.</typeparam>
	/// <param name="szTableName">Name of corresponding table in the database.</param>
	/// <param name="pfnPostIXRXXX">Pointer to function that sends a list of pointers to T which this function will calculate for sending to backend.</param>
	/// <param name="bOneAtATime">true = POST the objects one object per POST, false = POST them as one single POST with all objects in the body content.</param>
	/// <param name="nConfiguredXXXPerSendAttempt">The corresponding how many T's per send attempt from iXRLibConfiguration.</param>
	/// <param name="bSendingStragglers">true when being called by TimerCallback to drive Nagle-algorithmish-straggler-send, false when doing a main send</param>
	/// <returns>iXRResult status code</returns>
	protected static async SendUnsentXXXs<T extends iXRBase>(ixrDbContext: iXRDbContext, dsIXRXXX: DbSet<T> | null, tTypeOfT: any, szTableName: string, pfnPostIXRXXX: (listpT: DbSet<T>, bOneAtATime: boolean, refparam: {szResponse: string}) => Promise<iXRResult>, bOneAtATime: boolean, nConfiguredXXXPerSendAttempt: number, bSendingStragglers: boolean): Promise<iXRResult>
	{
		var	eRet:		iXRResult = iXRResult.eOk,
			eTestRet:	iXRResult = iXRResult.eOk;

		// If we have enough new yet-to-be-pushed-to-REST items, then do that and mark as sent.
		if (iXRLibStorage.m_ixrLibConfiguration.RESTConfigured())
		{
			var	dspObjectsToSend:	DbSet<T> | null | undefined = null;
			var	i:					number;
			var	bDoneSending:		boolean = false;
			var	eDb:				DatabaseResult;

			// if (iXRLibStorage.m_ixrLibConfiguration.m_bUseDatabase)
			// {
				// ScopeThreadBlock	cs(m_csDB);

			// 	eDb = ExecuteSqlSelect(ixrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud === 0 ORDER BY timestamp", {}, dsIXRXXX);
			// }
			// While the remaining unpushed > eventsPerSendAttempt...
			while (!bDoneSending && (dsIXRXXX?.Count() ?? 0) > 0 && ((bSendingStragglers || (dsIXRXXX?.Count() ?? 0) >= nConfiguredXXXPerSendAttempt) || (!iXRLibStorage.m_ixrLibConfiguration.m_bUseDatabase)))
			{
				// newscope
				// {
					// ScopeThreadBlock	cs(m_csDB);

					dspObjectsToSend = dsIXRXXX?.Take(nConfiguredXXXPerSendAttempt);
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
						iXRLibAnalytics.m_dtLastSuccessfulSend = DateTime.ConvertUnixTime(DateTime.Now());
						iXRLibAnalytics.m_bCheckForStragglers = !bSendingStragglers;
						bDoneSending = true;
						break;
					}
				// }
				for (i = 0; i < iXRLibStorage.m_ixrLibConfiguration.m_nSendRetriesOnFailure; i++)
				{
					try
					{
						var	szResponse: string = "";

						if ((await pfnPostIXRXXX((dspObjectsToSend ?? new DbSet<T>(tTypeOfT)), bOneAtATime, {szResponse})) === iXRResult.eOk)
						{
							var	eSuccessParse:		JsonResult,
								eFailureParse:		JsonResult;
							var	objResponseSuccess:	PostObjectsResponseSuccess = new PostObjectsResponseSuccess();
							var	objResponseFailure:	PostObjectsResponseFailure = new PostObjectsResponseFailure();

							eSuccessParse = LoadFromJson(objResponseSuccess, szResponse);
							eFailureParse = LoadFromJson(objResponseFailure, szResponse);
							if (eSuccessParse === JsonResult.eBadJsonStructure || eFailureParse === JsonResult.eBadJsonStructure)
							{
								eTestRet = iXRResult.eCorruptJson;
							}
							else if (eSuccessParse === JsonResult.eOk)
							{
								// Do something with the data?  Haven't seen a success yet.  TODO.
								eTestRet = iXRResult.eOk;
							}
							else
							{
								eTestRet = iXRResult.eAuthenticateFailed;
							}
							if (eTestRet === iXRResult.eOk)
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

									// if (iXRLibStorage.m_ixrLibConfiguration.m_bUseDatabase)
									// {
									// 	ixrDbContext.SaveChanges();
									// 	eDb = ExecuteSqlSelect(ixrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud === 0 ORDER BY timestamp", {}, dsIXRXXX);
									// }
									// else
									{
										// If not using the db, simply remove everything that sent successfully.
										dsIXRXXX = dsIXRXXX?.filter(t => !t.m_bSyncedWithCloud) as DbSet<T>;
									}
									iXRLibAnalytics.m_dtLastSuccessfulSend = DateTime.ConvertUnixTime(DateTime.Now());
									iXRLibAnalytics.m_bCheckForStragglers = !bSendingStragglers;
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
							Sleep(iXRLibStorage.m_ixrLibConfiguration.m_tsSendRetryInterval.ToInt64() * 1000);
						}
					}
					catch (error)
					{
						continue;
					}
				}
				//if (!bDoneSending)
				//{
				//	eRet = iXRResult.
				//}
			}
			// Delete sent from local-db if thusly configured.
			// if (iXRLibStorage.m_ixrLibConfiguration.m_bUseDatabase)
			// {
			// 	if (!iXRLibStorage.m_ixrLibConfiguration.m_bRetainLocalAfterSent)
			// 	{
			// 		ScopeThreadBlock	cs(m_csDB);

			// 		eDb = ExecuteSqlSelect(ixrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud !== 0", {}, dsIXRXXX);
			// 		dsIXRXXX.RemoveRange();
			// 		ixrDbContext.SaveChanges();
			// 	}
			// }
			// else
			{
				// If not using the db, simply remove everything that sent successfully.
				dsIXRXXX = dsIXRXXX?.filter(t => { return !t.m_bSyncedWithCloud; }) as DbSet<T>;
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
	/// <typeparam name="iXRLibStorage">Resolves forward reference catch-22.</typeparam>
	/// <param name="ixrT">The object to POST to backend.</param>
	/// <(type)param name="tTypeOfT">Type of object to be deleted as an any due to TypeScript's screwiness w.r.t. generics.</typeparam>
	/// <param name="pfnPostIXRXXX">Function pointer to function that POSTs list of objects (will always be list of one object when coming from here).</param>
	/// <param name="bOneAtATime">true = POST the objects one object per POST, false = POST them as one single POST with all objects in the body content.</param>
	/// <param name="bNoCallbackOnSuccess">When asynchronous and pfnStatusCallback not null, call always when this is false, only on failure when true.</param>
	/// <param name="pfnStatusCallback">null = no-op, not-null = callback in asynchronous case with respect to bNoCallbackOnSuccess.</param>
	/// <returns>iXRResult status code.</returns>
	private static async AddXXXNoDbTask<T extends iXRBase>(ixrT: T, tTypeOfT: any, pfnPostIXRXXX: (listpT: DbSet<T>, bOneAtATime: boolean, refparam: { szResponse: string}) => Promise<iXRResult>, bOneAtATime: boolean, bNoCallbackOnSuccess: boolean, pfnStatusCallback: ((ixrXXX: T, eResult: iXRResult, szExceptionMessage: string) => void) | null): Promise<iXRResult>
	{
		var	eRet:	iXRResult = iXRResult.eOk;

		try
		{
			// If we have enough new yet-to-be-pushed-to-REST items, then do that and mark as sent.
			if (iXRLibStorage.m_ixrLibConfiguration.RESTConfigured())
			{
				var	pObjectsToSend:	DbSet<T> = new DbSet<T>(tTypeOfT);
				var	i:				number;
				var	bDoneSending:	boolean = false;

				// While the remaining unpushed > eventsPerSendAttempt...
				pObjectsToSend.Add(ixrT);
				while (!bDoneSending)
				{
					for (i = 0; i < iXRLibStorage.m_ixrLibConfiguration.m_nSendRetriesOnFailure; i++)
					{
						try
						{
							var	szResponse:	string = "";

							if ((await pfnPostIXRXXX(pObjectsToSend, bOneAtATime, {szResponse})) === iXRResult.eOk)
							{
								var	eSuccessParse:		JsonResult,
									eFailureParse:		JsonResult;
								var	objResponseSuccess:	PostObjectsResponseSuccess = new PostObjectsResponseSuccess();
								var	objResponseFailure: PostObjectsResponseFailure = new PostObjectsResponseFailure();
								var	eTestRet:			iXRResult = iXRResult.eOk;

								eSuccessParse = LoadFromJson(objResponseSuccess, szResponse);
								eFailureParse = LoadFromJson(objResponseFailure, szResponse);
								if (eSuccessParse === JsonResult.eBadJsonStructure || eFailureParse === JsonResult.eBadJsonStructure)
								{
									eTestRet = iXRResult.eCorruptJson;
								}
								else if (eSuccessParse === JsonResult.eOk)
								{
									// Do something with the data?  Haven't seen a success yet.  TODO.
									eTestRet = iXRResult.eOk;
								}
								else
								{
									eTestRet = iXRResult.eAuthenticateFailed;
								}
								return eTestRet;
							}
							else
							{
								Sleep(iXRLibStorage.m_ixrLibConfiguration.m_tsSendRetryInterval.ToInt64() * 1000);
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
			return iXRLibAnalytics.TaskErrorReturnT<T>(iXRResult.eSendEventFailed, ixrT, bNoCallbackOnSuccess, pfnStatusCallback, "Caught exception.");
		}
		// ---
		return iXRLibAnalytics.TaskErrorReturnT<T>(eRet, ixrT, bNoCallbackOnSuccess, pfnStatusCallback, "");
	}
	/// <summary>
	/// Core-core function to force send unsent objects synchronously.  Used to be inlined in ^^^ TimerCallback().
	///		Now we want it to be callable on its own for the user-goes-to-the-bog-then-resumes-playing workflow.
	/// </summary>
	/// <returns>iXRResult enum.</returns>
    public static async ForceSendUnsentSynchronous(): Promise<iXRResult>
	{
		var	eRet:			iXRResult = iXRResult.eOk,
			eTestRet:		iXRResult = iXRResult.eOk;
		var	ixrDbContext:	iXRDbContext = new iXRDbContext(false);

		eTestRet = await iXRLibAnalytics.SendUnsentXXXs<iXREvent>(ixrDbContext, ixrDbContext.m_dsIXREvents, iXREvent, "IXREvents", iXRLibClient.PostIXREvents, false, iXRLibStorage.m_ixrLibConfiguration.m_nEventsPerSendAttempt, true);
		if (eTestRet !== iXRResult.eOk)
		{
			eRet = eTestRet;
		}
		eTestRet = await iXRLibAnalytics.SendUnsentXXXs<iXRLog>(ixrDbContext, ixrDbContext.m_dsIXRLogs, iXRLog, "IXRLogs", iXRLibClient.PostIXRLogs, false, iXRLibStorage.m_ixrLibConfiguration.m_nLogsPerSendAttempt, true);
		if (eTestRet !== iXRResult.eOk)
		{
			eRet = eTestRet;
		}
		eTestRet = await iXRLibAnalytics.SendUnsentXXXs<iXRTelemetry>(ixrDbContext, ixrDbContext.m_dsIXRTelemetry, iXRTelemetry, "IXRTelemetry", iXRLibClient.PostIXRTelemetry, false, iXRLibStorage.m_ixrLibConfiguration.m_nTelemetryEntriesPerSendAttempt, true);
		if (eTestRet !== iXRResult.eOk)
		{
			eRet = eTestRet;
		}
		eTestRet = await iXRLibAnalytics.SendUnsentXXXs<iXRStorage>(ixrDbContext, ixrDbContext.m_dsIXRStorage, iXRStorage, "IXRStorage", iXRLibClient.PostIXRStorage, true, iXRLibStorage.m_ixrLibConfiguration.m_nStorageEntriesPerSendAttempt, true);
		if (eTestRet !== iXRResult.eOk)
		{
			eRet = eTestRet;
		}
		// ---
		return eRet;
	}
	// ---
	// Would be cool to have these be private but the dll Interface.cpp code makes that too much of a pain at this point, maybe revisit later.
	public static SetHeadersFromCurrentStateStringBody(objRequest: CurlHttp, szBodyContent: string, bHasBody: boolean, bIncludeAuthHeaders: boolean): void
	{
		iXRLibAnalytics.SetHeadersFromCurrentState(objRequest, Buffer.from(szBodyContent, "utf-8"), bHasBody, bIncludeAuthHeaders);
	}
	/// <summary>
	/// Prepping request for send.
	/// </summary>
	/// <param name="objRequest">The request being prepared</param>
	/// <param name="pbBodyContent">Body content where applicable (POST, PUT, ...)</param>
	/// <param name="bIncludeAuthHeaders">Include X-iXRLib-xxx headers computed from Authenticate() data... i.e. false when Authenticate()ing</param>
	public static SetHeadersFromCurrentState(objRequest: CurlHttp, pbBodyContent: Buffer, bHasBody: boolean, bIncludeAuthHeaders: boolean): void
	{
		try
		{
			objRequest.AddHttpHeader("Host", iXRLibStorage.m_ixrLibConfiguration.GetRestUrlObject().HostAndPort());
			objRequest.AddHttpHeader("Accept", "application/json");
			objRequest.AddHttpHeader("UserAgent", "Mozilla/5.0 (Windows NT 10.0; Win64; rv:109.0) Gecko/20100101 Firefox/119.0");
			objRequest.AddHttpHeader("Accept-Language", "en-US; q=0.5, en; q=0.5");
			objRequest.AddHttpHeader("Accept-Encoding", "gzip, deflate");
			objRequest.AddHttpHeader("Content-Type", "application/json");	// May need to parse pbBodyContent someday to distinguish Content-Type and Accept header settings.
			// ---
			if (bIncludeAuthHeaders)
			{
				iXRLibInit.m_ixrLibAuthentication.SetHeadersFromCurrentState(objRequest, pbBodyContent, bHasBody);
			}
		}
		catch (error)
		{
			//iXRLibClient.WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
		}
	}
	// --- API (C++ dll and C# dll) versions of AddAIProxy().
	public static async AddAIProxySynchronous0(szPrompt: string, szLMMProvider: string): Promise<iXRResult>
	{
		var	ixrAIProxy:	iXRAIProxy = new iXRAIProxy().Construct0(szPrompt, "", szLMMProvider);

		return await iXRLibAnalytics.AddAIProxySynchronous(ixrAIProxy);
	}
	public static async AddAIProxySynchronous1(szPrompt: string, szPastMessages: string, szLMMProvider: string): Promise<iXRResult>
	{
		var	ixrAIProxy:	iXRAIProxy = new iXRAIProxy().Construct0(szPrompt, szPastMessages, szLMMProvider);

		return await iXRLibAnalytics.AddAIProxySynchronous(ixrAIProxy);
	}
	public static AddAIProxy0(szPrompt: string, szLMMProvider: string): iXRResult
	{
		var	ixrAIProxy:	iXRAIProxy = new iXRAIProxy().Construct0(szPrompt, "", szLMMProvider);

		return iXRLibAnalytics.AddAIProxy(ixrAIProxy, true, null);
	}
	public static AddAIProxy1(szPrompt: string, szPastMessages: string, szLMMProvider: string): iXRResult
	{
		var	ixrAIProxy:	iXRAIProxy = new iXRAIProxy().Construct0(szPrompt, szPastMessages, szLMMProvider);

		return iXRLibAnalytics.AddAIProxy(ixrAIProxy, true, null);
	}
	public static AddAIProxy2(szPrompt: string, dictPastMessages: PythonDictStrings, szLMMProvider: string): iXRResult
	{
		var	ixrAIProxy:	iXRAIProxy = new iXRAIProxy().Construct1(szPrompt, dictPastMessages, szLMMProvider);

		return iXRLibAnalytics.AddAIProxy(ixrAIProxy, true, null);
	}
	// --- End API (C++ dll and C# dll) versions of AddAIProxy().
	public static async AddAIProxySynchronous(ixrAIProxy: iXRAIProxy): Promise<iXRResult>
	{
		return await iXRLibAnalytics.AddXXXNoDbTask<iXRAIProxy>(ixrAIProxy, iXRAIProxy, iXRLibClient.PostIXRAIProxyObjects, false, false, null);
	}
	public static AddAIProxy(ixrAIProxy: iXRAIProxy, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsAIProxyCallback | null): iXRResult
	{
		iXRLibAnalytics.DiagnosticWriteLine("Going to call AddAIProxy().");
		// Notice the = capture... so pfnStatusCallback propagates by copy into the thread.  Notice it is not needed in the typescript port colon paren.
		return iXRLibAnalytics.m_ixrLibAsync.AddTask((pObject: any): iXRResult => { return iXRLibAnalytics.AddXXXNoDbTask<iXRAIProxy>(pObject as iXRAIProxy, iXRAIProxy, iXRLibClient.PostIXRAIProxyObjects, false, bNoCallbackOnSuccess, pfnStatusCallback).then((eRet: iXRResult) => { return eRet; }).catch((eRet: iXRResult) => { return eRet; }); },
			ixrAIProxy,
			(pObject: any): void => { /*delete (iXRAIProxy*)pObject;*/ }
		);
	}
	// ---
	public static async AddAIProxyEntrySynchronous(ixrAIProxy: iXRAIProxy): Promise<iXRResult>
	{
		return await iXRLibAnalytics.AddXXXTask<iXRAIProxy>(ixrAIProxy, iXRAIProxy, "IXRAIProxy", iXRLibClient.PostIXRAIProxy, false, false, null);
	}
	public static AddAIProxyEntry(ixrAIProxy: iXRAIProxy, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsAIProxyCallback): iXRResult
	{
		iXRLibAnalytics.DiagnosticWriteLine("Going to call AddAIProxy().");
		// Notice the = capture... so pfnStatusCallback propagates by copy into the thread.  Notice it is not needed in the typescript port colon paren.
		return iXRLibAnalytics.m_ixrLibAsync.AddTask((pObject: any): iXRResult => { return iXRLibAnalytics.AddXXXTask<iXRAIProxy>(pObject as iXRAIProxy, iXRAIProxy, "IXRAIProxy", iXRLibClient.PostIXRAIProxy, false, bNoCallbackOnSuccess, pfnStatusCallback).then((eRet: iXRResult) => { return eRet; }).catch((eRet: iXRResult) => { return eRet; }); },
			ixrAIProxy,
			(pObject: any): void => { /*delete (iXRAIProxy*)pObject;*/ });
	}
	// --- End Core AddXXX() functions called by the API functions.
	public static DefaultDiagnosticCallback(szLine: string): void
	{
	// #ifdef _DEBUG
	// 	iXRLibAnalyticsTests.WriteLine(szLine);
	// #endif
	}
	public static DiagnosticWriteLine(szLine: string): void
	{
		console.log(szLine);
	}
};

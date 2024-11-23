import { Partner, PartnerToString } from './iXRLibClient';
import { Base64, DATEMAXVALUE } from './network/types';
import { crc32 } from './network/utils/crc32';
import { SHA256 } from './network/utils/cryptoUtils';
import { iXRResult, DateTime } from './network/utils/DotNetishTypes';
import { TimeSpan } from './network/utils/timeSpan';

/// <summary>
/// Object for authenticating with iXR webservice.
/// </summary>
class Authentication
{
    public m_szApiToken: string = "";	    // JWT token obtained by authentication phase.  Goes into "Authentication:  Bearer" header.
    public m_szApiSecret: string = "";	    // Secret obtained by authentication phase.  Gets incorporated into SHA256 hash in X-iXRLib-Hash.
    public m_szSessionId: string = "";	    // Current session-id to be re-used on re-login.
    public m_dtTokenExpiration: DateTime = new DateTime();
    public m_szAppID: string = "";
    public m_szOrgID: string = "";
    public m_ePartner: Partner = Partner.eNone;
    // ---
    public constructor()
    {
        this.m_dtTokenExpiration.setFullYear(DATEMAXVALUE);
    }
    // ---
	private m_szAuthSecret: string = "";	// Not exposed via properties or anything else, only available to iXRLibInit for use in 2-stage authentication (dictAuthMechanism flows).
    // ---
    public m_objAuthTokenRequest = new AuthTokenRequest();	// For setting the environment/session members of AuthTokenRequest as global properties that then get incorporated into the specific auth request on Authenticate().
    // ---
    // Cat these together, then checksum then timestamp and hash it.
    // Headers for Hash, Timestamp, ApiToken, HardwareID.  Alternately or in addition to... JWT token?
    public SetHeadersFromCurrentState(objRequest: CurlHttp, pbBodyContent: Buffer, bHasBody: boolean): void
    {
        try
        {
            const dtNow = new DateTime(DateTime.Now());
            var szHashSource = this.m_szApiToken + this.m_szApiSecret + dtNow.toISOString();
            var szHash: string;
            var nCrc32: number;
    
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
        return (DateTime.Now() + TimeSpan.HMS(0, 1, 0).totalMilliseconds >= this.m_dtTokenExpiration.getMilliseconds());
    }
}

/// <summary>
/// Object for setting up and cleaning up the library, and authenticating.
/// </summary>
class iXRLibInit
{
    //friend struct iXRLibAnalyticsTests;
    // ---
    public static m_ixrLibAuthentication: Authentication = new Authentication();
    // ---
    // --- Initialization and its ancillaries.
    // Upon init/inclusion of the library we need to set the class variables.
    // Once we have the currentId set, we will also call GetAllData() so that its ready in cache right away.
    public static Start(): void
    {
        if (!iXRLibStorage.m_ixrLibConfiguration.ReadConfig())
        {
            iXRLibAnalytics.m_listErrors.push_back("Could not read AppConfig.");
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
    private static AuthenticateGuts(szAppId: string, szOrgId: string, szDeviceId: string, szAuthSecret: string, ePartner: Partner, bNewSession: boolean, bLookForAuthMechanism: boolean): iXRResult
    {
        objAuthTokenRequest: AuthTokenRequest = new AuthTokenRequest();
        eRet: iXRResult = iXRResult.eOk;
        var szResponse : string;

        // Stuff these into this object's property variables for future ReAuthenticate().
        set_AppID(szAppId);
        set_OrgID(szOrgId);
        if (!bNewSession)
        {
            // Using pre-existing session, countermand constructed new one.
            objAuthTokenRequest.m_szSessionId = m_ixrLibAuthentication.m_szSessionId;
        }
        iXRLibAnalytics.set_DeviceId(szDeviceId);
        set_Partner(ePartner);
        // Set the core auth fields.
        objAuthTokenRequest.m_szAppId = szAppId;
        objAuthTokenRequest.m_szOrgId = szOrgId;
        objAuthTokenRequest.m_szAuthSecret = szAuthSecret;
        objAuthTokenRequest.m_szDeviceId = szDeviceId;	// May also need UserId at some point.
        objAuthTokenRequest.m_szPartner = PartnerToString(ePartner);
        // Set the environment/session fields that come along for the ride in the auth payload.
        objAuthTokenRequest.m_szOsVersion = m_ixrLibAuthentication.m_objAuthTokenRequest.m_szOsVersion;
        objAuthTokenRequest.m_szIpAddress = m_ixrLibAuthentication.m_objAuthTokenRequest.m_szIpAddress;
        objAuthTokenRequest.m_szXrdmVersion = m_ixrLibAuthentication.m_objAuthTokenRequest.m_szXrdmVersion;
        objAuthTokenRequest.m_szAppVersion = m_ixrLibAuthentication.m_objAuthTokenRequest.m_szAppVersion;
        objAuthTokenRequest.m_szUnityVersion = m_ixrLibAuthentication.m_objAuthTokenRequest.m_szUnityVersion;
        objAuthTokenRequest.m_szDeviceModel = m_ixrLibAuthentication.m_objAuthTokenRequest.m_szDeviceModel;
        objAuthTokenRequest.m_szUserId = m_ixrLibAuthentication.m_objAuthTokenRequest.m_szUserId;
        objAuthTokenRequest.m_lszTags = m_ixrLibAuthentication.m_objAuthTokenRequest.m_lszTags;
        objAuthTokenRequest.m_dictGeoLocation = m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictGeoLocation;
        objAuthTokenRequest.m_dictAuthMechanism = m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism;
        // ---
        eRet = iXRLibClient.PostAuthenticate(objAuthTokenRequest, szResponse);
        if (eRet == iXRResult.eOk)
        {
            JsonResult					eSuccessParse,
                                        eFailureParse,
                                        eJWTParse;
            AuthTokenResponseSuccess	objAuthTokenResponseSuccess;
            AuthTokenResponseFailure	objAuthTokenResponseFailure;
            AuthTokenDecodedJWT			objAuthTokenDecodedJWT;

            eSuccessParse = LoadFromJson(objAuthTokenResponseSuccess, szResponse);
            eFailureParse = LoadFromJson(objAuthTokenResponseFailure, szResponse);
            if (eSuccessParse == JsonResult::eBadJsonStructure || eFailureParse == JsonResult::eBadJsonStructure)
            {
                eRet = iXRResult.eCorruptJson;
            }
            else if (eSuccessParse == JsonResult::eOk)
            {
                mstringb	szJWT;

                m_ixrLibAuthentication.m_szApiToken = objAuthTokenResponseSuccess.m_szToken;
                m_ixrLibAuthentication.m_szApiSecret = objAuthTokenResponseSuccess.m_szApiSecret;
                // This is purely internal to this object... for two-step authentications using dictAuthMechanism so FinalAuthenticate() can use the same one used here.
                m_ixrLibAuthentication.m_szAuthSecret = szAuthSecret;
                // Set current session only on successful login.
                m_ixrLibAuthentication.m_szSessionId = objAuthTokenRequest.m_szSessionId;
                // --- m_ixrLibAuthentication.m_szApiToken is a JWT token that contains, among other things, an "exp"
                //		field which is the Unix time of token expiration.
                szJWT = JWTDecode(nullptr, m_ixrLibAuthentication.m_szApiToken).c_str();
                eJWTParse = LoadFromJson(objAuthTokenDecodedJWT, szJWT);
                if (eJWTParse == JsonResult::eOk)
                {
                    m_ixrLibAuthentication.m_dtTokenExpiration.FromUnixTime(objAuthTokenDecodedJWT.m_utTokenExpiration);
                }
                else
                {
                    // For now, silently shrug off not getting the token expiration.  At this stage of development,
                    // it is excessively fastidious/brittle to fail due to this.
                }
                // --- While we are here, and now that we are authenticated, try and get the config from the backend.
                eRet = iXRLibStorage::ReadConfigFromBackend(bLookForAuthMechanism);
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
    public static Authenticate(szAppId: string, szOrgId: string, szDeviceId: string, szAuthSecret: string, ePartner: Partner): iXRResult
    {
        return AuthenticateGuts(szAppId, szOrgId, szDeviceId, szAuthSecret, ePartner, true, true);
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
    public static FinalAuthenticate(): iXRResult
    {
        return AuthenticateGuts(iXRLibInit.get_AppID(), iXRLibInit.get_OrgID(), iXRLibAnalytics.get_DeviceId(), m_ixrLibAuthentication.m_szAuthSecret, iXRLibInit.get_Partner(), false, false);
    }
    /// <summary>
    /// Called by POST/PUT/WHATEVER objects to backend when backend returns an auth error.
    ///		Attempt to acquire the latest secret via user-registered callback (if flagged)
    ///		and then auth with it and the other variables used to Authenticate() initially
    ///		(or set via properties) prior to calling this.
    /// </summary>
    /// <param name="bObtainAuthSecret">false = auth with current (appid, orgid, deviceid, authsecret), true = grab the authSecret with user-registered callback before attempting authentication.</param>
    /// <returns>iXRResult enum.</returns>
    public static ReAuthenticate(bObtainAuthSecret: boolean): iXRResult
    {
        var szAuthSecret: string;

        if (bObtainAuthSecret)
        {
            szAuthSecret = iXRLibAnalytics.m_pfnGetAuthSecretCallback(iXRLibAnalytics.m_pvGetAuthSecretCallbackData);
            if (szAuthSecret === '')
            {
                return iXRResult.eCouldNotObtainAuthSecret;
            }
            return AuthenticateGuts(iXRLibInit.get_AppID(), iXRLibInit.get_OrgID(), iXRLibAnalytics.get_DeviceId(), szAuthSecret, iXRLibInit.get_Partner(), false, false);
        }
        // ---
        return AuthenticateGuts(iXRLibInit.get_AppID(), iXRLibInit.get_OrgID(), iXRLibAnalytics.get_DeviceId(), iXRLibInit.get_ApiSecret(), iXRLibInit.get_Partner(), false, false);
    }
    /// <summary>
    /// Wrapper for Core-core function to force send unsent objects synchronously.  Used to be inlined in ^^^ TimerCallback().
    ///		Now we want it to be callable on its own for the user-goes-to-the-bog-then-resumes-playing workflow.
    /// </summary>
    /// <returns>iXRResult enum.</returns>
    public static ForceSendUnsentSynchronous(): iXRResult
    {
        return iXRLibAnalytics.ForceSendUnsentSynchronous();
    }
    // --- End Initialization and its ancillaries.
    // --- Authentication fields.
    public static get_ApiToken(): string { return iXRLibInit.m_ixrLibAuthentication.m_szApiToken; }
    public static set_ApiToken(szApiToken: string): void { iXRLibInit.m_ixrLibAuthentication.m_szApiToken = szApiToken; }
    // ---
    public static get_ApiSecret(): string { return iXRLibInit.m_ixrLibAuthentication.m_szApiSecret; }
    public static set_ApiSecret(szApiSecret: string): void { iXRLibInit.m_ixrLibAuthentication.m_szApiSecret = szApiSecret; }
    // --- ^^^ These 2 are obtained from the Authentication endpoint.  vvv These are iXRAnalytics::m_ixrLibAuthentication fields that these properties can set for future (re)authentication.
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
    public static StringList get_Tags() { return iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_lszTags; }
    public static void set_Tags(const StringList& lszTags) { iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_lszTags = lszTags; }
    // ---
    public static PythonDictStrings get_GeoLocation() { return iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictGeoLocation; }
    public static void set_GeoLocation(const PythonDictStrings& dictGeoLocation) { iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictGeoLocation = dictGeoLocation; }
    // ---
    public static PythonDictStrings get_AuthMechanism() { return iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism; }
    public static void set_AuthMechanism(const PythonDictStrings& dictAuthMechanism) { iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism = dictAuthMechanism; }
    // --- End Authentication fields.
};

// --- API inspired in part by Unity.  https://docs.unity3d.com/ScriptReference/Analytics.Analytics.html.
// https://docs.unity.com/ugs/manual/analytics/manual/track-events.
/// <summary>
/// The main API object.
/// </summary>
struct iXRLibAnalytics
{
    using iXRLibAnalyticsGeneralCallback = std::function<void(iXRResult eResult, const mstringb& szExceptionMessage)>;
    // --- MJP:  templatize these?
    using iXRLibAnalyticsAIProxyCallback = std::function<void(const iXRAIProxy& ixrAIProxy, iXRResult eResult, const mstringb& szExceptionMessage)>;
    using iXRLibAnalyticsStorageCallback = std::function<void(const iXRStorage& ixrStorage, iXRResult eResult, const mstringb& szExceptionMessage)>;
    // ---
    using iXRLibGetAuthSecretCallback = std::function<mstringb(void* pUserData)>;
    using iXRLibDiagnosticCallback = std::function<void(const char* szDiagnostic)>;
    // ---
public:
#if (0)
//		static iXRLibError					_lastError = new iXRLibError();
#endif
    // ---
    public static 			            m_listErrors: ;
    static DateTime						m_dtLastSuccessfulSend;			// State variable... for knowing when to wake up and send stragglers.
    static bool							m_bCheckForStragglers;			// State variable... flip flops on send-main-chunks / send-stragglers.
    // --- C# callback mechanism.
    static iXRLibGetAuthSecretCallback	m_pfnGetAuthSecretCallback;		// Give the client a hook for (re)authenticating... the call returns new authSecret that then gets used by (re)Authenticate() to auth with current (appId, orgId, deviceId, authSecret).
    static void							*m_pvGetAuthSecretCallbackData;	// User data that gets passed to m_pfnAuthSecretCallback.
    static bool							m_bGetAuthSecretCSharp;			// When C#, default m_pfnGetAuthSecretCallback will flip this flag so C# knows to call its callback.
    static SyncEvent					m_hCSharpCallbackEvent;			// Request C# to call its callback then wait on this for it to be finished.
    static mstringb						m_szGetAuthSecretCallbackRet;	// Return value from C# callback.
    static bool							m_bServingCSharp;				// C# flips this to true... if false, DefaultGetAuthSecretCallback() returns empty immediately, otherwise it uses the C# polling mechanism to prompt C# to call its callback and set the result.
    // ---
    static std::deque<mstringb>			m_qszDebugMessages;				// Debug messages to be picked up by C# layer when m_bServingCSharp.
    static std::recursive_mutex			m_csDebugMessages;				// Protect access to m_qszDebugMessages.
    // --- end C# callback mechanism.
    static iXRLibDiagnosticCallback		m_pfnDiagnosticCallback;		// Give the client a hook for getting exception and other diagnostic messages from this library.
    // --- App.Config entries.
public:
    // --- Information for encoding auth into HTTP headers.
private:
    // --- Will be either userId or deviceId and currentId aliases whichever it is.  This is current global... snapshot in each IXREvent as well.
    static mstringb						m_szUserId;
    static mstringb						m_szDeviceId;
    static PythonDictStrings			m_dssCurrentData;				// where we will store the current data in memory for quick access.  MJP:  may already have implemented this as IXRAnalytics.allEvents.
    static Dictionary<mstringb, bool>	m_dsbAllEvents;
public:
    static mstringb get_UserId() { return m_szUserId; }
    static void set_UserId(const mstringb& value) { m_szUserId = value; }
    // ---
    static mstringb get_DeviceId() { return m_szDeviceId; }
    static void set_DeviceId(const mstringb& value) { m_szDeviceId = value; }	// https://docs.unity3d.com/ScriptReference/SystemInfo-deviceUniqueIdentifier.html
    // ---
    static mstringb get_CurrentId() { return GetCurrentId(); }					// This may be a copy of userId or some other unique value we come up with.
    static void set_CurrentId(const mstringb& value) { }
    // ---
public:
    // --- C# callback mechanism.  It is actually more of a "flag C# to call into here simulating a callback" mechanism.
    //		Tacking into the wind, if there were an easy reverse-interop that ported to Linux, would be lovely, but there
    //		isn't so I have to simulate it with a polling mechanism.
    /// <summary>
    /// Called from C# (i.e. never a need to call from within this library).
    ///		This is the flag that tells C# it needs to call its callback and
    ///		then pump the result back into this code via interop.
    /// </summary>
    /// <returns>Flag that indicates some code in here wants the C# callback called.</returns>
    static bool GetAuthSecretCSharp()
    {
        return m_bGetAuthSecretCSharp;
    }
    /// <summary>
    /// C# iXRLibInit.Start() will set m_bServingCSharp to true which will cause this
    ///		code to drive the mechanism whenever this callback is called.  If there
    ///		is no C# client then this function will immediately no-op.
    /// </summary>
    /// <returns>Blank if no-op, return value from C# if C# provides a callback.</returns>
    static mstringb DefaultGetAuthSecretCallback(void* pUserData)
    {
        if (m_bServingCSharp)
        {
            m_hCSharpCallbackEvent.ResetEvent();
            m_szGetAuthSecretCallbackRet = "";
            m_bGetAuthSecretCSharp = true;
            m_hCSharpCallbackEvent.Wait();
            m_bGetAuthSecretCSharp = false;
            // ---
            return m_szGetAuthSecretCallbackRet;
        }
        // ---
        return "";
    }
    /// <summary>
    /// C# callback calls this with its result which unsticks ^^^ so it can return it as though it
    ///		obtained it directly.
    /// </summary>
    /// <returns></returns>
    static void SetGetAuthSecretCallbackRet(const char16_t* szAuthSecret)
    {
        m_szGetAuthSecretCallbackRet = szAuthSecret;
        m_hCSharpCallbackEvent.SetEvent();
    }
    /// <summary>
    /// C# iXRLibInit.Start() will set m_bServingCSharp to true which will cause this
    ///		code to drive the mechanism whenever this callback is called.  It simply
    ///		calls iXRLibAnalyticsTests::WriteLine() which, if there is no C# client,
    ///		will OUTPUTDEBUGSTRING() the string.
    /// </summary>
    /// <returns>void</returns>
    static void DefaultDiagnosticCallback(const char* szLine);
    static bool GetNextDiagnosticString(OUT mstringb& szString)
    {
        ScopeThreadBlock	cs(m_csDebugMessages);

        if (m_qszDebugMessages.empty())
        {
            return false;
        }
        else
        {
            szString = m_qszDebugMessages.front();
            m_qszDebugMessages.pop_front();
        }
        return true;
    }
    /// <summary>
    /// C# iXRLibInit.Start() calls this.  Then this code knows it is a C# client and will engage its callback
    ///		mechnaism whenever DefaultGetAuthSecretCallback() is called via m_pfnGetAuthSecretCallback().
    /// </summary>
    /// <param name="bServingCSharp">Flag, only changed by C# so no thread protection needed.</param>
    static void SetServingCSharp(const bool bServingCSharp)
    {
        m_bServingCSharp = bServingCSharp;
    }
    // --- End C# callback mechanism.
    static mstringb FinalUrl(const char* szEndpoint);
    static void SetDiagnosticCallback(iXRLibDiagnosticCallback pfnDiagnosticCallback)
    {
        m_pfnDiagnosticCallback = pfnDiagnosticCallback;
        DiagnosticWriteLine("Sanity check on SetDiagnosticCallback().");
    }
    static void DiagnosticWriteLine(const char* szLine)
    {
        if (m_pfnDiagnosticCallback != nullptr)
        {
            m_pfnDiagnosticCallback(szLine);
        }
    }
    // Calculate this when we have "valid" userId or deviceId then it gets used thereafter on all relevant filtering.
    static mstringb GetCurrentId()
    {
        return (m_szUserId.length() > 0) ? m_szUserId : m_szDeviceId;
    }
private:
    /// <summary>
    /// General TaskErrorReturn() that implements the callback logic on asynchronous calls.
    /// </summary>
    /// <param name="eResult">iXRResult to return indicating status.</param>
    /// <param name="bNoCallbackOnSuccess">Only call callback on failures if this is true (and pfnStatusCallback not null).  False means always call (unless pfnCallback null).</param>
    /// <param name="pfnStatusCallback">Callback to call if this logic ^^^ computes.</param>
    /// <param name="szExceptionMessage">Message describing problem to be passed to the callback.</param>
    /// <returns>eResult</returns>
    static iXRResult TaskErrorReturn(iXRResult eResult, bool bNoCallbackOnSuccess, const iXRLibAnalyticsGeneralCallback& pfnStatusCallback, const mstringb& szExceptionMessage)
    {
        if (pfnStatusCallback != nullptr)
        {
            if (!bNoCallbackOnSuccess || eResult != iXRResult::eOk)
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
    template <typename T, typename CB> static iXRResult TaskErrorReturn(iXRResult eResult, T& ixrXXX, bool bNoCallbackOnSuccess, const CB& pfnStatusCallback, const mstringb& szExceptionMessage)
    {
        if (pfnStatusCallback != nullptr)
        {
            if (!bNoCallbackOnSuccess || eResult != iXRResult::eOk)
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
    /// <param name="szTableName">Name of corresponding table in the database.</param>
    /// <param name="pfnPostIXRXXX">Pointer to function that sends a list of pointers to T which this function will calculate for sending to backend.</param>
    /// <param name="bOneAtATime">true = POST the objects one object per POST, false = POST them as one single POST with all objects in the body content.</param>
    /// <param name="bNoCallbackOnSuccess">true = Only call pfnStatusCallback on error, false = always call pfnStatusCallback (assuming pfnStatusCallback not null, do not call at all otherwise).</param>
    /// <param name="pfnStatusCallback">null = do not want status callback, else call according to ^^^.</param>
    /// <returns>As the call has not happened yet on return, this is the status of adding the task or failing to add it.</returns>
    template <typename T, typename CB, typename iXRLibStorage> static iXRResult AddXXXTask(T& ixrT, const char* szTableName, iXRResult (*pfnPostIXRXXX)(const DbSet<T*>& listpT, bool bOneAtATime, OUT mstringb& szResponse), bool bOneAtATime, bool bNoCallbackOnSuccess, const CB& pfnStatusCallback)
    {
        int				nTrimCount;
        DateTime		dtNow = DateTime::Now(),
                        dtOlderThan = dtNow - iXRLibStorage::m_ixrLibConfiguration.m_tsPruneSentItemsOlderThan;
        DbSet<T>		*pdsIXRXXX = nullptr;
        DatabaseResult	eDb;
        iXRResult		eRet = iXRResult::eOk;

        try
        {
            iXRDbContext	ixrDbContext;

            constexpr size_t nbChildObjectListProperties = std::tuple_size_v<decltype(iXRDbContext::childobjectlistproperties)>;
            // ---
            // Find the ixrDbContext child list matching type T.
            for_sequence(std::make_index_sequence<nbChildObjectListProperties>{}, [&](auto i)
            {
                // Get the property.
                constexpr auto	objChildListProperty = std::get<i>(iXRDbContext::childobjectlistproperties);
                // Get the type of the property.
                using Type = typename decltype(objChildListProperty)::Type;
                if (std::is_same_v<T, Type>)
                {
                    pdsIXRXXX = reinterpret_cast<DbSet<T>*>(&(ixrDbContext.*(objChildListProperty.member)));
                }
            });
            // ---
            newscope
            {
                ScopeThreadBlock	cs(m_csDB);

                pdsIXRXXX->Add(ixrT);
                if (iXRLibStorage::m_ixrLibConfiguration.m_bUseDatabase)
                {
                    eDb = ixrDbContext.SaveChanges();
                }
            }
            // If the un-pushed exceeds the limits (0 = ∞), trim out oldest necessary to get it under the limits.
            if (iXRLibStorage::m_ixrLibConfiguration.m_nMaximumCachedItems > 0)
            {
                ScopeThreadBlock	cs(m_csDB);

                if (iXRLibStorage::m_ixrLibConfiguration.m_bUseDatabase)
                {
                    // Could be faster by obtaining the count with a SELECT COUNT... in a hurry to finish this port so doing it this way for now.
                    eDb = ExecuteSqlSelect(ixrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud != 0 ORDER BY timestamp", {}, *pdsIXRXXX);
                    nTrimCount = (int)pdsIXRXXX->Count() - (int)iXRLibStorage::m_ixrLibConfiguration.m_nMaximumCachedItems;
                    if (nTrimCount > 0)
                    {
                        pdsIXRXXX->RemoveRange(nTrimCount);
                        eDb = ixrDbContext.SaveChanges();
                    }
                }
                else
                {
                    // If not using the db, simply remove everything that sent successfully.
                    pdsIXRXXX->remove_if([](T& t) { return t.m_bSyncedWithCloud; });
                }
            }
            // If pruneSentItemsOlderThan indicates a time (0 = ∞), trim older sent items.
            if (iXRLibStorage::m_ixrLibConfiguration.m_tsPruneSentItemsOlderThan > TimeSpan::Zero())
            {
                ScopeThreadBlock	cs(m_csDB);

                if (iXRLibStorage::m_ixrLibConfiguration.m_bUseDatabase)
                {
                    eDb = ExecuteSqlSelect(ixrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud != 0 AND timestamp < ?", { {"timestamp", &dtOlderThan} }, *pdsIXRXXX);
                    if (pdsIXRXXX->Count() > 0)
                    {
                        pdsIXRXXX->RemoveRange();
                        eDb = ixrDbContext.SaveChanges();
                    }
                }
                else
                {
                    // If not using the db, simply remove everything that sent successfully.
                    pdsIXRXXX->remove_if([](T& t) { return t.m_bSyncedWithCloud; });
                }
            }
            eRet = SendUnsentXXXs<T, iXRLibStorage>(ixrDbContext, *pdsIXRXXX, szTableName, pfnPostIXRXXX, bOneAtATime, iXRLibStorage::m_ixrLibConfiguration.m_nEventsPerSendAttempt, false);
            // ---
            if (iXRLibStorage::m_ixrLibConfiguration.m_bUseDatabase)
            {
                ScopeThreadBlock	cs(m_csDB);

                eDb = ixrDbContext.SaveChanges();
            }
        }
        catch (...)
        {
            //iXRLibClient.WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
            // ---
            return TaskErrorReturn<T, CB>(iXRResult::eSendEventFailed, ixrT, bNoCallbackOnSuccess, pfnStatusCallback, "Caught exception.");
        }
        // ---
        return TaskErrorReturn<T, CB>(eRet, ixrT, bNoCallbackOnSuccess, pfnStatusCallback, "");
    }
    /// <summary>
    /// The core Delete<Event, Log, etc> function template that is called directly by Delete<Event, Log, etc>Synchronous() or indirectly by asynchronous Delete<Event, Log, etc>().
    /// </summary>
    /// <typeparam name="T">Type of object to be deleted.</typeparam>
    /// <typeparam name="CB">Callback type, generally 1-1 with object type, e.g. (iXREvent, iXRLibAnalyticsEventCallback).</typeparam>
    /// <typeparam name="iXRLibStorage">Resolves forward reference catch-22.</typeparam>
    /// <param name="ixrT">T (Event, Log, etc) to delete.</param>
    /// <param name="szTableName">Name of corresponding table in the database.</param>
    /// <param name="pfnPostIXRXXX">Pointer to function that sends a list of pointers to T which this function will calculate for sending to backend.</param>
    /// <param name="bNoCallbackOnSuccess">true = Only call pfnStatusCallback on error, false = always call pfnStatusCallback (assuming pfnStatusCallback not null, do not call at all otherwise).</param>
    /// <param name="pfnStatusCallback">null = do not want status callback, else call according to ^^^.</param>
    /// <returns>As the call has not happened yet on return, this is the status of adding the task or failing to add it.</returns>
    template <typename T, typename CB, typename iXRLibStorage> static iXRResult DeleteXXXTask(T& ixrT, const char* szTableName, iXRResult (*pfnDeleteIXRXXX)(const T& ixrT, OUT mstringb& szResponse), bool bNoCallbackOnSuccess, const CB& pfnStatusCallback)
    {
        int				nTrimCount;
        DateTime		dtNow = DateTime::Now(),
                        dtOlderThan = dtNow - iXRLibStorage::m_ixrLibConfiguration.m_tsPruneSentItemsOlderThan;
        DbSet<T>		*pdsIXRXXX;
        DatabaseResult	eDb;
        iXRResult		eRet = iXRResult::eOk;

        try
        {
            iXRDbContext	ixrDbContext;

            constexpr size_t nbChildObjectListProperties = std::tuple_size_v<decltype(iXRDbContext::childobjectlistproperties)>;
            // ---
            // Find the ixrDbContext child list matching type T.
            for_sequence(std::make_index_sequence<nbChildObjectListProperties>{}, [&](auto i)
            {
                // Get the property.
                constexpr auto	objChildListProperty = std::get<i>(iXRDbContext::childobjectlistproperties);
                // Get the type of the property.
                using Type = typename decltype(objChildListProperty)::Type;
                if (std::is_same_v<T, Type>)
                {
                    pdsIXRXXX = reinterpret_cast<DbSet<T>*>(&(ixrDbContext.*(objChildListProperty.member)));
                }
            });
            // ---
            newscope
            {
                ScopeThreadBlock	cs(m_csDB);

                pdsIXRXXX->Add(ixrT);
                eDb = ixrDbContext.SaveChanges();
            }
            // If the un-pushed exceeds the limits (0 = ∞), trim out oldest necessary to get it under the limits.
            if (iXRLibStorage::m_ixrLibConfiguration.m_nMaximumCachedItems > 0)
            {
                ScopeThreadBlock	cs(m_csDB);

                // Could be faster by obtaining the count with a SELECT COUNT... in a hurry to finish this port so doing it this way for now.
                eDb = ExecuteSqlSelect(ixrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud != 0 ORDER BY timestamp", {}, *pdsIXRXXX);
                nTrimCount = (int)pdsIXRXXX->Count() - (int)iXRLibStorage::m_ixrLibConfiguration.m_nMaximumCachedItems;
                if (nTrimCount > 0)
                {
                    pdsIXRXXX->RemoveRange(nTrimCount);
                    eDb = ixrDbContext.SaveChanges();
                }
            }
            // If pruneSentItemsOlderThan indicates a time (0 = ∞), trim older sent items.
            if (iXRLibStorage::m_ixrLibConfiguration.m_tsPruneSentItemsOlderThan > TimeSpan::Zero())
            {
                ScopeThreadBlock	cs(m_csDB);

                eDb = ExecuteSqlSelect(ixrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud != 0 AND timestamp < ?", { {"timestamp", &dtOlderThan} }, *pdsIXRXXX);
                if (pdsIXRXXX->Count() > 0)
                {
                    pdsIXRXXX->RemoveRange();
                    eDb = ixrDbContext.SaveChanges();
                }
            }
            // ---
            newscope
            {
                ScopeThreadBlock	cs(m_csDB);

                eDb = ixrDbContext.SaveChanges();
            }
        }
        catch (...)
        {
            //iXRLibClient.WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
            // ---
            return TaskErrorReturn<T, CB>(iXRResult::eSendEventFailed, ixrT, bNoCallbackOnSuccess, pfnStatusCallback, "Caught exception.");
        }
        // ---
        return TaskErrorReturn<T, CB>(eRet, ixrT, bNoCallbackOnSuccess, pfnStatusCallback, "");
    }
    /// <summary>
    /// Core unsent-event function template... for main chunks and stragglers, handles resends etc.
    /// </summary>
    /// <typeparam name="T">Type of straggler objects to be sent.</typeparam>
    /// <typeparam name="iXRLibStorage">Resolves forward reference catch-22.</typeparam>
    /// <param name="ixrDbContext">Database object that contains all the iXRLib object lists</param>
    /// <param name="dsIXRXXX">DbSet<T> passed in by caller so we use the same one as we want any changes in its state to bubble up to the caller... contains the objects to send.</param>
    /// <param name="szTableName">Name of corresponding table in the database.</param>
    /// <param name="pfnPostIXRXXX">Pointer to function that sends a list of pointers to T which this function will calculate for sending to backend.</param>
    /// <param name="bOneAtATime">true = POST the objects one object per POST, false = POST them as one single POST with all objects in the body content.</param>
    /// <param name="nConfiguredXXXPerSendAttempt">The corresponding how many T's per send attempt from iXRLibConfiguration.</param>
    /// <param name="bSendingStragglers">true when being called by TimerCallback to drive Nagle-algorithmish-straggler-send, false when doing a main send</param>
    /// <returns>iXRResult status code</returns>
    template <typename T, typename iXRLibStorage> static iXRResult SendUnsentXXXs(iXRDbContext& ixrDbContext, DbSet<T>& dsIXRXXX, const char* szTableName, iXRResult (*pfnPostIXRXXX)(const DbSet<T*>& listpT, bool bOneAtATime, OUT mstringb& szResponse), bool bOneAtATime, size_t nConfiguredXXXPerSendAttempt, bool bSendingStragglers)
    {
        iXRResult	eRet = iXRResult::eOk,
                    eTestRet = iXRResult::eOk;

        // If we have enough new yet-to-be-pushed-to-REST items, then do that and mark as sent.
        if (iXRLibStorage::m_ixrLibConfiguration.RESTConfigured())
        {
            DbSet<T*>		dspObjectsToSend;
            int				i;
            bool			bDoneSending = false;
            DatabaseResult	eDb;

            if (iXRLibStorage::m_ixrLibConfiguration.m_bUseDatabase)
            {
                ScopeThreadBlock	cs(m_csDB);

                eDb = ExecuteSqlSelect(ixrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud == 0 ORDER BY timestamp", {}, dsIXRXXX);
            }
            // While the remaining unpushed > eventsPerSendAttempt...
            while (!bDoneSending && dsIXRXXX.Count() > 0 && ((bSendingStragglers || dsIXRXXX.Count() >= nConfiguredXXXPerSendAttempt) || (!iXRLibStorage::m_ixrLibConfiguration.m_bUseDatabase)))
            {
                newscope
                {
                    ScopeThreadBlock	cs(m_csDB);

                    dspObjectsToSend = dsIXRXXX.Take(nConfiguredXXXPerSendAttempt);
                    // ---
                    if (dspObjectsToSend.size() == 0)
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
                        m_dtLastSuccessfulSend = DateTime::Now();
                        m_bCheckForStragglers = !bSendingStragglers;
                        bDoneSending = true;
                        break;
                    }
                }
                for (i = 0; i < (int)iXRLibStorage::m_ixrLibConfiguration.m_nSendRetriesOnFailure; i++)
                {
                    try
                    {
                        mstringb	szResponse;

                        if (pfnPostIXRXXX(dspObjectsToSend, bOneAtATime, szResponse) == iXRResult::eOk)
                        {
                            JsonResult					eSuccessParse,
                                                        eFailureParse;
                            PostObjectsResponseSuccess	objResponseSuccess;
                            PostObjectsResponseFailure	objResponseFailure;

                            eSuccessParse = LoadFromJson(objResponseSuccess, szResponse);
                            eFailureParse = LoadFromJson(objResponseFailure, szResponse);
                            if (eSuccessParse == JsonResult::eBadJsonStructure || eFailureParse == JsonResult::eBadJsonStructure)
                            {
                                eTestRet = iXRResult::eCorruptJson;
                            }
                            else if (eSuccessParse == JsonResult::eOk)
                            {
                                // Do something with the data?  Haven't seen a success yet.  TODO.
                                eTestRet = iXRResult::eOk;
                            }
                            else
                            {
                                eTestRet = iXRResult::eAuthenticateFailed;
                            }
                            if (eTestRet == iXRResult::eOk)
                            {
                                // Succeeded... mark them as sent.
                                for (T* pt : dspObjectsToSend)
                                {
                                    pt->m_bSyncedWithCloud = true;
                                }
                                newscope
                                {
                                    ScopeThreadBlock	cs(m_csDB);

                                    if (iXRLibStorage::m_ixrLibConfiguration.m_bUseDatabase)
                                    {
                                        ixrDbContext.SaveChanges();
                                        eDb = ExecuteSqlSelect(ixrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud == 0 ORDER BY timestamp", {}, dsIXRXXX);
                                    }
                                    else
                                    {
                                        // If not using the db, simply remove everything that sent successfully.
                                        dsIXRXXX.remove_if([](T& t) { return t.m_bSyncedWithCloud; });
                                    }
                                    m_dtLastSuccessfulSend = DateTime::Now();
                                    m_bCheckForStragglers = !bSendingStragglers;
                                    bDoneSending = true;
                                }
                                break;
                            }
                            else
                            {
                                return eTestRet;
                            }
                        }
                        else
                        {
                            std::this_thread::sleep_for(std::chrono::duration_cast<dmilliseconds>(iXRLibStorage::m_ixrLibConfiguration.m_tsSendRetryInterval));
                        }
                    }
                    catch (...)
                    {
                        continue;
                    }
                }
                //if (!bDoneSending)
                //{
                //	eRet = iXRResult::
                //}
            }
            // Delete sent from local-db if thusly configured.
            if (iXRLibStorage::m_ixrLibConfiguration.m_bUseDatabase)
            {
                if (!iXRLibStorage::m_ixrLibConfiguration.m_bRetainLocalAfterSent)
                {
                    ScopeThreadBlock	cs(m_csDB);

                    eDb = ExecuteSqlSelect(ixrDbContext.m_db, szTableName, "SELECT %s FROM %s WHERE SyncedWithCloud != 0", {}, dsIXRXXX);
                    dsIXRXXX.RemoveRange();
                    ixrDbContext.SaveChanges();
                }
            }
            else
            {
                // If not using the db, simply remove everything that sent successfully.
                dsIXRXXX.remove_if([](T& t) { return t.m_bSyncedWithCloud; });
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
    /// <param name="pfnPostIXRXXX">Function pointer to function that POSTs list of objects (will always be list of one object when coming from here).</param>
    /// <param name="bOneAtATime">true = POST the objects one object per POST, false = POST them as one single POST with all objects in the body content.</param>
    /// <param name="bNoCallbackOnSuccess">When asynchronous and pfnStatusCallback not null, call always when this is false, only on failure when true.</param>
    /// <param name="pfnStatusCallback">null = no-op, not-null = callback in asynchronous case with respect to bNoCallbackOnSuccess.</param>
    /// <returns>iXRResult status code.</returns>
    template <typename T, typename CB, typename iXRLibStorage> static iXRResult AddXXXNoDbTask(T& ixrT, iXRResult (*pfnPostIXRXXX)(const DbSet<T*>& listpT, bool bOneAtATime, OUT mstringb& szResponse), bool bOneAtATime, bool bNoCallbackOnSuccess, const CB& pfnStatusCallback)
    {
        iXRResult	eRet = iXRResult::eOk;

        try
        {
            // If we have enough new yet-to-be-pushed-to-REST items, then do that and mark as sent.
            if (iXRLibStorage::m_ixrLibConfiguration.RESTConfigured())
            {
                DbSet<T*>	pObjectsToSend;
                int			i;
                bool		bDoneSending = false;

                // While the remaining unpushed > eventsPerSendAttempt...
                pObjectsToSend.Add(&ixrT);
                while (!bDoneSending)
                {
                    for (i = 0; i < (int)iXRLibStorage::m_ixrLibConfiguration.m_nSendRetriesOnFailure; i++)
                    {
                        try
                        {
                            mstringb	szResponse;

                            if (pfnPostIXRXXX(pObjectsToSend, bOneAtATime, szResponse) == iXRResult::eOk)
                            {
                                JsonResult					eSuccessParse,
                                                            eFailureParse;
                                PostObjectsResponseSuccess	objResponseSuccess;
                                PostObjectsResponseFailure	objResponseFailure;
                                iXRResult					eTestRet = iXRResult::eOk;

                                eSuccessParse = LoadFromJson(objResponseSuccess, szResponse);
                                eFailureParse = LoadFromJson(objResponseFailure, szResponse);
                                if (eSuccessParse == JsonResult::eBadJsonStructure || eFailureParse == JsonResult::eBadJsonStructure)
                                {
                                    eTestRet = iXRResult::eCorruptJson;
                                }
                                else if (eSuccessParse == JsonResult::eOk)
                                {
                                    // Do something with the data?  Haven't seen a success yet.  TODO.
                                    eTestRet = iXRResult::eOk;
                                }
                                else
                                {
                                    eTestRet = iXRResult::eAuthenticateFailed;
                                }
                                return eTestRet;
                            }
                            else
                            {
                                std::this_thread::sleep_for(std::chrono::duration_cast<dmilliseconds>(iXRLibStorage::m_ixrLibConfiguration.m_tsSendRetryInterval));
                            }
                        }
                        catch (...)
                        {
                            continue;
                        }
                    }
                }
            }
        }
        catch (...)
        {
            return TaskErrorReturn<T, CB>(iXRResult::eSendEventFailed, ixrT, bNoCallbackOnSuccess, pfnStatusCallback, "Caught exception.");
        }
        // ---
        return TaskErrorReturn<T, CB>(eRet, ixrT, bNoCallbackOnSuccess, pfnStatusCallback, "");
    }
    static iXRResult ForceSendUnsentSynchronous();
public:
    // Would be cool to have these be private but the dll Interface.cpp code makes that too much of a pain at this point, maybe revisit later.
    static void SetHeadersFromCurrentState(CurlHttp& objRequest, const mstringb& szBodyContent, const bool bHasBody, bool bIncludeAuthHeaders)
    {
        SetHeadersFromCurrentState(objRequest, mbinary(szBodyContent), bHasBody, bIncludeAuthHeaders);
    }
    static void SetHeadersFromCurrentState(CurlHttp& objRequest, const mbinary& pbBodyContent, const bool bHasBody, const bool bIncludeAuthHeaders);
    // --- API (C++ dll and C# dll) versions of AddAIProxy().
    static iXRResult AddAIProxySynchronous(const mstringb& szPrompt, const mstringb& szLMMProvider)
    {
        iXRAIProxy	ixrAIProxy(szPrompt, "", szLMMProvider);

        return AddAIProxySynchronous(ixrAIProxy);
    }
    static iXRResult AddAIProxySynchronous(const mstringb& szPrompt, const mstringb& szPastMessages, const mstringb& szLMMProvider)
    {
        iXRAIProxy	ixrAIProxy(szPrompt, szPastMessages, szLMMProvider);

        return AddAIProxySynchronous(ixrAIProxy);
    }
    static iXRResult AddAIProxy(const mstringb& szPrompt, const mstringb& szLMMProvider)
    {
        iXRAIProxy	ixrAIProxy(szPrompt, "", szLMMProvider);

        return AddAIProxy(ixrAIProxy, true, nullptr);
    }
    static iXRResult AddAIProxy(const mstringb& szPrompt, const mstringb& szPastMessages, const mstringb& szLMMProvider)
    {
        iXRAIProxy	ixrAIProxy(szPrompt, szPastMessages, szLMMProvider);

        return AddAIProxy(ixrAIProxy, true, nullptr);
    }
    static iXRResult AddAIProxy(const mstringb& szPrompt, const PythonDictStrings& dictPastMessages, const mstringb& szLMMProvider)
    {
        iXRAIProxy	ixrAIProxy(szPrompt, dictPastMessages, szLMMProvider);

        return AddAIProxy(ixrAIProxy, true, nullptr);
    }
    // --- End API (C++ dll and C# dll) versions of AddAIProxy().
    static iXRResult AddAIProxySynchronous(iXRAIProxy& ixrAIProxy);
    static iXRResult AddAIProxy(iXRAIProxy& ixrAIProxy, bool bNoCallbackOnSuccess, const iXRLibAnalyticsAIProxyCallback& pfnStatusCallback);
    // ---
    static iXRResult AddAIProxyEntrySynchronous(iXRAIProxy& ixrAIProxy);
    static iXRResult AddAIProxyEntry(iXRAIProxy& ixrAIProxy, bool bNoCallbackOnSuccess, const iXRLibAnalyticsAIProxyCallback& pfnStatusCallback);
    // --- End Core AddXXX() functions called by the API functions.
};

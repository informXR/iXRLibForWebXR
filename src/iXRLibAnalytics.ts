import { Partner, PartnerToString } from './iXRLibClient';
import { Base64, DATEMAXVALUE } from './network/types';
import { crc32 } from './network/utils/crc32';
import { SHA256 } from './network/utils/cryptoUtils';
import { iXRResult } from './network/utils/DotNetishTypes';
import { TimeSpan } from './network/utils/timeSpan';

/// <summary>
/// Object for authenticating with iXR webservice.
/// </summary>
class Authentication
{
    public m_szApiToken: string = "";	    // JWT token obtained by authentication phase.  Goes into "Authentication:  Bearer" header.
    public m_szApiSecret: string = "";	    // Secret obtained by authentication phase.  Gets incorporated into SHA256 hash in X-iXRLib-Hash.
    public m_szSessionId: string = "";	    // Current session-id to be re-used on re-login.
    public m_dtTokenExpiration: Date = new Date();
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
            const dtNow = new Date(Date.now());
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
        return (Date.now() + TimeSpan.HMS(0, 1, 0).totalMilliseconds >= this.m_dtTokenExpiration.getMilliseconds());
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
    public static get_TokenExpiration(): Date { return iXRLibInit.m_ixrLibAuthentication.m_dtTokenExpiration; }
    public static set_TokenExpiration(dtTokenExpiration: Date): void { iXRLibInit.m_ixrLibAuthentication.m_dtTokenExpiration = dtTokenExpiration; }
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

/// <summary>
/// All the partners of which we are aware (for authentication purposes).
///		Comaintain with AbxrAnalytics.cs.

import { AbxrLibAnalytics, AbxrLibInit } from "./AbxrLibAnalytics";
import { AbxrAIProxy, AbxrBase, AbxrEvent, AbxrLibConfiguration, AbxrLog, AbxrStorage, AbxrTelemetry, AbxrXXXContainer, RESTEndpointFromType } from "./AbxrLibCoreModel";
import { CurlHttp, EnsureSingleEndingCharacter, JsonScalarArrayElement, SUID, time_t } from "./network/types";
import { DataObjectBase, DbSet, DumpCategory, FieldProperties, FieldPropertiesRecordContainer, FieldPropertyFlags, GenerateJson, GenerateJsonAlternate, GenerateJsonList, LoadFromJson } from "./network/utils/DataObjectBase";
import { AbxrResult, JsonResult, AbxrDictStrings, StringList } from "./network/utils/DotNetishTypes";

/// </summary>
export enum Partner
{
	eNone,
	eArborXR
};
export function PartnerToString(ePartner: Partner): string
{
	switch (ePartner)
	{
	case Partner.eArborXR:
		return "arborxr";
	default:
		break;
	}
	return "";
}
export function StringToPartner(szString: string): Partner
{
	switch (szString)
	{
	case "arborxr":
		return Partner.eArborXR;
	default:
		break;
	}
	return Partner.eNone;
}

/// <summary>
/// Object that gets POSTed to /auth/token to obtain a JWT.
///		Not in database so does not inherit from DataObjectBase.
/// </summary>
export class AuthTokenRequest extends DataObjectBase
{
	// --- Fixed auth fields taken as parameters to Authenticate().
	m_szAppId:				string = "";
	m_szOrgId:				string = "";
	m_szAuthSecret:			string = "";
	m_szDeviceId:			string = "";
	m_szSessionId:			string = "";
	m_szPartner:			string = "";	// Blank if it is just us (Abxr).  Otherwise, "arborxr", ... if not blank this is how backend knows to do further authentication with partner.
	// --- Extra environment-variable kind of data set by properties.
	m_szOsVersion:			string = "";
	m_szIpAddress:			string = "";
	m_szXrdmVersion:		string = "";
	m_szAppVersion:			string = "";
	m_szUnityVersion:		string = "";
	m_szDeviceModel:		string = "";
	m_szUserId:				string = "";
	m_lszTags:				StringList;
	m_dictGeoLocation:		AbxrDictStrings;
	m_dictAuthMechanism:	AbxrDictStrings;
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_szAppId: new FieldProperties("app_id")},
	 	{m_szOrgId: new FieldProperties("org_id")},
	 	{m_szAuthSecret: new FieldProperties("auth_secret")},
	 	{m_szDeviceId: new FieldProperties("device_id")},
	 	{m_szSessionId: new FieldProperties("session_id")},
	 	{m_szPartner: new FieldProperties("partner")},
	 	// ---
	 	{m_szOsVersion: new FieldProperties("os_version", FieldPropertyFlags.bfStringOnly)},
	 	{m_szIpAddress: new FieldProperties("ip_address")},
	 	{m_szXrdmVersion: new FieldProperties("xrdm_version", FieldPropertyFlags.bfStringOnly)},
	 	{m_szAppVersion: new FieldProperties("app_version", FieldPropertyFlags.bfStringOnly)},
	 	{m_szUnityVersion: new FieldProperties("unity_version", FieldPropertyFlags.bfStringOnly)},
	 	{m_szDeviceModel: new FieldProperties("device_model")},
	 	{m_szUserId: new FieldProperties("user_id")},
	 	{m_lszTags: new FieldProperties("tags")},
	 	{m_dictGeoLocation: new FieldProperties("geolocation")},
	 	{m_dictAuthMechanism: new FieldProperties("auth_mechanism")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return AuthTokenRequest.m_mapProperties;
	}
	// ---
	constructor()
	{
		super();
		// ---
		this.m_lszTags = new StringList();
		this.m_dictGeoLocation = new AbxrDictStrings();
		this.m_dictAuthMechanism = new AbxrDictStrings();
		// ---
		this.RefreshSessionId();
	}
	public RefreshSessionId(): void
	{
		var	suid:	SUID = new SUID();

		this.m_szSessionId = suid.ToStringPureHex();
	}
	// ---
// #ifdef _DEBUG
// 	void FakeUpSomeRandomCrap();
// #endif
};

/// <summary>
/// When AuthTokenResponseSuccess parses successfully (successful auth), use this to parse the decoded JWT "token" field.
/// </summary>
export class AuthTokenDecodedJWT extends DataObjectBase
{
	public m_utTokenExpiration:	time_t = 0;	// Token expiration in Unix time (time_t).
	public m_szType:			string = "";
	public m_szJti:				string = "";
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_utTokenExpiration: new FieldProperties("exp")},
	 	{m_szType: new FieldProperties("type")},
	 	{m_szJti: new FieldProperties("jti")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return AuthTokenDecodedJWT.m_mapProperties;
	}
};

/// <summary>
/// Success response to auth token request.
/// </summary>
export class AuthTokenResponseSuccess extends DataObjectBase
{
	m_szToken:		string = "";	// Bearer token to use in future POSTs/etc (JWT).
	m_szApiSecret:	string = "";	// Key to use for SHA256 hashing in the header.
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_szToken: new FieldProperties("token")},
	 	{m_szApiSecret: new FieldProperties("secret")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return AuthTokenResponseSuccess.m_mapProperties;
	}
};

/// <summary>
/// Success response to POST events (and Logs, and Telemetry...).
/// </summary>
export class PostObjectsResponseSuccess extends DataObjectBase
{
	m_szStatus:	string = "";
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_szStatus: new FieldProperties("status")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return PostObjectsResponseSuccess.m_mapProperties;
	}
};

/// <summary>
/// Failure response to POST events (and Logs, and Telemetry...).
/// </summary>
export class PostObjectsResponseFailure extends DataObjectBase
{
	m_szDetail:	string = "";
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_szDetail: new FieldProperties("detail")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return PostObjectsResponseFailure.m_mapProperties;
	}
};

/// <summary>
/// Failure response to auth token request.
/// </summary>
export class AuthTokenResponseFailureDetail extends DataObjectBase
{
	public m_lszLoc:	DbSet<JsonScalarArrayElement<string>>;
	public m_szMsg:		string = "";
	public m_szType:	string = "";
	public m_szInput:	string = "";
	public m_szUrl:		string = "";
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_szMsg: new FieldProperties("msg")},
	 	{m_szType: new FieldProperties("type")},
	 	{m_szInput: new FieldProperties("input")},
	 	{m_szUrl: new FieldProperties("url")},
		// ---
	 	{m_lszLoc: new FieldProperties("loc", FieldPropertyFlags.bfChildList)}));
	// ---
	constructor()
	{
		super();
		// ---
		this.m_lszLoc = new DbSet<JsonScalarArrayElement<string>>(JsonScalarArrayElement<string>);
	}
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return AuthTokenResponseFailureDetail.m_mapProperties;
	}
};

/// <summary>
/// Failure response to auth token request.
/// </summary>
export class AuthTokenResponseFailure extends DataObjectBase
{
	public m_szMessage:		string = "";	// This is for failures in the LMS/AuthMechanism flow where we get e.g. {"message": "Invalid assessment pin or the assessment is already active."}
	public m_listDetail:	DbSet<AuthTokenResponseFailureDetail>;	// This is for more general case when we get one of those "detail": "<list of details dump>" error structures.
	// ^^^ Both of these are simply unioned and it will find and parse whichever is present.
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_szMessage: new FieldProperties("message")},
		// ---
	 	{m_listDetail: new FieldProperties("detail", FieldPropertyFlags.bfChildList)}));
	// ---
	constructor()
	{
		super();
		// ---
		this.m_listDetail = new DbSet<AuthTokenResponseFailureDetail>(AuthTokenResponseFailureDetail);
	}
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return AuthTokenResponseFailure.m_mapProperties;
	}
};

/// <summary>
/// Wrote this when I thought I had to generate it.  May have need of it someday, i.e. for decoding,
///		so leaving it in but do not be confused by it... not being used by anything at the moment.
/// </summary>
export class ApiTokenJWT extends DataObjectBase
{
	m_szType:		string = "";
	m_szDeviceId:	string = "";
	m_szUserId:		string = "";
	// ---
	// ApiTokenJWT() = default;
	constructor(szDeviceId: string, szUserId: string)
	{
		super();
		this.SetupAccessJWT(szDeviceId, szUserId);
	}
	public SetupAccessJWT(szDeviceId: string, szUserId: string): void
	{
		this.m_szType = "access";
		this.m_szDeviceId = szDeviceId;
		this.m_szUserId = szUserId;
	}
	// ToJWTString(szKey: string): string
	// {
	// 	var	mapPayload = { ["type", m_szType], ["device_id", m_szDeviceId], ["user_id", m_szUserId] };

	// 	return JWTEncode(szKey, mapPayload);
	// }
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_szType: new FieldProperties("type")},
	 	{m_szDeviceId: new FieldProperties("device_id")},
	 	{m_szUserId: new FieldProperties("user_id")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return ApiTokenJWT.m_mapProperties;
	}
};

// ---

/// <summary>
/// Object for communicating with the REST interface.
///		This layer knows the REST endpoints and sends the data and acquires the response.
///		Layer calling this handles parsing/interpreting the response.
/// </summary>
export class AbxrLibClient
{
	/// <summary>
	/// Core template-function for POSTing list of T to backend.
	/// </summary>
	/// <typeparam name="T">Type of object being POSTed.</typeparam>
	/// <typeparam name="AbxrLibAnalytics">Pass in AbxrLibAnalytics where this is instantiated... resolves forward-referencing catch-22.</typeparam>
	/// <typeparam name="AbxrLibConfiguration">Pass in AbxrLibConfiguration where this is instantiated... resolves forward-referencing catch-22.</typeparam>
	/// <param name="listpXXXs">List of pointers to Ts to be JSONed and POSTed.</param>
	/// <(type)param name="tTypeOfT">Type of object to be deleted as an any due to TypeScript's screwiness w.r.t. generics.</typeparam>
	/// <param name="szRESTEndpoint">Backend REST endpoint that receives the POST.</param>
	/// <param name="szResponse">Response from backend... either success JSON or failure JSON.</param>
	/// <returns>AbxrResult status code.</returns>
	public static async PostABXRXXXs<T extends AbxrBase>(listpXXXs: DbSet<T>, tTypeOfT: any, bOneAtATime: boolean, rpResponse: {szResponse: string}): Promise<AbxrResult>
	{
		try
		{
			var	abxrXXXContainer:	AbxrXXXContainer<T, number, false> = new AbxrXXXContainer<T, number, false>(tTypeOfT, false);
			var	eTestCurlRet:		boolean,
				eCurlRet:			boolean = true;
			var	eJsonRet:			JsonResult;
			var	szJSON:				string = "";
			var	eReauthResult:		AbxrResult;
			var	mbBodyContent:		Buffer = Buffer.from("");
			var	objResponseSuccess:	PostObjectsResponseSuccess = new PostObjectsResponseSuccess();	// e.g. {"status":"success"}
			var	objResponseFailure:	PostObjectsResponseFailure = new PostObjectsResponseFailure();	// e.g. {"detail":"Invalid Login - Hash"}

			if (bOneAtATime)
			{
				var	list1pXXXs:	DbSet<T> = new DbSet<T>(tTypeOfT);

				// list1pXXXs.push(null);
				for (let pT of listpXXXs.values())
				{
					var	objRequest: CurlHttp = new CurlHttp();

					// Backend complains about "missing name" which is not actually missing with this one.
					//szJSON = GenerateJson(*pT, DumpCategory.eDumpingJsonForBackend);
					// Backend complains about "it should be a valid list" with this one.
					//szJSON = GenerateJsonAlternate(abxrXXXContainer, DumpCategory.eDumpingJsonForBackend, { {"data", [&]()->mstringb { return GenerateJson<T, 1>(*pT, DumpCategory.eDumpingJsonForBackend); } } });
					list1pXXXs[0] = pT;
					szJSON = GenerateJsonAlternate(abxrXXXContainer, DumpCategory.eDumpingJsonForBackend, [ ["data", () => { return GenerateJsonList(list1pXXXs, DumpCategory.eDumpingJsonForBackend); } ] ]);
					mbBodyContent = Buffer.from(szJSON);
					// OUTPUTDEBUGSTRING(szJSON, "\n");
					await AbxrLibAnalytics.SetHeadersFromCurrentState(objRequest, Buffer.from(szJSON), true, true);
					eTestCurlRet = await objRequest.Post(AbxrLibAnalytics.FinalUrl(RESTEndpointFromType<T>(tTypeOfT)), [], mbBodyContent, rpResponse);
					// OUTPUTDEBUGSTRING(szResponse, "\n");
					if (!eTestCurlRet)
					{
						eCurlRet = eTestCurlRet;
					}
				}
			}
			else
			{
				var	objRequest: CurlHttp = new CurlHttp();

				szJSON = GenerateJsonAlternate(abxrXXXContainer, DumpCategory.eDumpingJsonForBackend, [ ["data", () => { return GenerateJsonList(listpXXXs, DumpCategory.eDumpingJsonForBackend); } ] ]);
				mbBodyContent = Buffer.from(szJSON);
				// OUTPUTDEBUGSTRING(szJSON, "\n");
				await AbxrLibAnalytics.SetHeadersFromCurrentState(objRequest, mbBodyContent, true, true);
				eCurlRet = await objRequest.Post(AbxrLibAnalytics.FinalUrl(RESTEndpointFromType<T>(tTypeOfT)), [], mbBodyContent, rpResponse);
				// OUTPUTDEBUGSTRING(szJSON, "\n\nRESPONSE:\n\n", szResponse);
			}
			// Judgment call here... if (bOneAtATime) then szResponse will be the last response and this will react to that.
			// Betting that trying to do all of them and maybe some will get through is the good policy.  It may prove that
			// bailing on the first failure is better but I do not know for sure.
			if (eCurlRet)
			{
				eJsonRet = LoadFromJson(objResponseSuccess, rpResponse.szResponse);
				if (eJsonRet === JsonResult.eOk)
				{
					return AbxrResult.eOk;
				}
				else
				{
					// Did not get success, does failure parse?
					eJsonRet = LoadFromJson(objResponseFailure, rpResponse.szResponse);
					if (eJsonRet === JsonResult.eOk)
					{
						// Failure parses, probably auth error.
						eReauthResult = await AbxrLibInit.ReAuthenticate(true);
						if (eReauthResult != AbxrResult.eOk)
						{
							return eReauthResult;
						}
					}
					else
					{
						// Response does not parse.
						return AbxrResult.ePostObjectsBadJsonResponse;
					}
				}
			}
			else
			{
				return AbxrResult.ePostObjectsFailedNetworkError;
			}
		}
		catch (error)
		{
			console.log("Error: ", error);
			// ---
			return AbxrResult.ePostObjectsFailed;
		}
		// ---
		return AbxrResult.eOk;
	}
	// TODO:  Summary this when dust has settled.
	public static async GetABXRXXXs<T extends DataObjectBase>(tTypeOfT: any, vpszQueryParameters: Array<[string, string]>, /*OUT*/ ptContainedResponse: AbxrXXXContainer<T, AbxrDictStrings, false> | null, /*OUT*/ ptResponse: T | null): Promise<AbxrResult>
	{
		try
		{
			var	objRequest:			CurlHttp = new CurlHttp();
			var	eCurlRet:			boolean;
			var	eJsonRet:			JsonResult;
			var	eReauthResult:		AbxrResult;
			var	rpResponse:			{szResponse: string} = {szResponse: ""};
			var	objResponseFailure:	PostObjectsResponseFailure = new PostObjectsResponseFailure();	// e.g. {"detail":"Invalid Login - Hash"}

			await AbxrLibAnalytics.SetHeadersFromCurrentState(objRequest, Buffer.from(""), false, true);
			eCurlRet = await objRequest.Get(AbxrLibAnalytics.FinalUrl(RESTEndpointFromType<T>(tTypeOfT)), vpszQueryParameters, rpResponse);
			// OUTPUTDEBUGSTRING("RESPONSE:\n", szResponse, "\n");
			if (eCurlRet)
			{
				// For config endpoint, we need to stringify nested objects
				if (RESTEndpointFromType<T>(tTypeOfT) === 'storage/config') {
					try {
						const parsedResponse = JSON.parse(rpResponse.szResponse);
						if (parsedResponse.authMechanism) {
							// Convert nested object to string representation
							parsedResponse.authMechanism = JSON.stringify(parsedResponse.authMechanism);
							rpResponse.szResponse = JSON.stringify(parsedResponse);
						}
					} catch (e) {
						console.error("Error preprocessing config response:", e);
						return AbxrResult.ePostObjectsBadJsonResponse;
					}
				}

				try {
					if (ptResponse)
					{
						eJsonRet = LoadFromJson(ptResponse, rpResponse.szResponse);
					}
					else
					{
						eJsonRet = LoadFromJson(ptContainedResponse, rpResponse.szResponse);
					}
					if (eJsonRet === JsonResult.eOk)
					{
						return AbxrResult.eOk;
					}
				} catch (jsonError) {
					console.error("Error parsing JSON response:", jsonError);
					return AbxrResult.ePostObjectsBadJsonResponse;
				}

				// Did not get success, does failure parse?
				eJsonRet = LoadFromJson(objResponseFailure, rpResponse.szResponse);
				if (eJsonRet === JsonResult.eOk)
				{
					// Failure parses, probably auth error.
					eReauthResult = await AbxrLibInit.ReAuthenticate(true);
					if (eReauthResult != AbxrResult.eOk)
					{
						return eReauthResult;
					}
				}
				else
				{
					// Response does not parse.
					return AbxrResult.ePostObjectsBadJsonResponse;
				}
			}
			else
			{
				return AbxrResult.ePostObjectsFailedNetworkError;
			}
		}
		catch (error)
		{
			console.log("Error: ", error);
			//WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
			// ---
			//return AbxrResult.ePostObjectsFailed;
		}
		// ---
		return AbxrResult.eOk;
	}
	// TODO:  Summary this when dust has settled.
	public static async DeleteABXRXXX<T extends AbxrBase>(tTypeOfT: any, vpszQueryParameters: Array<[string, string]>, rpResponse: {szResponse: string}): Promise<AbxrResult>
	{
		try
		{
			var	objRequest:			CurlHttp = new CurlHttp();
			var	eCurlRet:			boolean;
			var	eJsonRet:			JsonResult;
			var	eReauthResult:		AbxrResult;
			var	objResponseSuccess:	PostObjectsResponseSuccess = new PostObjectsResponseSuccess();	// e.g. {"status":"all data reset"}
			var	objResponseFailure:	PostObjectsResponseFailure = new PostObjectsResponseFailure();	// e.g. {"detail":"Invalid Login - Hash"}

			await AbxrLibAnalytics.SetHeadersFromCurrentState(objRequest, Buffer.from(""), false, true);
			eCurlRet = await objRequest.Delete(AbxrLibAnalytics.FinalUrl(RESTEndpointFromType<T>(tTypeOfT)), vpszQueryParameters, rpResponse);
			// OUTPUTDEBUGSTRING(szResponse, "\n");
			if (eCurlRet)
			{
				eJsonRet = LoadFromJson(objResponseSuccess, rpResponse.szResponse);
				if (eJsonRet === JsonResult.eOk)
				{
					return AbxrResult.eOk;
				}
				else
				{
					// Did not get success, does failure parse?
					eJsonRet = LoadFromJson(objResponseFailure, rpResponse.szResponse);
					if (eJsonRet === JsonResult.eOk)
					{
						// Failure parses, probably auth error.
						eReauthResult = await AbxrLibInit.ReAuthenticate(true);
						if (eReauthResult != AbxrResult.eOk)
						{
							return eReauthResult;
						}
					}
					else
					{
						// Response does not parse.
						return AbxrResult.eDeleteObjectsBadJsonResponse;
					}
				}
			}
			else
			{
				return AbxrResult.eDeleteObjectsFailedNetworkError;
			}
		}
		catch (error)
		{
			console.log("Error: ", error);
			//WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
			// ---
			return AbxrResult.eDeleteObjectsFailed;
		}
		// ---
		return AbxrResult.eOk;
	}
	// ---
	/// <summary>
	/// POST as JSON an authentication request and acquire the token (or error if not).
	/// </summary>
	/// <param name="authTokenRequest"></param>
	/// <returns>Success or failure</returns>
	public static async PostAuthenticate(authTokenRequest: AuthTokenRequest, rpResponse: {szResponse: string}): Promise<AbxrResult>
	{
		var	objRequest:		CurlHttp = new CurlHttp();
		var	eCurlRet:		boolean;
		var	szJSON:			string = GenerateJson(authTokenRequest, DumpCategory.eDumpEverything);	// Save a few ns not going with eDumpingJsonForBackend... this is not a database object, no need to exclude fields.
		var	mbBodyContent:	Buffer = Buffer.from(szJSON);

		try {
			// Set additional headers from current state
			await AbxrLibAnalytics.SetHeadersFromCurrentState(objRequest, mbBodyContent, true, false);

			// Debug logging
			//console.log("Authentication Request:", {
			//	url: AbxrLibAnalytics.FinalUrl("auth/token"),
			//	requestBody: JSON.parse(szJSON)
			//});

			eCurlRet = await objRequest.Post(AbxrLibAnalytics.FinalUrl("auth/token"), [], mbBodyContent, rpResponse);
			
			// Response logging
			//console.log("Authentication Response:", {
			//	success: eCurlRet,
			//	response: rpResponse.szResponse,
			//	responseObject: JSON.parse(rpResponse.szResponse)
			//});

			if (!eCurlRet) {
				return AbxrResult.eAuthenticateFailedNetworkError;
			}
		}
		catch (error)
		{
			console.log("Authentication Error:", error);
			//WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
			return AbxrResult.eAuthenticateFailed;
		}
		// ---
		return AbxrResult.eOk;
	}
	// ---
	public static async GetABXRConfig(/*OUT*/ abxrConfiguration: AbxrLibConfiguration): Promise<AbxrResult>
	{
		var	szRestUrl:	string = abxrConfiguration.GetRestUrl();
		var	eRet:		AbxrResult = await AbxrLibClient.GetABXRXXXs<AbxrLibConfiguration>(AbxrLibConfiguration, [], null, abxrConfiguration);

		// Judgment call here... restore the REST_URL to what it was before getting the config from the backend.
		// For example, when I am running test code, the local backend populates this field with the cloud URL,
		// which bwns up the future requests if allowed to stand.  And I do not see any downside as how could we
		// have communicated to the backend without a URL that was valid to begin with?
		abxrConfiguration.SetRestUrl(szRestUrl);
		// ---
		return eRet;
	}
	public static async GetABXRStorage(/*OUT*/ abxrStorage: AbxrXXXContainer<AbxrStorage, AbxrDictStrings, false>): Promise<AbxrResult>
	{
		return await AbxrLibClient.GetABXRXXXs<AbxrStorage>(AbxrStorage, [], abxrStorage, null);
	}
	/// <summary>
	/// Delete single AbxrStorage entry by name.
	///		Note neither of these are using the "userOnly" flag as it should always be default false indicating current device.
	/// </summary>
	/// <param name="szName">Name of the Storage element.</param>
	/// <param name="szResponse">Response from backend.</param>
	/// <returns>AbxrResult status code.</returns>
	public static async DeleteABXRStorageEntry(szName: string, rpResponse: {szResponse: string}): Promise<AbxrResult>
	{
		return await AbxrLibClient.DeleteABXRXXX<AbxrStorage>(AbxrStorage, [ ["name", szName] ], rpResponse);
	}
	/// <summary>
	/// Delete AbxrStorage entries for this device, either session only or all of them.
	///		Note neither of these are using the "userOnly" flag as it should always be default false indicating current device.
	/// </summary>
	/// <param name="bSessionOnly">true if only session data is to be deleted, else all data.</param>
	/// <param name="szResponse">Response from backend.</param>
	/// <returns>AbxrResult status code.</returns>
	public static async DeleteMultipleABXRStorageEntries(bSessionOnly: boolean, rpResponse: {szResponse: string}): Promise<AbxrResult>
	{
		return await AbxrLibClient.DeleteABXRXXX<AbxrStorage>(AbxrStorage, [ ["sessionOnly", (bSessionOnly) ? "true" : "false"] ], rpResponse);
	}
	// ---
	public static async PostABXREvents(listpEvents: DbSet<AbxrEvent>, bOneAtATime: boolean, rpResponse: {szResponse: string}): Promise<AbxrResult>
	{
		return await AbxrLibClient.PostABXRXXXs<AbxrEvent>(listpEvents, AbxrEvent, bOneAtATime, rpResponse);
	}
	public static async PostABXRAIProxyObjects(listpAIProxyObjects: DbSet<AbxrAIProxy>, bOneAtATime: boolean, rpResponse: {szResponse: string}): Promise<AbxrResult>
	{
		return await AbxrLibClient.PostABXRXXXs<AbxrAIProxy>(listpAIProxyObjects, AbxrAIProxy, bOneAtATime, rpResponse);
	}
	public static async PostABXRLogs(listpLogs: DbSet<AbxrLog>, bOneAtATime: boolean, rpResponse: {szResponse: string}): Promise<AbxrResult>
	{
		return await AbxrLibClient.PostABXRXXXs<AbxrLog>(listpLogs, AbxrLog, bOneAtATime, rpResponse);
	}
	public static async PostABXRTelemetry(listpTelemetry: DbSet<AbxrTelemetry>, bOneAtATime: boolean, rpResponse: {szResponse: string}): Promise<AbxrResult>
	{
		return await AbxrLibClient.PostABXRXXXs<AbxrTelemetry>(listpTelemetry, AbxrTelemetry, bOneAtATime, rpResponse);
	}
	public static async PostABXRStorage(listpStorage: DbSet<AbxrStorage>, bOneAtATime: boolean, rpResponse: {szResponse: string}): Promise<AbxrResult>
	{
		return await AbxrLibClient.PostABXRXXXs<AbxrStorage>(listpStorage, AbxrStorage, bOneAtATime, rpResponse);
	}
	// ---
	/// <summary>
	/// Debug/Test code... output diagnostic information for other debug/test code.
	/// </summary>
	/// <param name="szLine"></param>
	public static WriteLine(szLine: string): void
	{
		// https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/preprocessor-directives
		 szLine = EnsureSingleEndingCharacter(szLine, '\n');
		// if (Platform.IsWindows())
		// {
		 	console.log(szLine);
		// }
		// else
		// {
		// 	OutputDebugStringA(szLine);
		// }
		 AbxrLibAnalytics.DiagnosticWriteLine(szLine);
	}
};

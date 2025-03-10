/// <summary>
/// All the partners of which we are aware (for authentication purposes).
///		Comaintain with iXRAnalytics.cs.

import { iXRLibAnalytics, iXRLibInit } from "./iXRLibAnalytics";
import { iXRAIProxy, iXRBase, iXREvent, iXRLibConfiguration, iXRLog, iXRStorage, iXRTelemetry, iXRXXXContainer, RESTEndpointFromType } from "./iXRLibCoreModel";
import { CurlHttp, EnsureSingleEndingCharacter, JsonScalarArrayElement, SUID, time_t } from "./network/types";
import { DataObjectBase, DbSet, DumpCategory, FieldProperties, FieldPropertiesRecordContainer, FieldPropertyFlags, GenerateJson, GenerateJsonAlternate, GenerateJsonList, LoadFromJson } from "./network/utils/DataObjectBase";
import { iXRResult, JsonResult, iXRDictStrings, StringList } from "./network/utils/DotNetishTypes";

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
	m_szPartner:			string = "";	// Blank if it is just us (iXR).  Otherwise, "arborxr", ... if not blank this is how backend knows to do further authentication with partner.
	// --- Extra environment-variable kind of data set by properties.
	m_szOsVersion:			string = "";
	m_szIpAddress:			string = "";
	m_szXrdmVersion:		string = "";
	m_szAppVersion:			string = "";
	m_szUnityVersion:		string = "";
	m_szDeviceModel:		string = "";
	m_szUserId:				string = "";
	m_lszTags:				StringList;
	m_dictGeoLocation:		iXRDictStrings;
	m_dictAuthMechanism:	iXRDictStrings;
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
		this.m_dictGeoLocation = new iXRDictStrings();
		this.m_dictAuthMechanism = new iXRDictStrings();
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
export class iXRLibClient
{
	/// <summary>
	/// Core template-function for POSTing list of T to backend.
	/// </summary>
	/// <typeparam name="T">Type of object being POSTed.</typeparam>
	/// <typeparam name="iXRLibAnalytics">Pass in iXRLibAnalytics where this is instantiated... resolves forward-referencing catch-22.</typeparam>
	/// <typeparam name="iXRLibConfiguration">Pass in iXRLibConfiguration where this is instantiated... resolves forward-referencing catch-22.</typeparam>
	/// <param name="listpXXXs">List of pointers to Ts to be JSONed and POSTed.</param>
	/// <(type)param name="tTypeOfT">Type of object to be deleted as an any due to TypeScript's screwiness w.r.t. generics.</typeparam>
	/// <param name="szRESTEndpoint">Backend REST endpoint that receives the POST.</param>
	/// <param name="szResponse">Response from backend... either success JSON or failure JSON.</param>
	/// <returns>iXRResult status code.</returns>
	public static async PostIXRXXXs<T extends iXRBase>(listpXXXs: DbSet<T>, tTypeOfT: any, bOneAtATime: boolean, rpResponse: {szResponse: string}): Promise<iXRResult>
	{
		try
		{
			var	ixrXXXContainer:	iXRXXXContainer<T, number, false> = new iXRXXXContainer<T, number, false>(tTypeOfT, false);
			var	eTestCurlRet:		boolean,
				eCurlRet:			boolean = true;
			var	eJsonRet:			JsonResult;
			var	szJSON:				string = "";
			var	eReauthResult:		iXRResult;
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
					//szJSON = GenerateJsonAlternate(ixrXXXContainer, DumpCategory.eDumpingJsonForBackend, { {"data", [&]()->mstringb { return GenerateJson<T, 1>(*pT, DumpCategory.eDumpingJsonForBackend); } } });
					list1pXXXs[0] = pT;
					szJSON = GenerateJsonAlternate(ixrXXXContainer, DumpCategory.eDumpingJsonForBackend, [ ["data", () => { return GenerateJsonList(list1pXXXs, DumpCategory.eDumpingJsonForBackend); } ] ]);
					mbBodyContent = Buffer.from(szJSON);
					// OUTPUTDEBUGSTRING(szJSON, "\n");
					await iXRLibAnalytics.SetHeadersFromCurrentState(objRequest, Buffer.from(szJSON), true, true);
					eTestCurlRet = await objRequest.Post(iXRLibAnalytics.FinalUrl(RESTEndpointFromType<T>(tTypeOfT)), [], mbBodyContent, rpResponse);
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

				szJSON = GenerateJsonAlternate(ixrXXXContainer, DumpCategory.eDumpingJsonForBackend, [ ["data", () => { return GenerateJsonList(listpXXXs, DumpCategory.eDumpingJsonForBackend); } ] ]);
				mbBodyContent = Buffer.from(szJSON);
				// OUTPUTDEBUGSTRING(szJSON, "\n");
				await iXRLibAnalytics.SetHeadersFromCurrentState(objRequest, mbBodyContent, true, true);
				eCurlRet = await objRequest.Post(iXRLibAnalytics.FinalUrl(RESTEndpointFromType<T>(tTypeOfT)), [], mbBodyContent, rpResponse);
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
					return iXRResult.eOk;
				}
				else
				{
					// Did not get success, does failure parse?
					eJsonRet = LoadFromJson(objResponseFailure, rpResponse.szResponse);
					if (eJsonRet === JsonResult.eOk)
					{
						// Failure parses, probably auth error.
						eReauthResult = await iXRLibInit.ReAuthenticate(true);
						if (eReauthResult != iXRResult.eOk)
						{
							return eReauthResult;
						}
					}
					else
					{
						// Response does not parse.
						return iXRResult.ePostObjectsBadJsonResponse;
					}
				}
			}
			else
			{
				return iXRResult.ePostObjectsFailedNetworkError;
			}
		}
		catch (error)
		{
			console.log("Error: ", error);
			// ---
			return iXRResult.ePostObjectsFailed;
		}
		// ---
		return iXRResult.eOk;
	}
	// TODO:  Summary this when dust has settled.
	public static async GetIXRXXXs<T extends DataObjectBase>(tTypeOfT: any, vpszQueryParameters: Array<[string, string]>, /*OUT*/ ptContainedResponse: iXRXXXContainer<T, iXRDictStrings, false> | null, /*OUT*/ ptResponse: T | null): Promise<iXRResult>
	{
		try
		{
			var	objRequest:			CurlHttp = new CurlHttp();
			var	eCurlRet:			boolean;
			var	eJsonRet:			JsonResult;
			var	eReauthResult:		iXRResult;
			var	rpResponse:			{szResponse: string} = {szResponse: ""};
			var	objResponseFailure:	PostObjectsResponseFailure = new PostObjectsResponseFailure();	// e.g. {"detail":"Invalid Login - Hash"}

			await iXRLibAnalytics.SetHeadersFromCurrentState(objRequest, Buffer.from(""), false, true);
			eCurlRet = await objRequest.Get(iXRLibAnalytics.FinalUrl(RESTEndpointFromType<T>(tTypeOfT)), vpszQueryParameters, rpResponse);
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
						return iXRResult.ePostObjectsBadJsonResponse;
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
						return iXRResult.eOk;
					}
				} catch (jsonError) {
					console.error("Error parsing JSON response:", jsonError);
					return iXRResult.ePostObjectsBadJsonResponse;
				}

				// Did not get success, does failure parse?
				eJsonRet = LoadFromJson(objResponseFailure, rpResponse.szResponse);
				if (eJsonRet === JsonResult.eOk)
				{
					// Failure parses, probably auth error.
					eReauthResult = await iXRLibInit.ReAuthenticate(true);
					if (eReauthResult != iXRResult.eOk)
					{
						return eReauthResult;
					}
				}
				else
				{
					// Response does not parse.
					return iXRResult.ePostObjectsBadJsonResponse;
				}
			}
			else
			{
				return iXRResult.ePostObjectsFailedNetworkError;
			}
		}
		catch (error)
		{
			console.log("Error: ", error);
			//WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
			// ---
			//return iXRResult.ePostObjectsFailed;
		}
		// ---
		return iXRResult.eOk;
	}
	// TODO:  Summary this when dust has settled.
	public static async DeleteIXRXXX<T extends iXRBase>(tTypeOfT: any, vpszQueryParameters: Array<[string, string]>, rpResponse: {szResponse: string}): Promise<iXRResult>
	{
		try
		{
			var	objRequest:			CurlHttp = new CurlHttp();
			var	eCurlRet:			boolean;
			var	eJsonRet:			JsonResult;
			var	eReauthResult:		iXRResult;
			var	objResponseSuccess:	PostObjectsResponseSuccess = new PostObjectsResponseSuccess();	// e.g. {"status":"all data reset"}
			var	objResponseFailure:	PostObjectsResponseFailure = new PostObjectsResponseFailure();	// e.g. {"detail":"Invalid Login - Hash"}

			await iXRLibAnalytics.SetHeadersFromCurrentState(objRequest, Buffer.from(""), false, true);
			eCurlRet = await objRequest.Delete(iXRLibAnalytics.FinalUrl(RESTEndpointFromType<T>(tTypeOfT)), vpszQueryParameters, rpResponse);
			// OUTPUTDEBUGSTRING(szResponse, "\n");
			if (eCurlRet)
			{
				eJsonRet = LoadFromJson(objResponseSuccess, rpResponse.szResponse);
				if (eJsonRet === JsonResult.eOk)
				{
					return iXRResult.eOk;
				}
				else
				{
					// Did not get success, does failure parse?
					eJsonRet = LoadFromJson(objResponseFailure, rpResponse.szResponse);
					if (eJsonRet === JsonResult.eOk)
					{
						// Failure parses, probably auth error.
						eReauthResult = await iXRLibInit.ReAuthenticate(true);
						if (eReauthResult != iXRResult.eOk)
						{
							return eReauthResult;
						}
					}
					else
					{
						// Response does not parse.
						return iXRResult.eDeleteObjectsBadJsonResponse;
					}
				}
			}
			else
			{
				return iXRResult.eDeleteObjectsFailedNetworkError;
			}
		}
		catch (error)
		{
			console.log("Error: ", error);
			//WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
			// ---
			return iXRResult.eDeleteObjectsFailed;
		}
		// ---
		return iXRResult.eOk;
	}
	// ---
	/// <summary>
	/// POST as JSON an authentication request and acquire the token (or error if not).
	/// </summary>
	/// <param name="authTokenRequest"></param>
	/// <returns>Success or failure</returns>
	public static async PostAuthenticate(authTokenRequest: AuthTokenRequest, rpResponse: {szResponse: string}): Promise<iXRResult>
	{
		var	objRequest:		CurlHttp = new CurlHttp();
		var	eCurlRet:		boolean;
		var	szJSON:			string = GenerateJson(authTokenRequest, DumpCategory.eDumpEverything);	// Save a few ns not going with eDumpingJsonForBackend... this is not a database object, no need to exclude fields.
		var	mbBodyContent:	Buffer = Buffer.from(szJSON);

		try {
			// Set additional headers from current state
			await iXRLibAnalytics.SetHeadersFromCurrentState(objRequest, mbBodyContent, true, false);

			// Debug logging
			//console.log("Authentication Request:", {
			//	url: iXRLibAnalytics.FinalUrl("auth/token"),
			//	requestBody: JSON.parse(szJSON)
			//});

			eCurlRet = await objRequest.Post(iXRLibAnalytics.FinalUrl("auth/token"), [], mbBodyContent, rpResponse);
			
			// Response logging
			//console.log("Authentication Response:", {
			//	success: eCurlRet,
			//	response: rpResponse.szResponse,
			//	responseObject: JSON.parse(rpResponse.szResponse)
			//});

			if (!eCurlRet) {
				return iXRResult.eAuthenticateFailedNetworkError;
			}
		}
		catch (error)
		{
			console.log("Authentication Error:", error);
			//WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
			return iXRResult.eAuthenticateFailed;
		}
		// ---
		return iXRResult.eOk;
	}
	// ---
	public static async GetIXRConfig(/*OUT*/ ixrConfiguration: iXRLibConfiguration): Promise<iXRResult>
	{
		var	szRestUrl:	string = ixrConfiguration.GetRestUrl();
		var	eRet:		iXRResult = await iXRLibClient.GetIXRXXXs<iXRLibConfiguration>(iXRLibConfiguration, [], null, ixrConfiguration);

		// Judgment call here... restore the REST_URL to what it was before getting the config from the backend.
		// For example, when I am running test code, the local backend populates this field with the cloud URL,
		// which bwns up the future requests if allowed to stand.  And I do not see any downside as how could we
		// have communicated to the backend without a URL that was valid to begin with?
		ixrConfiguration.SetRestUrl(szRestUrl);
		// ---
		return eRet;
	}
	public static async GetIXRStorage(/*OUT*/ ixrStorage: iXRXXXContainer<iXRStorage, iXRDictStrings, false>): Promise<iXRResult>
	{
		return await iXRLibClient.GetIXRXXXs<iXRStorage>(iXRStorage, [], ixrStorage, null);
	}
	/// <summary>
	/// Delete single iXRStorage entry by name.
	///		Note neither of these are using the "userOnly" flag as it should always be default false indicating current device.
	/// </summary>
	/// <param name="szName">Name of the Storage element.</param>
	/// <param name="szResponse">Response from backend.</param>
	/// <returns>iXRResult status code.</returns>
	public static async DeleteIXRStorageEntry(szName: string, rpResponse: {szResponse: string}): Promise<iXRResult>
	{
		return await iXRLibClient.DeleteIXRXXX<iXRStorage>(iXRStorage, [ ["name", szName] ], rpResponse);
	}
	/// <summary>
	/// Delete iXRStorage entries for this device, either session only or all of them.
	///		Note neither of these are using the "userOnly" flag as it should always be default false indicating current device.
	/// </summary>
	/// <param name="bSessionOnly">true if only session data is to be deleted, else all data.</param>
	/// <param name="szResponse">Response from backend.</param>
	/// <returns>iXRResult status code.</returns>
	public static async DeleteMultipleIXRStorageEntries(bSessionOnly: boolean, rpResponse: {szResponse: string}): Promise<iXRResult>
	{
		return await iXRLibClient.DeleteIXRXXX<iXRStorage>(iXRStorage, [ ["sessionOnly", (bSessionOnly) ? "true" : "false"] ], rpResponse);
	}
	// ---
	public static async PostIXREvents(listpEvents: DbSet<iXREvent>, bOneAtATime: boolean, rpResponse: {szResponse: string}): Promise<iXRResult>
	{
		return await iXRLibClient.PostIXRXXXs<iXREvent>(listpEvents, iXREvent, bOneAtATime, rpResponse);
	}
	public static async PostIXRAIProxyObjects(listpAIProxyObjects: DbSet<iXRAIProxy>, bOneAtATime: boolean, rpResponse: {szResponse: string}): Promise<iXRResult>
	{
		return await iXRLibClient.PostIXRXXXs<iXRAIProxy>(listpAIProxyObjects, iXRAIProxy, bOneAtATime, rpResponse);
	}
	public static async PostIXRLogs(listpLogs: DbSet<iXRLog>, bOneAtATime: boolean, rpResponse: {szResponse: string}): Promise<iXRResult>
	{
		return await iXRLibClient.PostIXRXXXs<iXRLog>(listpLogs, iXRLog, bOneAtATime, rpResponse);
	}
	public static async PostIXRTelemetry(listpTelemetry: DbSet<iXRTelemetry>, bOneAtATime: boolean, rpResponse: {szResponse: string}): Promise<iXRResult>
	{
		return await iXRLibClient.PostIXRXXXs<iXRTelemetry>(listpTelemetry, iXRTelemetry, bOneAtATime, rpResponse);
	}
	public static async PostIXRAIProxy(listpAIProxy: DbSet<iXRAIProxy>, bOneAtATime: boolean, rpResponse: {szResponse: string}): Promise<iXRResult>
	{
		return await iXRLibClient.PostIXRXXXs<iXRAIProxy>(listpAIProxy, iXRAIProxy, bOneAtATime, rpResponse);
	}
	public static async PostIXRStorage(listpStorage: DbSet<iXRStorage>, bOneAtATime: boolean, rpResponse: {szResponse: string}): Promise<iXRResult>
	{
		return await iXRLibClient.PostIXRXXXs<iXRStorage>(listpStorage, iXRStorage, bOneAtATime, rpResponse);
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
		 iXRLibAnalytics.DiagnosticWriteLine(szLine);
	}
};

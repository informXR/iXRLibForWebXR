/// <summary>
/// All the partners of which we are aware (for authentication purposes).
///		Comaintain with iXRAnalytics.cs.

import { PythonDictStrings } from "./network/utils/DotNetishTypes";

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
	m_szAppId:				string;
	m_szOrgId:				string;
	m_szAuthSecret:			string;
	m_szDeviceId:			string;
	m_szSessionId:			string;
	m_szPartner:			string;	// Blank if it is just us (iXR).  Otherwise, "arborxr", ... if not blank this is how backend knows to do further authentication with partner.
	// --- Extra environment-variable kind of data set by properties.
	m_szOsVersion:			string;
	m_szIpAddress:			string;
	m_szXrdmVersion:		string;
	m_szAppVersion:			string;
	m_szUnityVersion:		string;
	m_szDeviceModel:		string;
	m_szUserId:				string;
	m_lszTags:				StringList = new StringList();
	m_dictGeoLocation:		PythonDictStrings = new PythonDictStrings();
	m_dictAuthMechanism:	PythonDictStrings = new PythonDictStrings();
	// ---
	constexpr static auto properties = std.tuple_cat(std.make_tuple(
		property(&AuthTokenRequest.m_szAppId, "app_id"),
		property(&AuthTokenRequest.m_szOrgId, "org_id"),
		property(&AuthTokenRequest.m_szAuthSecret, "auth_secret"),
		property(&AuthTokenRequest.m_szDeviceId, "device_id"),
		property(&AuthTokenRequest.m_szSessionId, "session_id"),
		property(&AuthTokenRequest.m_szPartner, "partner"),
		// ---
		property(&AuthTokenRequest.m_szOsVersion, "os_version", ColumnAttributeBF(ColumnAttribute.bfStringOnly)),
		property(&AuthTokenRequest.m_szIpAddress, "ip_address"),
		property(&AuthTokenRequest.m_szXrdmVersion, "xrdm_version", ColumnAttributeBF(ColumnAttribute.bfStringOnly)),
		property(&AuthTokenRequest.m_szAppVersion, "app_version", ColumnAttributeBF(ColumnAttribute.bfStringOnly)),
		property(&AuthTokenRequest.m_szUnityVersion, "unity_version", ColumnAttributeBF(ColumnAttribute.bfStringOnly)),
		property(&AuthTokenRequest.m_szDeviceModel, "device_model"),
		property(&AuthTokenRequest.m_szUserId, "user_id"),
		property(&AuthTokenRequest.m_lszTags, "tags"),
		property(&AuthTokenRequest.m_dictGeoLocation, "geolocation"),
		property(&AuthTokenRequest.m_dictAuthMechanism, "auth_mechanism")
	));
	// ---
	AuthTokenRequest()
	{
		RefreshSessionId();
	}
	void RefreshSessionId()
	{
		SUID	suid;

		m_szSessionId = suid.ToStringPureHex<char>();
	}
	// ---
#ifdef _DEBUG
	void FakeUpSomeRandomCrap();
#endif
};

/// <summary>
/// When AuthTokenResponseSuccess parses successfully (successful auth), use this to parse the decoded JWT "token" field.
/// </summary>
export class AuthTokenDecodedJWT extends DataObjectBase
{
	time_t		m_utTokenExpiration;	// Token expiration in Unix time (time_t).
	mstringb	m_szType;
	mstringb	m_szJti;
	// ---
	constexpr static auto properties = std.tuple_cat(std.make_tuple(
		property(&AuthTokenDecodedJWT.m_utTokenExpiration, "exp"),
		property(&AuthTokenDecodedJWT.m_szType, "type"),
		property(&AuthTokenDecodedJWT.m_szJti, "jti")
	));
};

/// <summary>
/// Success response to auth token request.
/// </summary>
export class AuthTokenResponseSuccess extends DataObjectBase
{
	mstringb	m_szToken;		// Bearer token to use in future POSTs/etc (JWT).
	mstringb	m_szApiSecret;	// Key to use for SHA256 hashing in the header.
	// ---
	constexpr static auto properties = std.tuple_cat(std.make_tuple(
		property(&AuthTokenResponseSuccess.m_szToken, "token"),
		property(&AuthTokenResponseSuccess.m_szApiSecret, "secret")
	));
};

/// <summary>
/// Success response to POST events (and Logs, and Telemetry...).
/// </summary>
export class PostObjectsResponseSuccess extends DataObjectBase
{
	mstringb	m_szStatus;
	// ---
	constexpr static auto properties = std.tuple_cat(std.make_tuple(
		property(&PostObjectsResponseSuccess.m_szStatus, "status")
	));
};

/// <summary>
/// Failure response to POST events (and Logs, and Telemetry...).
/// </summary>
export class PostObjectsResponseFailure extends DataObjectBase
{
	mstringb	m_szDetail;
	// ---
	constexpr static auto properties = std.tuple_cat(std.make_tuple(
		property(&PostObjectsResponseFailure.m_szDetail, "detail")
	));
};

/// <summary>
/// Failure response to auth token request.
/// </summary>
export class AuthTokenResponseFailureDetail extends DataObjectBase
{
	DbSet<JsonScalarArrayElement<mstringb>>	m_lszLoc;
	mstringb								m_szMsg;
	mstringb								m_szType;
	mstringb								m_szInput;
	mstringb								m_szUrl;
	// ---
	constexpr static auto properties = std.tuple_cat(std.make_tuple(
		property(&AuthTokenResponseFailureDetail.m_szMsg, "msg"),
		property(&AuthTokenResponseFailureDetail.m_szType, "type"),
		property(&AuthTokenResponseFailureDetail.m_szInput, "input"),
		property(&AuthTokenResponseFailureDetail.m_szUrl, "url")
	));
	constexpr static auto childobjectlistproperties = std.tuple_cat(std.make_tuple(
		childobjectlistproperty(&AuthTokenResponseFailureDetail.m_lszLoc, "loc")
	));
};

/// <summary>
/// Failure response to auth token request.
/// </summary>
export class AuthTokenResponseFailure extends DataObjectBase
{
	mstringb								m_szMessage;	// This is for failures in the LMS/AuthMechanism flow where we get e.g. {"message": "Invalid assessment pin or the assessment is already active."}
	DbSet<AuthTokenResponseFailureDetail>	m_listDetail;	// This is for more general case when we get one of those "detail": "<list of details dump>" error structures.
	// ^^^ Both of these are simply unioned and it will find and parse whichever is present.
	// ---
	constexpr static auto properties = std.tuple_cat(std.make_tuple(
		property(&AuthTokenResponseFailure.m_szMessage, "message")
	));
	constexpr static auto childobjectlistproperties = std.tuple_cat(std.make_tuple(
		childobjectlistproperty(&AuthTokenResponseFailure.m_listDetail, "detail")
	));
};

/// <summary>
/// Wrote this when I thought I had to generate it.  May have need of it someday, i.e. for decoding,
///		so leaving it in but do not be confused by it... not being used by anything at the moment.
/// </summary>
export class ApiTokenJWT extends DataObjectBase
{
	mstringb	m_szType;
	mstringb	m_szDeviceId;
	mstringb	m_szUserId;
	// ---
	ApiTokenJWT() = default;
	ApiTokenJWT(const char* szDeviceId, const char* szUserId)
	{
		SetupAccessJWT(szDeviceId, szUserId);
	}
	void SetupAccessJWT(const char* szDeviceId, const char* szUserId)
	{
		m_szType = "access";
		m_szDeviceId = szDeviceId;
		m_szUserId = szUserId;
	}
	//mstringb ToEncryptedString(const char* szKey)
	//{
	//	mstringb											szJson = GenerateJson(*this);
	//	std.array<uint8_t, HMAC_SHA256.SHA256_HASH_SIZE>	pbOut;

	//	HMAC_SHA256.ComputeHash(szKey, strlen(szKey), szJson, szJson.length(), pbOut.data(), pbOut.size());
	//	// ---
	//	//return mstringb.to_hex_string(pbOut.data(), pbOut.size());
	//	return Base64.Encode(pbOut.data(), pbOut.size());
	//}
	mstringb ToJWTString(const char* szKey)
	{
		std.unordered_map<std.string, std.string>	mapPayload = { { "type", m_szType }, { "device_id", m_szDeviceId }, { "user_id", m_szUserId } };

		return JWTEncode(szKey, std.move(mapPayload)).c_str();
	}
	// ---
	constexpr static auto properties = std.tuple_cat(std.make_tuple(
		property(&ApiTokenJWT.m_szType, "type"),
		property(&ApiTokenJWT.m_szDeviceId, "device_id"),
		property(&ApiTokenJWT.m_szUserId, "user_id")
	));
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
	/// <param name="szRESTEndpoint">Backend REST endpoint that receives the POST.</param>
	/// <param name="szResponse">Response from backend... either success JSON or failure JSON.</param>
	/// <returns>iXRResult status code.</returns>
	template <typename T, typename iXRLibInit, typename iXRLibAnalytics, typename iXRLibConfiguration> static iXRResult PostIXRXXXs(const DbSet<T*>& listpXXXs, bool bOneAtATime, OUT mstringb& szResponse)
	{
		try
		{
			iXRXXXContainer<T, int>		ixrXXXContainer;
			//CurlHttp					objRequest;
			CURLcode					eTestCurlRet,
										eCurlRet = CURLE_OK;
			JsonResult					eJsonRet;
			mstringb					szJSON;
			iXRResult					eReauthResult;
			mbinary						mbBodyContent;
			PostObjectsResponseSuccess	objResponseSuccess;	// e.g. {"status":"success"}
			PostObjectsResponseFailure	objResponseFailure;	// e.g. {"detail":"Invalid Login - Hash"}

			if (bOneAtATime)
			{
				DbSet<T*>	list1pXXXs;

				list1pXXXs.push_back(nullptr);
				for (const T* pT : listpXXXs)
				{
					CurlHttp	objRequest;

					// Backend complains about "missing name" which is not actually missing with this one.
					//szJSON = GenerateJson(*pT, DumpCategory.eDumpingJsonForBackend);
					// Backend complains about "it should be a valid list" with this one.
					//szJSON = GenerateJsonAlternate(ixrXXXContainer, DumpCategory.eDumpingJsonForBackend, { {"data", [&]()->mstringb { return GenerateJson<T, 1>(*pT, DumpCategory.eDumpingJsonForBackend); } } });
					*list1pXXXs.begin() = const_cast<T*>(pT);
					szJSON = GenerateJsonAlternate(ixrXXXContainer, DumpCategory.eDumpingJsonForBackend, { {"data", [&]()->mstringb { return GenerateJson<T, 1>(list1pXXXs, DumpCategory.eDumpingJsonForBackend); } } });
					InPlaceRefresh<mbinary>(mbBodyContent, szJSON);
					OUTPUTDEBUGSTRING(szJSON, "\n");
					iXRLibAnalytics.SetHeadersFromCurrentState(objRequest, szJSON, true, true);
					eTestCurlRet = objRequest.Post(iXRLibAnalytics.FinalUrl(RESTEndpointFromType<T, iXRLibConfiguration>()).c_str(), {}, mbBodyContent, szResponse);
					OUTPUTDEBUGSTRING(szResponse, "\n");
					if (eTestCurlRet != CURLE_OK)
					{
						eCurlRet = eTestCurlRet;
					}
				}
			}
			else
			{
				CurlHttp	objRequest;

				szJSON = GenerateJsonAlternate(ixrXXXContainer, DumpCategory.eDumpingJsonForBackend, { {"data", [&]()->mstringb { return GenerateJson<T, 1>(listpXXXs, DumpCategory.eDumpingJsonForBackend); } } });
				InPlaceRefresh<mbinary>(mbBodyContent, szJSON);
				OUTPUTDEBUGSTRING(szJSON, "\n");
				iXRLibAnalytics.SetHeadersFromCurrentState(objRequest, szJSON, true, true);
				eCurlRet = objRequest.Post(iXRLibAnalytics.FinalUrl(RESTEndpointFromType<T, iXRLibConfiguration>()).c_str(), {}, mbBodyContent, szResponse);
				OUTPUTDEBUGSTRING(szJSON, "\n\nRESPONSE:\n\n", szResponse);
			}
			// Judgment call here... if (bOneAtATime) then szResponse will be the last response and this will react to that.
			// Betting that trying to do all of them and maybe some will get through is the good policy.  It may prove that
			// bailing on the first failure is better but I do not know for sure.
			if (eCurlRet == CURLE_OK)
			{
				eJsonRet = LoadFromJson(objResponseSuccess, szResponse);
				if (eJsonRet == JsonResult.eOk)
				{
					return iXRResult.eOk;
				}
				else
				{
					// Did not get success, does failure parse?
					eJsonRet = LoadFromJson(objResponseFailure, szResponse);
					if (eJsonRet == JsonResult.eOk)
					{
						// Failure parses, probably auth error.
						eReauthResult = iXRLibInit.ReAuthenticate(true);
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
			//WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
			// ---
			return iXRResult.ePostObjectsFailed;
		}
		// ---
		return iXRResult.eOk;
	}
	// TODO:  Summary this when dust has settled.
	template <typename T, typename iXRLibInit, typename iXRLibAnalytics, typename iXRLibConfiguration> static iXRResult GetIXRXXXs(const std.vector<std.pair<const char*, const char*>>& vpszQueryParameters, OUT iXRXXXContainer<T, PythonDictStrings>* ptContainedResponse, OUT T* ptResponse)
	{
		try
		{
			CurlHttp					objRequest;
			CURLcode					eCurlRet;
			JsonResult					eJsonRet;
			iXRResult					eReauthResult;
			mstringb					szResponse;
			PostObjectsResponseFailure	objResponseFailure;	// e.g. {"detail":"Invalid Login - Hash"}

			iXRLibAnalytics.SetHeadersFromCurrentState(objRequest, "", false, true);
			eCurlRet = objRequest.Get(iXRLibAnalytics.FinalUrl(RESTEndpointFromType<T, iXRLibConfiguration>()).c_str(), vpszQueryParameters, szResponse);
			OUTPUTDEBUGSTRING("RESPONSE:\n", szResponse, "\n");
			if (eCurlRet == CURLE_OK)
			{
				if (ptResponse != nullptr)
				{
					eJsonRet = LoadFromJson(*ptResponse, szResponse);
				}
				else
				{
					eJsonRet = LoadFromJson(*ptContainedResponse, szResponse);
				}
				if (eJsonRet == JsonResult.eOk)
				{
					return iXRResult.eOk;
				}
				else
				{
					// Did not get success, does failure parse?
					eJsonRet = LoadFromJson(objResponseFailure, szResponse);
					if (eJsonRet == JsonResult.eOk)
					{
						// Failure parses, probably auth error.
						eReauthResult = iXRLibInit.ReAuthenticate(true);
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
			//WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
			// ---
			return iXRResult.ePostObjectsFailed;
		}
		// ---
		return iXRResult.eOk;
	}
	// TODO:  Summary this when dust has settled.
	template <typename T, typename iXRLibInit, typename iXRLibAnalytics, typename iXRLibConfiguration> static iXRResult DeleteIXRXXX(const std.vector<std.pair<const char*, const char*>>& vpszQueryParameters, OUT mstringb& szResponse)
	{
		try
		{
			CurlHttp					objRequest;
			CURLcode					eCurlRet;
			JsonResult					eJsonRet;
			iXRResult					eReauthResult;
			PostObjectsResponseSuccess	objResponseSuccess;	// e.g. {"status":"all data reset"}
			PostObjectsResponseFailure	objResponseFailure;	// e.g. {"detail":"Invalid Login - Hash"}

			iXRLibAnalytics.SetHeadersFromCurrentState(objRequest, "", false, true);
			eCurlRet = objRequest.Delete(iXRLibAnalytics.FinalUrl(RESTEndpointFromType<T, iXRLibConfiguration>()).c_str(), vpszQueryParameters, szResponse);
			OUTPUTDEBUGSTRING(szResponse, "\n");
			if (eCurlRet == CURLE_OK)
			{
				eJsonRet = LoadFromJson(objResponseSuccess, szResponse);
				if (eJsonRet == JsonResult.eOk)
				{
					return iXRResult.eOk;
				}
				else
				{
					// Did not get success, does failure parse?
					eJsonRet = LoadFromJson(objResponseFailure, szResponse);
					if (eJsonRet == JsonResult.eOk)
					{
						// Failure parses, probably auth error.
						eReauthResult = iXRLibInit.ReAuthenticate(true);
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
			//WriteLine($"Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
			// ---
			return iXRResult.eDeleteObjectsFailed;
		}
		// ---
		return iXRResult.eOk;
	}
	// ---
	static iXRResult PostAuthenticate(const AuthTokenRequest& authTokenRequest, OUT mstringb& szResponse);
	// ---
	static iXRResult GetIXRConfig(OUT iXRLibConfiguration& ixrConfiguration);
	static iXRResult GetIXRStorage(OUT iXRXXXContainer<iXRStorage, PythonDictStrings>& ixrStorage);
	static iXRResult DeleteIXRStorageEntry(const mstringb& szName, OUT mstringb& szResponse);
	static iXRResult DeleteMultipleIXRStorageEntries(const bool bSessionOnly, OUT mstringb& szResponse);
	// ---
	static iXRResult PostIXREvents(const DbSet<iXREvent*>& listpEvents, bool bOneAtATime, OUT mstringb& szResponse);
	static iXRResult PostIXRAIProxyObjects(const DbSet<iXRAIProxy*>& listpAIProxyObjects, bool bOneAtATime, OUT mstringb& szResponse);
	static iXRResult PostIXRLogs(const DbSet<iXRLog*>& listpLogs, bool bOneAtATime, OUT mstringb& szResponse);
	static iXRResult PostIXRTelemetry(const DbSet<iXRTelemetry*>& listpTelemetry, bool bOneAtATime, OUT mstringb& szResponse);
	static iXRResult PostIXRAIProxy(const DbSet<iXRAIProxy*>& listpAIProxy, bool bOneAtATime, OUT mstringb& szResponse);
	static iXRResult PostIXRStorage(const DbSet<iXRStorage*>& listpStorage, bool bOneAtATime, OUT mstringb& szResponse);
	// ---
	static void WriteLine(mstringb szLine);
};

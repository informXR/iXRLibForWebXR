import { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { Agent } from 'https';
import { Guid  } from 'guid-typescript';
import { DataObjectBase, FieldProperties, FieldPropertiesRecordContainer } from './utils/DataObjectBase';

export const DATEMAXVALUE = 2222;
export const DATEMINVALUE = 1972;
export const DEFAULTNAME = "state";

export class Base64
{
    public static Decode = (str: string):Buffer => Buffer.from(str, 'base64');
    public static Encode = (buf: Buffer):string => buf.toString('base64');
}

export type time_t = number;

export class JsonScalarArrayElement<T> extends DataObjectBase
{
	public m_data:	T|null = null;
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_data: new FieldProperties("data")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return JsonScalarArrayElement.m_mapProperties;
	}
}

export function Sleep(nMilliseconds: number)
{
	return new Promise(resolve => setTimeout(resolve, nMilliseconds));
}

export enum Verb
{
	eGet,
	eDelete,
	eOptions,
	eHead,
	ePost,
	eHasBody = ePost,
	ePut,
	ePatch
};

/// <summary>
/// CURL-based HTTP client in the C++/TypeScript style.
/// </summary>
export class CurlHttp
{
	public m_objRequestHeaders:	Headers = new Headers();
	public m_objRequest:		Request = new Request("");
	public m_objResponse:		Response = new Response();
	public m_szLastError:		string = "";
	// ---
	public AddHttpHeader(szName: string, szValue: string) : void
	{
		this.m_objRequestHeaders.append(szName, szValue);
	}
	public AddHttpAuthHeader(szName: string, szValue: string): void
	{
		this.m_objRequestHeaders.append("Authorization", `${szName} ${szValue}`);
	}
	public Initialize(szUrl: string, vpszQueryParameters: Array<[string, string]>, eVerb: Verb, pmbBodyContent: Buffer | null, refparam: {szResponse: string}): boolean
	{
		var	szUrlWithQueryParameters:	string = "";

		this.m_objRequestHeaders = new Headers();
		this.m_objResponse = new Response();
		// ---
		if (vpszQueryParameters.length !== 0)
		{
			var	szQueryParams: string = "",
				szTemp: string = "";

			for (const [szKey, szValue] of vpszQueryParameters)
			{
				szTemp = `${(szQueryParams.length === 0) ? "" : "&"}${szKey}=${szValue}`;
				szQueryParams += szTemp;
			}
			szUrlWithQueryParameters = szUrl;
			szUrlWithQueryParameters += "?";
			szUrlWithQueryParameters += szQueryParams;
			szUrl = szUrlWithQueryParameters;
		}
		// --- Body content for POST-style verbs.
		if (pmbBodyContent)
		{
			// If eVerb not POST, custom set whatever body-content verb it is.
			switch (eVerb)
			{
			case Verb.ePut:
				this.m_objRequest = new Request(szUrl, {method: "PUT", headers: this.m_objRequestHeaders, body: pmbBodyContent});
				break;
			case Verb.ePatch:
				this.m_objRequest = new Request(szUrl, {method: "PATCH", headers: this.m_objRequestHeaders, body: pmbBodyContent});
				break;
			case Verb.ePost:
				this.m_objRequest = new Request(szUrl, {method: "POST", headers: this.m_objRequestHeaders, body: pmbBodyContent});
				break;
			default:
				break;
			}
		}
		else
		{
			// If eVerb not GET, custom set whatever non-body-content verb it is.
			switch (eVerb)
			{
			case Verb.eDelete:
				this.m_objRequest = new Request(szUrl, {method: "DELETE", headers: this.m_objRequestHeaders});
				break;
			case Verb.eOptions:
				this.m_objRequest = new Request(szUrl, {method: "OPTIONS", headers: this.m_objRequestHeaders});
				break;
			case Verb.eHead:
				this.m_objRequest = new Request(szUrl, {method: "HEAD", headers: this.m_objRequestHeaders});
				break;
			default:
				break;
			}
		}
		// ---
		return true;
	}
	public async Get(szUrl: string, vpszQueryParameters: Array<[string, string]>, refparam: {szResponse: string}): Promise<boolean>
	{
		try
		{
			if (this.Initialize(szUrl, vpszQueryParameters, Verb.eGet, null, {szResponse: refparam.szResponse}))
			{
				const objResponse:	Response = await fetch(this.m_objRequest);

				refparam.szResponse = await objResponse.text();
				// ---
				return true;
			}
		}
		catch (error: unknown)
		{
			this.m_szLastError = error instanceof Error ? error.message : String(error);
			// ---
			return false;
		}
		return false;
	}
	public async Post(szUrl: string, vpszQueryParameters: Array<[string, string]>, mbBodyContent: Buffer, refparam: {szResponse: string}): Promise<boolean>
	{
		try
		{
			if (this.Initialize(szUrl, vpszQueryParameters, Verb.ePost, mbBodyContent, {szResponse: refparam.szResponse}))
			{
				const objResponse:	Response = await fetch(this.m_objRequest);

				refparam.szResponse = await objResponse.text();
				// ---
				return true;
			}
		}
		catch (error: unknown)
		{
			this.m_szLastError = error instanceof Error ? error.message : String(error);
			// ---
			return false;
		}
		return false;
	}
	public async Delete(szUrl: string, vpszQueryParameters: Array<[string, string]>, refparam: {szResponse: string}): Promise<boolean>
	{
		try
		{
			if (this.Initialize(szUrl, vpszQueryParameters, Verb.eDelete, null, {szResponse: refparam.szResponse}))
			{
				const objResponse:	Response = await fetch(this.m_objRequest);

				refparam.szResponse = await objResponse.text();
				// ---
				return true;
			}
		}
		catch (error: unknown)
		{
			this.m_szLastError = error instanceof Error ? error.message : String(error);
			// ---
			return false;
		}
		return false;
	}
}

/// <summary>
/// GUID (globally-unique) conflicts with Windows(tm), UUID (universally-unique) also conflicts with a header file in Windows(tm).
/// SUID (solarsystemy-unique) does not conflict with anything.
/// </summary>
export class SUID
{
	public m_guid:	Guid = Guid.create();
	// ---
	constructor()
	{
		this.Create();
	}
	// SUID(const SUID& o)
	// {
	// 	operator=(o);
	// }
	// SUID& operator=(const SUID& o)
	// {
	// 	memcpy(m_pnData, o.m_pnData, sizeof(m_pnData));
	// 	// ---
	// 	return *this;
	// }
	private static hexStringToGuid(hexString: string): string
	{
		// Check if the hex string is valid.
		if (!/^[0-9a-f]{32}$/i.test(hexString))
		{
			throw new Error("Invalid hex string");
		}
		// Format the hex string into a GUID format.
		return '${hexString.slice(0, 8)}-${hexString.slice(8, 12)}-${hexString.slice(12, 16)}-${hexString.slice(16, 20)}-${hexString.slice(20)}';
	}
	public Construct(szHexString: string)
	{
		this.m_guid = Guid.parse(szHexString);
	}
	public Create(): void
	{
		this.m_guid = Guid.create();
	}
	FromHex(szHex: string): SUID
	{
		// ParseHex(szHex);
		// ---
		return this;
	}
	// ---
	// bool operator==(const SUID& o) const
	// {
	// 	return (*m_pnData == *o.m_pnData && m_pnData[1] == o.m_pnData[1]);
	// }
	// bool operator!=(const SUID& o) const
	// {
	// 	return !operator==(o);
	// }
	public MakeNull(): void
	{
		this.m_guid = Guid.createEmpty();
	}
	public IsNull(): boolean
	{
		return this.m_guid.isEmpty();
	}
	// template <typename CHAR> void ParseHex(const CHAR* szHex)
	// {
	// 	static intptr_t	pnOffsets[] = { 3, 2, 1, 0, 5, 4, 7, 6, 8, 9, 10, 11, 12, 13, 14, 15 };
	// 	uint8_t			*pThis = reinterpret_cast<uint8_t*>(this);
	// 	const intptr_t	*pn;
	// 	CHAR			szFiltered[33],
	// 					c;
	// 	const CHAR		*p;
	// 	CHAR			*d;
	// 	uint8_t			n;

	// 	// Filter out non-hex and normalize to capital.
	// 	for (p = szHex, d = szFiltered; *p && d < &szFiltered[32]; p++)
	// 	{
	// 		c = (sizeof(CHAR) == 1) ? (CHAR)toupper(*(const CHAR*)p) : (CHAR)towupper(*(const CHAR*)p);
	// 		if ((c >= CHAR('0') && c <= CHAR('9')) || (c >= CHAR('A') && c <= CHAR('F')))
	// 		{
	// 			*d++ = c;
	// 		}
	// 	}
	// 	*d = 0;
	// 	for (p = szFiltered, pn = pnOffsets; *p; )
	// 	{
	// 		n = ToHexByte<CHAR>(p);
	// 		pThis[*pn++] = n;
	// 	}
	// }
	// private static ToHexByte(const CHAR*& p): number
	// {
	// 	uint8_t	n = 0;
	// 	CHAR	c = *p++;

	// 	if (c)
	// 	{
	// 		n = (c >= CHAR('A')) ? c - CHAR('A') + 10 : c - CHAR('0');
	// 		c = *p++;
	// 		if (c)
	// 		{
	// 			n = (n << 4) | ((c >= CHAR('A')) ? c - CHAR('A') + 10 : c - CHAR('0'));
	// 		}
	// 	}
	// 	return n;
	// }
	/// <summary>
	/// Core ToString() function.  Coded it to memory layout on little-endian system.  May have to revisit later.
	/// For now, the ParseHex() and ToString() are symmetric in that (and every other) regard... only if some
	/// outside GUID parsing needs to interface will this possibly become a problem.
	/// </summary>
	/// <typeparam name="CHAR">char, wchar_t, TCHAR</typeparam>
	/// <param name="bJustHex">false = canonical with squiggleys and hyphens, true means just hex digits.</param>
	/// <returns>Hexified representation of GUID/UUID/SUID</returns>
	// private template <typename CHAR> basic_mstring<CHAR> ToStringGuts(const bool bJustHex) const
	// {
	// 	static intptr_t		pnOffsets[] = { 3, 2, 1, 0, -1, 5, 4, -1, 7, 6, -1, 8, 9, -1, 10, 11, 12, 13, 14, 15 };
	// 	const uint8_t		*pThis = reinterpret_cast<const uint8_t*>(this);
	// 	basic_mstring<CHAR>	szRet;
	// 	CHAR				szHex[4];

	// 	if (!bJustHex)
	// 	{
	// 		szRet = (sizeof(CHAR) == 1) ? (CHAR*)"{" : (CHAR*)L"{";
	// 	}
	// 	for (const intptr_t nOffset : pnOffsets)
	// 	{
	// 		if (nOffset >= 0)
	// 		{
	// 			(sizeof(CHAR) == 1) ? sprintf_s<cardinalityof(szHex)>((char(&)[4])szHex, "%02X", pThis[nOffset]) : swprintf_s<cardinalityof(szHex)>((wchar_t(&)[4])szHex, L"%02X", pThis[nOffset]);
	// 			szRet += szHex;
	// 		}
	// 		else if (!bJustHex)
	// 		{
	// 			szRet += (sizeof(CHAR) == 1) ? (CHAR*)"-" : (CHAR*)L"-";
	// 		}
	// 	}
	// 	if (!bJustHex)
	// 	{
	// 		szRet += (sizeof(CHAR) == 1) ? (CHAR*)"}" : (CHAR*)L"}";
	// 	}
	// 	// ---
	// 	return szRet;
	// }
	public ToString(): string
	{
		// return ToStringGuts<CHAR>(false);
		return "";
	}
	public ToStringPureHex(): string
	{
		// return ToStringGuts<CHAR>(true);
		return "";
	}
};

export class Regex
{
	// Simple... is there a match anywhere in the string.
	static Contains(data: string, regex: RegExp): boolean
	{
		return regex.test(data);
	}
	// First match from the beginning of the string, if any.
	static FirstMatch(szData: string, rxRegex: RegExp): {match: string, range: [number, number]} | null
	{
		const raMatch:	RegExpMatchArray | null = szData.match(rxRegex);

		if (!raMatch)
		{
			return null;
		}
		return {match: raMatch[0], range: [raMatch.index!, raMatch.index! + raMatch[0].length]};
	}
	/// <summary>
	///		Drill down regexing through vrxszRegexLevels... i.e. vrxszRegexLevels[0] produces an array of matches, for each of those run vrxszRegexLevels[1], for each of those...
	///		Then take the non-empty leaf node(s) and chew through using pbrxszRegexes, tossing the ones with false in the pair, accruing the ones with true in the pair.
	/// </summary>
	/// <param name="szData">String in which to search for matches</param>
	/// <param name="vrxszRegexLevels">Regular expressions to drill down into desired matches... i.e. first level acquires set of matches, second level matches into those, third level matches into second level...</param>
	/// <param name="pbrxszRegexes">pairs of <bool, regex-string> to chew through the matches from vrxszRegexLevels... keep the true ones, discard the false ones</param>
	/// <param name="vszMatches">Matches from the true pbrxszRegexes</param>
	/// <returns>true if there are matches, false if empty set</returns>
	static ProgressiveMatch(szData: string, vrxszRegexLevels: RegExp[], pbrxszFilterRegexes: Array<[boolean, RegExp]>): string[]
	{
		let vszCurrentMatches = [szData];
		const vszMatches:	string[] = [];

		// Drill down through regex levels.
		for (const regex of vrxszRegexLevels)
		{
			if (vszCurrentMatches.length === 0)
			{
				break;
			}
			const vszNextMatches: string[] = [];
			for (const text of vszCurrentMatches)
			{
				const found = text.match(new RegExp(regex, 'g')) || [];
				vszNextMatches.push(...found);
			}
			vszCurrentMatches = vszNextMatches;
		}
		// Process final matches through filter regexes.
		for (const szText of vszCurrentMatches)
		{
			let szCurrentText = szText;
			let bAllMatched = true;

			for (const [bKeep, rxRegex] of pbrxszFilterRegexes)
			{
				const szrMatch = this.FirstMatch(szCurrentText, rxRegex);

				if (!szrMatch)
				{
					bAllMatched = false;
					break;
				}
				if (bKeep)
				{
					vszMatches.push(szrMatch.match);
				}
				szCurrentText = szCurrentText.slice(szrMatch.range[1]);
			}
		}
		return vszMatches;
	}
	/// <summary>
	/// Algorithm summary:
	///		Drill down regexing through vrxszRegexLevels... i.e. vrxszRegexLevels[0] produces an array of matches, for each of those run vrxszRegexLevels[1], for each of those...
	///		Then take the non-empty leaf node(s) and truncate rxszRegexPrefix and rxszPostFix and vszMatches are results of all of those.
	/// High-level summary:
	///		Hone in on substrings per vrxszRegexLevels then get at the meat in between what is bracketing it on the left and right.
	/// </summary>
	/// <param name="szData">String in which to search for matches</param>
	/// <param name="vrxszRegexLevels">Regular expressions to drill down into desired matches... i.e. first level acquires set of matches, second level matches into those, third level matches into second level...</param>
	/// <param name="rxszRegexPrefix">On final level matches, lop off left to trim to absolute final match</param>
	/// <param name="rxszRegexPostfix">On final level matches, lop off right to trim to absolute final match</param>
	/// <param name="vszMatches">Bottom line matches from all of above</param>
	/// <returns>true if found any, false if empty set</returns>
	static DeepMatch(szData: string, vrxszRegexLevels: RegExp[], rxPrefixRegex: RegExp, rxPostfixRegex: RegExp): string[]
	{
		let vszCurrentMatches = [szData];
		const vszMatches: string[] = [];

		// Drill down through regex levels.
		for (const rxszRegex of vrxszRegexLevels)
		{
			if (vszCurrentMatches.length === 0)
			{
				break;
			}
			const vszNextMatches: string[] = [];
			for (const szText of vszCurrentMatches)
			{
				const szFound = szText.match(new RegExp(rxszRegex, 'g')) || [];
				vszNextMatches.push(...szFound);
			}
			vszCurrentMatches = vszNextMatches;
		}
		// Process final matches - remove prefix and postfix.
		for (const szText of vszCurrentMatches)
		{
			const szPrefixMatch = this.FirstMatch(szText, rxPrefixRegex);
			const szStartIndex = szPrefixMatch ? szPrefixMatch.range[1] : 0;
			const szRemainingText = szText.slice(szStartIndex);
			const szPostfixMatch = this.FirstMatch(szRemainingText, rxPostfixRegex);
			const szEndIndex = szPostfixMatch ? szPostfixMatch.range[0] : szRemainingText.length;
			const szFinalMatch = szRemainingText.slice(0, szEndIndex);

			vszMatches.push(szFinalMatch);
		}
		return vszMatches;
	}
}

export function atol(str: string): number
{
	return parseInt(str, 10);
}

export function atobool(str: string): boolean
{
	return str === "true";
}

export function atoi(str: string): number
{
	return parseInt(str, 10);
}

export function atof(str: string): number
{
	return parseFloat(str);
}

// ---

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryableStatuses: number[];
}

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retryConfig?: RetryConfig;
  httpsAgent?: Agent;
}

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type ApiErrorResponse = {
  data: any;
  status: number;
  statusText: string;
};

// New types for API requests and responses
export interface AuthenticationRequestSchema {
  appId: string;
  orgId: string;
  deviceId: string;
  authSecret: string;
  userId?: string;
  tags?: string[];
  sessionId?: string;
  partner?: string;
  ipAddress?: string;
  deviceModel?: string;
  geolocation?: Record<string, any>;
  osVersion?: string;
  xrdmVersion?: string;
  appVersion?: string;
}

export interface AuthenticationResponseSchema {
  token: string;
  secret: string;
}

export interface EventSchemaNested {
  timestamp: string;
  name: string;
  meta?: Record<string, any>;
  [key: string]: any;
}

export interface EventSchema {
  data: EventSchemaNested[];
}

export interface NestedLogSchema {
  timestamp: string;
  logLevel?: string;
  text?: string;
  meta?: Record<string, any>;
  [key: string]: any;
}

export interface LogSchema {
  data: NestedLogSchema[];
}

export interface TelemetryNestedSchema {
  timestamp: string;
  name: string;
  data: Record<string, any>;
  [key: string]: any;
}

export interface TelemetrySchema {
  data: TelemetryNestedSchema[];
}

export interface MessageSchema {
  role: string;
  content: string;
}

export interface PromptSchema {
  prompt: string;
  llmProvider?: string;
  pastMessages?: MessageSchema[];
}

export interface NestedStorageSchema {
  timestamp: string;
  keepPolicy?: string;
  name: string;
  data: Record<string, any>[];
  origin?: string;
  sessionData?: boolean;
  [key: string]: any;
}

export interface StorageSchema {
  data: NestedStorageSchema[];
}

// API client method types
export interface ApiClient {
  get: <T>(url: string, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  delete: <T>(url: string, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  auth: {
    token: (authData: AuthenticationRequestSchema) => Promise<void>;
    ping: () => Promise<ApiResponse<void>>;
  };
  config: {
    get: () => Promise<ApiResponse<any>>;
  };
  collect: {
    event: (data: EventSchema) => Promise<ApiResponse<{ status: string }>>;
    log: (data: LogSchema) => Promise<ApiResponse<{ status: string }>>;
    telemetry: (data: TelemetrySchema) => Promise<ApiResponse<{ status: string }>>;
  };
  services: {
    llm: (data: PromptSchema) => Promise<ApiResponse<any>>;
  };
  storage: {
    store: (data: StorageSchema) => Promise<ApiResponse<void>>;
    get: (params?: { name?: string; origin?: string; tagsAny?: string[]; tagsAll?: string[]; userOnly?: boolean }) => Promise<ApiResponse<StorageSchema>>;
    reset: (params?: { sessionOnly?: boolean; name?: string; userOnly?: boolean }) => Promise<ApiResponse<{ status: string }>>;
    getConfig: () => Promise<ApiResponse<any>>;
  };
}

import { AxiosRequestConfig } from 'axios';
import { Agent } from 'https';
import { Guid  } from 'guid-typescript';

export const DATEMAXVALUE = 2222;
export const DATEMINVALUE = 1972;

export class Base64
{
    public static Decode = (str: string):Buffer => Buffer.from(str, 'base64');
    public static Encode = (buf: Buffer):string => buf.toString('base64');
}

export type time_t = number;

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
	SUID(const char* szHexString)
	{
		operator=(szHexString);
	}
	SUID(const wchar_t* wszHexString)
	{
		operator=(wszHexString);
	}
#ifdef _UNIX
	void generate_uuid_v4(unsigned char uuid[16])
	{
            std::random_device rd;
            std::mt19937 gen(rd());
            std::uniform_int_distribution<uint8_t> dis(0, 255);

	    for (int i = 0; i < 16; ++i)
	    {
                uuid[i] = dis(gen);
            }

            // Set the version to 4 -> uuid[6] = 0b0100xxxx
            uuid[6] = (uuid[6] & 0x0F) | 0x40;

            // Set the variant to 10 -> uuid[8] = 0b10xxxxxx
            uuid[8] = (uuid[8] & 0x3F) | 0x80;
        }
#endif
	void Create()
	{
		this.m_guid = Guid.create();
	}
	template <typename CHAR> SUID& operator=(const CHAR* szHex)
	{
		ParseHex(szHex);
		// ---
		return *this;
	}
	// ---
	bool operator==(const SUID& o) const
	{
		return (*m_pnData == *o.m_pnData && m_pnData[1] == o.m_pnData[1]);
	}
	bool operator!=(const SUID& o) const
	{
		return !operator==(o);
	}
	void MakeNull()
	{
		*m_pnData = m_pnData[1] = 0ull;
	}
	bool IsNull() const
	{
		const uint64_t* pThis = reinterpret_cast<const uint64_t*>(this);

		return (*pThis == 0ull && pThis[1] == 0ull);
	}
	template <typename CHAR> void ParseHex(const CHAR* szHex)
	{
		static intptr_t	pnOffsets[] = { 3, 2, 1, 0, 5, 4, 7, 6, 8, 9, 10, 11, 12, 13, 14, 15 };
		uint8_t			*pThis = reinterpret_cast<uint8_t*>(this);
		const intptr_t	*pn;
		CHAR			szFiltered[33],
						c;
		const CHAR		*p;
		CHAR			*d;
		uint8_t			n;

		// Filter out non-hex and normalize to capital.
		for (p = szHex, d = szFiltered; *p && d < &szFiltered[32]; p++)
		{
			c = (sizeof(CHAR) == 1) ? (CHAR)toupper(*(const CHAR*)p) : (CHAR)towupper(*(const CHAR*)p);
			if ((c >= CHAR('0') && c <= CHAR('9')) || (c >= CHAR('A') && c <= CHAR('F')))
			{
				*d++ = c;
			}
		}
		*d = 0;
		for (p = szFiltered, pn = pnOffsets; *p; )
		{
			n = ToHexByte<CHAR>(p);
			pThis[*pn++] = n;
		}
	}
private:
	template <typename CHAR> static constexpr uint8_t ToHexByte(const CHAR*& p)
	{
		uint8_t	n = 0;
		CHAR	c = *p++;

		if (c)
		{
			n = (c >= CHAR('A')) ? c - CHAR('A') + 10 : c - CHAR('0');
			c = *p++;
			if (c)
			{
				n = (n << 4) | ((c >= CHAR('A')) ? c - CHAR('A') + 10 : c - CHAR('0'));
			}
		}
		return n;
	}
	/// <summary>
	/// Core ToString() function.  Coded it to memory layout on little-endian system.  May have to revisit later.
	/// For now, the ParseHex() and ToString() are symmetric in that (and every other) regard... only if some
	/// outside GUID parsing needs to interface will this possibly become a problem.
	/// </summary>
	/// <typeparam name="CHAR">char, wchar_t, TCHAR</typeparam>
	/// <param name="bJustHex">false = canonical with squiggleys and hyphens, true means just hex digits.</param>
	/// <returns>Hexified representation of GUID/UUID/SUID</returns>
	template <typename CHAR> basic_mstring<CHAR> ToStringGuts(const bool bJustHex) const
	{
		static intptr_t		pnOffsets[] = { 3, 2, 1, 0, -1, 5, 4, -1, 7, 6, -1, 8, 9, -1, 10, 11, 12, 13, 14, 15 };
		const uint8_t		*pThis = reinterpret_cast<const uint8_t*>(this);
		basic_mstring<CHAR>	szRet;
		CHAR				szHex[4];

		if (!bJustHex)
		{
			szRet = (sizeof(CHAR) == 1) ? (CHAR*)"{" : (CHAR*)L"{";
		}
		for (const intptr_t nOffset : pnOffsets)
		{
			if (nOffset >= 0)
			{
				(sizeof(CHAR) == 1) ? sprintf_s<cardinalityof(szHex)>((char(&)[4])szHex, "%02X", pThis[nOffset]) : swprintf_s<cardinalityof(szHex)>((wchar_t(&)[4])szHex, L"%02X", pThis[nOffset]);
				szRet += szHex;
			}
			else if (!bJustHex)
			{
				szRet += (sizeof(CHAR) == 1) ? (CHAR*)"-" : (CHAR*)L"-";
			}
		}
		if (!bJustHex)
		{
			szRet += (sizeof(CHAR) == 1) ? (CHAR*)"}" : (CHAR*)L"}";
		}
		// ---
		return szRet;
	}
public:
	template <typename CHAR> basic_mstring<CHAR> ToString() const
	{
		return ToStringGuts<CHAR>(false);
	}
	template <typename CHAR> basic_mstring<CHAR> ToStringPureHex() const
	{
		return ToStringGuts<CHAR>(true);
	}
};

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

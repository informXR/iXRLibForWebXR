/// <summary>
/// MJP adapted from MIT licensed https://github.com/dongbum/URLParser/blob/master/src/
/// </summary>
//class URLParserFunction
//{
//public:
//	static bool FindKeyword(const std::string& input_url, size_t& st, size_t& before, const std::string& delim, std::string& result)
//	{
//		char	temp[1024] = { 0, };
//		size_t	temp_st = st;

import { atoi } from "../types";

//		memcpy(&temp_st, &st, sizeof(temp_st));

//		st = input_url.find(delim, before);
//		if (st === std::string::npos)
//		{
//			st = temp_st;
//			return false;
//		}

//		memcpy(&temp[0], &input_url[before], st - before);
//		before = st + delim.length();

//		result = std::string(temp);
//		if (result.empty())
//		{
//			return false;
//		}
//		return true;
//	}
//	static bool SplitQueryString(const std::string& str, const std::string& delim, std::string& key, std::string& value)
//	{
//		char	first[1024] = { 0, };
//		char	second[1024] = { 0, };
//		size_t	st = str.find(delim, 0);

//		memcpy(first, &str[0], st);
//		memcpy(second, &str[st + 1], str.length() - st);

//		key = std::string(first);
//		value = std::string(second);

//		return true;
//	}
//};

type querymap = { [key: string]: string };

export class HTTP_URL
{
	public m_szScheme:		string = "";
	public m_szHost:		string = "";
	public m_szPort:		string = "";
	public m_szHostAndPort:	string = "";		// Calculated.
	public m_nPort:			number = 0;			// Calculated.
	public m_vszPath:		Array<string> = [];
	public m_szQueryString:	string = "";
	public m_mapszQuery:	querymap = {};
	// ---
	// MJP:  Set defaults when certain fields are parsed as empty.
	public TidyUp(): void
	{
		if (this.m_szScheme.length === 0)
		{
			if (this.m_szPort.length === 0)
			{
				this.m_szScheme = "http";
				this.m_szPort = "80";
			}
			else
			{
				this.m_szScheme = (this.m_szPort === "443") ? "https" : "http";
			}
		}
		if (this.m_szPort.length === 0)
		{
			this.m_szPort = (this.m_szScheme === "https") ? "443" : "80";
		}
		this.m_nPort = atoi(this.m_szPort);
	}
	public HostAndPort(): string
	{
		this.m_szHostAndPort = `${this.m_szHost}:${this.m_nPort}`;
		// ---
		return this.m_szHostAndPort;
	}
};

export class URLParser
{
	public static Parse(input_url: string): HTTP_URL
	{
		let http_url:	HTTP_URL = new HTTP_URL();
		const objURL:	URL = new URL(input_url);

		http_url.m_szScheme = objURL.protocol;
		http_url.m_szHost = objURL.hostname;
		http_url.m_szPort = objURL.port;
		http_url.m_vszPath = objURL.pathname.split("/");
		http_url.m_szQueryString = objURL.search;
		// ---
		if (objURL.search.length > 0)
		{
			for (const [key, value] of objURL.searchParams.entries())
			{
				http_url.m_mapszQuery[key] = value;
			}
		}
		http_url.TidyUp();
		// ---
		return http_url;
	};
};

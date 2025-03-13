//void TestJsonParsing()
//{
//	mstringb					szJson,
//								szTemp,
//								szErr,
//								szErrorJsonFromAuth;
//	std.stringstream			ssJson;
//	JsonResult					eRet = JsonResult.eOk;
//	iXRDbContext				objDbContext;
//	AuthTokenResponseFailure	objAuthTokenResponseFailure;
//	std.set<mstringb>			sszErrors;

import { iXRLibAnalytics, iXRLibInit, iXRLibAnalyticsGeneralCallback } from "../iXRLibAnalytics"
import { iXRAIProxy, iXRBase, iXREvent, iXRLibConfiguration, iXRLog, iXRStorage, iXRTelemetry } from "../iXRLibCoreModel";
import { iXRLibStorage } from "../iXRLibStorage";
import { DbSet } from "../network/utils/DataObjectBase";
import { SIZE_MAX, Sleep, SyncEvent } from "../network/types";
import { iXRResult, TimeSpan } from "../network/utils/DotNetishTypes"
import { iXRLibClient, Partner } from "../iXRLibClient";

//#ifdef _UNIX
//	if (szErrorJsonFromAuth.LoadFromFile(_T("../iXRTestData/AuthReturnedError.json")))
//#else
//	if (szErrorJsonFromAuth.LoadFromFile("..\\iXRTestData\\AuthReturnedError.json"))
//#endif // _UNIX
//	{
//		ssJson << szErrorJsonFromAuth;
//		json objARFJson = json.parse(ssJson);
//		eRet = LoadFromJson(objAuthTokenResponseFailure, "", objARFJson, sszErrors);
//		recursive_iterate(objAuthTokenResponseFailure, 0, "", objARFJson.items(), [](detail.iteration_proxy_value<detail.iter_impl<const json>>& it)->void
//			{
//				mstringb	szKey = it.key();
//				it.value();
//			});
//	}
//#ifdef _UNIX
//	if (szJson.LoadFromFile(_T("../iXRTestData/Test01.json")))
//#else
//	if (szJson.LoadFromFile("..\\iXRTestData\\Test01.json"))
//#endif // _UNIX
//	{
//		InPlaceRefresh<std.stringstream>(ssJson);
//		ssJson << szJson;
//		//std.ifstream fs("C:\\ztest\\InformXR\\Test01.json");
//		json objJson = json.parse(ssJson);
//		eRet = LoadFromJson(objDbContext, "", objJson.items(), sszErrors);
//		if (!JsonSuccess(eRet))
//		{
//			cout << "LoadFromJson on DbContext failed with " << unsigned(eRet) << endl;
//		}
//		szTemp = "";
//		szTemp = GenerateJson(objDbContext, DumpCategory.eDumpEverything);
//		if (strcmp(szTemp, szJson) != 0)
//		{
//            szErr.Format("Loaded length is %d\n", szJson.length());
//			OutputDebugStringA(szErr);
//            szErr.Format("Parsed length is %d\n", szTemp.length());
//			OutputDebugStringA(szErr);
//			//szJson.SaveToFile("~/szJson.txt");
//			//szTemp.SaveToFile("~/szTemp.txt");
//		}
//		//OutputDebugStringA(szJson);
//		recursive_iterate(objDbContext, 0, "", objJson.items(), [](detail.iteration_proxy_value<detail.iter_impl<const json>>& it)->void
//			{
//				mstringb	szKey = it.key();
//				it.value();
//			});
//		auto objItems = objJson.items();
//		for (auto& d : objJson.items())
//		{
//			szTemp = d.key();
//			switch (d.value().type())
//			{
//			case json.value_t.null:
//				break;
//			case json.value_t.object:
//				break;
//			case json.value_t.array:
//				//for (auto& o : d.value().array().items())
//				//{
//				//	szTemp = "l";
//				//	szTemp += "x";
//				//}
//				break;
//			case json.value_t.string:
//				break;
//			case json.value_t.boolean:
//				break;
//			case json.value_t.number_integer:
//				break;
//			case json.value_t.number_unsigned:
//				break;
//			case json.value_t.number_float:
//				break;
//			case json.value_t.binary:
//				break;
//			case json.value_t.discarded:
//				break;
//			}
//		}
//	}
//}

/// <summary>
/// This gets called by int main(argc, argv) or the C# equivalent via interop
///		and does a bunch of tests of the various ancillaries (SHA256, Base64,
///		JSON parsing, database, etc) after calling glavnaya() which is the
///		function above which runs tests specified by the command line params.
/// </summary>
/// <param name="argc"></param>
/// <param name="argv"></param>
//int iXRLibAnalyticsTests.iXRLibAnalyticsTestsMain(int argc, char* argv[])
//{
//	int		nRet = glavnaya(argc, argv);

//	if (nRet < 0)
//	{
//		return nRet;
//	}
//	// ---
//	vector<mstringb>		vszUrls =
//	{
//		"http://www.somesite.com/blah.php",
//		"https://www.somesite.com/blah.php?x=3&y=4",
//		"www.somesite.com:19080/dir1/dir2/blah.php",
//		"https://www.somesite.com:19080/blah.php?x=3&y=4#anchor",
//		"http://www.somesite.com/",
//		"https://www.somesite.com:19080"
//	};
//	iXRDbContext			objDbContext(false);
//	DateTime				dt = DateTime.Now();
//	mstringb				szNow;
//	mstringw				wszNow;
//	mstringb				szAppConfigField;
//	mstringb				szSHA256;
//	mstringb				szSomethingToHash = "I was in a printing house in hell and saw the method by which knowledge is transmitted from one generation to the next.";
//	SHA256					objSHA256;	// MJP NOTE:  There is a SHA256 in openssl, maybe switch to that someday to streamline code?  Not urgent.
//	mstringb				szBase64SHA256;
//	mbinary					mbUnbase64SHA256;
//	std.array<uint8_t, 32>	aUnbase64SHA256;
//	mstringb				szUnbase64SHA256;
//	mstringb				szAppConfig;
//	mbinary					mbTemp;
//	mbinary					mbDecoded;
//	mstringw				wszPycckuu = L"зеленый grass голубой sky";
//	mstringb				szTemp,
//							szError;
//	mstring16				sz16Temp;
//	mstringw				wszTemp;
//	SUID					suid,
//							suidOther;
//	GUID					guid,
//							guidOther;
//	vector<mstringb>		vszMatches,
//							vszErrors,
//							vszCreateTables;
//	size_t					i,
//							j,
//							nLength;
//	TimeSpan				ts;
//	uint8_t					b;
//	Random					rnd;
//	SqliteDbConnection		db;
//	DatabaseResult			eDb;
//	// --- HMAC_SHA256 data.
//	mstringb				szKey = "key",
//							szValue = "The quick brown fox jumps over the lazy dog";
//	std.array<uint8_t, 32>	pbOut;
//	mstringb				szWhatWikipediaSaysResultShouldBe = "F7BC83F430538424B13298E6AA6FB143EF4D59A14946175997479DBC2D1A3CD8";
//	Partner					ePartner;

//	ePartner = StringToPartner("arborxr");
//	ePartner = StringToPartner("None");
//	ePartner = StringToPartner("NotGonnaFindThisOne");
//	// ---
//	HMAC_SHA256.ComputeHash(szKey, szKey.length(), szValue, szValue.length(), pbOut.data(), pbOut.size());
//	if (mstringb.to_hex_string(pbOut.data(), pbOut.size()) != szWhatWikipediaSaysResultShouldBe)
//	{
//		cout << "Error: HMAC_SHA256 test failed." << endl;
//	}
//	JWTTest1();
//	// ---
//	if (true)
//	{
//		iXRDictStrings	dictFirst,
//							dictSecond,
//							dictThird("var1=value1"),
//							dictFourth("var1=value1,var2=value2,var3="),
//							dictFifth("var1=value1,var2 = value2,var3"),
//							dictSixth("var1=value1, var2 = value2, var3 = value3");

//		dictFirst.Add("magic", "missile");
//		dictFirst.Add("attack", "darkness");
//		dictFirst.Add("grey", "hair");
//		dictFirst.Add("blue", "eyes");
//		dictFirst.SerializeToBinary();
//		// ---
//		dictSecond.m_mbBinaryData = dictFirst.m_mbBinaryData;
//		dictSecond.DeserializeFromBinary();
//		b = 6;
//	}
//	TestJsonParsing();
//	// String conversions.
//	szTemp = wszPycckuu.to_bstring();
//	sz16Temp = wszPycckuu.to_string16();
//	sz16Temp = szTemp.to_string16();
//	wszTemp = szTemp.to_wstring();
//	wszTemp = sz16Temp.to_wstring();
//	szTemp = sz16Temp.to_bstring();
//	// Base64 corner cases.
//	szTemp = Base64.Encode(nullptr, 0);
//	Base64.Decode(szTemp, mbTemp);
//	for (i = 0; i < 256; i++)
//	{
//		b = (uint8_t)i;
//		szTemp = Base64.Encode(&b, 1);
//		Base64.Decode(szTemp, mbTemp);
//		if (mbTemp.size() != 1 || *(const uint8_t*)mbTemp != b)
//		{
//			cout << "Error: " << b << " should be " << i << " from " << szTemp << endl;
//		}
//		//cout << i << "\t" << szTemp << endl;
//	}
//	// Random samples from non-corner-case-space.
//	for (i = 0; i < 256; i++)
//	{
//		nLength = rnd.Next(2, 255);
//		mbTemp.resize(nLength);
//		for (j = 0; j < nLength; j++)
//		{
//			mbTemp.data()[j] = (uint8_t)rnd.Next(256);
//		}
//		szTemp = Base64.Encode(mbTemp, nLength);
//		szError = Base64.Decode(szTemp, mbDecoded);
//		if (szError.length() != 0)
//		{
//			cout << "Error: Base64.Decode() returned error " << szError << endl;
//		}
//		if (mbDecoded.size() != mbTemp.size() || memcmp(mbDecoded, mbTemp, nLength) != 0)
//		{
//			cout << "Error: Base64.Decode() asymmetry." << endl;
//		}
//		//cout << i << "\t" << szTemp << endl;
//	}
//	// ---
//	ts = TimeSpan.Parse(mstringb("1.01:30:05"));
//	ts = TimeSpan.Parse(mstringb("13:25:32"));
//	ts = 3600.0;
//	// ---
//	size_t x = sizeof(ts);
//	x = sizeof(dt);
//	szTemp.Format("%s\n", dt.ToString());
//	OutputDebugStringA(szTemp);
//	dt += ts;
//	szTemp.Format("%s\n", dt.ToString());
//	OutputDebugStringA(szTemp);
//	dt -= ts;
//	szTemp.Format("%s\n", dt.ToString());
//	OutputDebugStringA(szTemp);
//	// ---
//	dt = DateTime(1983, 9, 4, 21, 0, 0);
//	szTemp.Format("%s\n", dt.ToString());
//	OutputDebugStringA(szTemp);
//	// ---
//	dt = DateTime(1983, 9, 4, 21, 0, 0);
//	dt += TimeSpan(24, 0, 0);
//	szTemp.Format("%s\n", dt.ToString());
//	OutputDebugStringA(szTemp);
//	// ---
//	dt = DateTime(1983, 9, 4, 21, 0, 0);
//	dt -= TimeSpan(24, 0, 0);
//	szTemp.Format("%s\n", dt.ToString());
//	OutputDebugStringA(szTemp);
//	// ---
//	dt = DateTime(1983, 9, 4, 21, 0, 0, 345);
//	dt += TimeSpan(1, 0, 0, 0);
//	szTemp.Format("%s\n", dt.ToString());
//	OutputDebugStringA(szTemp);
//	// ---
//	dt = DateTime(1983, 9, 4, 21, 0, 0);
//	dt -= TimeSpan(1, 0, 0, 0);
//	szTemp.Format("%s\n", dt.ToString());
//	OutputDebugStringA(szTemp);
//	// ---
//	newscope
//	{
//		std.vector<mstringb>	vecTestDates =
//		{
//			"1983-9-4 9:30:45 AM",
//			"1983-9-4 21:30:45 AM",
//			"1983-09-04 9:30:45 PM",
//			"1983/09/04 09:30:45 PM",
//			// ---
//			"1983-9-4 9:30:45.123 AM",
//			"1983-9-4 21:30:45.456 AM",
//			"1983-09-04 9:30:45.78 PM",
//			"1983/09/04 09:30:45.9 PM",
//			// ---
//			"1983-09-04 21:30:45",
//			"1983/09/04 21:30:45",
//			"1983/9/4 21:30:45",
//			"1983-9-4 21:30:45",
//			// ---
//			"1983-09-04 21:30:45.123",
//			"1983/09/04 21:30:45.456",
//			"1983/9/4 21:30:45.78",
//			"1983-9-4 21:30:45.9",
//			// ---
//			"9-4-1983 9:30:45 PM",
//			"9/4/1983 21:30:45 AM",
//			"09-04-1983 21:30:45 PM",
//			"9-04-1983 9:30:45 PM",
//			// ---
//			"9-4-1983 9:30:45.123 PM",
//			"9/4/1983 21:30:45.456 AM",
//			"09-04-1983 21:30:45.78 PM",
//			"9-04-1983 9:30:45.9 PM",
//			// ---
//			"9-4-1983 21:30:45",
//			"9/4/1983 21:30:45",
//			"09-04-1983 21:30:45",
//			"09/04/1983 21:30:45",
//			// ---
//			"9-4-1983 21:30:45.123",
//			"9/4/1983 21:30:45.456",
//			"09-04-1983 21:30:45.78",
//			"09/04/1983 21:30:45.9"
//		};

//		for (const mstringb& sz : vecTestDates)
//		{
//			dt = DateTime.Parse(sz);
//			szTemp.Format("%s parsed from %s\n", dt.ToLocalTimeString(), sz);
//			OutputDebugStringA(szTemp);
//		}
//	}
//	// ---
//	szNow = dt.ToString();
//	wszNow = dt.ToString();
//	szAppConfigField = ConfigurationManager.AppSettings("SendNextBatchWait", "00:00:30");
//	szAppConfigField = ConfigurationManager.AppSettings("MaximumCachedItems", "16777216");
//	szAppConfigField = ConfigurationManager.AppSettings("AintGonnaFindThis", "StimpsonJavierGato");
//	szSHA256 = SHA256.ToString(objSHA256.ComputeHash(szSomethingToHash));
//	szBase64SHA256 = Base64.Encode(objSHA256.ComputeHash(szSomethingToHash).data(), 32);
//	Base64.Decode(szBase64SHA256, mbUnbase64SHA256);
//	memcpy(aUnbase64SHA256.data(), mbUnbase64SHA256, 32);
//	szUnbase64SHA256 = SHA256.ToString(aUnbase64SHA256);
//#ifdef _UNIX
//	if (szAppConfig.LoadFromFile("../iXRTestData/App.config"))
//#else
//	if (szAppConfig.LoadFromFile("..\\iXRTestData\\App.config"))
//#endif // _UNIX
//	{
//		CSREGEXB.DeepMatch(szAppConfig, { R"(<add[\s]+key[\s]*=[\s]*".*"[\s]+value[\s]*=[\s]*".*"[\s]*[/]?[\s]*>)", R"(value[\s]*=[\s]*".*"[\s]*[/]?[\s]*>)" }, R"(value[\s]*=[\s]*")", R"("[\s]*[/]?[\s]*>)", vszMatches);
//	}
//	szTemp.Format("blah %s blah", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
//	wszTemp.Format(L"blah %s blah", L"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
//	for (const mstringb& sz : vszUrls)
//	{
//		URLParser.HTTP_URL	url = URLParser.Parse(sz);

//		szTemp.Format("\"%s\":  Scheme = \"%s\", Host = \"%s\", Port = \"%s\", QueryString = \"%s\"\n", sz, url.m_szScheme, url.m_szHost, url.m_szPort, url.m_szQueryString);
//		OutputDebugString(mstringt(szTemp));
//	}
//	// ---
//	objDbContext.FakeUpSomeRandomCrap();
//	szTemp = GenerateJson(objDbContext, DumpCategory.eDumpEverything);
//	cout << szTemp;
//	//szTemp.SaveToFile(_T("C:\\ztest\\InformXR\\Test01.json"));
//	// --- GUID tests.
//	memcpy(&guid, &suid, sizeof(guid));
//	// ---
//	wszTemp = suid.ToString<wchar_t>();
//	suidOther.ParseHex<wchar_t>(wszTemp);
//	memcpy(&guidOther, &suidOther, sizeof(guid));
//	if (memcmp(&suid, &suidOther, sizeof(SUID)) != 0)
//	{
//		OutputDebugStringA("Bummer.\n");
//	}
//	// ---
//	szTemp = suid.ToString<char>();
//	suidOther.ParseHex<char>(szTemp);
//	memcpy(&guidOther, &suidOther, sizeof(guid));
//	if (memcmp(&suid, &suidOther, sizeof(SUID)) != 0)
//	{
//		OutputDebugStringA("Bummer.\n");
//	}
//	// ---
//	wszTemp = suid.ToStringPureHex<wchar_t>();
//	suidOther.ParseHex<wchar_t>(wszTemp);
//	memcpy(&guidOther, &suidOther, sizeof(guid));
//	if (memcmp(&suid, &suidOther, sizeof(SUID)) != 0)
//	{
//		OutputDebugStringA("Bummer.\n");
//	}
//	// ---
//	szTemp = suid.ToStringPureHex<char>();
//	suidOther.ParseHex<char>(szTemp);
//	memcpy(&guidOther, &suidOther, sizeof(guid));
//	if (memcmp(&suid, &suidOther, sizeof(SUID)) != 0)
//	{
//		OutputDebugStringA("Bummer.\n");
//	}
//	// ---
//	GenerateCreateSchema(nullptr, objDbContext, vszCreateTables);
//#ifdef _UNIX
//	if (db.ConnectSQLite("../iXRTestData/InformXR.db") == DatabaseResult.eOk)
//#else
//	if (db.ConnectSQLite("..\\iXRTestData\\InformXR.db") == DatabaseResult.eOk)
//#endif // _UNIX
//	//if (db.ConnectSQLite("C:\\ztest\\InformXR\\test.db") == DatabaseResult.eOk)
//	{
////		char	*szError = nullptr;

//		db.VerifySchema(vszErrors);
////		objDbContext.FakeUpSomeRandomCrap();
////		eDb = objDbContext.SaveChanges();
//		// MJP:  This illustrates how to traverse a recordset in the simplest way where it tells you via callback what the column names are.
//		//	Did not wind up using this because it is not type-strong but this code may come in handy as reference someday.
//		//db.m_objSQLiteDll.exec(db.m_pdbSQLite3, "SELECT * FROM IXREvents", [](void* pData, int nColumns, char** ppszColumnValues, char** ppszColumns)->int
//		//{
//		//	std.pair<bool, DbSet<iXREvent>*>	&listEvents = *(std.pair<bool, DbSet<iXREvent>*>*)pData;
//		//	std.vector<intptr_t>				vnIndices;

//		//	if (listEvents.first)
//		//	{
//		//		SetupColumnIndices(*listEvents.second, ppszColumns, nColumns, vnIndices);
//		//		listEvents.first = false;
//		//	}
//		//	// ---
//		//	return 0;
//		//}, ADDRESSOF(std.pair<bool, DbSet<iXREvent>*>{true, &objDbContext.m_dsIXREvents}), & szError);
//		iXREvent		ixrEvent;
//		DbSet<iXREvent>	listEvents;

//		//objDbContext.SaveChanges();
//		//ixrEvent.FakeUpSomeRandomCrap();
//		//ixrEvent.m_listStupidChildObjects.begin()->m_szSomeString = L"Это УТФ-восемь";
//		//eDb = ExecuteSqlSelect(db, "IXREvents", "SELECT %s FROM %s", {}, objDbContext.m_dsIXREvents);
//		//eDb = SaveChanges(db, "IXREvents", ixrEvent);
//		//ixrEvent.m_szAppId = "AppIdChanged";
//		//eDb = SaveChanges(db, "IXREvents", ixrEvent);
//		//ixrEvent.m_listStupidChildObjects.begin()->m_szSomeString = L"Это УТФ-восемь также";
//		//eDb = SaveChanges(db, "IXREvents", ixrEvent);
//		//eDb = ExecuteSqlSelect(db, "IXREvents", "SELECT %s from %s", {}, listEvents);
//		//eDb = ExecuteSqlSelect(db, nullptr, "SELECT %s from %s", {}, listEvents);
//		eDb = objDbContext.LoadAll(db);
//		szTemp = objDbContext.m_dsIXREvents.cbegin()->m_dtTimeStamp.ToString();
//		//(++objDbContext.m_dsIXREvents.begin())->m_bFlaggedForDelete = true;
//		//eDb = SaveChanges(db, nullptr, objDbContext);
//#if (0)
//		eDb = ExecuteSqlInsert(db, "IXREvents", ixrEvent);
//		ixrEvent.m_szAppId = "AppIdChanged";
//		eDb = ExecuteSqlUpdateWherePrimaryKey(db, "IXREvents", ixrEvent);
//		eDb = ExecuteDeleteWherePrimaryKey(db, "IXREvents", ixrEvent);
//		// ---
//		eDb = ExecuteSqlSelect(db, "IXREvents", "SELECT %s FROM %s", objDbContext.m_dsIXREvents);
//#endif
//	}
//	// ---
//	return 0;
//}

// --- Tests ported over from C#.

export class iXRLibAnalyticsTests
{
	/// <summary>
	/// Core templated function that encapsulates the pattern of testing Add()ing a single T using the cacheing, resend, send-stragglers mechanisms.
	/// </summary>
	/// <typeparam name="T">Type... iXREvent, iXRLog, iXRTelemetry, ...</typeparam>
	/// <typeparam name="iXRLibCallback">Type of callback... which using std.function<>... iXRLibAnalyticsLogCallback, iXRLibAnalyticsEventCallback, iXRLibAnalyticsTelemetryCallback, ...</typeparam>
	/// <typeparam name="iXRLibStorage">Resolves forward reference catch-22.</typeparam>
	/// <param name="bSynchronous">Call synchronous version of the Add() function, else asynchronous.</param>
	/// <param name="seAsyncOperationComplete">Reference to sync event to be used in asynchronous case.</param>
	/// <param name="bAlreadyAuthenticated">Do not set ApiToken, Secret if this is true.</param>
	/// <param name="pfnAddXXXSynchronous">Synchronous Add() function to call if bSynchronous.</param>
	/// <param name="pfnAddXXX">Asynchronous Add() function to call if !bSynchronous.</param>
	public static async AddXXX<T extends iXRBase>(tTypeOfT: any, bSynchronous: boolean, seAsyncOperationComplete: SyncEvent, bAlreadyAuthenticated: boolean, pfnAddXXXSynchronous: (ixrT: T) => Promise<iXRResult>, pfnAddXXX: ((ixrT: T, bNoCallbackOnSuccess: boolean, pfnCallback: (ixrT: T, eResult: iXRResult, szExceptionMessage: string) => void) => Promise<iXRResult>) | null): Promise<void>
	{
		if (!bAlreadyAuthenticated)
		{
			iXRLibInit.set_ApiToken("secret-key-need2change");
			iXRLibInit.set_ApiSecret("theApiKey");
		}
		iXRLibInit.set_OrgID("Oculus4");
		iXRLibInit.set_AppID("gameThatDoesNotExistYet");
		// --- In the "-testauth addevent" code, these were not set up (left to default).  This might be an improvement so leaving it, but noting it.
		iXRLibStorage.m_ixrLibConfiguration.m_nMaximumCachedItems = 20;
		iXRLibStorage.m_ixrLibConfiguration.m_nEventsPerSendAttempt = 5;
		iXRLibStorage.m_ixrLibConfiguration.m_tsStragglerTimeout = new TimeSpan().Construct0(0, 0, 7);
		iXRLibStorage.m_ixrLibConfiguration.m_bRetainLocalAfterSent = true;
		// --- vvv after ^^^... iXREvent ctor calls CaptureStateVariables() and ^^^ sets the state variables.
		var ixrT:	T = new tTypeOfT();

		ixrT.FakeUpSomeRandomCrap();
		// ---
		if (bSynchronous)
		{
			await pfnAddXXXSynchronous(ixrT);
		}
		else if (pfnAddXXX)
		{
			await pfnAddXXX(ixrT, false, (ixrT: T, eResult: iXRResult, szExceptionMessage: string): void =>
				{
					var	szTemp:	string = "";

					szTemp = `eResult = ${eResult}, szExceptionMessage = ${szExceptionMessage}`;
					iXRLibClient.WriteLine(szTemp);
					seAsyncOperationComplete.SetEvent();
				});
			// Give it time to do the whole thing and send stragglers... comment out to test the "send stragglers on the way out" mechanism.
			await Sleep(iXRLibStorage.m_ixrLibConfiguration.m_tsStragglerTimeout.ToMilliseconds() * 4.0);
			// Prefer hanging on nebbishy send to crashing on pull-rug-out-from-under... on the premise that a few sends that actually will
			// complete may just run a little long.
			await seAsyncOperationComplete.Wait();
		}
	}
	/// <summary>
	/// Core templated function that encapsulates the pattern of testing POSTing several T's synchronously or asynchronously.
	/// </summary>
	/// <typeparam name="T">Type... iXREvent, iXRLog, iXRTelemetry, ...</typeparam>
	/// <param name="szT">Name of type... "Log", "Event", "Telemetry", ...</param>
	/// <param name="bAsync">Calling the asynchronous or synchronous version of POST function.</param>
	/// <param name="seAsyncOperationComplete">Reference to sync event to be used in asynchronous case.</param>
	/// <param name="pfnPostXXX">Function pointer to POST function to call if !bAsync.</param>
	/// <param name="pfnSendXXXs">Function pointer to Send function to call if bAsync.</param>
	/// <returns>iXRResult return code.</returns>
	public static async TestPostXXX<T extends iXRBase>(tTypeOfT: any, szT: string, pfnModifyTheList: (listXXXs: DbSet<T>) => void, bAlreadyAuthenticated: boolean, bAsync: boolean, bOneAtATime: boolean, seAsyncOperationComplete: SyncEvent, pfnPostXXX: (listpXXXs: DbSet<T>, bOneAtATime: boolean, szResponse: string) => iXRResult, pfnSendXXXs: (listXXXs: DbSet<T>, bNoCallbackOnSuccess: boolean, pfnCallback: iXRLibAnalyticsGeneralCallback) => iXRResult) : Promise<iXRResult>
	{
		var	i:			number;
		var	listXXXs:	DbSet<T> = new DbSet<T>(tTypeOfT);
		var	szTemp:		string = "";
		var	eRet:		iXRResult = iXRResult.eOk;

		// Auth fields.
		if (!bAlreadyAuthenticated)
		{
			iXRLibInit.set_ApiToken("secret-key-need2change");
			iXRLibInit.set_ApiSecret("theApiSecret");
		}
		// End auth fields.
		iXRLibInit.set_OrgID("Oculus4");
		iXRLibInit.set_AppID("gameThatDoesNotExistYet");
		// vvv after ^^^... iXREvent ctor calls CaptureStateVariables() and ^^^ sets the state variables.
		for (i = 0; i < 8; i++)
		{
			var	objXXX:	T = new tTypeOfT();

			objXXX.FakeUpSomeRandomCrap(true);
			listXXXs.emplace_back_object(objXXX);
		}
		if (pfnModifyTheList)
		{
			pfnModifyTheList(listXXXs);
		}
		if (!bAsync)
		{
			var	listpXXXs:	DbSet<T> = new DbSet<T>(tTypeOfT);
			var	szResponse:	string = "";

			listpXXXs = listXXXs.Take(SIZE_MAX);
			eRet = await pfnPostXXX(listpXXXs, bOneAtATime, szResponse);
			//OUTPUTDEBUGSTRING(szResponse);
			if (eRet != iXRResult.eOk)
			{
				szTemp = `PostIXR${szT}s failed with code ${eRet}.`;
				iXRLibClient.WriteLine(szTemp);
			}
		}
		else
		{
			szTemp = `About to Send${szT}s() asynchronously.`;
			iXRLibClient.WriteLine(szTemp);
			pfnSendXXXs(listXXXs, false, (eResult: iXRResult, szExceptionMessage: string): void =>
				{
					var	szTemp:	string = "";

					szTemp = `eResult = ${eResult}, szExceptionMessage = ${szExceptionMessage}`;
					iXRLibClient.WriteLine(szTemp);
					seAsyncOperationComplete.SetEvent();
				});
			iXRLibClient.WriteLine("About to sleep for 3 seconds.");
			await Sleep(3000);
			iXRLibClient.WriteLine("Slept for 3 seconds.");
			await seAsyncOperationComplete.Wait();
		}
		// ---
		return eRet;
	}
	/// <summary>
	/// Core templated function that encapsulates the pattern of testing Send()ing a list of T's directly (i.e. not going through the AddT() mechanism) asynchronously.
	/// </summary>
	/// <typeparam name="T">Type... iXREvent, iXRLog, iXRTelemetry, ...</typeparam>
	/// <typeparam name="iXRLibAnalytics">Just pass in iXRLibAnalytics (from a .cpp function that can include iXRLibAnalytics.h)... breaks the catch-22 of not able to include iXRLibAnalytics.h in this file.</typeparam>
	/// <param name="szT">Name of type... "Log", "Event", "Telemetry", ...</param>
	/// <param name="listXXXs">List of T to send.</param>
	/// <param name="bOneAtATime">true = POST the objects one object per POST, false = POST them as one single POST with all objects in the body content.</param>
	/// <param name="bNoCallbackOnSuccess">Same pattern as Add() function being called... do not call pfnStatusCallback if Send is successful or pfnStatusCallback is null.</param>
	/// <param name="pfnStatusCallback">If not null, background thread that executes the Add() asynchronously will call this callback when done.</param>
	/// <returns>iXRResult return code.</returns>
	//public static async SendXXXs<T extends iXRBase>(tTypeOfT: any, szT: string, listXXXs: DbSet<T>, bOneAtATime: boolean, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsGeneralCallback) : Promise<iXRResult>
	//{
	//	// Notice the = capture... so pfnStatusCallback propagates by copy into the thread.
	//	return await iXRLibAnalytics.m_ixrLibAsync.AddTask(async (pObject: any): Promise<iXRResult> =>
	//		{
	//			var	eRet:	iXRResult;
	//			var	szTemp:	string = "";

	//			eRet = await iXRLibAnalyticsTests.SendXXXsSynchronous<T>(tTypeOfT, szT, pObject as DbSet<T>, bOneAtATime, bNoCallbackOnSuccess, pfnStatusCallback);
	//			szTemp = `Finished with Send${szT}sSynchronous().`;
	//			iXRLibClient.WriteLine(szTemp);
	//			// ---
	//			return eRet;
	//		},
	//		listXXXs,
	//		(pObject: any): void => { /*delete static_cast<DbSet<T>*>(pObject);*/ });
	//}
	/// <summary>
	/// Core templated function that encapsulates the pattern of testing Send()ing a list of T's directly (i.e. not going through the AddT() mechanism) synchronously.
	/// </summary>
	/// <typeparam name="T">Type... iXREvent, iXRLog, iXRTelemetry, ...</typeparam>
	/// <typeparam name="iXRLibAnalytics">Just pass in iXRLibAnalytics (from a .cpp function that can include iXRLibAnalytics.h)... breaks the catch-22 of not able to include iXRLibAnalytics.h in this file.</typeparam>
	/// <param name="szT">Name of type... "Log", "Event", "Telemetry", ...</param>
	/// <param name="listXXXs">List of T to send.</param>
	/// <param name="bOneAtATime">true = POST the objects one object per POST, false = POST them as one single POST with all objects in the body content.</param>
	/// <param name="bNoCallbackOnSuccess">Same pattern as Add() function being called... do not call pfnStatusCallback if Send is successful or pfnStatusCallback is null.</param>
	/// <param name="pfnStatusCallback">If not null, background thread that executes the Add() asynchronously will call this callback when done.</param>
	/// <returns>iXRResult return code.</returns>
	public static async SendXXXsSynchronous<T extends iXRBase>(tTypeOfT: any, szT: string, listXXXs: DbSet<T>, bOneAtATime: boolean, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsGeneralCallback) : Promise<iXRResult>
	{
		var	eRet:		iXRResult = iXRResult.eOk;
		var	listpXXXs:	DbSet<T> = listXXXs.Take(SIZE_MAX);
		var	szResponse:	string = "";

		try
		{
			var	szTemp:	string = "";

			szTemp = `About to PostIXR${szT}s().`;
			iXRLibClient.WriteLine(szTemp);
			// ---
			eRet = await iXRLibClient.PostIXRXXXs<T>(listpXXXs, tTypeOfT, bOneAtATime, {szResponse: ""});
			// ---
			szTemp = `Done with PostIXR${szT}s().`;
			iXRLibClient.WriteLine(szTemp);
		}
		catch (e)
		{
			eRet = iXRResult.ePostObjectsFailed;
		}
		// ---
		return iXRLibAnalytics.TaskErrorReturn(eRet, bNoCallbackOnSuccess, pfnStatusCallback, "");
	}
	// Synchronous and asynchronous test functions for sending logs directly... in here as that should only be done during testing.
	//public static async SendLogs(listLogs: DbSet<iXRLog>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsGeneralCallback) : Promise<iXRResult>
	//{
	//	return await iXRLibAnalyticsTests.SendXXXs<iXRLog>(iXRLog, "Log", listLogs, false, bNoCallbackOnSuccess, pfnStatusCallback);
	//}
	public static async SendLogsSynchronous(listLogs: DbSet<iXRLog>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsGeneralCallback) : Promise<iXRResult>
	{
		return await iXRLibAnalyticsTests.SendXXXsSynchronous<iXRLog>(iXRLog, "Log", listLogs, false, bNoCallbackOnSuccess, pfnStatusCallback);
	}
	// Synchronous and asynchronous test functions for sending events directly... in here as that should only be done during testing.
	//public static async SendEvents(listEvents: DbSet<iXREvent>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsGeneralCallback) : Promise<iXRResult>
	//{
	//	return await iXRLibAnalyticsTests.SendXXXs<iXREvent>(iXREvent, "Event", listEvents, false, bNoCallbackOnSuccess, pfnStatusCallback);
	//}
	public static async SendEventsSynchronous(listEvents: DbSet<iXREvent>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsGeneralCallback) : Promise<iXRResult>
	{
		return await iXRLibAnalyticsTests.SendXXXsSynchronous<iXREvent>(iXREvent, "Event", listEvents, false, bNoCallbackOnSuccess, pfnStatusCallback);
	}
	// Synchronous and asynchronous test functions for sending telemetry directly... in here as that should only be done during testing.
	//public static async SendTelemetry(listTelemetryEntries: DbSet<iXRTelemetry>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsGeneralCallback) : Promise<iXRResult>
	//{
	//	return await iXRLibAnalyticsTests.SendXXXs<iXRTelemetry>(iXRTelemetry, "Telemetry", listTelemetryEntries, false, bNoCallbackOnSuccess, pfnStatusCallback);
	//}
	public static async SendTelemetrySynchronous(listTelemetryEntries: DbSet<iXRTelemetry>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsGeneralCallback) : Promise<iXRResult>
	{
		return await iXRLibAnalyticsTests.SendXXXsSynchronous<iXRTelemetry>(iXRTelemetry, "Telemetry", listTelemetryEntries, false, bNoCallbackOnSuccess, pfnStatusCallback);
	}
	// Synchronous and asynchronous test functions for sending AIProxy directly... in here as that should only be done during testing.
	//public static async SendAIProxy(listAIProxyEntries: DbSet<iXRAIProxy>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsGeneralCallback) : Promise<iXRResult>
	//{
	//	return await iXRLibAnalyticsTests.SendXXXs<iXRAIProxy>(iXRAIProxy, "AIProxy", listAIProxyEntries, false, bNoCallbackOnSuccess, pfnStatusCallback);
	//}
	public static async SendAIProxySynchronous(listAIProxyEntries: DbSet<iXRAIProxy>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsGeneralCallback) : Promise<iXRResult>
	{
		return await iXRLibAnalyticsTests.SendXXXsSynchronous<iXRAIProxy>(iXRAIProxy, "AIProxy", listAIProxyEntries, false, bNoCallbackOnSuccess, pfnStatusCallback);
	}
	// Synchronous and asynchronous test functions for sending storage directly... in here as that should only be done during testing.
	//public static async SendStorage(listStorageEntries: DbSet<iXRStorage>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsGeneralCallback) : Promise<iXRResult>
	//{
	//	return await iXRLibAnalyticsTests.SendXXXs<iXRStorage>(iXRStorage, "Storage", listStorageEntries, false, bNoCallbackOnSuccess, pfnStatusCallback);
	//}
	public static async SendStorageSynchronous(listStorageEntries: DbSet<iXRStorage>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: iXRLibAnalyticsGeneralCallback) : Promise<iXRResult>
	{
		return await iXRLibAnalyticsTests.SendXXXsSynchronous<iXRStorage>(iXRStorage, "Storage", listStorageEntries, true, bNoCallbackOnSuccess, pfnStatusCallback);
	}
	public static async TestAuthenticate() : Promise<iXRResult>
	{
		//iXRLibStorage.m_ixrLibConfiguration.SetRestUrl("http://192.168.5.2:19080/");
		//iXRLibStorage.m_ixrLibConfiguration.SetRestUrl("http://192.168.5.17:9000/");
		//iXRLibStorage.m_ixrLibConfiguration.SetRestUrl("https://testapi.informxr.io/");
		//iXRLibStorage.m_ixrLibConfiguration.SetRestUrl("https://dev-libapi.informxr.io/v1/");
		// ---
		return await iXRLibInit.Authenticate("245950f2-570e-4e81-adb3-c468d14d319a", "57278692-cdbc-45b0-bba9-85ed2e2bab09", "75e66431-cf5e-493f-99ab-4836e79f7c93", "RAJvmTpaUNNDAVW7KqQ4nUWZHUIAPmfk6FkTXNrvm9bijMF1AUbAr4PkiVUKwPRF", Partner.eNone);
		//iXRResult eRet = iXRLibInit.Authenticate("471fd6fd-f5d0-4096-bc0c-17100c1c4fa0", "5304ef74-423f-4bd4-87d9-cba4f19c3bdb", "75e66431-cf5e-493f-99ab-4836e79f7c93", "vEwWpJs5K2Kib3XeWBhXgQnQr43XNJCSyb5QJoGCU5ec590hFyb63vBSx6dX6Clj", Partner.eArborXR);
		//iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism = iXRLibStorage.m_ixrLibConfiguration.m_dictAuthMechanism;
		//iXRLibInit.m_ixrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism["prompt"] = "999999";
		//iXRLibInit.Authenticate("471fd6fd-f5d0-4096-bc0c-17100c1c4fa0", "5304ef74-423f-4bd4-87d9-cba4f19c3bdb", "75e66431-cf5e-493f-99ab-4836e79f7c93", "vEwWpJs5K2Kib3XeWBhXgQnQr43XNJCSyb5QJoGCU5ec590hFyb63vBSx6dX6Clj", Partner.eArborXR);
		// ---
		//return eRet;
	}

	//public static iXRLibAnalyticsTests.TestGetAuthSecretCallback() : string
	//{
	//	return m_pfnGetAuthSecretCallback(nullptr);
	//}

	//void iXRLibAnalyticsTests.TestDiagnosticStringCallbackMechanism()
	//{
	//	DebugMessage.WriteLine("Here is a line of text.");
	//	DebugMessage.WriteLine("And here is another one.");
	//	DebugMessage.WriteLine("And if this one works, there should be a number 5 right here: ", 5, ", and if there is, whoo-the-bleep-hoo", " as it means the parameter-packing worked.");
	//	DebugMessage.WriteLine("And yet another one.  After this one however, we are going to sleep for 3 seconds.");
	//	// ---
	//	std.this_thread.sleep_for(dseconds(3));
	//	// ---
	//	DebugMessage.WriteLine("And we're back.");
	//	DebugMessage.WriteLine("To the devourer it seems as though the producer were in his chains but it is not so.");
	//	DebugMessage.WriteLine("He only takes portions of existence and fancies that the whole.");
	//	DebugMessage.WriteLine("But the prolific would cease to be prolific unless the devourer as a sea received the excess of his delights.");
	//}

	//void iXRLibAnalyticsTests.WriteLine(mstringb szLine)
	//{
	//	// https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/preprocessor-directives
	//	szLine.EnsureSingleEndingCharacter('\n');
	//	if (m_bServingCSharp)
	//	{
	//		ScopeThreadBlock	cs(m_csDebugMessages);

	//		m_qszDebugMessages.emplace_back(szLine);
	//	}
	//	else
	//	{
	//		OUTPUTDEBUGSTRING(szLine);
	//	}
	//}
}

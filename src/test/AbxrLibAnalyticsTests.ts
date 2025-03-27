//void TestJsonParsing()
//{
//	mstringb					szJson,
//								szTemp,
//								szErr,
//								szErrorJsonFromAuth;
//	std.stringstream			ssJson;
//	JsonResult					eRet = JsonResult.eOk;
//	AbxrDbContext				objDbContext;
//	AuthTokenResponseFailure	objAuthTokenResponseFailure;
//	std.set<mstringb>			sszErrors;

import { AbxrLibAnalytics, AbxrLibInit, AbxrLibAnalyticsGeneralCallback } from "../AbxrLibAnalytics"
import { AbxrAIProxy, AbxrBase, AbxrEvent, AbxrLibConfiguration, AbxrLog, AbxrStorage, AbxrTelemetry } from "../AbxrLibCoreModel";
import { AbxrLibStorage } from "../AbxrLibStorage";
import { DbSet } from "../network/utils/DataObjectBase";
import { SIZE_MAX, Sleep, SyncEvent } from "../network/types";
import { AbxrResult, TimeSpan } from "../network/utils/DotNetishTypes"
import { AbxrLibClient, Partner } from "../AbxrLibClient";

//#ifdef _UNIX
//	if (szErrorJsonFromAuth.LoadFromFile(_T("../AbxrTestData/AuthReturnedError.json")))
//#else
//	if (szErrorJsonFromAuth.LoadFromFile("..\\AbxrTestData\\AuthReturnedError.json"))
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
//	if (szJson.LoadFromFile(_T("../AbxrTestData/Test01.json")))
//#else
//	if (szJson.LoadFromFile("..\\AbxrTestData\\Test01.json"))
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
//int AbxrLibAnalyticsTests.AbxrLibAnalyticsTestsMain(int argc, char* argv[])
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
//	AbxrDbContext			objDbContext(false);
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
//		AbxrDictStrings	dictFirst,
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
//	if (szAppConfig.LoadFromFile("../AbxrTestData/App.config"))
//#else
//	if (szAppConfig.LoadFromFile("..\\AbxrTestData\\App.config"))
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
//	if (db.ConnectSQLite("../AbxrTestData/InformXR.db") == DatabaseResult.eOk)
//#else
//	if (db.ConnectSQLite("..\\AbxrTestData\\InformXR.db") == DatabaseResult.eOk)
//#endif // _UNIX
//	//if (db.ConnectSQLite("C:\\ztest\\InformXR\\test.db") == DatabaseResult.eOk)
//	{
////		char	*szError = nullptr;

//		db.VerifySchema(vszErrors);
////		objDbContext.FakeUpSomeRandomCrap();
////		eDb = objDbContext.SaveChanges();
//		// MJP:  This illustrates how to traverse a recordset in the simplest way where it tells you via callback what the column names are.
//		//	Did not wind up using this because it is not type-strong but this code may come in handy as reference someday.
//		//db.m_objSQLiteDll.exec(db.m_pdbSQLite3, "SELECT * FROM ABXREvents", [](void* pData, int nColumns, char** ppszColumnValues, char** ppszColumns)->int
//		//{
//		//	std.pair<bool, DbSet<AbxrEvent>*>	&listEvents = *(std.pair<bool, DbSet<AbxrEvent>*>*)pData;
//		//	std.vector<intptr_t>				vnIndices;

//		//	if (listEvents.first)
//		//	{
//		//		SetupColumnIndices(*listEvents.second, ppszColumns, nColumns, vnIndices);
//		//		listEvents.first = false;
//		//	}
//		//	// ---
//		//	return 0;
//		//}, ADDRESSOF(std.pair<bool, DbSet<AbxrEvent>*>{true, &objDbContext.m_dsABXREvents}), & szError);
//		AbxrEvent		abxrEvent;
//		DbSet<AbxrEvent>	listEvents;

//		//objDbContext.SaveChanges();
//		//abxrEvent.FakeUpSomeRandomCrap();
//		//abxrEvent.m_listStupidChildObjects.begin()->m_szSomeString = L"Это УТФ-восемь";
//		//eDb = ExecuteSqlSelect(db, "ABXREvents", "SELECT %s FROM %s", {}, objDbContext.m_dsABXREvents);
//		//eDb = SaveChanges(db, "ABXREvents", abxrEvent);
//		//abxrEvent.m_szAppId = "AppIdChanged";
//		//eDb = SaveChanges(db, "ABXREvents", abxrEvent);
//		//abxrEvent.m_listStupidChildObjects.begin()->m_szSomeString = L"Это УТФ-восемь также";
//		//eDb = SaveChanges(db, "ABXREvents", abxrEvent);
//		//eDb = ExecuteSqlSelect(db, "ABXREvents", "SELECT %s from %s", {}, listEvents);
//		//eDb = ExecuteSqlSelect(db, nullptr, "SELECT %s from %s", {}, listEvents);
//		eDb = objDbContext.LoadAll(db);
//		szTemp = objDbContext.m_dsABXREvents.cbegin()->m_dtTimeStamp.ToString();
//		//(++objDbContext.m_dsABXREvents.begin())->m_bFlaggedForDelete = true;
//		//eDb = SaveChanges(db, nullptr, objDbContext);
//#if (0)
//		eDb = ExecuteSqlInsert(db, "ABXREvents", abxrEvent);
//		abxrEvent.m_szAppId = "AppIdChanged";
//		eDb = ExecuteSqlUpdateWherePrimaryKey(db, "ABXREvents", abxrEvent);
//		eDb = ExecuteDeleteWherePrimaryKey(db, "ABXREvents", abxrEvent);
//		// ---
//		eDb = ExecuteSqlSelect(db, "ABXREvents", "SELECT %s FROM %s", objDbContext.m_dsABXREvents);
//#endif
//	}
//	// ---
//	return 0;
//}

// --- Tests ported over from C#.

export class AbxrLibAnalyticsTests
{
	/// <summary>
	/// Core templated function that encapsulates the pattern of testing Add()ing a single T using the cacheing, resend, send-stragglers mechanisms.
	/// </summary>
	/// <typeparam name="T">Type... AbxrEvent, AbxrLog, AbxrTelemetry, ...</typeparam>
	/// <typeparam name="AbxrLibCallback">Type of callback... which using std.function<>... AbxrLibAnalyticsLogCallback, AbxrLibAnalyticsEventCallback, AbxrLibAnalyticsTelemetryCallback, ...</typeparam>
	/// <typeparam name="AbxrLibStorage">Resolves forward reference catch-22.</typeparam>
	/// <param name="bSynchronous">Call synchronous version of the Add() function, else asynchronous.</param>
	/// <param name="seAsyncOperationComplete">Reference to sync event to be used in asynchronous case.</param>
	/// <param name="bAlreadyAuthenticated">Do not set ApiToken, Secret if this is true.</param>
	/// <param name="pfnAddXXX">Synchronous Add() function to call if bSynchronous.</param>
	/// <param name="pfnAddXXX">Asynchronous Add() function to call if !bSynchronous.</param>
	public static async AddXXX<T extends AbxrBase>(tTypeOfT: any, bSynchronous: boolean, seAsyncOperationComplete: SyncEvent, bAlreadyAuthenticated: boolean, pfnAddXXX: (abxrT: T) => Promise<AbxrResult>, pfnAddXXXDeferred: ((abxrT: T, bNoCallbackOnSuccess: boolean, pfnCallback: (abxrT: T, eResult: AbxrResult, szExceptionMessage: string) => void) => Promise<AbxrResult>) | null): Promise<void>
	{
		if (!bAlreadyAuthenticated)
		{
			AbxrLibInit.set_ApiToken("secret-key-need2change");
			AbxrLibInit.set_ApiSecret("theApiKey");
		}
		AbxrLibInit.set_OrgID("Oculus4");
		AbxrLibInit.set_AppID("gameThatDoesNotExistYet");
		// --- In the "-testauth addevent" code, these were not set up (left to default).  This might be an improvement so leaving it, but noting it.
		AbxrLibStorage.m_abxrLibConfiguration.m_nMaximumCachedItems = 20;
		AbxrLibStorage.m_abxrLibConfiguration.m_nEventsPerSendAttempt = 5;
		AbxrLibStorage.m_abxrLibConfiguration.m_tsStragglerTimeout = new TimeSpan().Construct0(0, 0, 7);
		AbxrLibStorage.m_abxrLibConfiguration.m_bRetainLocalAfterSent = true;
		// --- vvv after ^^^... AbxrEvent ctor calls CaptureStateVariables() and ^^^ sets the state variables.
		var abxrT:	T = new tTypeOfT();

		abxrT.FakeUpSomeRandomCrap();
		// ---
		if (bSynchronous)
		{
			await pfnAddXXX(abxrT);
		}
		else if (pfnAddXXXDeferred)
		{
			await pfnAddXXXDeferred(abxrT, false, (abxrT: T, eResult: AbxrResult, szExceptionMessage: string): void =>
				{
					var	szTemp:	string = "";

					szTemp = `eResult = ${eResult}, szExceptionMessage = ${szExceptionMessage}`;
					AbxrLibClient.WriteLine(szTemp);
					seAsyncOperationComplete.SetEvent();
				});
			// Give it time to do the whole thing and send stragglers... comment out to test the "send stragglers on the way out" mechanism.
			await Sleep(AbxrLibStorage.m_abxrLibConfiguration.m_tsStragglerTimeout.ToMilliseconds() * 4.0);
			// Prefer hanging on nebbishy send to crashing on pull-rug-out-from-under... on the premise that a few sends that actually will
			// complete may just run a little long.
			await seAsyncOperationComplete.Wait();
		}
	}
	/// <summary>
	/// Core templated function that encapsulates the pattern of testing POSTing several T's synchronously or asynchronously.
	/// </summary>
	/// <typeparam name="T">Type... AbxrEvent, AbxrLog, AbxrTelemetry, ...</typeparam>
	/// <param name="szT">Name of type... "Log", "Event", "Telemetry", ...</param>
	/// <param name="bAsync">Calling the asynchronous or synchronous version of POST function.</param>
	/// <param name="seAsyncOperationComplete">Reference to sync event to be used in asynchronous case.</param>
	/// <param name="pfnPostXXX">Function pointer to POST function to call if !bAsync.</param>
	/// <param name="pfnSendXXXs">Function pointer to Send function to call if bAsync.</param>
	/// <returns>AbxrResult return code.</returns>
	public static async TestPostXXX<T extends AbxrBase>(tTypeOfT: any, szT: string, pfnModifyTheList: (listXXXs: DbSet<T>) => void, bAlreadyAuthenticated: boolean, bAsync: boolean, bOneAtATime: boolean, seAsyncOperationComplete: SyncEvent, pfnPostXXX: (listpXXXs: DbSet<T>, bOneAtATime: boolean, szResponse: string) => AbxrResult, pfnSendXXXs: (listXXXs: DbSet<T>, bNoCallbackOnSuccess: boolean, pfnCallback: AbxrLibAnalyticsGeneralCallback) => AbxrResult) : Promise<AbxrResult>
	{
		var	i:			number;
		var	listXXXs:	DbSet<T> = new DbSet<T>(tTypeOfT);
		var	szTemp:		string = "";
		var	eRet:		AbxrResult = AbxrResult.eOk;

		// Auth fields.
		if (!bAlreadyAuthenticated)
		{
			AbxrLibInit.set_ApiToken("secret-key-need2change");
			AbxrLibInit.set_ApiSecret("theApiSecret");
		}
		// End auth fields.
		AbxrLibInit.set_OrgID("Oculus4");
		AbxrLibInit.set_AppID("gameThatDoesNotExistYet");
		// vvv after ^^^... AbxrEvent ctor calls CaptureStateVariables() and ^^^ sets the state variables.
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
			if (eRet != AbxrResult.eOk)
			{
				szTemp = `PostABXR${szT}s failed with code ${eRet}.`;
				AbxrLibClient.WriteLine(szTemp);
			}
		}
		else
		{
			szTemp = `About to Send${szT}s() asynchronously.`;
			AbxrLibClient.WriteLine(szTemp);
			pfnSendXXXs(listXXXs, false, (eResult: AbxrResult, szExceptionMessage: string): void =>
				{
					var	szTemp:	string = "";

					szTemp = `eResult = ${eResult}, szExceptionMessage = ${szExceptionMessage}`;
					AbxrLibClient.WriteLine(szTemp);
					seAsyncOperationComplete.SetEvent();
				});
			AbxrLibClient.WriteLine("About to sleep for 3 seconds.");
			await Sleep(3000);
			AbxrLibClient.WriteLine("Slept for 3 seconds.");
			await seAsyncOperationComplete.Wait();
		}
		// ---
		return eRet;
	}
	/// <summary>
	/// Core templated function that encapsulates the pattern of testing Send()ing a list of T's directly (i.e. not going through the AddT() mechanism) asynchronously.
	/// </summary>
	/// <typeparam name="T">Type... AbxrEvent, AbxrLog, AbxrTelemetry, ...</typeparam>
	/// <typeparam name="AbxrLibAnalytics">Just pass in AbxrLibAnalytics (from a .cpp function that can include AbxrLibAnalytics.h)... breaks the catch-22 of not able to include AbxrLibAnalytics.h in this file.</typeparam>
	/// <param name="szT">Name of type... "Log", "Event", "Telemetry", ...</param>
	/// <param name="listXXXs">List of T to send.</param>
	/// <param name="bOneAtATime">true = POST the objects one object per POST, false = POST them as one single POST with all objects in the body content.</param>
	/// <param name="bNoCallbackOnSuccess">Same pattern as Add() function being called... do not call pfnStatusCallback if Send is successful or pfnStatusCallback is null.</param>
	/// <param name="pfnStatusCallback">If not null, background thread that executes the Add() asynchronously will call this callback when done.</param>
	/// <returns>AbxrResult return code.</returns>
	//public static async SendXXXsDeferred<T extends AbxrBase>(tTypeOfT: any, szT: string, listXXXs: DbSet<T>, bOneAtATime: boolean, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsGeneralCallback) : Promise<AbxrResult>
	//{
	//	// Notice the = capture... so pfnStatusCallback propagates by copy into the thread.
	//	return await AbxrLibAnalytics.m_abxrLibAsync.AddTask(async (pObject: any): Promise<AbxrResult> =>
	//		{
	//			var	eRet:	AbxrResult;
	//			var	szTemp:	string = "";

	//			eRet = await AbxrLibAnalyticsTests.SendXXXs<T>(tTypeOfT, szT, pObject as DbSet<T>, bOneAtATime, bNoCallbackOnSuccess, pfnStatusCallback);
	//			szTemp = `Finished with Send${szT}s().`;
	//			AbxrLibClient.WriteLine(szTemp);
	//			// ---
	//			return eRet;
	//		},
	//		listXXXs,
	//		(pObject: any): void => { /*delete static_cast<DbSet<T>*>(pObject);*/ });
	//}
	/// <summary>
	/// Core templated function that encapsulates the pattern of testing Send()ing a list of T's directly (i.e. not going through the AddT() mechanism) synchronously.
	/// </summary>
	/// <typeparam name="T">Type... AbxrEvent, AbxrLog, AbxrTelemetry, ...</typeparam>
	/// <typeparam name="AbxrLibAnalytics">Just pass in AbxrLibAnalytics (from a .cpp function that can include AbxrLibAnalytics.h)... breaks the catch-22 of not able to include AbxrLibAnalytics.h in this file.</typeparam>
	/// <param name="szT">Name of type... "Log", "Event", "Telemetry", ...</param>
	/// <param name="listXXXs">List of T to send.</param>
	/// <param name="bOneAtATime">true = POST the objects one object per POST, false = POST them as one single POST with all objects in the body content.</param>
	/// <param name="bNoCallbackOnSuccess">Same pattern as Add() function being called... do not call pfnStatusCallback if Send is successful or pfnStatusCallback is null.</param>
	/// <param name="pfnStatusCallback">If not null, background thread that executes the Add() asynchronously will call this callback when done.</param>
	/// <returns>AbxrResult return code.</returns>
	public static async SendXXXs<T extends AbxrBase>(tTypeOfT: any, szT: string, listXXXs: DbSet<T>, bOneAtATime: boolean, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsGeneralCallback) : Promise<AbxrResult>
	{
		var	eRet:		AbxrResult = AbxrResult.eOk;
		var	listpXXXs:	DbSet<T> = listXXXs.Take(SIZE_MAX);
		var	szResponse:	string = "";

		try
		{
			var	szTemp:	string = "";

			szTemp = `About to PostABXR${szT}s().`;
			AbxrLibClient.WriteLine(szTemp);
			// ---
			eRet = await AbxrLibClient.PostABXRXXXs<T>(listpXXXs, tTypeOfT, bOneAtATime, {szResponse: ""});
			// ---
			szTemp = `Done with PostABXR${szT}s().`;
			AbxrLibClient.WriteLine(szTemp);
		}
		catch (e)
		{
			eRet = AbxrResult.ePostObjectsFailed;
		}
		// ---
		return AbxrLibAnalytics.TaskErrorReturn(eRet, bNoCallbackOnSuccess, pfnStatusCallback, "");
	}
	// Synchronous and asynchronous test functions for sending logs directly... in here as that should only be done during testing.
	//public static async SendLogsDeferred(listLogs: DbSet<AbxrLog>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsGeneralCallback) : Promise<AbxrResult>
	//{
	//	return await AbxrLibAnalyticsTests.SendXXXsDeferred<AbxrLog>(AbxrLog, "Log", listLogs, false, bNoCallbackOnSuccess, pfnStatusCallback);
	//}
	public static async SendLogs(listLogs: DbSet<AbxrLog>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsGeneralCallback) : Promise<AbxrResult>
	{
		return await AbxrLibAnalyticsTests.SendXXXs<AbxrLog>(AbxrLog, "Log", listLogs, false, bNoCallbackOnSuccess, pfnStatusCallback);
	}
	// Synchronous and asynchronous test functions for sending events directly... in here as that should only be done during testing.
	//public static async SendEventsDeferred(listEvents: DbSet<AbxrEvent>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsGeneralCallback) : Promise<AbxrResult>
	//{
	//	return await AbxrLibAnalyticsTests.SendXXXsDeferred<AbxrEvent>(AbxrEvent, "Event", listEvents, false, bNoCallbackOnSuccess, pfnStatusCallback);
	//}
	public static async SendEvents(listEvents: DbSet<AbxrEvent>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsGeneralCallback) : Promise<AbxrResult>
	{
		return await AbxrLibAnalyticsTests.SendXXXs<AbxrEvent>(AbxrEvent, "Event", listEvents, false, bNoCallbackOnSuccess, pfnStatusCallback);
	}
	// Synchronous and asynchronous test functions for sending telemetry directly... in here as that should only be done during testing.
	//public static async SendTelemetryDeferred(listTelemetryEntries: DbSet<AbxrTelemetry>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsGeneralCallback) : Promise<AbxrResult>
	//{
	//	return await AbxrLibAnalyticsTests.SendXXXsDeferred<AbxrTelemetry>(AbxrTelemetry, "Telemetry", listTelemetryEntries, false, bNoCallbackOnSuccess, pfnStatusCallback);
	//}
	public static async SendTelemetry(listTelemetryEntries: DbSet<AbxrTelemetry>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsGeneralCallback) : Promise<AbxrResult>
	{
		return await AbxrLibAnalyticsTests.SendXXXs<AbxrTelemetry>(AbxrTelemetry, "Telemetry", listTelemetryEntries, false, bNoCallbackOnSuccess, pfnStatusCallback);
	}
	// Synchronous and asynchronous test functions for sending AIProxy directly... in here as that should only be done during testing.
	//public static async SendAIProxyDeferred(listAIProxyEntries: DbSet<AbxrAIProxy>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsGeneralCallback) : Promise<AbxrResult>
	//{
	//	return await AbxrLibAnalyticsTests.SendXXXsDeferred<AbxrAIProxy>(AbxrAIProxy, "AIProxy", listAIProxyEntries, false, bNoCallbackOnSuccess, pfnStatusCallback);
	//}
	public static async SendAIProxy(listAIProxyEntries: DbSet<AbxrAIProxy>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsGeneralCallback) : Promise<AbxrResult>
	{
		return await AbxrLibAnalyticsTests.SendXXXs<AbxrAIProxy>(AbxrAIProxy, "AIProxy", listAIProxyEntries, false, bNoCallbackOnSuccess, pfnStatusCallback);
	}
	// Synchronous and asynchronous test functions for sending storage directly... in here as that should only be done during testing.
	//public static async SendStorageDeferred(listStorageEntries: DbSet<AbxrStorage>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsGeneralCallback) : Promise<AbxrResult>
	//{
	//	return await AbxrLibAnalyticsTests.SendXXXsDeferred<AbxrStorage>(AbxrStorage, "Storage", listStorageEntries, false, bNoCallbackOnSuccess, pfnStatusCallback);
	//}
	public static async SendStorage(listStorageEntries: DbSet<AbxrStorage>, bNoCallbackOnSuccess: boolean, pfnStatusCallback: AbxrLibAnalyticsGeneralCallback) : Promise<AbxrResult>
	{
		return await AbxrLibAnalyticsTests.SendXXXs<AbxrStorage>(AbxrStorage, "Storage", listStorageEntries, true, bNoCallbackOnSuccess, pfnStatusCallback);
	}
	public static async TestAuthenticate() : Promise<AbxrResult>
	{
		//AbxrLibStorage.m_abxrLibConfiguration.SetRestUrl("http://192.168.5.2:19080/");
		//AbxrLibStorage.m_abxrLibConfiguration.SetRestUrl("http://192.168.5.17:9000/");
		//AbxrLibStorage.m_abxrLibConfiguration.SetRestUrl("https://testapi.informxr.io/");
		//AbxrLibStorage.m_abxrLibConfiguration.SetRestUrl("https://dev-libapi.informxr.io/v1/");
		// ---
		return await AbxrLibInit.Authenticate("245950f2-570e-4e81-adb3-c468d14d319a", "57278692-cdbc-45b0-bba9-85ed2e2bab09", "75e66431-cf5e-493f-99ab-4836e79f7c93", "RAJvmTpaUNNDAVW7KqQ4nUWZHUIAPmfk6FkTXNrvm9bijMF1AUbAr4PkiVUKwPRF", Partner.eNone);
		//AbxrResult eRet = AbxrLibInit.Authenticate("471fd6fd-f5d0-4096-bc0c-17100c1c4fa0", "5304ef74-423f-4bd4-87d9-cba4f19c3bdb", "75e66431-cf5e-493f-99ab-4836e79f7c93", "vEwWpJs5K2Kib3XeWBhXgQnQr43XNJCSyb5QJoGCU5ec590hFyb63vBSx6dX6Clj", Partner.eArborXR);
		//AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism = AbxrLibStorage.m_abxrLibConfiguration.m_dictAuthMechanism;
		//AbxrLibInit.m_abxrLibAuthentication.m_objAuthTokenRequest.m_dictAuthMechanism["prompt"] = "999999";
		//AbxrLibInit.Authenticate("471fd6fd-f5d0-4096-bc0c-17100c1c4fa0", "5304ef74-423f-4bd4-87d9-cba4f19c3bdb", "75e66431-cf5e-493f-99ab-4836e79f7c93", "vEwWpJs5K2Kib3XeWBhXgQnQr43XNJCSyb5QJoGCU5ec590hFyb63vBSx6dX6Clj", Partner.eArborXR);
		// ---
		//return eRet;
	}

	//public static AbxrLibAnalyticsTests.TestGetAuthSecretCallback() : string
	//{
	//	return m_pfnGetAuthSecretCallback(nullptr);
	//}

	//void AbxrLibAnalyticsTests.TestDiagnosticStringCallbackMechanism()
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

	//void AbxrLibAnalyticsTests.WriteLine(mstringb szLine)
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

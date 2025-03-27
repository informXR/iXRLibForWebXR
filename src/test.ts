import { AbxrLibAnalytics, AbxrLibInit } from './AbxrLibAnalytics';
import { AbxrLibAsync } from './AbxrLibAsync';
import { AbxrApplication, AbxrBase, AbxrDbContext, AbxrEvent, AbxrLibConfiguration, AbxrLog, AbxrTelemetry } from './AbxrLibCoreModel';
import { AbxrLibSend, AbxrLibAnalyticsEventCallback } from './AbxrLibSend';
import { AbxrLibStorage } from './AbxrLibStorage';
import { Base64, CurlHttp, logError, Sleep, SUID, SyncEvent } from './network/types';
import { SHA256 } from './network/utils/cryptoUtils';
import { DataObjectBase, DbSet, DumpCategory, FieldProperties, FieldPropertiesRecordContainer, FieldPropertyFlags, GenerateJson } from './network/utils/DataObjectBase';
import { ConfigurationManager, DateTime, AbxrResult, AbxrDictStrings, StringList, TimeSpan } from './network/utils/DotNetishTypes';
import { FakeUpSomeCrapEvent, FakeUpSomeRandomCrapEvent } from './test/AbxrLibCoreModelTests';
import { AbxrLibAnalyticsTests } from './test/AbxrLibAnalyticsTests';

// Mock window object for Node.js environment
if (typeof window === 'undefined') {
  (global as any).window = {
    location: {
      search: '',
      pathname: '/',
      href: 'http://localhost/',
    },
    history: {
      pushState: (state: any, title: string, url: string) => {
        (global as any).window.location.search = url.split('?')[1] || '';
      },
      replaceState: (state: any, title: string, url: string) => {
        (global as any).window.location.search = url.split('?')[1] || '';
      },
    },
  };
}

// ---

class TestChild extends DataObjectBase
{
	public m_nGardenWall:	number = 3.4;
	public m_szDingALing:	string = "My ding a ling.";
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
		{m_nGardenWall: new FieldProperties("garden_wall")},
		{m_szDingALing: new FieldProperties("ding_a_ling")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return TestChild.m_mapProperties;
	}
}

class TestListChild extends DataObjectBase
{
	public m_szDemented:	string = "Ghastly Gary";
	public m_nBartSimpson:	number = 3.1415926535897932384626433;
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
		{m_szDemented: new FieldProperties("demented", FieldPropertyFlags.bfExclude)},
		{m_nBartSimpson: new FieldProperties("bart_simpson")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return TestListChild.m_mapProperties;
	}
}

class TestData extends DataObjectBase
{
	public m_nStrictlyCommercial:	number = 1.2;
	public m_szSomeString:			string = "with a lead filled snowshoe."
	public m_objTestChild:			TestChild = new TestChild();
	public m_dictTest:				AbxrDictStrings = new AbxrDictStrings();
	public m_listTestListChild:		DbSet<TestListChild> = new DbSet<TestListChild>(TestListChild);
	public m_listTestStringList:	StringList = new StringList();
	// ---
	constructor()
	{
		super();
		this.m_dictTest.Add("key", "value");
		this.m_dictTest.Add("ключь", "значение");
		this.m_listTestListChild.Add(new TestListChild());
		this.m_listTestListChild.Add(new TestListChild());
		this.m_listTestListChild.Add(new TestListChild());
		this.m_listTestStringList.push("warm");
		this.m_listTestStringList.push("leatherette");
		this.m_listTestStringList.push("feel");
		this.m_listTestStringList.push("the");
		this.m_listTestStringList.push("steering");
		this.m_listTestStringList.push("wheel");
	}
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
		{m_nStrictlyCommercial: new FieldProperties("strictly_commercial")},
		{m_szSomeString: new FieldProperties("some_string")},
		{m_objTestChild: new FieldProperties("test_child", FieldPropertyFlags.bfChild, TestChild.m_mapProperties)},
		{m_dictTest: new FieldProperties("dict_test")},
		{m_listTestListChild: new FieldProperties("test_list_child", FieldPropertyFlags.bfChildList, TestListChild.m_mapProperties)},
		{m_listTestStringList: new FieldProperties("test_string_list")}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return TestData.m_mapProperties;
	}
}

class DbSetsOfStuff extends DataObjectBase
{
	public m_listTestDatas:		DbSet<TestData> = new DbSet<TestData>(TestData);
	public m_listTestChildren:	DbSet<TestChild> = new DbSet<TestChild>(TestChild);
}

export class AbxrXXXTestScalarContainer<T extends DataObjectBase> extends AbxrBase
{
	public m_tABXRXXX:	T = {} as T;
	// ---
	constructor(tTypeOfT: any)
	{
		super();
		this.m_tABXRXXX = new tTypeOfT();
	}
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
		{m_tABXRXXX: new FieldProperties("data", FieldPropertyFlags.bfChild)}));
	// ---
	//constructor(tTypeOfT: any)
	//{
	//	super();
	//	this.m_tABXRXXX = new tTypeOfT();
	//}
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return AbxrXXXTestScalarContainer.m_mapProperties;
	}
};

function DebugSetAppConfig(): void
{
	var szAppConfig:	string = '<?xml version="1.0" encoding="utf-8" ?>' +
		'<configuration>' +
			'<appSettings>' +
				'<add key="REST_URL" value="http://192.168.5.24:9000/v1/"/>' +
				'<!--<add key="REST_URL" value="http://192.168.5.2:19080/"/>-->' +
				'<add key="SendRetriesOnFailure" value="3"/>' +
				'<!-- Bandwidth config parameters. -->' +
				'<add key="SendRetryInterval" value="00:00:03"/>' +
				'<add key="SendNextBatchWait" value="00:00:30"/>' +
				'<!-- 0 = infinite, i.e. never send remainders = always send exactly EventsPerSendAttempt. -->' +
				'<add key="StragglerTimeout" value="00:00:15"/>' +
				'<!-- 0 = Send all not-already-sent. -->' +
				'<add key="EventsPerSendAttempt" value="4"/>' +
				'<add key="LogsPerSendAttempt" value="4"/>' +
				'<add key="TelemetryEntriesPerSendAttempt" value="4"/>' +
				'<add key="StorageEntriesPerSendAttempt" value="4"/>' +
				'<!-- 0 = infinite, i.e. never prune. -->' +
				'<add key="PruneSentItemsOlderThan" value="12:00:00"/>' +
				'<add key="MaximumCachedItems" value="1024"/>' +
				'<add key="RetainLocalAfterSent" value="false"/>' +
			'</appSettings>' +
		'</configuration>';

	ConfigurationManager.DebugSetAppConfig(szAppConfig);
}

function TestRegex()
{
	const targetText = "SomeT1extSomeT2extSomeT3extSomeT4extSomeT5extSomeT6ext"
	const reg = /e(.*?)e/g;
	let result: RegExpMatchArray | null = null;

	while ((result = reg.exec(targetText)) !== null)
	{
		console.log(result[0]);
	}
}

async function TestHttp()
{
	var objRequest:	CurlHttp = new CurlHttp();
	var dtNow:		DateTime = new DateTime();
	var szResponse:	string = "";

	objRequest.AddHttpHeader("Host", AbxrLibStorage.m_abxrLibConfiguration.GetRestUrlObject().HostAndPort());
	objRequest.AddHttpHeader("Accept", "application/json");
	objRequest.AddHttpHeader("UserAgent", "Mozilla/5.0 (Windows NT 10.0; Win64; rv:109.0) Gecko/20100101 Firefox/119.0");
	objRequest.AddHttpHeader("Accept-Language", "en-US; q=0.5, en; q=0.5");
	objRequest.AddHttpHeader("Accept-Encoding", "gzip, deflate");
	objRequest.AddHttpHeader("Content-Type", "application/json");	// May need to parse pbBodyContent someday to distinguish Content-Type and Accept header settings.
	// ---
	objRequest.AddHttpAuthHeader("Bearer", 'this.m_szApiToken');
	objRequest.AddHttpHeader("X-AbxrLib-Hash", "wpIeZXbCmG1HYQ/CpMK0BWFFE8K/cSsnw41hA8KrwrVnFsKcSsOnG2YN");
	objRequest.AddHttpHeader("X-AbxrLib-Timestamp", dtNow.ToString());
	// ---
	await objRequest.Post("http://192.168.5.2:19080/api/v1/telemetry", [], Buffer.from("Some egregiously invalid body content."), {szResponse: ""});
	console.log(objRequest.m_objResponse);
}

async function TestLoginAndSend(): Promise<void>
{
	var abxrEvent:					AbxrEvent = new AbxrEvent();
	var seAsyncOperationComplete:	SyncEvent = new SyncEvent();
	// var eRet:						AbxrResult = AbxrResult.eOk;

	AbxrLibInit.Start();
	FieldPropertiesRecordContainer.FromString({obj: AbxrLibStorage.m_abxrLibConfiguration, szKey: 'm_tsPruneSentItemsOlderThan'}, "12:00:00");
	FieldPropertiesRecordContainer.FromString({obj: AbxrLibStorage.m_abxrLibConfiguration, szKey: 'm_nMaximumCachedItems'}, "1025");
	FieldPropertiesRecordContainer.FromString({obj: AbxrLibStorage.m_abxrLibConfiguration, szKey: 'm_bRetainLocalAfterSent'}, "false");
	FieldPropertiesRecordContainer.FromString({obj: AbxrLibStorage.m_abxrLibConfiguration, szKey: 'm_dictAuthMechanism'}, "{\"Hey\": \"Pedro\", \"There\": \"Juan\", \"What\": \"Up\"}");
	console.log(AbxrLibStorage.m_abxrLibConfiguration);
	var	dtNow:			DateTime = DateTime.ConvertUnixTime(DateTime.Now()),
						dtOlderThan:	DateTime = DateTime.ConvertUnixTime(dtNow.ToUnixTime() - (AbxrLibStorage.m_abxrLibConfiguration.m_tsPruneSentItemsOlderThan as TimeSpan).ToInt64());
	if (await AbxrLibAnalyticsTests.TestAuthenticate() === AbxrResult.eOk)
	{
		await AbxrLibAnalyticsTests.AddXXX<AbxrEvent>(AbxrEvent, true, seAsyncOperationComplete, true, AbxrLibSend.EventCore, /*AbxrLibSend.EventCoreDeferred*/null);
		await AbxrLibAnalyticsTests.AddXXX<AbxrTelemetry>(AbxrTelemetry, true, seAsyncOperationComplete, true, AbxrLibSend.AddTelemetryEntryCore, /*AbxrLibSend.AddTelemetryEntryCoreDeferred*/null);
		await AbxrLibAnalyticsTests.AddXXX<AbxrLog>(AbxrLog, true, seAsyncOperationComplete, true, AbxrLibSend.AddLog, /*AbxrLibSend.AddLogDeferred*/null);
	}
	abxrEvent.FakeUpSomeRandomCrap(true);
	await AbxrLibSend.EventCore(abxrEvent);
}

async function PrintStuffEveryThirdOfASecond(): Promise<number>
{
	var i:	number;

	for (i = 0; i < 30; i++)
	{
		console.log(`I is ${i}`);
		await Sleep(333);
	}
	return 0;
}

async function PrintStuffEveryHalfOfASecond(): Promise<number>
{
	var j:	number;

	for (j = 0; j < 20; j++)
	{
		console.log(`J is ${j}`);
		await Sleep(500);
	}
	return 1;
}

async function TestEmptyDictMeta()
{
	var abxrEvent:	AbxrEvent = new AbxrEvent();

	abxrEvent.FakeUpSomeRandomCrap();
	console.log(GenerateJson(abxrEvent, DumpCategory.eDumpingJsonForBackend), "\n");
	abxrEvent.m_dictMeta.clear();
	console.log(GenerateJson(abxrEvent, DumpCategory.eDumpingJsonForBackend), "\n");
}

async function TestJson(): Promise<void>
{
	var objTestData:	TestData = new TestData();
	var szJSON:			string = "";
	var bLooped:		boolean = false;
	var obj:			DbSetsOfStuff = new DbSetsOfStuff();
	var pdsABXRXXX:		any = null;
	var tsTest:			TimeSpan = TimeSpan.Parse("12:34:56");
	var abxrEvent:		AbxrEvent = new AbxrEvent();
	var suidTest:		SUID = new SUID();
	var bufferTest:		Buffer = Buffer.from([23, 56, 26, 78, 45, 12, 89, 54]);
	var objTestScalarContainer:	AbxrXXXTestScalarContainer<TestData> = new AbxrXXXTestScalarContainer<TestData>(TestData);

	try
	{
		// TestEmptyDictMeta();
		// Sequential.
		// await PrintStuffEveryThirdOfASecond();
		// await PrintStuffEveryHalfOfASecond();
		// Parallel.
		// const [x, y] = await Promise.all([PrintStuffEveryThirdOfASecond(), PrintStuffEveryHalfOfASecond()]);
		// console.log(`x is ${x} and y is ${y}`);
		DebugSetAppConfig();
		// await TestHttp();
		// TestRegex();
		await TestLoginAndSend();
		bufferTest = await SHA256("Hello, world!");
		try
		{
			console.log(Base64.Encode(bufferTest));
		}
		catch (e)
		{
			console.log(e);
		}
		console.log(suidTest.ToString());
		// AbxrLibAnalytics.m_abxrLibAsync.AddTask(async (o: any): Promise<AbxrResult> => { console.log("Sleeping..."); await Sleep(3000); console.log("Never shoot no dear."); return AbxrResult.eOk; }, objTestData, (o: any):void => { console.log("It's just flooded I'll be ok."); });
		// ---
		console.log(DbSetsOfStuff);
		AbxrLibInit.Start();
		FakeUpSomeRandomCrapEvent(abxrEvent, true);
		await AbxrLibSend.EventCore(abxrEvent);
		// if (typeof(DbSetsOfStuff) === "function")
		// {
		// 	console.log("It is a function");
		// }
		await Sleep(400000);
		// for (const [szField, objField] of Object.entries(obj))
		// {
		// 	console.log(szField, " ", typeof(objField));
		// 	if (objField instanceof DbSet)
		// 	{
		// 		if (objField.ContainedType() === TestData)
		// 		{
		// 			console.log("Found it: ", szField);
		// 			pdsABXRXXX = objField;
		// 			break;
		// 		}
		// 	}
		// }
		szJSON = GenerateJson(objTestData, DumpCategory.eDumpingJsonForBackend);
		// console.log(szJSON);
		szJSON = JSON.stringify(objTestData, TestData.m_mapProperties.replacer);
		// console.log(szJSON);
	}
	catch (e)
	{
		logError("TestJson", e);
	}
}

async function main(): Promise<void>
{
	try
	{
		await TestJson();
	}
	catch (error)
	{
		logError('Main test function', error);
	}
}

// Run the main function
main();

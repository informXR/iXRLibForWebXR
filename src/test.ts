import { iXRInit, iXRInstance, ResultOptions, InteractionType } from './iXR';
import { iXRLibAnalytics, iXRLibInit } from './iXRLibAnalytics';
import { iXRLibAsync } from './iXRLibAsync';
import { iXRBase, iXRDbContext, iXREvent, iXRLibConfiguration } from './iXRLibCoreModel';
import { iXRLibSend } from './iXRLibSend';
import { AuthenticationRequestSchema, Base64, Sleep, SUID } from './network/types';
import { SHA256 } from './network/utils/cryptoUtils';
import { DataObjectBase, DbSet, DumpCategory, FieldProperties, FieldPropertiesRecordContainer, FieldPropertyFlags, GenerateJson } from './network/utils/DataObjectBase';
import { ConfigurationManager, iXRResult, PythonDictStrings, StringList, TimeSpan } from './network/utils/DotNetishTypes';
import { logError, logInfo } from './network/utils/logger';
import { FakeUpSomeCrapEvent } from './test/iXRCoreModelTests';

export { iXRInit, iXRInstance, AuthenticationRequestSchema };

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
	public m_dictTest:				PythonDictStrings = new PythonDictStrings();
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

export class iXRXXXTestScalarContainer<T extends DataObjectBase> extends iXRBase
{
	public m_tIXRXXX:	T = {} as T;
	// ---
	constructor(tTypeOfT: any)
	{
		super();
		this.m_tIXRXXX = new tTypeOfT();
	}
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
		{m_tIXRXXX: new FieldProperties("data", FieldPropertyFlags.bfChild)}));
	// ---
	//constructor(tTypeOfT: any)
	//{
	//	super();
	//	this.m_tIXRXXX = new tTypeOfT();
	//}
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return iXRXXXTestScalarContainer.m_mapProperties;
	}
};

function DebugSetAppConfig(): void
{
	var szAppConfig:	string = '<?xml version="1.0" encoding="utf-8" ?>' +
		'<configuration>' +
			'<appSettings>' +
				'<!--<add key="REST_URL" value="http://192.168.5.17:9000/"/>-->' +
				'<add key="REST_URL" value="http://192.168.5.2:19080/"/>' +
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

async function TestJson(): Promise<void>
{
	var objTestData:	TestData = new TestData();
	var szJSON:			string = "";
	var bLooped:		boolean = false;
	var obj:			DbSetsOfStuff = new DbSetsOfStuff();
	var pdsIXRXXX:		any = null;
	var tsTest:			TimeSpan = TimeSpan.Parse("12:34:56");
	var ixrEvent:		iXREvent = new iXREvent();
	var suidTest:		SUID = new SUID();
	var bufferTest:		Buffer = Buffer.from([23, 56, 26, 78, 45, 12, 89, 54]);
	var objTestScalarContainer:	iXRXXXTestScalarContainer<TestData> = new iXRXXXTestScalarContainer<TestData>(TestData);

	try
	{
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
		DebugSetAppConfig();
		FakeUpSomeCrapEvent(ixrEvent);
		iXRLibSend.EventSynchronousCore(ixrEvent);
		iXRLibAnalytics.m_ixrLibAsync.AddTask(async (o: any): Promise<iXRResult> => { console.log("Sleeping..."); await Sleep(3000); console.log("Never shoot no dear."); return iXRResult.eOk; }, objTestData, (o: any):void => { console.log("It's just flooded I'll be ok."); });
		// ---
		console.log(DbSetsOfStuff);
		iXRLibInit.Start();
		if (typeof(DbSetsOfStuff) === "function")
		{
			console.log("It is a function");
		}
		await Sleep(4000);
		for (const [szField, objField] of Object.entries(obj))
		{
			console.log(szField, " ", typeof(objField));
			if (objField instanceof DbSet)
			{
				if (objField.ContainedType() === TestData)
				{
					console.log("Found it: ", szField);
					pdsIXRXXX = objField;
					break;
				}
			}
		}
		szJSON = GenerateJson(objTestData, DumpCategory.eDumpingJsonForBackend);
		console.log(szJSON);
		szJSON = JSON.stringify(objTestData, TestData.m_mapProperties.replacer);
		console.log(szJSON);
	}
	catch (e)
	{
		logError("TestJson", e);
	}
}

async function main(): Promise<void> {
  try {
    // Simulate GET request parameters
    const urlParams = new URLSearchParams({
      xrdm_orgid: 'orgId',
      xrdm_deviceid: 'iXRLibForWebXR_device_id',
      xrdm_devicemodel: 'iXRLibForWebXR_device_model',
      xrdm_authsecret: 'authSecret'
    });

	await TestJson();
    // Set the URL for testing
    window.history.pushState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
    console.log('Set URL:', window.location.href);
  
    // Pass appId directly to iXRInit
    const iXR = await iXRInit({
      appId: 'appId',
    });

    console.log('iXR instance created successfully');

    // Test existing iXR methods
    const eventResponse = await iXR.Event('task_completed', 'fruit=apple,color=red');
    logInfo('Event', 'Event response received', eventResponse);

    const infoResponse = await iXR.LogInfo('Task completed successfully');
    logInfo('LogInfo', 'LogInfo response received', infoResponse);

    const errorResponse = await iXR.LogError('An error occurred during processing');
    logError('LogError', errorResponse);

    const warningResponse = await iXR.LogWarning('Low disk space detected');
    logInfo('LogWarning', 'LogWarning response received', warningResponse);

    const telemetryResponse = await iXR.Telemetry('system_stats', { cpu_usage: '45%', memory_usage: '60%' });
    logInfo('Telemetry', 'Telemetry response received', telemetryResponse);

    const pingResponse = await iXR.Ping();
    logInfo('Ping', 'Ping response received', pingResponse);

    // Test new event methods with duration calculation
    console.log('\nTesting Event Methods with Duration:');

    const levelStartResponse = await iXR.EventLevelStart('level_1', { difficulty: 'easy' });
    logInfo('EventLevelStart', 'Level start event response received', levelStartResponse);

    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const levelCompleteResponse = await iXR.EventLevelComplete('level_1', 100, { time_taken: '120s' });
    logInfo('EventLevelComplete', 'Level complete event response received', levelCompleteResponse);

    const assessmentStartResponse = await iXR.EventAssessmentStart('math_quiz', { topic: 'algebra' });
    logInfo('EventAssessmentStart', 'Assessment start event response received', assessmentStartResponse);

    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const assessmentCompleteResponse = await iXR.EventAssessmentComplete('math_quiz', 85, ResultOptions.Pass, { questions_answered: '20' });
    logInfo('EventAssessmentComplete', 'Assessment complete event response received', assessmentCompleteResponse);

    const objectiveStartResponse = await iXR.EventObjectiveStart('collect_coins', { total_coins: '50' });
    logInfo('EventObjectiveStart', 'Objective start event response received', objectiveStartResponse);

    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 1000));

    const objectiveCompleteResponse = await iXR.EventObjectiveComplete('collect_coins', 45, ResultOptions.Complete, { coins_collected: '45' });
    logInfo('EventObjectiveComplete', 'Objective complete event response received', objectiveCompleteResponse);

    const interactionStartResponse = await iXR.EventInteractionStart('npc_dialogue', { npc_name: 'Guide' });
    logInfo('EventInteractionStart', 'Interaction start event response received', interactionStartResponse);

    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 500));

    const interactionCompleteResponse = await iXR.EventInteractionComplete('npc_dialogue', 'Friendly', 'Player chose to help NPC', InteractionType.Select, { dialogue_path: 'friendly' });
    logInfo('EventInteractionComplete', 'Interaction complete event response received', interactionCompleteResponse);

    // Test storage methods
    console.log('\nTesting Storage Methods:');

    //const setStorageResponse = await iXR.SetStorageEntry({ key1: 'value1', key2: 'value2' }, 'test_storage');
    // logInfo('SetStorageEntry', 'Set storage entry response received', setStorageResponse);

    // const getStorageResponse = await iXR.GetStorageEntry('test_storage');
    // logInfo('GetStorageEntry', 'Get storage entry response received', getStorageResponse);

    // const getAllStorageResponse = await iXR.GetAllStorageEntries();
    // logInfo('GetAllStorageEntries', 'Get all storage entries response received', getAllStorageResponse);

    // const removeStorageResponse = await iXR.RemoveStorageEntry('test_storage');
    // logInfo('RemoveStorageEntry', 'Remove storage entry response received', removeStorageResponse);

  } catch (error) {
    logError('Main test function', error);
  }
}

// Run the main function
main();

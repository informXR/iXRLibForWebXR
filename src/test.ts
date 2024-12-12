import { iXRInit, iXRInstance, ResultOptions, InteractionType } from './iXR';
import { AuthenticationRequestSchema } from './network/types';
import { DataObjectBase, DbSet } from './network/utils/DataObjectBase';
import { PythonDictStrings } from './network/utils/DotNetishTypes';
import { logError, logInfo } from './network/utils/logger';

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

enum FieldPropertyFlags
{
	bfNull		= 0x00000000,
	bfExclude	= 0x00000001,
	bfChild		= 0x00000002,
	bfChildList	= 0x00000004
}

class FieldProperties
{
	public m_szName:	string = "";
	public m_fFlags:	FieldPropertyFlags|null = FieldPropertyFlags.bfNull;
	public m_objChild:	any|null = null;
	// ---
	constructor(szName: string, fFlags?: FieldPropertyFlags|null, objChild?: any|null)
	{
		this.m_szName = szName;
		this.m_fFlags = (fFlags) ? fFlags : FieldPropertyFlags.bfNull;
		this.m_objChild = objChild;
	}
	public static JSONFieldName(rsfFieldProperties: Record<string, FieldProperties>, szFieldName: string, fFlags: number): string
	{
		for (const szKey in rsfFieldProperties)
		{
			if (szKey === szFieldName)
			{
				return rsfFieldProperties[szKey].m_szName;
			}
		}
		return "";
	}
}

class FieldPropertiesRecordContainer
{
	public m_rfp:	Record<string, FieldProperties>;
	// ---
	constructor(rfp: Record<string, FieldProperties>)
	{
		this.m_rfp = rfp;
	}
	public replacer = (key: string, value: any): any =>
	{
		if (key === '')
		{
			// On the root object, create a new object with transformed keys.
			const result:	any = {};

			for (const [oldKey, val] of Object.entries(value))
			{
				const fpNode:	FieldProperties = this.m_rfp[oldKey];
				const newKey:	string = fpNode ? fpNode.m_szName : oldKey;

if (val instanceof TestListChild)
{
	const f = 3;
}
				if (fpNode && fpNode.m_objChild && fpNode.m_objChild instanceof FieldPropertiesRecordContainer)
				{
					// console.log("TestChild.m_mapProperties.replacer = ", {TestChild.m_mapProperties.replacer});
					const szInnerJson:  string = JSON.stringify(val, fpNode.m_objChild.replacer);

					result[newKey] = JSON.parse(szInnerJson);
				}
				else if (val instanceof PythonDictStrings)
				{
					const szInnerJson:	string = (val as PythonDictStrings).JSONstringify();

					result[newKey] = JSON.parse(szInnerJson);
				}
				else
				{
					result[newKey] = val;
				}
			}
			return result;
		}
		return value;
	}
}

class TestChild extends DataObjectBase
{
	public m_nGardenWall:	number = 3.4;
	public m_szDingALing:	string = "My ding a ling.";
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign(
		{m_nGardenWall: new FieldProperties("garden_wall", FieldPropertyFlags.bfExclude | FieldPropertyFlags.bfNull)},
		{m_szDingALing: new FieldProperties("ding_a_ling")}));
}

class TestListChild extends DataObjectBase
{
	public m_szDemented:	string = "Ghastly Gary";
	public m_nBartSimpson:	number = 3.1415926535897932384626433;
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign(
		{m_szDemented: new FieldProperties("demented", FieldPropertyFlags.bfExclude)},
		{m_nBartSimpson: new FieldProperties("bart_simpson")}));
}

class TestData extends DataObjectBase
{
	public m_nStrictlyCommercial:	number = 1.2;
	public m_szSomeString:			string = "with a lead filled snowshoe."
	public m_objTestChild:			TestChild = new TestChild();
	public m_dictTest:				PythonDictStrings = new PythonDictStrings();
	public m_listTestListChild:		DbSet<TestListChild> = new DbSet<TestListChild>();
	// ---
	constructor()
	{
		super();
		this.m_dictTest.Add("key", "value");
		this.m_dictTest.Add("ключь", "значение");
		this.m_listTestListChild.Add(new TestListChild());
		this.m_listTestListChild.Add(new TestListChild());
		this.m_listTestListChild.Add(new TestListChild());
	}
	// public static m_mapChildProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign(
	// 	{m_objTestChild: new FieldProperties("test_child", 56)}));
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign(
		{m_nStrictlyCommercial: new FieldProperties("strictly_commercial")},
		{m_szSomeString: new FieldProperties("some_string")},
		{m_objTestChild: new FieldProperties("test_child", FieldPropertyFlags.bfChild, TestChild.m_mapProperties)},
		{m_dictTest: new FieldProperties("dict_test")},
		{m_listTestListChild: new FieldProperties("test_list_child", FieldPropertyFlags.bfChildList, TestListChild.m_mapProperties)}));
}

function TestJson()
{
	var objTestData:	TestData = new TestData();
	var szJSON:			string = "";

	szJSON = JSON.stringify(objTestData, TestData.m_mapProperties.replacer);
	console.log(szJSON);
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

	TestJson();
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

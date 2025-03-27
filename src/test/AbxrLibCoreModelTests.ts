import { AbxrDictStrings, Random } from "../network/utils/DotNetishTypes";
import { AbxrAIProxy, AbxrStorageData, LogLevelToString } from "../AbxrLibCoreModel";
import { LogLevel } from "../AbxrLibCoreModel";
import { AbxrLocationData, AbxrApplication, AbxrEvent, AbxrLog, AbxrTelemetry, AbxrStorage, AbxrDbContext } from "../AbxrLibCoreModel";

/// <summary>
/// Application object... from "Database Models" doc... Represents the software application in use.
/// </summary>
export function FakeUpSomeRandomCrapApplication(obj: AbxrApplication): void
{
	var pszAppIds:		string[] = [ "a44654", "a51654", "a57649", "a75638", "a83659", "a90376", "a45723" ];
	var pszUserIds:		string[] = [ "u84967", "u74857", "u94748", "u84736", "u29683", "u98375", "u45823" ];
	var pszDeviceIds:	string[] = [ "d83746", "d98264", "d83769", "d23985", "d34985", "d34985", "d24397" ];
	var pszLogLevels:	string[] = [ "Stygian", "Low", "Medium", "High", "Stratospheric" ];
	var pszDatas:		string[] = [ "The thing = 3", "Orange = the new Indigo", "Rock on Chicago", "Будет пухом, Нина Сергеевна", "Magikist", "Glenn Miller", "Frank Sinatra", "Lena Horne" ];
	var rnd:			Random = new Random();

	obj.m_szAppId = pszAppIds[rnd.Next(pszAppIds.length)];
	obj.m_szDeviceUserId = pszUserIds[rnd.Next(pszUserIds.length)];
	obj.m_szDeviceId = pszDeviceIds[rnd.Next(pszDeviceIds.length)];
	obj.m_szLogLevel = pszLogLevels[rnd.Next(pszLogLevels.length)];
	obj.m_szData = pszDatas[rnd.Next(pszDatas.length)];
}

export function FakeUpSomeRandomCrapLocation(obj: AbxrLocationData): void
{
	var rnd:	Random = new Random();

	obj.m_dX = (rnd.Next(625)) / 5.0;
	obj.m_dY = (rnd.Next(625)) / 5.0;
	obj.m_dZ = (rnd.Next(625)) / 5.0;
}

export function FakeUpSomeRandomCrapLog(obj: AbxrLog): void
{
	var pszTexts:		string[] =
		[
			"Something bad happened.",
			"Something implausibly good happened.",
			"Something to which the complacent bourgeoisie is indifferent happened.",
			"Нукюлар war happened."
		];
	var rnd:			Random = new Random();

	obj.m_szLogLevel = LogLevelToString(rnd.Next(5) as LogLevel);
	obj.m_szText = pszTexts[rnd.Next(pszTexts.length)];
	obj.m_dictMeta.Add("Yes log", "All kids love log");
	obj.m_dictMeta.Add("Rock on Chicago", "3141");
}

export function FakeUpSomeRandomCrapTelemetry(obj: AbxrTelemetry): void
{
	var pszNames:		string[] =
		[
			"Right controller",
			"Battery",
			"Aggravated battery",
			"User looked at something significant",
			"User fell asleep"
		];
	var rnd:			Random = new Random();

	obj.m_szName = pszNames[rnd.Next(pszNames.length)];
	obj.m_dictMeta.Add("galaxy", "Lousy Day");
	obj.m_dictMeta.Add("Squirrel", "2718");
}

export function FakeUpSomeRandomCrapAIProxy(obj: AbxrAIProxy): void
{
	var pszPrompts:			string[] =
		[
			"Hey you!",
			"Achtung!",
			"Ping!",
			"Здравствуйте!",
			"Hey mon."
		];
	var pszLMMProviders:	string[] =
		[
			"OpenAI",
			"ChatGPT",
			"CIAMainframe",
			"ФСБ",
			"Gemini"
		];
	var rnd:				Random = new Random();

	obj.m_szPrompt = pszPrompts[rnd.Next(pszPrompts.length)];
	obj.m_dictPastMessages.Add("Hey you!", "Trout mask replica.");
	obj.m_dictPastMessages.Add("Achtung!", "There is always someone with you.");
}

/// <summary>
/// Event object... from "abxrlib Spec 2023" doc... the main event object that will be profligately POST/PUT/ETCed to the backend for data analytics.
/// </summary>

export function FakeUpSomeCrapEvent(obj: AbxrEvent): void
{
	obj.m_dictMeta.Add("key1", "1");
	obj.m_dictMeta.Add("key2", "value2");
	obj.m_dictMeta.Add("key3", "3");
	obj.m_dictMeta.Add("key4", "value4");
}

export function FakeUpSomeDifferentCrapEvent(obj: AbxrEvent): void
{
	var rnd:			Random = new Random();

	obj.m_dictMeta.Add("key1", "value1");
	obj.m_dictMeta.Add("key2", "value2");
	obj.m_dictMeta.Add("key3", "value3");
	obj.m_dictMeta.Add("key4", "value4");
}

// export function FakeUpSomeRandomCrapEvent(obj: AbxrEvent): void
// {
// 	FakeUpSomeRandomCrapEvent(obj, true);
// }

export function FakeUpSomeRandomCrapEvent(obj: AbxrEvent, bWantChildObjects: boolean): void
{
	var pszLogLevels:	string[] = [ "Stygian", "Low", "Medium", "High", "Stratospheric" ];
	var pszNames:		string[] =
	[
		"Waiting in the toolshed.",
		"On the bus.",
		"Double bourbon.",
		"Not you, her.",
		"Interesting hobbies.",
		"My flippers came off.",
		"Were they good ones?",
		"Sorry, I never let anyone near my equipment.",
		"Why don't you put a sock in it.",
		"Virgo.",
		"Will you stay out of this?"
	];
	var pszEvents:		string[] =
	[
		"Moved right",
		"Moved left",
		"Moved up",
		"Moved down",
		"Shot bad guy",
		"Saved Lorna",
		"Found Stas",
		"Killed Tylan",
		"Mortgaged immortal soul",
		"Drank Kool-Aid",
		"Completed indoctrination",
		"Gelded Moose"
	];
	var pszEnvironments:	string[] =
	[
		"Desert",
		"Paradise",
		"Orange County",
		"Perdition",
		"LA County",
		"Antarctica",
		"Middle-East",
		"CCCP",
		"The Sticks",
		"The Styx"
	];
	var rnd:			Random = new Random();

	obj.m_szName = pszNames[rnd.Next(pszNames.length)];
	obj.m_dictMeta.Add("galaxy", "Lousy Day");
	obj.m_dictMeta.Add("Squirrel", "Run Away");
	obj.m_dictMeta.Add("How many", "456");
	obj.m_dictMeta.Add("Some floating point", "456.789");
	obj.m_dictMeta.Add("Some really big floating point", "456.789e+36");
	obj.m_dictMeta.Add("Some really small floating point", "456.789e-36");
	obj.m_szEnvironment = pszEnvironments[rnd.Next(pszEnvironments.length)];
}

/// <summary>
/// Mainly state, but more general than that... whatever user wants but principally state info.
/// </summary>

export function FakeUpSomeRandomCrapStorageData(obj: AbxrStorageData): void
{
	var pszStorageEntries:	string[] =
	[
		"Like", "Your", "Cousin", "Luigi", "Lasagna", "Jacob Plows, Fool!", "I don't like roast beef."
	];
	var rnd:				Random = new Random();
	var szKey:				string;
	var szValue:			string;

	obj.m_cdictData = new AbxrDictStrings();
	szKey = pszStorageEntries[rnd.Next(pszStorageEntries.length)];
	szValue = pszStorageEntries[rnd.Next(pszStorageEntries.length)];
	obj.m_cdictData.Add(szKey, szValue);
	szKey = pszStorageEntries[rnd.Next(pszStorageEntries.length)];
	szValue = pszStorageEntries[rnd.Next(pszStorageEntries.length)];
	obj.m_cdictData.Add(szKey, szValue);
};

export function FakeUpSomeRandomCrapStorage(obj: AbxrStorage): void
{
	var pszNames:	string[] = [ "George", "Liquor", "American", "Dave", "Знать", "Here", "Richard", "Wagner", "Jonas", "Grumby" ];
	var pszOrigins:	string[] = [ "system", "user" ];
	var pszTags:	string[] = [ "pour", "the", "crimson", "in", "me", "Jimson" ];
	var rnd:		Random = new Random();
	var szKey:		string;
	var szValue:	string;
	var abxrData:	AbxrStorageData = new AbxrStorageData();

	obj.m_szKeepPolicy = (rnd.Next(3) == 0) ? "keepLatest" : "appendHistory";
	obj.m_szName = pszNames[rnd.Next(pszNames.length)];
	// ---
	FakeUpSomeRandomCrapStorageData(abxrData);
	obj.m_dsData.clear();
	//m_dsData.Add(abxrData);
	obj.m_dsData.emplace_front().m_dspABXRXXXs.emplace_front().m_cdictData.Add("Rock", "Roll");
	obj.m_dsData[0].m_dspABXRXXXs[0].m_cdictData.Add("Lemon", "Custard");
	// ---
	obj.m_szOrigin = pszOrigins[rnd.Next(pszOrigins.length)];
	obj.m_bSessionData = (rnd.Next(3) == 0);
	// ---
	obj.m_lszTags.emplace_back(pszTags[rnd.Next(pszTags.length)]);
	obj.m_lszTags.emplace_back(pszTags[rnd.Next(pszTags.length)]);
}

/// <summary>
/// The Entity-Framework database object.
/// </summary>

export function FakeUpSomeRandomCrapDbContext(obj: AbxrDbContext): void
{
	var i:	number;

	for (i = 0; i < 8; i++)
	{
		var objApplication:	AbxrApplication = obj.m_dsABXRApplications.emplace_back();

		FakeUpSomeRandomCrapApplication(objApplication);
	}
	for (i = 0; i < 16; i++)
	{
		var objLog:	AbxrLog = obj.m_dsABXRLogs.emplace_back();

		FakeUpSomeRandomCrapLog(objLog);
	}
	for (i = 0; i < 16; i++)
	{
		var objEvent:	AbxrEvent = obj.m_dsABXREvents.emplace_back();

		FakeUpSomeRandomCrapEvent(objEvent, true);
	}
	for (i = 0; i < 13; i++)
	{
		var objTelemetry:	AbxrTelemetry = obj.m_dsABXRTelemetry.emplace_back();

		FakeUpSomeRandomCrapTelemetry(objTelemetry);
	}
	for (i = 0; i < 8; i++)
	{
		var objStorage:	AbxrStorage = obj.m_dsABXRStorage.emplace_back();

		FakeUpSomeRandomCrapStorage(objStorage);
	}
}

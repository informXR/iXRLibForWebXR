/// <summary>
/// Allows for several categories of object dumping each with rules for which fields to dump or filter.

import { SUID } from "../types";
import { DateTime, AbxrResult, JsonResult, AbxrDictStrings, StringList, TimeSpan } from "./DotNetishTypes";
import { DatabaseResult } from "./AbxrLibSQLite";

/// </summary>
export enum DumpCategory
{
	eDumpEverything,		// NULL/wildcard.
	eDumpingJsonForBackend	// Sending JSON to the backend, in which case we want to filter db fields (primary key etc).
};

/// <summary>
/// Due to the need to accommodate backend imprecision vis-a-vis object vs. array-of-object the object doing that has
///		an object and a list named the same thing.  Need to not dump the object to JSON.
/// </summary>
export enum JsonFieldType
{
	eField,
	eObject,
	eObjectList,
	eScalarList
};

export enum FieldPropertyFlags
{
	eOrdinaryColumn			= 0x00000000,
	bfNull					= 0x00000000,
	bfPrimaryKey			= 0x00000001,
	bfParentKey				= 0x00000002,
	bfBackendAccommodation	= 0x00000004,
	bfNoEscapeJson			= 0x00000008,
	bfStringOnly			= 0x00000010,
	bfNoFieldIfEmpty		= 0x00000020,
	bfChild					= 0x00000040,
	bfChildList				= 0x00000080,
	bfExclude				= 0x00000100
}

export class FieldProperties
{
	public m_szName:	string = "";
	public m_fFlags:	FieldPropertyFlags | null = FieldPropertyFlags.bfNull;
	public m_objChild:	any | null = null;
	// ---
	constructor(szName: string, fFlags?: FieldPropertyFlags | null, objChild?: any | null)
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

export class FieldPropertiesRecordContainer
{
	public m_objCurrentObject:				any = null;								// The object being dumped.
	public m_rfp:							Record<string, FieldProperties>;		// The (static/constant) field properties.  Key is the field name of the object, field properties has the JSON field name.
	public m_nState:						number = 0;								// For generating unique names for objects and lists.
	public m_aszAlreadySeen:				Array<string> = new Array<string>();	// Prevents re-entrancy stackfault.
	public m_aszExcludedFields:				Array<string> = new Array<string>();	// Fields to exclude from the dump... extra fields that are not in the map m_rfp.
	public m_bExcludedFieldsInitialized:	boolean = false;						// True if m_aszExcludedFields has been initialized.
	public m_atpChildren:					Array<[string, object]> = new Array<[string, object]>();	// Objects that are children of the current object, accrued during the replacer function.
	public m_atpListChildren:				Array<[string, object]> = new Array<[string, object]>();	// Lists that are children of the current object, accrued during the replacer function.
	// ---
	constructor(rfp: Record<string, FieldProperties>)
	{
		this.m_rfp = rfp;
	}
	public LookupFieldProperties(szJsonFieldName: string): FieldProperties | null
	{
		for (const [szKey, fpNode] of Object.entries(this.m_rfp))
		{
			if (fpNode.m_szName === szJsonFieldName)
			{
				return fpNode;
			}
		}
		return null;
	}
	public static FromString(rObj: {obj: any, szKey: string}, szJsonFieldValue: string): void
	{
		switch (typeof rObj.obj[rObj.szKey])
		{
			case 'string':
				rObj.obj[rObj.szKey] = szJsonFieldValue;
				break;
			case 'number':
				rObj.obj[rObj.szKey] = Number(szJsonFieldValue);
				break;
			case 'boolean':
				rObj.obj[rObj.szKey] = (szJsonFieldValue === 'true');
				break;
			case 'object':
				if (rObj.obj[rObj.szKey] instanceof AbxrDictStrings)
				{
					rObj.obj[rObj.szKey] = new AbxrDictStrings().FromJsonFieldValue(szJsonFieldValue);
				}
				else if (rObj.obj[rObj.szKey] instanceof StringList)
				{
					rObj.obj[rObj.szKey] = new StringList().FromCommaSeparatedList(szJsonFieldValue);
				}
				else if (rObj.obj[rObj.szKey] instanceof TimeSpan)
				{
					rObj.obj[rObj.szKey] = TimeSpan.Parse(szJsonFieldValue);
				}
				else if (rObj.obj[rObj.szKey] instanceof DateTime)
				{
					rObj.obj[rObj.szKey] = DateTime.Parse(szJsonFieldValue);
				}
				else if (rObj.obj[rObj.szKey] instanceof SUID)
				{
					rObj.obj[rObj.szKey] = (rObj.obj[rObj.szKey] as SUID).FromHex(szJsonFieldValue);
				}
				break;
			default:
		}
	}
	public LookupField(obj: any, szJsonFieldName: string): any | null
	{
		var fpNode:	FieldProperties | null = this.LookupFieldProperties(szJsonFieldName);

		if (fpNode)
		{
			for (var [szKey, val] of Object.entries(obj))
			{
				if (this.m_rfp[szKey]?.m_szName === szJsonFieldName)
				{
					return {value: val, pfnSetter: (val: any) => {FieldPropertiesRecordContainer.FromString({obj: obj, szKey: szKey}, val);}};
				}
			}
		}
		return null;
	}
	public Reset(objCurrentObject: any): void
	{
		this.m_objCurrentObject = objCurrentObject;
		this.m_nState = 0;
		this.m_aszAlreadySeen = new Array<string>();
		this.m_atpChildren = new Array<[string, object]>();
		this.m_atpListChildren = new Array<[string, object]>();
		if (!this.m_bExcludedFieldsInitialized)
		{
			this.m_aszExcludedFields = new Array<string>();
			this.m_bExcludedFieldsInitialized = true;
			for (const szKey in objCurrentObject)
			{
				if (this.m_rfp[szKey] === undefined)
				{
					this.m_aszExcludedFields.push(szKey);
				}
			}
		}
	}
	private ValueIsEmpty(oObjectValue: any)
	{
		if (oObjectValue instanceof AbxrDictStrings)
		{
			return (oObjectValue as AbxrDictStrings).Count() == 0;
		}
		else if (oObjectValue instanceof StringList)
		{
			return (oObjectValue as StringList).length == 0;
		}
		return false;
	}
	public replacer = (key: string, value: any): any =>
	{
		if (key === '')
		{
			// On the root object, create a new object with transformed keys.
			const result:	any = {};

			for (const [szObjectKey, oObjectValue] of Object.entries(value))
			{
				const fpNode:			FieldProperties | null = this.m_rfp[szObjectKey];
				const szJsonKey:		string = (fpNode) ? fpNode.m_szName : szObjectKey;
				const fFlags:			FieldPropertyFlags = (fpNode && fpNode.m_fFlags) ? fpNode.m_fFlags : FieldPropertyFlags.bfNull;
				const bExclude:			boolean = ((fFlags & (FieldPropertyFlags.bfExclude | FieldPropertyFlags.bfBackendAccommodation)) !== 0);
				const bChild:			boolean = ((fFlags & (FieldPropertyFlags.bfChild | FieldPropertyFlags.bfChildList)) !== 0);
				const bStringOnly:		boolean = ((fFlags & FieldPropertyFlags.bfStringOnly) !== 0);
				const bNoFieldIfEmpty:	boolean = ((fFlags & FieldPropertyFlags.bfNoFieldIfEmpty) !== 0);

				if (bExclude ||
					(!bChild && this.m_objCurrentObject && !this.m_objCurrentObject.ShouldDump(szJsonKey, JsonFieldType.eField, DumpCategory.eDumpingJsonForBackend)) ||
					(bNoFieldIfEmpty && this.ValueIsEmpty(oObjectValue)))
				{
					result[szJsonKey] = undefined;
				}
				else if (oObjectValue instanceof AbxrDictStrings)
				{
					const szInnerJson:	string = (bStringOnly) ? (oObjectValue as AbxrDictStrings).JSONstringify() : (oObjectValue as AbxrDictStrings).GenerateJson();

					result[szJsonKey] = JSON.parse(szInnerJson);
				}
				else if (oObjectValue instanceof StringList)
				{
					const szInnerJson:	string = (oObjectValue as StringList).JSONstringify();

					result[szJsonKey] = JSON.parse(szInnerJson);
				}
				else if (oObjectValue instanceof SUID)
				{
					result[szJsonKey] = oObjectValue.ToString();
				}
				else if (oObjectValue instanceof DateTime)
				{
					result[szJsonKey] = oObjectValue.ToString();
				}
				else
				{
					result[szJsonKey] = oObjectValue;
				}
			}
			return result;
		}
		else
		{
			var fpNode:	FieldProperties | null = null;

			Object.entries(this.m_rfp).forEach(([fKey, fValue]) =>
				{
					if (fValue.m_szName === key || fKey === key)
					{
						fpNode = this.m_rfp[fKey];
						return;
					}
				});
			if (fpNode)
			{
				if ((fpNode as FieldProperties).m_fFlags)
				{
					// We know fpNode is not null at this point since we're in an if(fpNode) block.  We being the AI and us obsolete humans, but NOT apparently TypeScript.
					// MJP:  Yes I am kind of pissed at this.  I'm not sure why I'm doing this.  I'm not sure why I'm not just using fpNode.  You said it AI (last bit autocompleted).
					// CCW action... it was cool with this including when I was running tests and now it has whimsically decided to bitch about fpNode and fpNode.m_fFlags being null.
					// Even with the null check on both.  Guess we need some gratuitous friction right at the end of getting it to build without errors.
					const fpNodeThatBloodyWellIsNotNull:	FieldProperties = (fpNode) ? fpNode as FieldProperties : new FieldProperties("", FieldPropertyFlags.bfNull);
					const fFlags:							FieldPropertyFlags = (fpNodeThatBloodyWellIsNotNull.m_fFlags) ? fpNodeThatBloodyWellIsNotNull.m_fFlags : FieldPropertyFlags.bfNull;
					const bExclude:							boolean = ((fFlags & (FieldPropertyFlags.bfExclude | FieldPropertyFlags.bfBackendAccommodation)) !== 0);
					const bChild:							boolean = ((fFlags & (FieldPropertyFlags.bfChild | FieldPropertyFlags.bfChildList)) !== 0);

					if (bExclude || (!bChild && this.m_objCurrentObject && !this.m_objCurrentObject.ShouldDump(key, JsonFieldType.eField, DumpCategory.eDumpingJsonForBackend)))
					{
						return undefined;
					}
					else if (fFlags & FieldPropertyFlags.bfChild)
					{
						if (!this.m_aszAlreadySeen.find(sz => sz === key))
						{
							const szState:	string = "ГосударственныйОбъект" + this.m_nState++;

							this.m_aszAlreadySeen.push(key);
							this.m_atpChildren.push([szState, value]);
							// ---
							return szState;
						}
					}
					else if (fFlags & FieldPropertyFlags.bfChildList)
					{
						if (!this.m_aszAlreadySeen.find(sz => sz === key))
						{
							const szState:	string = "ГосударственныйОбъект" + this.m_nState++;

							this.m_aszAlreadySeen.push(key);
							this.m_atpListChildren.push([szState, value]);
							// ---
							return szState;
						}
					}
				}
			}
			else
			{
				return (this.m_aszExcludedFields.find(sz => sz === key)) ? undefined : value;
			}
		}
		return value;
	}
}

/// <summary>
/// Baseclass for anything that wants to load/save itself to SQLite db and/or JSON using the mechanisms in this header file.
/// </summary>
export class DataObjectBase
{
	// --- OBJECT STATE.
	public	m_nLastLoadedSignature:	number = -1;
	public	m_bFlaggedForDelete:	boolean = false;
	public	m_bAlreadyTaken:		boolean = false;	// Database objects have to remain in memory until next SaveChanges() so this is how we Take() only not-previously-taken objects.
	// --- END OBJECT STATE.
	// When indicated by ObjectAttribute::eOutOfBandObject, any fields not found in the object
	// being LoadFromJson()ed, instead of erroring with JsonResult::eMissingField, will get stuffed
	// into here, and GenerateJson() will render the extra fields.
	// AbxrDictStrings	m_dictOutOfBandData;
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		{m_nLastLoadedSignature: new FieldProperties("last_loaded_signature", FieldPropertyFlags.bfExclude)},
		{m_bFlaggedForDelete: new FieldProperties("flagged_for_delete", FieldPropertyFlags.bfExclude)},
		{m_bAlreadyTaken: new FieldProperties("already_taken", FieldPropertyFlags.bfExclude)}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return DataObjectBase.m_mapProperties;
	}
	// ---
	/// <summary>
	/// DB model is like Entity Framework:  objects are operated on in memory then reflected in DB in large collective operation (SaveChanges()).
	///		This flags an object for deletion on the next SaveChanges().
	/// </summary>
	/// <param name="bFlaggedForDelete">Turn on or off.</param>
	public FlagForDelete(bFlaggedForDelete: boolean): void
	{
		this.m_bFlaggedForDelete = bFlaggedForDelete;
	}
	// ---
	/// <summary>
	/// Overload this in a particular object when discretionary JSON field dumping/filtering is required for that object.
	/// </summary>
	/// <param name="szFieldName">Name of field... string compare to include/exclude.</param>
	/// <param name="eJsonFieldType">Field, object, object-list, scalar-list.</param>
	/// <param name="eDumpCategory">Everything or Backend as I write this... basically for what is this JSON intended.</param>
	/// <returns>Should this field be dumped, true/false.</returns>
	public ShouldDump(szFieldName: string, eJsonFieldType: JsonFieldType, eDumpCategory: DumpCategory): boolean // virtual
	{
		return true;
	}
	/// <summary>
	/// Used by JsonScalarArrayElement to return pointer to contained data for the clause in
	///		LoadFromJson() that loads those.
	/// </summary>
	/// <returns>void* pointer to contained data that will be cast by LoadFromJson() appropriately.</returns>
	public GetData(): object | null // virtual
	{
		return null;
	}
	/// <summary>
	/// Any object that needs to post-process, typically converting a string to more meaningful data,
	///		can overload this then it will get called by LoadFromJson().
	/// </summary>
	public FinalizeParse(): void // virtual
	{
	}
	public FakeUpSomeRandomCrap(bWantChildObjects: boolean = true): void
	{
	}
};

// ---

export class DbContext extends DataObjectBase
{
	// public m_db:		SqliteDbConnection = new SqliteDbConnection();
	public m_guidId:	SUID = new SUID();	// Never actually gets dereferenced... needed so templates will instantiate as this object serves as a container for db objects.
	// ---
	public static m_mapProperties: FieldPropertiesRecordContainer = new FieldPropertiesRecordContainer(Object.assign({},
		super.m_mapProperties.m_rfp,
	 	{m_guidId: new FieldProperties("Id", FieldPropertyFlags.bfPrimaryKey)}));
	// ---
	public GetMapProperties(): FieldPropertiesRecordContainer // virtual
	{
		return DbContext.m_mapProperties;
	}
	// ---
	public SaveChanges(): DatabaseResult // virtual
	{
		return DatabaseResult.eOk;
	}
};

/// <summary>
/// Analogue of .NET DbSet<>... in here rather than DotNetishTypes.h as it is a core object needed by several functions in this header file.
/// </summary>
/// <typeparam name="T">Type of database object</typeparam>
export class DbSet<T extends DataObjectBase> extends Array<T>
{
	private m_tTypeCompare:	new() => T;
	//private m_tTypeCompare:	T;
	// ---
	constructor(ctor: new() => T)
	{
		super();
		this.m_tTypeCompare = ctor;
	}
	public ContainedType() : any
	{
		return this.m_tTypeCompare;
	}
	// --- C++/stl-ish from port from C++.
	public empty(): boolean
	{
		return (super.length === 0);
	}
	public clear(): void
	{
		super.length = 0;
	}
	public erase(o: T): void
	{
		super.splice(super.indexOf(o), 1);
	}
	// --- C#ish from C# port to C++.
	public emplace_back(): T
	{
		var o:	T = new this.m_tTypeCompare();
		super.push(o);
		// ---
		return o;
	}
	public emplace_back_object(o: T): T
	{
		super.push(o);
		// ---
		return o;
	}
	public emplace_front(): T
	{
		var o:	T = new this.m_tTypeCompare();

		super.unshift(o);
		// ---
		return o;
	}
	public Add(o: T): T
	{
		super.push(o);
		// ---
		return this[this.length - 1];
	}
	public Count(): number
	{
		var	nRet:	number = 0;

		for (let t of this.values())
		{
			if (!t.m_bAlreadyTaken && !t.m_bFlaggedForDelete)
			{
				nRet++;
			}
		}
		return nRet;
	}
	/// <summary>
	/// Like .NET List<T>.Count / stl-ish size().
	///		Note that this is not the same as Count() which is the number of items in this not filtered by m_bAlreadyTaken or m_bFlaggedForDelete.
	///		Generally use Count(), this is here to port a specific safety case from C++.
	/// </summary>
	/// <returns>Number of items in this not filtered by m_bAlreadyTaken or m_bFlaggedForDelete</returns>
	public size(): number
	{
		return this.length;
	}
	public RemoveAllRange(): void
	{
		for (let t of this.values())
		{
			t.m_bFlaggedForDelete = true;
		}
	}
	public RemoveRange(nFirst: number): void
	{
		if (nFirst > 0)
		{
			for (let t of this.values())
			{
				t.m_bFlaggedForDelete = true;
				nFirst--;
				if (nFirst === 0)
				{
					break;
				}
			}
		}
	}
	/// <summary>
	/// Like Take() in .NET.
	/// </summary>
	/// <param name="nCount">How many... SIZE_MAX for all (and do not mark as taken in that case)</param>
	/// <returns>List of pointers to first <nCount> objects in this</returns>
	public Take(nCount: number): DbSet<T>
	{
		var	lRet:			DbSet<T> = new DbSet<T>(this.m_tTypeCompare);
		var	bMarkAsTaken:	boolean = (nCount < Number.MAX_VALUE);

		if (nCount > 0)
		{
			for (let t of this.values())
			{
				if (!t.m_bAlreadyTaken)
				{
					lRet.push(t);
					if (bMarkAsTaken)
					{
						t.m_bAlreadyTaken = true;
					}
					nCount--;
					if (nCount === 0)
					{
						break;
					}
				}
			}
		}
		// ---
		return lRet;
	}
};

export function GenerateJsonAlternate(o: DataObjectBase, eDumpCategory: DumpCategory, mpfnGenerateJsonAlternate: Array<[string, () => string]>): string
{
	var szJSON:	string = "";

	o.GetMapProperties().Reset(o);
	// Dump just this object's fields (replacer will filter the children and put objects in m_atpChildren and lists in m_atpListChildren).
	szJSON = JSON.stringify(o, o.GetMapProperties().replacer);
	// Replace the placeholders.
	for (const [szName, oChildObject] of o.GetMapProperties().m_atpChildren)
	{
		if (o.ShouldDump(szName, JsonFieldType.eObject, eDumpCategory))
		{
			var szObjectJSON:				string = "";
			const fnGenerateJsonAlternate:	(() => string) | undefined = mpfnGenerateJsonAlternate.find(([szName, fn]) => szName === szName)?.[1];

			if (fnGenerateJsonAlternate)
			{
				szObjectJSON = fnGenerateJsonAlternate();
			}
			else
			{
				szObjectJSON = GenerateJson(oChildObject as DataObjectBase, eDumpCategory);
			}
			szJSON = szJSON.replace('"' + szName + '"', szObjectJSON);
		}
	}
	for (const [szName, oChildObjectList] of o.GetMapProperties().m_atpListChildren)
	{
		if (o.ShouldDump(szName, JsonFieldType.eObjectList, eDumpCategory))
		{
			var szObjectListJSON:			string = "";
			var bDidOne:					boolean = false;
			const fnGenerateJsonAlternate:	(() => string) | undefined = mpfnGenerateJsonAlternate.find(([szName, fn]) => szName === szName)?.[1];

			if (fnGenerateJsonAlternate)
			{
				szObjectListJSON = fnGenerateJsonAlternate();
			}
			else
			{
				szObjectListJSON = "[";
				for (const o of oChildObjectList as DbSet<DataObjectBase>)
				{
					const szInnerJson:  string = GenerateJson(o, eDumpCategory);

					if (bDidOne)
					{
						szObjectListJSON += ",";
					}
					bDidOne = true;
					szObjectListJSON += szInnerJson;
				}
				szObjectListJSON += "]";
			}
			szJSON = szJSON.replace('"' + szName + '"', szObjectListJSON);
		}
	}
	o.FinalizeParse();
	// ---
	return szJSON;
}

export function GenerateJson(o: DataObjectBase, eDumpCategory: DumpCategory): string
{
	return GenerateJsonAlternate(o, eDumpCategory, []);
}

export function GenerateJsonList(l: DbSet<DataObjectBase>, eDumpCategory: DumpCategory): string
{
	var szJSON:		string = "[";
	var bDidOne:	boolean = false;

	for (const o of l as DbSet<DataObjectBase>)
	{
		const szInnerJson:  string = GenerateJson(o, eDumpCategory);

		if (bDidOne)
		{
			szJSON += ",";
		}
		bDidOne = true;
		szJSON += szInnerJson;
	}
	szJSON += "]";
	// ---
	return szJSON;
}

export function LoadFromJson(o: DataObjectBase | null, szJSON: string): JsonResult
{
	var objJsonObject:	any = null;

	try
	{
		if (o !== null)
		{
			var objFieldProperties:	FieldPropertiesRecordContainer = o.GetMapProperties();

			objJsonObject = JSON.parse(szJSON);
			// objJsonObject = JSON.parse(JSON.stringify(JSON.parse(szJSON)));
			// objJsonObject = eval(szJSON);
			for (const [szField, szValue] of Object.entries(objJsonObject))
			{
				var fpNode:	FieldProperties | null = objFieldProperties.LookupFieldProperties(szField);

				if (fpNode)
				{
					const fpNodeThatBloodyWellIsNotNull:	FieldProperties = (fpNode) ? fpNode as FieldProperties : new FieldProperties("", FieldPropertyFlags.bfNull);
					const fFlags:							FieldPropertyFlags = (fpNodeThatBloodyWellIsNotNull.m_fFlags) ? fpNodeThatBloodyWellIsNotNull.m_fFlags : FieldPropertyFlags.bfNull;
					const bExclude:							boolean = (fFlags & FieldPropertyFlags.bfExclude) !== 0;
					const bChild:							boolean = ((fFlags & (FieldPropertyFlags.bfChild | FieldPropertyFlags.bfChildList)) !== 0);

					if (!bExclude && !bChild)
					{
						var objField:	any | null = objFieldProperties.LookupField(o, szField);

						if (objField !== null)
						{
							objField.pfnSetter(szValue);
						}
					}
					else
					{
						if (fFlags & FieldPropertyFlags.bfChild)
						{
							const objChild:	DataObjectBase = objFieldProperties.LookupField(o, szField) as DataObjectBase;

							if (objChild !== null)
							{
								LoadFromJson(objChild, szValue as string);
							}
						}
					}
				}
				else
				{
					return JsonResult.eMissingField;
				}
			}
		}
	}
	catch (error)
	{
		console.log(error);
		return JsonResult.eBadJsonStructure;
	}
	// ---
	return JsonResult.eOk;
}

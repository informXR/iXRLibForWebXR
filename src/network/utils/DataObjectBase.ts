/// <summary>
/// Allows for several categories of object dumping each with rules for which fields to dump or filter.

import { SUID } from "../types";
import { PythonDictStrings } from "./DotNetishTypes";
import { DatabaseResult } from "./iXRLibSQLite";

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
	bfChild					= 0x00000020,
	bfChildList				= 0x00000040
}

export class FieldProperties
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

export class FieldPropertiesRecordContainer
{
	public m_rfp:				Record<string, FieldProperties>;
	public m_nState:			number = 0;
	public m_aszAlreadySeen:	Array<string> = new Array<string>();	// Prevents re-entrancy stackfault.
	public m_atpChildren:		Array<[string, object]> = new Array<[string, object]>()
	public m_atpListChildren:	Array<[string, object]> = new Array<[string, object]>()
	// ---
	constructor(rfp: Record<string, FieldProperties>)
	{
		this.m_rfp = rfp;
	}
	public Reset(): void
	{
		this.m_nState = 0;
		this.m_aszAlreadySeen = new Array<string>();
		this.m_atpChildren = new Array<[string, object]>();
		this.m_atpListChildren = new Array<[string, object]>();
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

				 if (val instanceof PythonDictStrings)
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
		else
		{
			var fpNode:	FieldProperties|null = null;

			Object.entries(this.m_rfp).forEach(([fKey, fValue]) =>
				{
					if (fValue.m_szName === key || fKey === key)
					{
						fpNode = this.m_rfp[fKey];
						return;
					}
				});
			if (fpNode && fpNode.m_fFlags)
			{
				if (fpNode.m_fFlags & FieldPropertyFlags.bfExclude)
				{
					return undefined;
				}
				else if (fpNode.m_fFlags & FieldPropertyFlags.bfChild)
				{
					if (!this.m_aszAlreadySeen.find(sz => sz === key))
					{
						const result:	any = {};
						const szState:	string = "ГосударственныйОбъект" + this.m_nState++;

						this.m_aszAlreadySeen.push(key);
						this.m_atpChildren.push([szState, value]);
						// ---
						return szState;
					}
				}
				else if (fpNode.m_fFlags & FieldPropertyFlags.bfChildList)
				{
					if (!this.m_aszAlreadySeen.find(sz => sz === key))
					{
						const result:	any = {};
						const szState:	string = "ГосударственныйОбъект" + this.m_nState++;

						this.m_aszAlreadySeen.push(key);
						this.m_atpListChildren.push([szState, value]);
						// ---
						return szState;
					}
				}
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
	// PythonDictStrings	m_dictOutOfBandData;
	// // ---
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
	public GetData(): object|null // virtual
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
	// --- C#ish from C# port to C++.
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
				if (nFirst == 0)
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
		var	lRet:	DbSet<T> = new DbSet<T>;
		var	bMarkAsTaken = (nCount < Number.MAX_VALUE);

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
					if (nCount == 0)
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

export function GenerateJson(o: DataObjectBase, eDumpCategory: DumpCategory): string
{
	var szJSON:	string = "";

	o.GetMapProperties().Reset();
	// Dump just this object's fields (replacer will filter the children).
	szJSON = JSON.stringify(o, o.GetMapProperties().replacer);
	// Replace the placeholders.
	for (const [szName, oChildObject] of o.GetMapProperties().m_atpChildren)
	{
		const szObjectJSON:	string = GenerateJson(oChildObject as DataObjectBase, eDumpCategory);

		szJSON = szJSON.replace(szName, szObjectJSON);
	}
	for (const [szName, oChildObjectList] of o.GetMapProperties().m_atpListChildren)
	{
		var szObjectListJSON:	string = "[";
		var bDidOne:			boolean = false;

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
		szJSON = szJSON.replace(szName, szObjectListJSON);
	}
	o.FinalizeParse();
	// ---
	return szJSON;
}

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
	// constexpr static auto properties = std::make_tuple();
	// constexpr static auto childobjectproperties = std::make_tuple();
	// constexpr static auto childobjectlistproperties = std::make_tuple();
	// constexpr static auto childscalarlistproperties = std::make_tuple();
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
	// public ShouldDump(szFieldName: string, eJsonFieldType: JsonFieldType, eDumpCategory: DumpCategory): boolean // virtual
	// {
	// 	return true;
	// }
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

/// <summary>
/// Analogue of .NET DbSet<>... in here rather than DotNetishTypes.h as it is a core object needed by several functions in this header file.
/// </summary>
/// <typeparam name="T">Type of database object</typeparam>
export class DbSet<T extends DataObjectBase> extends Array<T>
{
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

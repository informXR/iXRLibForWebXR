import { iXRLibAnalytics, iXRLibInit } from "./iXRLibAnalytics";
import { iXRLibAsync } from "./iXRLibAsync";
import { DbSetStorage, iXRBase, iXREvent } from "./iXRLibCoreModel";
import { iXRLibStorage } from "./iXRLibStorage";

export class iXRInitAllStatics
{
	public static InitStatics(): void
	{
		iXRLibInit.InitStatics();
		iXRLibAnalytics.InitStatics();
		iXRLibAsync.InitStatics();
		iXRBase.InitStatics();
		iXREvent.InitStatics();
		DbSetStorage.InitStatics();
		iXRLibStorage.InitStatics();
	}
}

/// <summary>
/// One of TypeScript's many eccentricities... it 'supports' initializing members at their declaration but if you actually do it
///		you get an error that gives no clue that this is the problem.  This leads to 2 patterns:  initialize all non-static members
///		in the constructor() NOT the members, and then this:  initialize all statics with a global call, NOT the members.
/// ---
/// More commentary:  This worked in the very specific code tree where it was branched off Jijo's code.  When I condensed it down
///		to just what is necessary for the port, this started having init-order issues.  Hence, InitAllStatics() below is called in
///		iXRLib.Start().  Also, static { this.InitStatics(); } was tried... which results in the error that inspired this code.
/// </summary>
// iXRInitAllStatics.InitStatics();

export function InitAllStatics()
{
	iXRInitAllStatics.InitStatics();
}

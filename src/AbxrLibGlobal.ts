import { AbxrLibAnalytics, AbxrLibInit } from "./AbxrLibAnalytics";
import { AbxrLibAsync } from "./AbxrLibAsync";
import { DbSetStorage, AbxrBase, AbxrEvent } from "./AbxrLibCoreModel";
import { AbxrLibStorage } from "./AbxrLibStorage";

export class AbxrInitAllStatics
{
	public static InitStatics(): void
	{
		AbxrLibInit.InitStatics();
		AbxrLibAnalytics.InitStatics();
		AbxrLibAsync.InitStatics();
		AbxrBase.InitStatics();
		AbxrEvent.InitStatics();
		DbSetStorage.InitStatics();
		AbxrLibStorage.InitStatics();
	}
}

/// <summary>
/// One of TypeScript's many eccentricities... it 'supports' initializing members at their declaration but if you actually do it
///		you get an error that gives no clue that this is the problem.  This leads to 2 patterns:  initialize all non-static members
///		in the constructor() NOT the members, and then this:  initialize all statics with a global call, NOT the members.
/// ---
/// More commentary:  This worked in the very specific code tree where it was branched off Jijo's code.  When I condensed it down
///		to just what is necessary for the port, this started having init-order issues.  Hence, InitAllStatics() below is called in
///		AbxrLib.Start().  Also, static { this.InitStatics(); } was tried... which results in the error that inspired this code.
/// </summary>
// AbxrInitAllStatics.InitStatics();

export function InitAllStatics()
{
	AbxrInitAllStatics.InitStatics();
}

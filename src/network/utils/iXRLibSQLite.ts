/// <summary>
/// Results of database operations.
/// </summary>
export enum DatabaseResult
{
	eOk,
	eBlewException,
	eDatabaseConnectFailed,
	eDatabaseConnectCouldNotParseSchema,
	eDatabaseNotConnected,
	eNoColumns,
	eNoRows,
	ePrimaryKeyColumnDoesNotExist,
	eParentKeyColumnDoesNotExist,
	eWhereClauseColumnDoesNotExist,
	ePartialColumns,
	eBeginTransactionFailed,
	eEndTransactionFailed,
	eExecuteRecordsetFailed,
	ePrepareFailed,
	eBindColumnFailed,
	eStepAfterPrepareFailed
};

export function DatabaseResultToString(eDbRet: DatabaseResult): string
{
	switch (eDbRet)
	{
	case DatabaseResult.eOk:
		return "Ok";
	case DatabaseResult.eBlewException:
		return "Blew Exception";
	case DatabaseResult.eDatabaseConnectFailed:
		return "DatabaseConnect Failed";
	case DatabaseResult.eDatabaseConnectCouldNotParseSchema:
		return "Database Connect Could Not Parse Schema";
	case DatabaseResult.eDatabaseNotConnected:
		return "Database Not Connected";
	case DatabaseResult.eNoColumns:
		return "No Columns";
	case DatabaseResult.eNoRows:
		return "No Rows";
	case DatabaseResult.ePrimaryKeyColumnDoesNotExist:
		return "Primary Key Column Does Not Exist";
	case DatabaseResult.eParentKeyColumnDoesNotExist:
		return "Parent Key Column Does Not Exist";
	case DatabaseResult.eWhereClauseColumnDoesNotExist:
		return "Where Clause Column Does Not Exist";
	case DatabaseResult.ePartialColumns:
		return "Partial Columns";
	case DatabaseResult.eBeginTransactionFailed:
		return "Begin Transaction Failed";
	case DatabaseResult.eEndTransactionFailed:
		return "End Transaction Failed";
	case DatabaseResult.eExecuteRecordsetFailed:
		return "Execute Recordset Failed";
	case DatabaseResult.ePrepareFailed:
		return "Prepare Failed";
	case DatabaseResult.eBindColumnFailed:
		return "Bind Column Failed";
	case DatabaseResult.eStepAfterPrepareFailed:
		return "Step After Prepare Failed";
	default:
		break;
	}
	return "Forgot a Case Statement";
}

/// <summary>
/// When only interested in hard failures... this regards soft failures (ePartialColumns)
///		as success, or more precisely, not a failure.
/// </summary>
/// <param name="eRet"></param>
/// <returns></returns>
export function DbSuccess(eRet: DatabaseResult): boolean
{
	return (eRet === DatabaseResult.eOk || eRet === DatabaseResult.ePartialColumns);
}

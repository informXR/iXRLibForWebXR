import { jwtDecode } from "jwt-decode";

export function JWTDecode(szToken: string): string
{
	if (typeof window !== 'undefined')
	{
		// Browser environment.
		// You may want to use a library like 'jwt-decode' here
		// For simplicity, we'll use a basic implementation
		const base64Url:	string = szToken.split('.')[1];
		const base64:		string = base64Url.replace(/-/g, '+').replace(/_/g, '/');

		return JSON.stringify(JSON.parse(atob(base64)));
	}
	else if (typeof process !== 'undefined' && process.versions && process.versions.node)
	{
		// Node.js environment.
		const jwt = require('jsonwebtoken');

		return JSON.stringify(jwt.decode(szToken));
	}
	else
	{
		throw new Error('Unsupported environment for JWT decoding');
	}
}

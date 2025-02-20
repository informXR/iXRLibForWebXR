const path = require('path');

module.exports =
{
	mode: "development",
	devtool: "inline-source-map",
	entry:
	{
		main: "./src/test.ts",
	},
	output:
	{
		path: path.resolve(__dirname, './dist'),
		filename: "iXRLibForWebXR.js" // <--- Will be compiled to this single file
	},
	resolve:
	{
		extensions: [".ts", ".tsx", ".js"],
		fallback: {
            "fs": false,
            "tls": false,
            "net": false,
            "path": false,
            "zlib": false,
            "http": false,
            "https": false,
            "stream": require.resolve('stream-browserify'),
            "crypto": require.resolve('crypto-browserify'),
            "buffer": require.resolve('buffer/'),
            "util": require.resolve('util/'),
			"vm": require.resolve('vm-browserify')
        }
	},
	module:
	{
		rules:
		[
			{
				test: /\.tsx?$/,
				loader: "ts-loader"
			}
		]
	}
};

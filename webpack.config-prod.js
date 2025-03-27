const path = require('path');
const webpack = require('webpack');

module.exports = {
	mode: "production",
	devtool: "source-map",
	entry: {
		main: "./src/test.ts"
	},
	output: {
		path: path.resolve(__dirname, './dist'),
		filename: "AbxrLibForWebXR.js" // <--- Will be compiled to this single file
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js"],
		fallback: {
			fs: false,
			tls: false,
			net: false,
			path: false,
			zlib: false,
			http: false,
			https: false,
			stream: require.resolve('stream-browserify'),
			crypto: require.resolve('crypto-browserify'),
			buffer: require.resolve('buffer/'),
			util: require.resolve('util/'),
			vm: require.resolve('vm-browserify'),
			process: require.resolve('process/browser')
		}
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: "ts-loader"
			}
		]
	},
	plugins: [
		// Work around for Buffer is undefined:
		// https://github.com/webpack/changelog-v5/issues/10
		new webpack.ProvidePlugin({
			Buffer: ['buffer', 'Buffer'],
		}),
		new webpack.ProvidePlugin({
			process: 'process/browser',
		}),
	],
};

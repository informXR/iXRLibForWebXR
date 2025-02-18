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

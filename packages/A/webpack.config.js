const path = require("path");
const MonorepoAliasPlugin = require("@monorepo/alias-plugin");

module.exports = {
  entry: "./src/index.ts",
  
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
  },
  
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
      "@utils": path.resolve(__dirname, "src/utils")
    }
  },
  
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  
  plugins: [
    new MonorepoAliasPlugin({
      root: path.resolve(__dirname, "../.."), // monorepo 根目录
    }),
  ],
  
  mode: "development",
  devtool: "source-map"
}; 
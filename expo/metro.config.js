const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// react-native-youtube-iframe's web entry requires the optional peer dep
// react-native-web-webview, which we don't install (the player is native-only).
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-web-webview") {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "web-stubs", "react-native-web-webview.js"),
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withRorkMetro(config);

const { getDefaultConfig } = require("expo/metro-config");
const resolveFrom = require("resolve-from");

const config = getDefaultConfig(__dirname);

// Fix for react-native-webrtc event-target-shim compatibility
// React Native uses event-target-shim@5 but react-native-webrtc needs @6
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.startsWith("event-target-shim") &&
    context.originModulePath.includes("react-native-webrtc")
  ) {
    const eventTargetShimPath = resolveFrom(
      context.originModulePath,
      moduleName
    );
    return {
      filePath: eventTargetShimPath,
      type: "sourceFile",
    };
  }
  // Ensure you call the default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

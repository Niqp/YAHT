const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;
const androidTimeChangePath = path.resolve(__dirname, "../react-native-android-time-change");

config.watchFolders = [...(config.watchFolders ?? []), androidTimeChangePath];

config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "zustand" || moduleName.startsWith("zustand/")) {
    return (defaultResolveRequest ?? context.resolveRequest)(
      {
        ...context,
        unstable_conditionNames: ["browser", "require", "react-native"],
      },
      moduleName,
      platform
    );
  }

  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;

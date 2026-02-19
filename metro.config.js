const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;

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

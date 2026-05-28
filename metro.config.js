const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    return context.resolveRequest(context, moduleName, platform);
  }
  const isTamagui =
    moduleName === 'tamagui' ||
    moduleName.startsWith('tamagui/') ||
    moduleName.startsWith('@tamagui/');
  if (isTamagui) {
    return context.resolveRequest(
      { ...context, unstable_conditionNames: ['react-native', 'require', 'default'] },
      moduleName,
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

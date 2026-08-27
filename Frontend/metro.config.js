const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'mjs' to the sourceExtensions resolver list so packages like style-value-types bundle correctly
config.resolver.sourceExts.push('mjs');

// Fix for tslib Metro resolving error
const ALIASES = {
  tslib: require.resolve('tslib/tslib.es6.js'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  return context.resolveRequest(
    context,
    ALIASES[moduleName] ?? moduleName,
    platform
  );
};

module.exports = config;

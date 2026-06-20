const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'mjs' to the sourceExtensions resolver list so packages like style-value-types bundle correctly
config.resolver.sourceExts.push('mjs');

module.exports = config;

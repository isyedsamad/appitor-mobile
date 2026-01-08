// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true, // must be true for Tailwind
});

module.exports = withNativeWind(config, {
  input: './global.css', // path to your CSS file
});

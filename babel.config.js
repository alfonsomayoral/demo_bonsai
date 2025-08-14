// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NUNCA pongas "expo-router/babel" aquí (deprecado)
      'react-native-reanimated/plugin', // siempre el último
    ],
  };
};

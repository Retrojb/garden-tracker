/** @type {import('jest').Config} */
const config = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!(' +
    '(jest-)?react-native' +
    '|@react-native(-community)?' +
    '|expo(nent)?' +
    '|@expo(nent)?/.*' +
    '|expo-modules-core' +
    '|@expo-google-fonts/.*' +
    '|react-navigation' +
    '|@react-navigation/.*' +
    '|@unimodules/.*' +
    '|unimodules' +
    '|sentry-expo' +
    '|native-base' +
    '|react-native-svg' +
    '|@shopify/flash-list' +
    '|@shopify/react-native-skia' +
    '|react-native-calendars' +
    '|react-native-gesture-handler' +
    '|react-native-reanimated' +
    '|react-native-drawer-layout' +
    '|react-native-worklets' +
    '|expo-sqlite' +
    '|zustand' +
    ')/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^react-native-mmkv': '<rootDir>/src/__mocks__/react-native-mmkv.ts',
  },
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
}

module.exports = config

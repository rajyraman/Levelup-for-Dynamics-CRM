module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  testTimeout: 30000, // Increased timeout for Chrome extension tests
  verbose: true,
  // Chrome extension specific configuration
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  // Module name mapping for Chrome extension imports
  moduleNameMapper: {
    '^#types/(.*)$': '<rootDir>/src/types/$1',
    '^#services/(.*)$': '<rootDir>/src/services/$1',
    '^#components/(.*)$': '<rootDir>/src/sidebar/components/$1',
    '^#contexts/(.*)$': '<rootDir>/src/sidebar/contexts/$1',
    '^#hooks/(.*)$': '<rootDir>/src/sidebar/hooks/$1',
    '^#config/(.*)$': '<rootDir>/src/sidebar/config/$1',
    '^#utils/(.*)$': '<rootDir>/src/utils/$1',
    '^#content/(.*)$': '<rootDir>/src/content/$1',
    '^#background/(.*)$': '<rootDir>/src/background/$1',
    '^#data/(.*)$': '<rootDir>/src/data/$1',
  },
  // Global setup for Chrome extension testing
  globalSetup: '<rootDir>/tests/global-setup.ts',
  globalTeardown: '<rootDir>/tests/global-teardown.ts',
};

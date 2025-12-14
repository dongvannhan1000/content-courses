const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Root directory for tests
  rootDir: '.',

  // Test file patterns
  testRegex: ['.*\\.spec\\.ts$', '.*\\.test\\.ts$'],

  // Transform TypeScript files
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },

  // Module name mapping for absolute imports
  moduleNameMapping: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test-setup/jest.setup.ts'],

  // Test timeout
  testTimeout: 30000,

  // Worker management
  maxWorkers: process.env.CI ? 2 : '50%',

  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.dto.ts',
    '!src/main.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.guard.ts',
  ],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Test environment
  testEnvironment: 'node',

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Module paths
  modulePaths: ['<rootDir>/src', '<rootDir>/node_modules'],

  // Ignore patterns
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],

  // Global variables
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
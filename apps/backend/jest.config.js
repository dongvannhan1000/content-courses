const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions: baseOptions } = require('../../tsconfig.base.json');
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
  moduleNameMapper: baseOptions.paths ? pathsToModuleNameMapper(baseOptions.paths, { prefix: '<rootDir>/../../' }) : {},

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

  // Coverage thresholds (target: 80%, current: ~66%)
  // TODO: Increase thresholds as more tests are added
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
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
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/', '<rootDir>/prisma/'],

  // Transform ignore patterns - allow ESM modules to be transformed
  transformIgnorePatterns: [
    'node_modules/(?!(@faker-js)/)',
  ],

  // Global variables
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
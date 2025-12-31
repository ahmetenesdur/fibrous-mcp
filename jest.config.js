/** @type {import('jest').Config} */
export default {
	preset: "ts-jest",
	testEnvironment: "node",
	extensionsToTreatAsEsm: [".ts"],

	// Test files
	testMatch: [
		"<rootDir>/tests/**/*.test.ts",
		"<rootDir>/tests/**/**/*.test.ts",
	],

	// TypeScript configuration
	transform: {
		"^.+\\.ts$": [
			"ts-jest",
			{
				useESM: true,
			},
		],
	},

	// Module resolution
	moduleFileExtensions: ["ts", "js", "json"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		"^(\\.{1,2}/.*)\\.js$": "$1",
		"^fibrous-router-sdk$": "<rootDir>/router-sdk/src",
	},

	// Setup files
	setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

	// Coverage
	collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/*.test.ts"],
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "html"],
	coverageThreshold: {
		global: {
			branches: 85,
			functions: 90,
			lines: 90,
			statements: 90,
		},
	},

	// Clear mocks between tests
	clearMocks: true,
	resetMocks: true,
	restoreMocks: true,

	// Timeout
	testTimeout: 10000,

	// Verbose output
	verbose: true,
};

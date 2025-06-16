/**
 * Global test setup for Fibrous MCP Server tests
 */

// Global test timeout
jest.setTimeout(10000);

// Mock environment variables
process.env.NODE_ENV = "test";

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
	// Mock console methods
	global.console = {
		...console,
		log: jest.fn(),
		error: jest.fn(),
		warn: jest.fn(),
		info: jest.fn(),
		debug: jest.fn(),
	};
});

afterAll(() => {
	// Restore console
	global.console = originalConsole;
	// Restore fetch
	global.fetch = originalFetch;
});

// Global error handler for unhandled promises
process.on("unhandledRejection", (reason) => {
	// During tests, it's better to fail the test case than to log an unhandled rejection
	// If a promise is expected to reject, it should be handled with .catch() or await expect().rejects
	throw new Error(`Unhandled Rejection in tests: ${reason}`);
});

// Store original fetch for restoration
const originalFetch = global.fetch;

// Global fetch mock setup
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Helper function to create mock responses
export const createMockResponse = (data: any, status = 200): Response => {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: status === 200 ? "OK" : "Error",
		headers: new Headers(),
		json: async () => data,
		text: async () => JSON.stringify(data),
	} as Response;
};

// Helper function to create mock error responses
export const createMockErrorResponse = (error: string, status = 500): Response => {
	return {
		ok: false,
		status,
		statusText: "Error",
		headers: new Headers(),
		json: async () => ({ error }),
		text: async () => JSON.stringify({ error }),
	} as Response;
};

// Mock dependencies before imports
const mockLogConfigStatus = jest.fn();
const mockServer = {
	connect: jest.fn().mockResolvedValue(undefined),
	close: jest.fn().mockResolvedValue(undefined),
};

jest.mock("../src/utils/config.js", () => ({
	logConfigStatus: mockLogConfigStatus,
}));

jest.mock("../src/server.js", () => ({
	server: mockServer,
}));

describe("Index Module", () => {
	let originalProcess: any;
	let mockExit: jest.SpyInstance;
	let mockOn: jest.SpyInstance;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, "log").mockImplementation(() => undefined);
		jest.spyOn(console, "error").mockImplementation(() => undefined);

		// Mock process
		originalProcess = global.process;
		mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});
		mockOn = jest.spyOn(process, "on").mockImplementation(() => process);
	});

	afterEach(() => {
		jest.restoreAllMocks();
		global.process = originalProcess;
	});

	describe("startServer", () => {
		it("should start server successfully", async () => {
			// Import after mocks are set up
			const { startServer } = await import("../src/index.js");

			await startServer();

			expect(console.error).toHaveBeenCalledWith("[INFO] Starting Fibrous MCP Server...");
			expect(mockServer.connect).toHaveBeenCalled();
			expect(console.error).toHaveBeenCalledWith(
				"[SUCCESS] Fibrous MCP Server started successfully"
			);
		});

		it("should handle server startup errors", async () => {
			mockServer.connect.mockRejectedValueOnce(new Error("Connection failed"));

			const { startServer } = await import("../src/index.js");

			try {
				await startServer();
			} catch (error) {
				expect(error).toEqual(new Error("process.exit called"));
			}

			expect(console.error).toHaveBeenCalledWith(
				"[ERROR] Failed to start Fibrous MCP Server:",
				expect.any(Error)
			);
			expect(mockExit).toHaveBeenCalledWith(1);
		});
	});

	describe("gracefulShutdown", () => {
		it("should handle graceful shutdown", async () => {
			const { gracefulShutdown } = await import("../src/index.js");

			try {
				await gracefulShutdown("SIGTERM");
			} catch (error) {
				expect(error).toEqual(new Error("process.exit called"));
			}

			expect(console.error).toHaveBeenCalledWith(
				"\n[INFO] Received SIGTERM, initiating graceful shutdown..."
			);

			expect(console.error).toHaveBeenCalledWith(
				"[INFO] Fibrous MCP Server shutdown complete"
			);
			expect(mockExit).toHaveBeenCalledWith(0);
		});

		it("should handle shutdown errors", async () => {
			// Mock console.log to throw an error during cleanup
			jest.spyOn(console, "error").mockImplementation((message) => {
				if (message === "[INFO] Fibrous MCP Server shutdown complete") {
					throw new Error("Cleanup failed");
				}
				return undefined;
			});

			const { gracefulShutdown } = await import("../src/index.js");

			try {
				await gracefulShutdown("SIGINT");
			} catch (error) {
				expect(error).toEqual(new Error("process.exit called"));
			}

			expect(console.error).toHaveBeenCalledWith(
				"[ERROR] Error during shutdown:",
				expect.any(Error)
			);
			expect(mockExit).toHaveBeenCalledWith(1);
		});
	});

	describe("signal handlers", () => {
		it("should register signal handlers on module load", async () => {
			// Clear previous calls
			mockOn.mockClear();

			// Reset modules to trigger fresh import
			jest.resetModules();

			// Import to trigger signal handler registration
			await import("../src/index.js");

			// Check if signal handlers are registered
			const calls = mockOn.mock.calls;
			const signalTypes = calls.map((call) => call[0]);

			expect(signalTypes).toContain("SIGTERM");
			expect(signalTypes).toContain("SIGINT");
			expect(signalTypes).toContain("uncaughtException");
			expect(signalTypes).toContain("unhandledRejection");
		});
	});
});

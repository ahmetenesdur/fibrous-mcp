// Mock dependencies before imports
const mockRouter = {
	supportedTokens: jest.fn(),
	supportedProtocols: jest.fn(),
	refreshSupportedChains: jest.fn().mockResolvedValue(undefined),
	supportedChains: [],
};

const mockMcpServer = {
	tool: jest.fn(),
	resource: jest.fn(),
	prompt: jest.fn(),
};

const mockLogConfigStatusServer = jest.fn();
const mockGetValidChains = jest.fn().mockReturnValue(["base", "starknet"]);

jest.mock("fibrous-router-sdk", () => ({
	Router: jest.fn().mockImplementation(() => mockRouter),
}));

jest.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
	McpServer: jest.fn().mockImplementation(() => mockMcpServer),
	ResourceTemplate: jest.fn(),
}));

jest.mock("../src/utils/index.js", () => ({
	SUPPORTED_CHAINS: ["base", "starknet", "scroll"],
	SERVER_CONSTANTS: {
		NAME: "fibrous-mcp",
		VERSION: "1.0.0",
		DESCRIPTION: "Test server",
		RATE_LIMIT: "200 req/min",
	},
	API_ENDPOINTS: {
		FIBROUS_API: "https://api.fibrous.finance",
		GRAPH_API: "https://graph.fibrous.finance",
	},
	VALIDATION_LIMITS: {
		MIN_SLIPPAGE: 0.01,
		MAX_SLIPPAGE: 50,
		MIN_DECIMALS: 0,
		MAX_DECIMALS: 30,
		MIN_STRING_LENGTH: 1,
	},
	getValidChains: () => mockGetValidChains(),
	logConfigStatus: () => mockLogConfigStatusServer(),
	validateChain: jest.fn(),
}));

describe("Server Module", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetModules();
		// Reset mock implementations
		mockGetValidChains.mockReturnValue(["base", "starknet"]);
		mockLogConfigStatusServer.mockImplementation(() => undefined);
		jest.spyOn(console, "log").mockImplementation(() => undefined);
		jest.spyOn(console, "error").mockImplementation(() => undefined);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe("Fibrous Router Initialization", () => {
		it("should initialize Fibrous Router successfully", async () => {
			// Import server after mocks are set up
			const { fibrousRouter } = await import("../src/server.js");

			expect(fibrousRouter).toBeDefined();
			expect(console.error).toHaveBeenCalledWith(
				"[INFO] Fibrous Router initialized with V2 API"
			);
		});

		it("should call logConfigStatus during initialization", async () => {
			await import("../src/server.js");

			expect(mockLogConfigStatusServer).toHaveBeenCalled();
		});
	});

	describe("MCP Server Configuration", () => {
		it("should create MCP server with correct configuration", async () => {
			const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
			await import("../src/server.js");

			expect(McpServer).toHaveBeenCalledWith({
				name: "fibrous-mcp",
				version: "1.0.0",
			});
		});

		it("should register all core tools", async () => {
			await import("../src/server.js");

			// Verify core tools are registered
			const expectedTools = [
				"get-supported-tokens",
				"get-supported-protocols",
				"get-best-route",
				"build-transaction",
				"format-token-amount",
				"get-token",
			];

			expectedTools.forEach((toolName) => {
				expect(mockMcpServer.tool).toHaveBeenCalledWith(
					toolName,
					expect.any(Object),
					expect.any(Function)
				);
			});
		});

		it("should register additional tools when valid chains are available", async () => {
			mockGetValidChains.mockReturnValue(["base", "starknet"]);

			// Re-import to trigger registration with valid chains
			jest.resetModules();
			await import("../src/server.js");

			// Should also register swap tools
			expect(mockMcpServer.tool).toHaveBeenCalledWith(
				"execute-swap",
				expect.any(Object),
				expect.any(Function)
			);
			expect(mockMcpServer.tool).toHaveBeenCalledWith(
				"estimate-swap",
				expect.any(Object),
				expect.any(Function)
			);
		});

		it("should not register swap tools when no valid chains", async () => {
			mockGetValidChains.mockReturnValue([]);

			jest.resetModules();
			await import("../src/server.js");

			// Should not register swap tools
			const swapCalls = mockMcpServer.tool.mock.calls.filter(
				(call) => call[0] === "execute-swap" || call[0] === "estimate-swap"
			);
			expect(swapCalls).toHaveLength(0);
		});
	});

	describe("Resource Registration", () => {
		it("should register fibrous-config resource", async () => {
			await import("../src/server.js");

			expect(mockMcpServer.resource).toHaveBeenCalledWith(
				"fibrous-config",
				"fibrous://config",
				expect.any(Function)
			);
		});

		it("should register chain-info resource template", async () => {
			await import("../src/server.js");

			expect(mockMcpServer.resource).toHaveBeenCalledWith(
				"chain-info",
				expect.any(Object), // ResourceTemplate
				expect.any(Function)
			);
		});

		it("should register greeting resource template", async () => {
			await import("../src/server.js");

			expect(mockMcpServer.resource).toHaveBeenCalledWith(
				"greeting",
				expect.any(Object), // ResourceTemplate
				expect.any(Function)
			);
		});
	});

	describe("Prompt Registration", () => {
		it("should register analyze-swap prompt", async () => {
			await import("../src/server.js");

			expect(mockMcpServer.prompt).toHaveBeenCalledWith(
				"analyze-swap",
				expect.any(Object),
				expect.any(Function)
			);
		});

		it("should register defi-strategy prompt", async () => {
			await import("../src/server.js");

			expect(mockMcpServer.prompt).toHaveBeenCalledWith(
				"defi-strategy",
				expect.any(Object),
				expect.any(Function)
			);
		});

		it("should register help prompt", async () => {
			await import("../src/server.js");

			expect(mockMcpServer.prompt).toHaveBeenCalledWith(
				"help",
				expect.any(Object),
				expect.any(Function)
			);
		});
	});

	describe("Server Exports", () => {
		it("should export server instance", async () => {
			const { server } = await import("../src/server.js");

			expect(server).toBeDefined();
			expect(server).toBe(mockMcpServer);
		});

		it("should export fibrousRouter instance", async () => {
			const { fibrousRouter } = await import("../src/server.js");

			expect(fibrousRouter).toBeDefined();
			expect(fibrousRouter).toBe(mockRouter);
		});
	});
});

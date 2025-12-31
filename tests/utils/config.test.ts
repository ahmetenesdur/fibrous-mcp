// Mock process.env for testing
const originalEnv = process.env;

beforeEach(() => {
	jest.resetModules();
	process.env = { ...originalEnv };
});

afterAll(() => {
	process.env = originalEnv;
});

describe("Configuration Utilities", () => {
	describe("getWalletConfig", () => {
		it("should return valid wallet configuration for mainnet", async () => {
			// Set up mainnet environment variables
			process.env.BASE_RPC_URL = "https://mainnet.base.org";
			process.env.BASE_PRIVATE_KEY =
				"0x1234567890123456789012345678901234567890123456789012345678901234";
			process.env.SCROLL_RPC_URL = "https://rpc.scroll.io";
			process.env.SCROLL_PRIVATE_KEY =
				"0x2345678901234567890123456789012345678901234567890123456789012345";
			process.env.STARKNET_RPC_URL = "https://starknet-mainnet.public.blastapi.io";
			process.env.STARKNET_PRIVATE_KEY =
				"0x3456789012345678901234567890123456789012345678901234567890123456";
			process.env.STARKNET_PUBLIC_KEY =
				"0x4567890123456789012345678901234567890123456789012345678901234567";

			const { getWalletConfig } = await import("../../src/utils/config");
			const config = getWalletConfig();

			expect(config.base.rpcUrl).toBe("https://mainnet.base.org");
			expect(config.base.privateKey).toBe(
				"0x1234567890123456789012345678901234567890123456789012345678901234"
			);
			expect(config.scroll.rpcUrl).toBe("https://rpc.scroll.io");
			expect(config.scroll.privateKey).toBe(
				"0x2345678901234567890123456789012345678901234567890123456789012345"
			);
			expect(config.starknet.rpcUrl).toBe("https://starknet-mainnet.public.blastapi.io");
			expect(config.starknet.privateKey).toBe(
				"0x3456789012345678901234567890123456789012345678901234567890123456"
			);
			expect(config.starknet.publicKey).toBe(
				"0x4567890123456789012345678901234567890123456789012345678901234567"
			);
		});

		it("should throw error for missing required environment variables", async () => {
			// Clear environment variables
			delete process.env.BASE_RPC_URL;
			delete process.env.BASE_PRIVATE_KEY;

			const { getWalletConfig } = await import("../../src/utils/config");

			expect(() => getWalletConfig()).toThrow(
				"Environment variable BASE_RPC_URL is required but not set"
			);
		});
	});

	describe("getServerConfig", () => {
		it("should return default server configuration", async () => {
			// Clear all optional environment variables
			delete process.env.DEFAULT_SLIPPAGE;
			delete process.env.GAS_PRICE_MULTIPLIER;
			delete process.env.TRANSACTION_TIMEOUT;
			delete process.env.FIBROUS_API_KEY;

			const { getServerConfig } = await import("../../src/utils/config");
			const config = getServerConfig();

			expect(config.defaultSlippage).toBe(1.0);
			expect(config.gasPriceMultiplier).toBe(1.2);
			expect(config.transactionTimeout).toBe(300);
			expect(config.fibrousApiKey).toBe("");
		});

		it("should return custom server configuration", async () => {
			process.env.DEFAULT_SLIPPAGE = "2.5";
			process.env.GAS_PRICE_MULTIPLIER = "1.5";
			process.env.TRANSACTION_TIMEOUT = "600";
			process.env.FIBROUS_API_KEY = "test-api-key";

			const { getServerConfig } = await import("../../src/utils/config");
			const config = getServerConfig();

			expect(config.defaultSlippage).toBe(2.5);
			expect(config.gasPriceMultiplier).toBe(1.5);
			expect(config.transactionTimeout).toBe(600);
			expect(config.fibrousApiKey).toBe("test-api-key");
		});

		it("should throw error for invalid number values", async () => {
			process.env.DEFAULT_SLIPPAGE = "invalid";

			const { getServerConfig } = await import("../../src/utils/config");

			expect(() => getServerConfig()).toThrow(
				"Environment variable DEFAULT_SLIPPAGE must be a valid number"
			);
		});
	});

	describe("getChainConfig", () => {
		beforeEach(() => {
			// Set up basic environment for each test
			process.env.BASE_RPC_URL = "https://mainnet.base.org";
			process.env.BASE_PRIVATE_KEY =
				"0x1234567890123456789012345678901234567890123456789012345678901234";
			process.env.SCROLL_RPC_URL = "https://rpc.scroll.io";
			process.env.SCROLL_PRIVATE_KEY =
				"0x2345678901234567890123456789012345678901234567890123456789012345";
			process.env.STARKNET_RPC_URL = "https://starknet-mainnet.public.blastapi.io";
			process.env.STARKNET_PRIVATE_KEY =
				"0x3456789012345678901234567890123456789012345678901234567890123456";
			process.env.STARKNET_PUBLIC_KEY =
				"0x4567890123456789012345678901234567890123456789012345678901234567";
		});

		it("should return base chain configuration", async () => {
			const { getChainConfig } = await import("../../src/utils/config");
			const config = getChainConfig("base");

			expect(config.rpcUrl).toBe("https://mainnet.base.org");
			expect(config.privateKey).toBe(
				"0x1234567890123456789012345678901234567890123456789012345678901234"
			);
			expect(config.publicKey).toBeUndefined();
		});

		it("should return starknet chain configuration", async () => {
			const { getChainConfig } = await import("../../src/utils/config");
			const config = getChainConfig("starknet");

			expect(config.rpcUrl).toBe("https://starknet-mainnet.public.blastapi.io");
			expect(config.privateKey).toBe(
				"0x3456789012345678901234567890123456789012345678901234567890123456"
			);
			expect(config.publicKey).toBe(
				"0x4567890123456789012345678901234567890123456789012345678901234567"
			);
		});
	});

	describe("validateWalletConfig", () => {
		it("should return valid for complete configuration", async () => {
			// Set up complete environment
			process.env.BASE_RPC_URL = "https://mainnet.base.org";
			process.env.BASE_PRIVATE_KEY =
				"0x1234567890123456789012345678901234567890123456789012345678901234";
			process.env.SCROLL_RPC_URL = "https://rpc.scroll.io";
			process.env.SCROLL_PRIVATE_KEY =
				"0x2345678901234567890123456789012345678901234567890123456789012345";
			process.env.STARKNET_RPC_URL = "https://starknet-mainnet.public.blastapi.io";
			process.env.STARKNET_PRIVATE_KEY =
				"0x3456789012345678901234567890123456789012345678901234567890123456";
			process.env.STARKNET_PUBLIC_KEY =
				"0x4567890123456789012345678901234567890123456789012345678901234567";

			const { validateWalletConfig } = await import("../../src/utils/config");
			const validation = validateWalletConfig();

			expect(validation.isValid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});

		it("should return invalid for missing configuration", async () => {
			// Clear all environment variables
			delete process.env.BASE_RPC_URL;
			delete process.env.BASE_PRIVATE_KEY;
			delete process.env.SCROLL_RPC_URL;
			delete process.env.SCROLL_PRIVATE_KEY;
			delete process.env.STARKNET_RPC_URL;
			delete process.env.STARKNET_PRIVATE_KEY;
			delete process.env.STARKNET_PUBLIC_KEY;

			const { validateWalletConfig } = await import("../../src/utils/config");
			const validation = validateWalletConfig();

			expect(validation.isValid).toBe(false);
			expect(validation.errors.length).toBeGreaterThan(0);
			expect(validation.errors).toContain(
				"Environment variable BASE_RPC_URL is required but not set"
			);
		});

		it("should detect missing Starknet public key", async () => {
			// Set up incomplete Starknet configuration
			process.env.BASE_RPC_URL = "https://mainnet.base.org";
			process.env.BASE_PRIVATE_KEY =
				"0x1234567890123456789012345678901234567890123456789012345678901234";
			process.env.SCROLL_RPC_URL = "https://rpc.scroll.io";
			process.env.SCROLL_PRIVATE_KEY =
				"0x2345678901234567890123456789012345678901234567890123456789012345";
			process.env.STARKNET_RPC_URL = "https://starknet-mainnet.public.blastapi.io";
			process.env.STARKNET_PRIVATE_KEY =
				"0x3456789012345678901234567890123456789012345678901234567890123456";
			// Missing STARKNET_PUBLIC_KEY

			const { validateWalletConfig } = await import("../../src/utils/config");
			const validation = validateWalletConfig();

			expect(validation.isValid).toBe(false);
			expect(validation.errors).toContain(
				"Environment variable STARKNET_PUBLIC_KEY is required but not set"
			);
		});
	});

	describe("maskPrivateKey", () => {
		it("should mask long private keys", async () => {
			const { maskPrivateKey } = await import("../../src/utils/config");
			const masked = maskPrivateKey(
				"0x1234567890123456789012345678901234567890123456789012345678901234"
			);

			expect(masked).toBe("0x12****1234");
		});

		it("should mask short strings", async () => {
			const { maskPrivateKey } = await import("../../src/utils/config");
			const masked = maskPrivateKey("short");

			expect(masked).toBe("****");
		});

		it("should handle empty strings", async () => {
			const { maskPrivateKey } = await import("../../src/utils/config");
			const masked = maskPrivateKey("");

			expect(masked).toBe("****");
		});
	});

	describe("logConfigStatus", () => {
		let consoleSpy: jest.SpyInstance;

		beforeEach(() => {
			consoleSpy = jest.spyOn(console, "error").mockImplementation();
		});

		afterEach(() => {
			consoleSpy.mockRestore();
		});

		it("should log configuration status", async () => {
			// Set up environment
			process.env.DEFAULT_SLIPPAGE = "1.5";
			process.env.GAS_PRICE_MULTIPLIER = "1.3";
			process.env.TRANSACTION_TIMEOUT = "450";
			process.env.FIBROUS_API_KEY = "test-key";
			process.env.BASE_RPC_URL = "https://mainnet.base.org";
			process.env.BASE_PRIVATE_KEY =
				"0x1234567890123456789012345678901234567890123456789012345678901234";
			process.env.SCROLL_RPC_URL = "https://rpc.scroll.io";
			process.env.SCROLL_PRIVATE_KEY =
				"0x2345678901234567890123456789012345678901234567890123456789012345";
			process.env.STARKNET_RPC_URL = "https://starknet-mainnet.public.blastapi.io";
			process.env.STARKNET_PRIVATE_KEY =
				"0x3456789012345678901234567890123456789012345678901234567890123456";
			process.env.STARKNET_PUBLIC_KEY =
				"0x4567890123456789012345678901234567890123456789012345678901234567";

			const { logConfigStatus } = await import("../../src/utils/config");
			logConfigStatus();

			expect(consoleSpy).toHaveBeenCalledWith("[INFO] Configuration Status:");
			expect(consoleSpy).toHaveBeenCalledWith("  - Default Slippage: 1.5%");
			expect(consoleSpy).toHaveBeenCalledWith("  - Gas Price Multiplier: 1.3x");
			expect(consoleSpy).toHaveBeenCalledWith("  - Transaction Timeout: 450s");
			expect(consoleSpy).toHaveBeenCalledWith("  - API Key: Set");
		});

		it("should log invalid configuration", async () => {
			// Clear critical environment variables
			delete process.env.BASE_RPC_URL;

			const { logConfigStatus } = await import("../../src/utils/config");
			logConfigStatus();

			expect(consoleSpy).toHaveBeenCalledWith("    [-] base: Invalid");
		});
	});
});

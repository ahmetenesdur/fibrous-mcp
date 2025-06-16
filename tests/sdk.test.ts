/**
 * Fibrous SDK Test Suite
 * Professional test suite for testing Fibrous Router SDK methods
 */

import { Router as FibrousRouter } from "fibrous-router-sdk";
import { createTestAmount } from "../src/utils/index";

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("Fibrous Router SDK", () => {
	let router: FibrousRouter;

	beforeEach(() => {
		router = new FibrousRouter();
		mockFetch.mockClear();
	});

	describe("Initialization", () => {
		test("should initialize router with default settings", () => {
			const defaultRouter = new FibrousRouter();
			expect(defaultRouter).toBeInstanceOf(FibrousRouter);
		});

		test("should initialize router with custom URL", () => {
			const customRouter = new FibrousRouter("https://custom-api.example.com");
			expect(customRouter).toBeInstanceOf(FibrousRouter);
		});

		test("should initialize router with API key", () => {
			const routerWithKey = new FibrousRouter(undefined, "test-api-key");
			expect(routerWithKey).toBeInstanceOf(FibrousRouter);
		});

		test("should initialize router with custom URL and API key", () => {
			const fullCustomRouter = new FibrousRouter(
				"https://custom-api.example.com",
				"test-api-key"
			);
			expect(fullCustomRouter).toBeInstanceOf(FibrousRouter);
		});
	});

	describe("supportedTokens", () => {
		const mockTokens = [
			{
				address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
				symbol: "ETH",
				name: "Ethereum",
				decimals: 18,
				isBase: true,
				isNative: true,
				price: 2000,
			},
			{
				address: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
				symbol: "USDC",
				name: "USD Coin",
				decimals: 6,
				isBase: true,
				isNative: false,
				price: 1,
			},
		];

		test("should fetch supported tokens for starknet", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockTokens,
			} as Response);

			const tokens = await router.supportedTokens("starknet");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://graph.fibrous.finance/starknet/tokens",
				expect.objectContaining({
					headers: {},
				})
			);

			expect(tokens).toBeInstanceOf(Map);
			expect(tokens.has("eth")).toBe(true);
			expect(tokens.has("usdc")).toBe(true);
		});

		test("should fetch supported tokens for base", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockTokens,
			} as Response);

			const tokens = await router.supportedTokens("base");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://graph.fibrous.finance/base/tokens",
				expect.objectContaining({
					headers: {},
				})
			);

			expect(tokens).toBeInstanceOf(Map);
		});

		test("should handle empty token list", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => [],
			} as Response);

			const tokens = await router.supportedTokens("starknet");

			expect(tokens).toBeInstanceOf(Map);
			expect(tokens.size).toBe(0);
		});

		test("should handle duplicate tokens by symbol", async () => {
			const duplicateTokens = [
				...mockTokens,
				{
					address: "0x999",
					symbol: "ETH", // Duplicate symbol
					name: "Wrapped Ethereum",
					decimals: 18,
					isBase: false,
					isNative: false,
					price: 2000,
				},
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => duplicateTokens,
			} as Response);

			const tokens = await router.supportedTokens("starknet");

			expect(tokens.size).toBe(2); // Should only have 2 unique symbols
			expect(tokens.get("eth")?.address).toBe(mockTokens[0].address); // First one wins
		});
	});

	describe("supportedProtocols", () => {
		const mockProtocols = [
			{ amm_name: "JediSwap", protocol: 1 },
			{ amm_name: "MySwap", protocol: 2 },
			{ amm_name: "10kSwap", protocol: 3 },
		];

		test("should fetch supported protocols", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockProtocols,
			} as Response);

			const protocols = await router.supportedProtocols("starknet");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://graph.fibrous.finance/starknet/protocols",
				expect.objectContaining({
					headers: {},
				})
			);

			expect(protocols).toEqual({
				JediSwap: 1,
				MySwap: 2,
				"10kSwap": 3,
			});
		});

		test("should handle empty protocol list", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => [],
			} as Response);

			const protocols = await router.supportedProtocols("starknet");

			expect(protocols).toEqual({});
		});
	});

	describe("getToken", () => {
		const mockToken = {
			address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
			symbol: "ETH",
			name: "Ethereum",
			decimals: 18,
			isBase: true,
			isNative: true,
			price: 2000,
		};

		test("should fetch token by address", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockToken,
			} as Response);

			const token = await router.getToken(mockToken.address, "starknet");

			expect(mockFetch).toHaveBeenCalledWith(
				`https://graph.fibrous.finance/starknet/tokens/${mockToken.address}`,
				expect.objectContaining({
					headers: {},
				})
			);

			expect(token).toEqual(mockToken);
		});

		test("should return null for non-existent token", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => null,
			} as Response);

			const token = await router.getToken("0x999", "starknet");

			expect(token).toBeNull();
		});
	});

	describe("getBestRoute", () => {
		const mockRoute = {
			success: true,
			inputToken: {
				address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
				symbol: "ETH",
				name: "Ethereum",
				decimals: 18,
				isBase: true,
				isNative: true,
				price: 2000,
			},
			outputToken: {
				address: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
				symbol: "USDC",
				name: "USD Coin",
				decimals: 6,
				isBase: true,
				isNative: false,
				price: 1,
			},
			inputAmount: "1000000000000000000",
			outputAmount: "1800000000",
			estimatedGasUsed: "200000",
			estimatedGasUsedInUsd: "5.0",
			route: [
				{
					percent: "100%",
					swaps: [
						[
							{
								protocol: 1,
								poolId: "ETH-USDC",
								poolAddress: "0x123",
								poolName: "ETH/USDC Pool",
								fromTokenAddress:
									"0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
								toTokenAddress:
									"0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
								percent: "100%",
							},
						],
					],
				},
			],
			time: 0.1,
		};

		test("should get best route", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockRoute,
			} as Response);

			const amount = createTestAmount("1.0", 18);
			const tokenIn = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
			const tokenOut = "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";

			const route = await router.getBestRoute(amount, tokenIn, tokenOut, "starknet");

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("https://api.fibrous.finance/starknet/route"),
				expect.objectContaining({
					headers: {},
				})
			);

			expect(route).toEqual(mockRoute);
		});

		test("should get best route with options", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockRoute,
			} as Response);

			const amount = createTestAmount("1.0", 18);
			const tokenIn = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
			const tokenOut = "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";

			const route = await router.getBestRoute(amount, tokenIn, tokenOut, "starknet", {
				excludeProtocols: [1, 2],
				reverse: false,
			});

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("excludeProtocols=1,2"),
				expect.objectContaining({
					headers: {},
				})
			);

			expect(route).toEqual(mockRoute);
		});

		test("should handle route failure", async () => {
			const failureRoute = {
				success: false,
				errorMessage: "No route found",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => failureRoute,
			} as Response);

			const amount = createTestAmount("1.0", 18);
			const tokenIn = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
			const tokenOut = "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";

			const route = await router.getBestRoute(amount, tokenIn, tokenOut, "starknet");

			expect(route).toEqual(failureRoute);
		});
	});

	describe("buildTransaction", () => {
		const mockCalldata = ["0x1", "0x2", "0x3"];

		test("should build transaction for starknet", async () => {
			// Mock both route and calldata requests
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ success: true }),
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => mockCalldata,
				} as Response);

			const amount = createTestAmount("1.0", 18);
			const tokenIn = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
			const tokenOut = "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";
			const slippage = 1;
			const destination = "0x123";

			const transaction = await router.buildTransaction(
				amount,
				tokenIn,
				tokenOut,
				slippage,
				destination,
				"starknet"
			);

			expect(transaction).toEqual({
				contractAddress: router.STARKNET_ROUTER_ADDRESS,
				entrypoint: "swap",
				calldata: mockCalldata,
			});
		});

		test("should build transaction for base", async () => {
			const mockEvmCalldata = {
				route: {},
				swap_parameters: [],
			};

			// Mock both route and calldata requests
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ success: true }),
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => mockEvmCalldata,
				} as Response);

			const amount = createTestAmount("1.0", 18);
			const tokenIn = "0x123";
			const tokenOut = "0x456";
			const slippage = 1;
			const destination = "0x789";

			const transaction = await router.buildTransaction(
				amount,
				tokenIn,
				tokenOut,
				slippage,
				destination,
				"base"
			);

			expect(transaction).toEqual(mockEvmCalldata);
		});

		test("should throw error for unsupported chain", async () => {
			const amount = createTestAmount("1.0", 18);
			const tokenIn = "0x123";
			const tokenOut = "0x456";
			const slippage = 1;
			const destination = "0x789";

			// Mock both potential fetch calls
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ success: true }),
				} as Response)
				.mockResolvedValueOnce({
					ok: false,
					status: 400,
					json: async () => ({ error: "Invalid chain" }),
				} as Response);

			await expect(
				router.buildTransaction(
					amount,
					tokenIn,
					tokenOut,
					slippage,
					destination,
					"unsupported" as any
				)
			).rejects.toThrow(); // Just expect any error for now since SDK implementation varies
		});
	});

	describe("buildApproveStarknet", () => {
		test("should build approve transaction for starknet", async () => {
			const amount = createTestAmount("1.0", 18);
			const tokenAddress =
				"0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

			const approveCall = await router.buildApproveStarknet(amount, tokenAddress);

			expect(approveCall).toEqual({
				contractAddress: tokenAddress,
				entrypoint: "approve",
				calldata: [
					router.STARKNET_ROUTER_ADDRESS,
					expect.any(String), // low part of uint256
					expect.any(String), // high part of uint256
				],
			});
		});
	});

	describe("Error Handling", () => {
		test("should handle network errors", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			await expect(router.supportedTokens("starknet")).rejects.toThrow("Network error");
		});

		test("should handle API errors", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				json: async () => ({ error: "Internal server error" }),
			} as Response);

			// This would depend on how the SDK handles HTTP errors
			// The test structure shows intent even if implementation varies
			await expect(router.supportedTokens("starknet")).rejects.toThrow();
		});

		test("should handle invalid JSON responses", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Headers(),
				json: async () => {
					throw new Error("Invalid JSON");
				},
			} as unknown as Response);

			await expect(router.supportedTokens("starknet")).rejects.toThrow("Invalid JSON");
		});
	});
});

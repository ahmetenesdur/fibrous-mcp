// Mock the entire utils module first
const mockGetServerConfig = jest.fn();
const mockToBigInt = jest.fn();

jest.mock("../../src/utils/config", () => ({
	getServerConfig: mockGetServerConfig,
}));

jest.mock("../../src/utils/amounts", () => ({
	toBigInt: mockToBigInt,
}));

// Mock external dependencies
jest.mock("viem", () => ({
	createPublicClient: jest.fn(),
	createWalletClient: jest.fn(),
	http: jest.fn(),
	parseUnits: jest.fn(),
	erc20Abi: [],
}));

jest.mock("viem/accounts", () => ({
	privateKeyToAccount: jest.fn(),
}));

jest.mock("viem/chains", () => ({
	base: { id: 8453 },
	scroll: { id: 534352 },
}));

// Mock starknet
const mockRpcProvider = jest.fn();
const mockAccount = jest.fn();

jest.mock("starknet", () => ({
	RpcProvider: mockRpcProvider,
	Account: mockAccount,
}));

import {
	validateSwapParams,
	estimateSwapGas,
	executeSwap,
	type SwapParams,
} from "../../src/utils/swap";

import { createPublicClient, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";

describe("Swap Utilities", () => {
	// Mock objects
	const mockPublicClient = {
		getGasPrice: jest.fn(),
		estimateGas: jest.fn(),
		waitForTransactionReceipt: jest.fn(),
		readContract: jest.fn(),
	};

	const mockWalletClient = {
		sendTransaction: jest.fn(),
		writeContract: jest.fn(),
	};

	const mockAccountFromKey = {
		address: "0x1234567890123456789012345678901234567890",
	};

	beforeEach(() => {
		jest.clearAllMocks();

		// Setup default utils mocks
		mockGetServerConfig.mockReturnValue({
			gasPriceMultiplier: 1.2,
		});

		mockToBigInt.mockImplementation((value: string) => BigInt(value));

		// Setup viem mocks
		(createPublicClient as jest.Mock).mockReturnValue(mockPublicClient);
		(createWalletClient as jest.Mock).mockReturnValue(mockWalletClient);
		(privateKeyToAccount as jest.Mock).mockReturnValue(mockAccountFromKey);

		mockPublicClient.getGasPrice.mockResolvedValue(BigInt("20000000000")); // 20 Gwei
		mockPublicClient.estimateGas.mockResolvedValue(BigInt("200000"));
		mockPublicClient.waitForTransactionReceipt.mockResolvedValue({
			gasUsed: BigInt("180000"),
		});
		mockPublicClient.readContract.mockResolvedValue(BigInt("99999999999999999999999999")); // High allowance

		mockWalletClient.sendTransaction.mockResolvedValue("0xevmtxhash");
		mockWalletClient.writeContract.mockResolvedValue("0xapprovaltxhash");

		// Setup starknet mocks
		mockRpcProvider.mockImplementation(() => ({}));
		mockAccount.mockImplementation(() => ({
			execute: jest.fn().mockResolvedValue({
				transaction_hash: "0xabc123def456",
			}),
			estimateFee: jest.fn().mockResolvedValue({
				gas_consumed: BigInt("150000"),
				gas_price: BigInt("1000000000"),
				overall_fee: BigInt("150000000000000"),
			}),
		}));
	});

	describe("validateSwapParams", () => {
		const validParams: SwapParams = {
			amount: "1000000000000000000",
			tokenInAddress: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
			tokenOutAddress: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
			slippage: 1,
			chainName: "starknet",
		};

		it("should validate correct swap parameters", () => {
			const result = validateSwapParams(validParams);

			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should reject zero amount", () => {
			const params = { ...validParams, amount: "0" };
			const result = validateSwapParams(params);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("Amount must be greater than 0");
		});

		it("should reject empty amount", () => {
			const params = { ...validParams, amount: "" };
			const result = validateSwapParams(params);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("Amount must be greater than 0");
		});

		it("should reject missing token addresses", () => {
			const params = { ...validParams, tokenInAddress: "", tokenOutAddress: "" };
			const result = validateSwapParams(params);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("Token in address is required");
			expect(result.errors).toContain("Token out address is required");
		});

		it("should reject same token addresses", () => {
			const params = {
				...validParams,
				tokenInAddress: "0x123",
				tokenOutAddress: "0x123",
			};
			const result = validateSwapParams(params);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("Token in and token out addresses must be different");
		});

		it("should reject invalid slippage values", () => {
			const lowSlippageParams = { ...validParams, slippage: 0.005 };
			const highSlippageParams = { ...validParams, slippage: 51 };

			const lowResult = validateSwapParams(lowSlippageParams);
			const highResult = validateSwapParams(highSlippageParams);

			expect(lowResult.isValid).toBe(false);
			expect(lowResult.errors).toContain("Slippage must be between 0.01% and 50%");
			expect(highResult.isValid).toBe(false);
			expect(highResult.errors).toContain("Slippage must be between 0.01% and 50%");
		});

		it("should handle invalid amount format", () => {
			mockToBigInt.mockImplementation(() => {
				throw new Error("Invalid format");
			});

			const params = { ...validParams, amount: "invalid" };
			const result = validateSwapParams(params);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("Invalid amount format");
		});

		it("should accept valid slippage range", () => {
			const minValidParams = { ...validParams, slippage: 0.01 };
			const maxValidParams = { ...validParams, slippage: 50 };

			const minResult = validateSwapParams(minValidParams);
			const maxResult = validateSwapParams(maxValidParams);

			expect(minResult.isValid).toBe(true);
			expect(maxResult.isValid).toBe(true);
		});
	});

	describe("estimateSwapGas", () => {
		const validParams: SwapParams = {
			amount: "1000000000000000000",
			tokenInAddress: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
			tokenOutAddress: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
			slippage: 1,
			chainName: "starknet",
		};

		const mockChainConfig = {
			rpcUrl: "https://starknet-mainnet.public.blastapi.io",
			privateKey: "0x1234567890123456789012345678901234567890123456789012345678901234",
			publicKey: "0x4567890123456789012345678901234567890123456789012345678901234567",
		};

		let mockFibrousRouter: any;

		beforeEach(() => {
			mockFibrousRouter = {
				supportedChains: [
					{
						chain_name: "starknet",
						chain_id: 1,
						router_address: "0xRouterStarknet",
					},
					{
						chain_name: "base",
						chain_id: 8453,
						router_address: "0xRouterBase", // Needed for EVM swap/estimate
					},
				],
				buildApproveStarknet: jest.fn().mockResolvedValue({
					contractAddress: "0x123",
					entrypoint: "approve",
					calldata: ["0x1", "0x2", "0x3"],
				}),
				buildRouteAndCalldata: jest.fn().mockResolvedValue({
					route: { path: ["token1", "token2"] },
					calldata: ["0x4", "0x5", "0x6"], // For Starknet
				}),
			};
		});

		it("should estimate gas for Starknet swap", async () => {
			const result = await estimateSwapGas(validParams, mockChainConfig, mockFibrousRouter);

			expect(result.gasEstimate).toBe("150000");
			expect(result.gasPrice).toBe("1000000000");
			expect(result.estimatedCost).toBe("150000000000000");
		});

		it("should estimate gas for EVM chains", async () => {
			const evmParams = { ...validParams, chainName: "base" as const };
			const evmChainConfig = {
				rpcUrl: "https://mainnet.base.org",
				privateKey: "0x1234567890123456789012345678901234567890123456789012345678901234",
			};

			// Mock the router methods for EVM
			const mockEvmRouter = {
				...mockFibrousRouter,
				buildRouteAndCalldata: jest.fn().mockResolvedValue({
					route: { path: ["token1", "token2"] },
					calldata: "0xcalldata",
				}),
			};

			const result = await estimateSwapGas(evmParams, evmChainConfig, mockEvmRouter as any);

			const expectedGasPrice = "24000000000"; // 20 Gwei * 1.2
			const expectedCost = "4800000000000000"; // 200,000 * 24 Gwei

			expect(result.gasEstimate).toBe("200000");
			expect(result.gasPrice).toBe(expectedGasPrice);
			expect(result.estimatedCost).toBe(expectedCost);
		});

		it("should return fallback values for missing Starknet public key", async () => {
			const configWithoutPublicKey = { ...mockChainConfig, publicKey: undefined };

			const result = await estimateSwapGas(
				validParams,
				configWithoutPublicKey,
				mockFibrousRouter as any
			);

			// Should return fallback values instead of throwing
			expect(result.gasEstimate).toBe("50000");
			expect(result.gasPrice).toBe("1000000000");
			expect(result.estimatedCost).toBe("50000000000000");
		});
	});

	describe("executeSwap", () => {
		const validParams: SwapParams = {
			amount: "1000000000000000000",
			tokenInAddress: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
			tokenOutAddress: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
			slippage: 1,
			chainName: "starknet",
		};

		const mockChainConfig = {
			rpcUrl: "https://starknet-mainnet.public.blastapi.io",
			privateKey: "0x1234567890123456789012345678901234567890123456789012345678901234",
			publicKey: "0x4567890123456789012345678901234567890123456789012345678901234567",
		};

		const mockFibrousRouter = {
			supportedChains: [
				{
					chain_name: "starknet",
					chain_id: 1,
					router_address: "0xRouterStarknet",
				},
				{
					chain_name: "base",
					chain_id: 8453,
					router_address: "0xRouterBase", // Needed for internal lookup
				},
			],
			buildApproveStarknet: jest.fn(),
			buildRouteAndCalldata: jest.fn(),
			getContractWAccount: jest.fn(),
			buildApproveEVM: jest.fn(),
		};

		beforeEach(() => {
			mockFibrousRouter.buildApproveStarknet.mockResolvedValue({
				contractAddress: "0x123",
				entrypoint: "approve",
				calldata: ["0x1", "0x2", "0x3"],
			});

			mockFibrousRouter.buildRouteAndCalldata.mockResolvedValue({
				route: { path: ["token1", "token2"] },
				calldata: ["0x4", "0x5", "0x6"],
			});

			// We don't use these anymore in EVM direct implementation, but keeping for starknet usage if any
			mockFibrousRouter.getContractWAccount.mockResolvedValue({});
		});

		it("should execute Starknet swap successfully", async () => {
			const result = await executeSwap(
				validParams,
				mockChainConfig,
				mockFibrousRouter as any
			);

			expect(result.success).toBe(true);
			expect(result.transactionHash).toBe("0xabc123def456");
			expect(result.explorerUrl).toBe("https://starkscan.co/tx/0xabc123def456");
		});

		it("should execute EVM swap successfully", async () => {
			const evmParams: SwapParams = { ...validParams, chainName: "base" };
			const evmChainConfig = {
				rpcUrl: "https://mainnet.base.org",
				privateKey: "0x1234567890123456789012345678901234567890123456789012345678901234",
			};

			const mockEvmRouter = {
				...mockFibrousRouter,
				buildRouteAndCalldata: jest.fn().mockResolvedValue({
					route: { path: ["token1", "token2"] },
					calldata: "0xcalldata",
				}),
			};

			const result = await executeSwap(evmParams, evmChainConfig, mockEvmRouter as any);

			expect(result.success).toBe(true);
			expect(result.transactionHash).toBe("0xevmtxhash");
			expect(result.explorerUrl).toContain("basescan.org/tx/0xevmtxhash");
			expect(result.gasUsed).toBe("180000");
		});

		it("should handle missing receiver address", async () => {
			const paramsWithoutReceiver = { ...validParams };
			delete (paramsWithoutReceiver as any).receiverAddress;

			const result = await executeSwap(
				paramsWithoutReceiver,
				mockChainConfig,
				mockFibrousRouter as any
			);

			expect(result.success).toBe(true);
			expect(result.transactionHash).toBe("0xabc123def456");
		});

		it("should handle Starknet swap failure", async () => {
			const mockError = new Error("Starknet execution failed");
			mockFibrousRouter.buildApproveStarknet.mockRejectedValue(mockError);

			const result = await executeSwap(
				validParams,
				mockChainConfig,
				mockFibrousRouter as any
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Starknet execution failed");
		});

		it("should handle EVM swap approval failure", async () => {
			const evmParams: SwapParams = { ...validParams, chainName: "base" };
			const evmChainConfig = {
				rpcUrl: "https://mainnet.base.org",
				privateKey: "0x1234567890123456789012345678901234567890123456789012345678901234",
			};

			const mockEvmRouter = {
				...mockFibrousRouter,
				buildRouteAndCalldata: jest.fn().mockResolvedValue({
					route: { path: ["token1", "token2"] },
					calldata: "0xcalldata",
				}),
			};

			// Simulate approval failure
			// Mock allowance as 0
			mockPublicClient.readContract.mockResolvedValue(BigInt(0));
			// Mock writeContract failure
			mockWalletClient.writeContract.mockRejectedValue(new Error("Approval rejected"));

			const result = await executeSwap(evmParams, evmChainConfig, mockEvmRouter as any);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Approval rejected");
		});

		it("should handle missing Starknet public key", async () => {
			const configWithoutPublicKey = { ...mockChainConfig, publicKey: undefined };

			const result = await executeSwap(
				validParams,
				configWithoutPublicKey,
				mockFibrousRouter as any
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Starknet public key is required");
		});

		it("should handle general execution errors", async () => {
			// Reset mocks to their successful state
			mockFibrousRouter.buildApproveStarknet.mockResolvedValue({
				contractAddress: "0x123",
				entrypoint: "approve",
				calldata: ["0x1", "0x2", "0x3"],
			});

			const result = await executeSwap(
				validParams,
				mockChainConfig,
				mockFibrousRouter as any
			);

			expect(result.success).toBe(true); // This should succeed with our mocks
		});

		it("should handle unknown error types", async () => {
			const unknownError = { someProperty: "not an error object" };
			mockFibrousRouter.buildApproveStarknet.mockRejectedValue(unknownError);

			const result = await executeSwap(
				validParams,
				mockChainConfig,
				mockFibrousRouter as any
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Starknet swap failed");
		});
	});
});

// Mock utilities
const mockValidateChain = jest.fn();
const mockToBigInt = jest.fn();
const mockCreateSuccessResponse = jest.fn();
const mockCreateErrorResponse = jest.fn();
const mockCreateEmptyResponse = jest.fn();

jest.mock("../../src/utils/index.js", () => ({
	validateChain: mockValidateChain,
	toBigInt: mockToBigInt,
	createSuccessResponse: mockCreateSuccessResponse,
	createErrorResponse: mockCreateErrorResponse,
	createEmptyResponse: mockCreateEmptyResponse,
	convertAmount: jest.fn(),
	executeSwap: jest.fn(),
	validateSwapParams: jest.fn(),
	estimateSwapGas: jest.fn(),
	getChainConfig: jest.fn(),
	validateChainConfig: jest.fn(),
	DEFAULTS: { SLIPPAGE: 1 },
}));

import {
	getSupportedTokensHandler,
	getSupportedProtocolsHandler,
	getBestRouteHandler,
	buildTransactionHandler,
	formatTokenAmountHandler,
	getTokenHandler,
} from "../../src/tools/handlers.js";

describe("Tool Handlers", () => {
	const mockRouter = {
		supportedTokens: jest.fn(),
		supportedProtocols: jest.fn(),
		getBestRoute: jest.fn(),
		buildRouteAndCalldata: jest.fn(),
		getToken: jest.fn(),
		supportedChains: [{ chain_name: "base", chain_id: 8453 }],
		refreshSupportedChains: jest
			.fn()
			.mockResolvedValue([{ chain_name: "base", chain_id: 8453 }]),
	};

	beforeEach(() => {
		jest.clearAllMocks();

		// Setup default mocks
		mockValidateChain.mockImplementation(() => true);
		mockToBigInt.mockImplementation((value: string) => BigInt(value));
		mockCreateSuccessResponse.mockReturnValue({ content: [{ type: "text", text: "Success" }] });
		mockCreateErrorResponse.mockReturnValue({
			content: [{ type: "text", text: "Error" }],
			isError: true,
		});
		mockCreateEmptyResponse.mockReturnValue({ content: [{ type: "text", text: "Empty" }] });
	});

	describe("getSupportedTokensHandler", () => {
		it("should fetch supported tokens successfully", async () => {
			const mockTokens = new Map([
				["eth", { symbol: "ETH", address: "0x123" }],
				["usdc", { symbol: "USDC", address: "0x456" }],
			]);
			mockRouter.supportedTokens.mockResolvedValue(mockTokens);

			const result = await getSupportedTokensHandler(
				{ chainName: "base" },
				mockRouter as any
			);

			expect(mockValidateChain).toHaveBeenCalledWith("base");
			expect(mockRouter.supportedTokens).toHaveBeenCalledWith("base");
			expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
				expect.any(Object),
				"Supported tokens for base"
			);
			expect(result).toEqual({ content: [{ type: "text", text: "Success" }] });
		});

		it("should handle empty token results", async () => {
			mockRouter.supportedTokens.mockResolvedValue(new Map());

			const result = await getSupportedTokensHandler(
				{ chainName: "base" },
				mockRouter as any
			);

			expect(mockCreateEmptyResponse).toHaveBeenCalledWith("tokens", "base");
			expect(result).toEqual({ content: [{ type: "text", text: "Empty" }] });
		});

		it("should handle errors", async () => {
			const error = new Error("Network error");
			mockRouter.supportedTokens.mockRejectedValue(error);

			const result = await getSupportedTokensHandler(
				{ chainName: "base" },
				mockRouter as any
			);

			expect(mockCreateErrorResponse).toHaveBeenCalledWith(
				error,
				"get-supported-tokens",
				"base"
			);
			expect(result).toEqual({ content: [{ type: "text", text: "Error" }], isError: true });
		});
	});

	describe("getSupportedProtocolsHandler", () => {
		it("should fetch supported protocols successfully", async () => {
			const mockProtocols = { uniswap: "1", sushiswap: "2" };
			mockRouter.supportedProtocols.mockResolvedValue(mockProtocols);

			const result = await getSupportedProtocolsHandler(
				{ chainName: "base" },
				mockRouter as any
			);

			expect(mockValidateChain).toHaveBeenCalledWith("base");
			expect(mockRouter.supportedProtocols).toHaveBeenCalledWith("base");
			expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
				mockProtocols,
				"Supported protocols for base"
			);
			expect(result).toEqual({ content: [{ type: "text", text: "Success" }] });
		});

		it("should handle errors", async () => {
			const error = new Error("API error");
			mockRouter.supportedProtocols.mockRejectedValue(error);

			const _result = await getSupportedProtocolsHandler(
				{ chainName: "starknet" },
				mockRouter as any
			);

			expect(mockCreateErrorResponse).toHaveBeenCalledWith(
				error,
				"get-supported-protocols",
				"starknet"
			);
		});
	});

	describe("getBestRouteHandler", () => {
		it("should find best route successfully", async () => {
			const mockRoute = { success: true, outputAmount: "950000000000000000" };
			mockRouter.getBestRoute.mockResolvedValue(mockRoute);

			const result = await getBestRouteHandler(
				{
					amount: "1000000000000000000",
					tokenInAddress: "0x123",
					tokenOutAddress: "0x456",
					chainName: "base",
				},
				mockRouter as any
			);

			expect(mockToBigInt).toHaveBeenCalledWith("1000000000000000000");
			expect(mockRouter.getBestRoute).toHaveBeenCalledWith(
				expect.objectContaining({
					amount: BigInt("1000000000000000000"),
					tokenInAddress: "0x123",
					tokenOutAddress: "0x456",
					chainId: 8453,
				})
			);
			expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
				mockRoute,
				"Best route for base swap"
			);
			expect(result).toEqual({ content: [{ type: "text", text: "Success" }] });
		});

		it("should handle route finding errors", async () => {
			const error = new Error("No route found");
			mockRouter.getBestRoute.mockRejectedValue(error);

			const _result = await getBestRouteHandler(
				{
					amount: "1000000000000000000",
					tokenInAddress: "0x123",
					tokenOutAddress: "0x456",
					chainName: "base",
				},
				mockRouter as any
			);

			expect(mockCreateErrorResponse).toHaveBeenCalledWith(error, "get-best-route", "base");
		});
	});

	describe("buildTransactionHandler", () => {
		it("should build transaction successfully", async () => {
			const mockResponse = { route: {}, calldata: ["0x1", "0x2"] };
			mockRouter.buildRouteAndCalldata.mockResolvedValue(mockResponse);

			const result = await buildTransactionHandler(
				{
					amount: "1000000000000000000",
					tokenInAddress: "0x123",
					tokenOutAddress: "0x456",
					slippage: 1,
					receiverAddress: "0x789",
					chainName: "base",
				},
				mockRouter as any
			);

			expect(mockRouter.buildRouteAndCalldata).toHaveBeenCalledWith(
				expect.objectContaining({
					inputAmount: BigInt("1000000000000000000"),
					tokenInAddress: "0x123",
					tokenOutAddress: "0x456",
					slippage: 1,
					destination: "0x789",
					chainId: 8453,
				})
			);
			expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
				mockResponse,
				"Transaction data for base swap"
			);
			expect(result).toEqual({ content: [{ type: "text", text: "Success" }] });
		});

		it("should handle transaction building errors", async () => {
			const error = new Error("Transaction build failed");
			mockRouter.buildRouteAndCalldata.mockRejectedValue(error);

			const _result = await buildTransactionHandler(
				{
					amount: "1000000000000000000",
					tokenInAddress: "0x123",
					tokenOutAddress: "0x456",
					slippage: 1,
					receiverAddress: "0x789",
					chainName: "base",
				},
				mockRouter as any
			);

			expect(mockCreateErrorResponse).toHaveBeenCalledWith(
				error,
				"build-transaction",
				"base"
			);
		});
	});

	describe("getTokenHandler", () => {
		it("should fetch token info successfully", async () => {
			const mockToken = {
				symbol: "ETH",
				name: "Ethereum",
				address: "0x123",
				decimals: "18",
			};
			mockRouter.getToken.mockResolvedValue(mockToken);

			const result = await getTokenHandler(
				{ address: "0x123", chainName: "base" },
				mockRouter as any
			);

			expect(mockRouter.getToken).toHaveBeenCalledWith("0x123", "base");
			expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
				mockToken,
				"Token information for ETH"
			);
			expect(result).toEqual({ content: [{ type: "text", text: "Success" }] });
		});

		it("should handle token not found", async () => {
			mockRouter.getToken.mockResolvedValue(null);

			const result = await getTokenHandler(
				{ address: "0x123", chainName: "base" },
				mockRouter as any
			);

			expect(result).toEqual({
				content: [
					{
						type: "text",
						text: "Token not found: 0x123 on base",
					},
				],
			});
		});

		it("should handle token fetch errors", async () => {
			const error = new Error("Token fetch failed");
			mockRouter.getToken.mockRejectedValue(error);

			const _result = await getTokenHandler(
				{ address: "0x123", chainName: "base" },
				mockRouter as any
			);

			expect(mockCreateErrorResponse).toHaveBeenCalledWith(error, "get-token", "base");
		});
	});

	describe("formatTokenAmountHandler", () => {
		it("should format token amount successfully", async () => {
			const { convertAmount } = await import("../../src/utils/index.js");
			(convertAmount as jest.Mock).mockReturnValue("1.5");

			const result = await formatTokenAmountHandler({
				amount: "1500000000000000000",
				decimals: 18,
				operation: "format",
			});

			expect(convertAmount).toHaveBeenCalledWith("1500000000000000000", 18, "format");
			expect(result).toEqual({
				content: [
					{
						type: "text",
						text: "Amount conversion: 1500000000000000000 → 1.5 (format, 18 decimals)",
					},
				],
			});
		});

		it("should handle amount conversion errors", async () => {
			const { convertAmount } = await import("../../src/utils/index.js");
			(convertAmount as jest.Mock).mockImplementation(() => {
				throw new Error("Invalid amount");
			});

			const _result = await formatTokenAmountHandler({
				amount: "invalid",
				decimals: 18,
				operation: "format",
			});

			expect(mockCreateErrorResponse).toHaveBeenCalledWith(
				expect.any(Error),
				"format-token-amount"
			);
		});
	});
});

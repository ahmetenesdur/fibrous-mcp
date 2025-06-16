/**
 * Fibrous MCP Server Test Suite
 * Professional test suite for testing MCP server tool handlers
 */

// Mock the fibrous-router-sdk
const mockSupportedTokens = jest.fn();
const mockSupportedProtocols = jest.fn();
const mockGetBestRoute = jest.fn();
const mockBuildTransaction = jest.fn();
const mockGetToken = jest.fn();

jest.mock("fibrous-router-sdk", () => ({
	Router: jest.fn().mockImplementation(() => ({
		supportedTokens: mockSupportedTokens,
		supportedProtocols: mockSupportedProtocols,
		getBestRoute: mockGetBestRoute,
		buildTransaction: mockBuildTransaction,
		getToken: mockGetToken,
	})),
}));

import {
	getSupportedTokensHandler,
	getSupportedProtocolsHandler,
	getBestRouteHandler,
	buildTransactionHandler,
	formatTokenAmountHandler,
	getTokenHandler,
} from "../src/server";
import { toBigNumber } from "../src/utils";

describe("Fibrous MCP Server Tool Handlers", () => {
	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks();
	});

	describe("getSupportedTokensHandler", () => {
		it("should return a success response with tokens", async () => {
			const mockTokens = new Map([["ETH", { symbol: "ETH" }]]);
			mockSupportedTokens.mockResolvedValue(mockTokens);

			const result = await getSupportedTokensHandler({ chainName: "base" });

			expect(mockSupportedTokens).toHaveBeenCalledWith("base");
			expect(result.content[0].text).toContain("Supported tokens for base");
			expect(result.isError).toBeUndefined();
		});

		it("should return an empty response if no tokens are found", async () => {
			mockSupportedTokens.mockResolvedValue(new Map());
			const result = await getSupportedTokensHandler({ chainName: "base" });
			expect(result.content[0].text).toContain("No tokens found for base");
		});

		it("should return an error response on failure", async () => {
			const error = new Error("API Error");
			mockSupportedTokens.mockRejectedValue(error);
			const result = await getSupportedTokensHandler({ chainName: "base" });
			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Error in get-supported-tokens: API Error");
		});
	});

	describe("getSupportedProtocolsHandler", () => {
		it("should return a success response with protocols", async () => {
			const mockProtocols = { uniswap: "0x123" };
			mockSupportedProtocols.mockResolvedValue(mockProtocols);
			const result = await getSupportedProtocolsHandler({ chainName: "scroll" });
			expect(mockSupportedProtocols).toHaveBeenCalledWith("scroll");
			expect(result.content[0].text).toContain("Supported protocols for scroll");
		});

		it("should return an error response on failure", async () => {
			mockSupportedProtocols.mockRejectedValue(new Error("Fetch failed"));
			const result = await getSupportedProtocolsHandler({ chainName: "scroll" });
			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Fetch failed");
		});
	});

	describe("getBestRouteHandler", () => {
		const args = {
			amount: "1000000000000000000",
			tokenInAddress: "0xIn",
			tokenOutAddress: "0xOut",
			chainName: "base",
		};

		it("should return the best route successfully", async () => {
			const mockRoute = { success: true, outputAmount: "995..." };
			mockGetBestRoute.mockResolvedValue(mockRoute);
			const result = await getBestRouteHandler(args);
			expect(mockGetBestRoute).toHaveBeenCalledWith(
				toBigNumber(args.amount),
				args.tokenInAddress,
				args.tokenOutAddress,
				args.chainName
			);
			expect(result.content[0].text).toContain("Best route for base swap");
		});

		it("should return an error response on failure", async () => {
			mockGetBestRoute.mockRejectedValue(new Error("No route found"));
			const result = await getBestRouteHandler(args);
			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("No route found");
		});
	});

	describe("buildTransactionHandler", () => {
		const args = {
			amount: "1000000000000000000",
			tokenInAddress: "0xIn",
			tokenOutAddress: "0xOut",
			slippage: 1,
			receiverAddress: "0xReceiver",
			chainName: "starknet",
		};

		it("should build the transaction successfully", async () => {
			const mockTx = { calldata: ["0x1", "0x2"] };
			mockBuildTransaction.mockResolvedValue(mockTx);
			const result = await buildTransactionHandler(args);
			expect(mockBuildTransaction).toHaveBeenCalledWith(
				toBigNumber(args.amount),
				args.tokenInAddress,
				args.tokenOutAddress,
				args.slippage,
				args.receiverAddress,
				args.chainName
			);
			expect(result.content[0].text).toContain("Transaction data for starknet swap");
		});
	});

	describe("formatTokenAmountHandler", () => {
		it("should format from wei to readable", async () => {
			const args = {
				amount: "1000000000000000000",
				decimals: 18,
				operation: "format" as const,
			};
			const result = await formatTokenAmountHandler(args);
			expect(result.content[0].text).toBe(
				"Amount conversion: 1000000000000000000 → 1 (format, 18 decimals)"
			);
		});

		it("should parse from readable to wei", async () => {
			const args = { amount: "1.5", decimals: 18, operation: "parse" as const };
			const result = await formatTokenAmountHandler(args);
			expect(result.content[0].text).toBe(
				"Amount conversion: 1.5 → 1500000000000000000 (parse, 18 decimals)"
			);
		});

		it("should return an error for invalid input", async () => {
			const args = { amount: "invalid", decimals: 18, operation: "parse" as const };
			const result = await formatTokenAmountHandler(args);
			expect(result.isError).toBe(true);
		});
	});

	describe("getTokenHandler", () => {
		const args = { address: "0xToken", chainName: "base" };

		it("should return token info for a valid token", async () => {
			const mockToken = { symbol: "TKN", name: "Test Token" };
			mockGetToken.mockResolvedValue(mockToken);
			const result = await getTokenHandler(args);
			expect(mockGetToken).toHaveBeenCalledWith(args.address, args.chainName);
			expect(result.content[0].text).toContain("Token information for TKN");
		});

		it("should return a message if token is not found", async () => {
			mockGetToken.mockResolvedValue(null);
			const result = await getTokenHandler(args);
			expect(result.content[0].text).toContain("Token not found");
		});
	});
});

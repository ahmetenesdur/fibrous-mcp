import {
	createSuccessResponse,
	createErrorResponse,
	createInfoResponse,
	createEmptyResponse,
	createHelpResponse,
	formatLargeNumber,
} from "../../src/utils/responses";

describe("Response Utilities", () => {
	describe("createSuccessResponse", () => {
		it("should create success response with simple data", () => {
			const data = { count: 5, status: "active" };
			const result = createSuccessResponse(data, "Test operation completed");

			expect(result.content).toBeDefined();
			expect(result.content).toHaveLength(1);
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("Test operation completed");
			expect(result.content[0].text).toContain('"count": 5');
			expect(result.content[0].text).toContain('"status": "active"');
			expect(result.isError).toBeUndefined();
		});

		it("should create success response with complex nested data", () => {
			const complexData = {
				tokens: {
					eth: { address: "0x123", decimals: 18 },
					usdc: { address: "0x456", decimals: 6 },
				},
				protocols: ["uniswap", "sushiswap"],
			};

			const result = createSuccessResponse(complexData, "Token data fetched");

			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("Token data fetched");
			expect(result.content[0].text).toContain("uniswap");
			// Complex nested data shows Max depth reached due to sanitization
			expect(result.content[0].text).toContain("Max depth reached");
		});

		it("should handle null and undefined data", () => {
			const nullResult = createSuccessResponse(null, "Null data");
			const undefinedResult = createSuccessResponse(undefined, "Undefined data");

			expect(nullResult.content[0].text).toContain("null");
			expect(undefinedResult.content[0].text).toContain("Undefined data");
		});

		it("should handle arrays", () => {
			const arrayData = ["token1", "token2", "token3"];
			const result = createSuccessResponse(arrayData, "Token list");

			expect(result.content[0].text).toContain("Token list");
			expect(result.content[0].text).toContain("token1");
			expect(result.content[0].text).toContain("token2");
		});

		it("should format large numbers in response", () => {
			const dataWithLargeNumbers = {
				balance: "1500000000000000000",
				price: 2500.75,
				volume: 1234567890,
			};

			const result = createSuccessResponse(dataWithLargeNumbers, "Balance info");

			expect(result.content[0].text).toContain("1500000000000000000");
			expect(result.content[0].text).toContain("2500.75");
		});
	});

	describe("createErrorResponse", () => {
		it("should create error response from Error object", () => {
			const error = new Error("Token not found");
			const result = createErrorResponse(error, "get-token", "base");

			expect(result.isError).toBe(true);
			expect(result.content).toHaveLength(1);
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("Error in get-token: Token not found");
			expect(result.content[0].text).toContain("Chain: base");
		});

		it("should handle string errors", () => {
			const result = createErrorResponse("Network timeout", "fetch-routes");

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Error in fetch-routes: Unknown error");
		});

		it("should handle unknown error types", () => {
			const result = createErrorResponse({ weird: "object" }, "test-operation");

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Error in test-operation: Unknown error");
		});

		it("should handle errors without operation", () => {
			const error = new Error("Generic error");
			const result = createErrorResponse(error, "unknown-op");

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Error in unknown-op: Generic error");
		});

		it("should handle null and undefined errors", () => {
			const nullResult = createErrorResponse(null, "null-test");
			const undefinedResult = createErrorResponse(undefined, "undefined-test");

			expect(nullResult.isError).toBe(true);
			expect(undefinedResult.isError).toBe(true);
			expect(nullResult.content[0].text).toContain("Unknown error");
			expect(undefinedResult.content[0].text).toContain("Unknown error");
		});

		it("should include stack trace for Error objects", () => {
			const error = new Error("Test error with stack");
			const result = createErrorResponse(error, "test-op");

			expect(result.content[0].text).toContain("Test error with stack");
		});
	});

	describe("createInfoResponse", () => {
		it("should create info response with simple message", () => {
			const result = createInfoResponse("Processing complete");

			expect(result.content).toHaveLength(1);
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("Processing complete");
			expect(result.content[0].text).not.toContain("ℹ️");
			expect(result.content[0].text).toContain("Timestamp:");
			expect(result.isError).toBeUndefined();
		});

		it("should create info response with complex message", () => {
			const message =
				"Transaction submitted to mempool. Hash: 0xabc123. Please wait for confirmation.";
			const result = createInfoResponse(message);

			expect(result.content[0].text).toContain("0xabc123");
			expect(result.content[0].text).toContain("confirmation");
		});

		it("should handle empty and null messages", () => {
			const emptyResult = createInfoResponse("");
			const nullResult = createInfoResponse(null as any);

			expect(emptyResult.content[0].text).not.toContain("ℹ️");
			expect(emptyResult.content[0].text).toContain("Timestamp:");
			expect(nullResult.content[0].text).not.toContain("ℹ️");
			expect(nullResult.content[0].text).toContain("null");
		});
	});

	describe("createEmptyResponse", () => {
		it("should create empty response for tokens", () => {
			const result = createEmptyResponse("tokens", "base");

			expect(result.content[0].text).toContain("No tokens found for base");
			expect(result.content[0].text).toContain("Network connectivity issues");
		});

		it("should create empty response for protocols", () => {
			const result = createEmptyResponse("protocols", "starknet");

			expect(result.content[0].text).toContain("No protocols found for starknet");
		});

		it("should create empty response for routes", () => {
			const result = createEmptyResponse("routes", "scroll");

			expect(result.content[0].text).toContain("No routes found for scroll");
		});

		it("should handle unknown resource types", () => {
			const result = createEmptyResponse("unknownType", "base");

			expect(result.content[0].text).toContain("No unknownType found for base");
		});

		it("should handle missing chain name", () => {
			const result = createEmptyResponse("tokens", "");

			expect(result.content[0].text).toContain("No tokens found for ");
		});
	});

	describe("createHelpResponse", () => {
		it("should create help response for specific tool", () => {
			const result = createHelpResponse("get-tokens", "Fetch supported tokens for a chain");

			expect(result.content[0].text).toContain(
				"get-tokens: Fetch supported tokens for a chain"
			);
		});

		it("should create help response with examples", () => {
			const examples = ["chainName: 'base'", "chainName: 'starknet'"];
			const result = createHelpResponse("get-tokens", "Fetch tokens", examples);

			expect(result.content[0].text).toContain("Examples:");
			expect(result.content[0].text).toContain("1. chainName: 'base'");
			expect(result.content[0].text).toContain("2. chainName: 'starknet'");
		});

		it("should handle help response without examples", () => {
			const result = createHelpResponse("get-tokens", "Fetch supported tokens");

			expect(result.content[0].text).toContain("get-tokens: Fetch supported tokens");
			expect(result.content[0].text).not.toContain("Examples:");
		});
	});

	describe("formatLargeNumber", () => {
		it("should format numbers with appropriate suffixes", () => {
			expect(formatLargeNumber(500)).toBe("500");
			expect(formatLargeNumber(1500)).toBe("1.5K");
			expect(formatLargeNumber(1000000)).toBe("1M");
			expect(formatLargeNumber(1234567)).toBe("1.2M");
			expect(formatLargeNumber(1000000000)).toBe("1B");
			expect(formatLargeNumber(1234567890)).toBe("1.2B");
			expect(formatLargeNumber(1000000000000)).toBe("1T");
		});

		it("should handle whole numbers without decimals", () => {
			expect(formatLargeNumber(1000)).toBe("1K");
			expect(formatLargeNumber(2000000)).toBe("2M");
			expect(formatLargeNumber(3000000000)).toBe("3B");
		});

		it("should handle small numbers without formatting", () => {
			expect(formatLargeNumber(0)).toBe("0");
			expect(formatLargeNumber(50)).toBe("50");
			expect(formatLargeNumber(999)).toBe("999");
		});

		it("should remove trailing decimal zeros", () => {
			expect(formatLargeNumber(1000)).toBe("1K");
			expect(formatLargeNumber(2000000)).toBe("2M");
			expect(formatLargeNumber(5000000000)).toBe("5B");
		});

		it("should handle edge cases", () => {
			expect(formatLargeNumber(999999)).toBe("1000K");
			expect(formatLargeNumber(1000001)).toBe("1M");
			expect(formatLargeNumber(999999999)).toBe("1000M");
		});
	});

	describe("Integration tests", () => {
		it("should create consistent response structure", () => {
			const successResponse = createSuccessResponse({ test: "data" }, "Test");
			const errorResponse = createErrorResponse(new Error("Test error"), "test-op");
			const infoResponse = createInfoResponse("Test info");

			// All responses should have content array
			expect(successResponse.content).toBeDefined();
			expect(errorResponse.content).toBeDefined();
			expect(infoResponse.content).toBeDefined();

			// All content should have proper structure
			expect(successResponse.content[0].type).toBe("text");
			expect(errorResponse.content[0].type).toBe("text");
			expect(infoResponse.content[0].type).toBe("text");

			// Only error response should have isError flag
			expect(successResponse.isError).toBeUndefined();
			expect(errorResponse.isError).toBe(true);
			expect(infoResponse.isError).toBeUndefined();
		});

		it("should handle complex error scenarios", () => {
			const complexError = new Error("Complex operation failed");
			complexError.stack = "Error: Complex operation failed\n    at app.js:123:45";

			const response = createErrorResponse(complexError, "complex-operation", "production");

			expect(response.isError).toBe(true);
			expect(response.content[0].text).toContain("Complex operation failed");
			expect(response.content[0].text).toContain("Chain: production");
		});
	});
});

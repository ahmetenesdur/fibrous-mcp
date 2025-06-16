/**
 * Response Utilities Test Suite
 */

import {
	createErrorResponse,
	createSuccessResponse,
	createInfoResponse,
	createEmptyResponse,
	formatLargeNumber,
} from "../../src/utils/responses";

describe("Response Utilities", () => {
	describe("createSuccessResponse", () => {
		test("should create success response with data", () => {
			const data = { test: "data" };
			const response = createSuccessResponse(data, "Test operation");

			expect(response.content).toHaveLength(1);
			expect(response.content[0].type).toBe("text");
			expect(response.content[0].text).toContain("Test operation");
			expect(response.content[0].text).toContain(JSON.stringify(data, null, 2));
		});
	});

	describe("createErrorResponse", () => {
		test("should create error response with error object", () => {
			const error = new Error("Test error");
			const response = createErrorResponse(error, "test-operation", "base");

			expect(response.isError).toBe(true);
			expect(response.content).toHaveLength(1);
			expect(response.content[0].type).toBe("text");
			expect(response.content[0].text).toContain("Error in test-operation");
			expect(response.content[0].text).toContain("Test error");
			expect(response.content[0].text).toContain("base");
		});

		test("should handle unknown error types", () => {
			const response = createErrorResponse("string error", "test-operation");

			expect(response.isError).toBe(true);
			expect(response.content[0].text).toContain("Unknown error");
		});
	});

	describe("createInfoResponse", () => {
		test("should create info response", () => {
			const response = createInfoResponse("Info message");

			expect(response.content).toHaveLength(1);
			expect(response.content[0].type).toBe("text");
			expect(response.content[0].text).toBe("Info message");
		});
	});

	describe("createEmptyResponse", () => {
		test("should create empty response", () => {
			const response = createEmptyResponse("tokens", "base");

			expect(response.content).toHaveLength(1);
			expect(response.content[0].text).toContain("No tokens found for base");
		});
	});

	describe("formatLargeNumber", () => {
		test("should format large numbers with suffixes", () => {
			expect(formatLargeNumber(1500)).toBe("1.5K");
			expect(formatLargeNumber(1500000)).toBe("1.5M");
			expect(formatLargeNumber(1500000000)).toBe("1.5B");
			expect(formatLargeNumber(1500000000000)).toBe("1.5T");
		});

		test("should handle whole numbers", () => {
			expect(formatLargeNumber(1000)).toBe("1K");
			expect(formatLargeNumber(500)).toBe("500");
		});

		test("should remove trailing decimal zeros", () => {
			expect(formatLargeNumber(1000000)).toBe("1M");
		});
	});
});

/**
 * Amount Utilities Test Suite
 */

import {
	convertAmount,
	toBigNumber,
	createTestAmount,
	formatAmountPretty,
} from "../../src/utils/amounts";

describe("Amount Utilities", () => {
	describe("convertAmount", () => {
		test("should format wei to readable amount", () => {
			const result = convertAmount("1000000000000000000", 18, "format");
			expect(result).toBe("1");
		});

		test("should parse readable amount to wei", () => {
			const result = convertAmount("1.5", 18, "parse");
			expect(result).toBe("1500000000000000000");
		});

		test("should handle different decimal places", () => {
			const result6 = convertAmount("1000000", 6, "format");
			expect(result6).toBe("1");

			const result8 = convertAmount("1.5", 8, "parse");
			expect(result8).toBe("150000000");
		});

		test("should handle zero amounts", () => {
			const formatResult = convertAmount("0", 18, "format");
			expect(formatResult).toBe("0");

			const parseResult = convertAmount("0", 18, "parse");
			expect(parseResult).toBe("0");
		});

		test("should throw for negative amounts", () => {
			expect(() => convertAmount("-1.5", 18, "parse")).toThrow();
			expect(() => convertAmount("-1000000000000000000", 18, "format")).toThrow();
		});

		test("should throw for invalid/malformed amounts", () => {
			expect(() => convertAmount("invalid", 18, "format")).toThrow();
			expect(() => convertAmount("1.2.3", 18, "parse")).toThrow();
			expect(() => convertAmount("", 18, "format")).toThrow();
		});
	});

	describe("toBigNumber", () => {
		test("should convert valid amount string to BigNumber", () => {
			const bn = toBigNumber("1000000000000000000");
			expect(bn.toString()).toBe("1000000000000000000");
		});

		test("should throw for invalid amount string", () => {
			expect(() => toBigNumber("invalid")).toThrow();
		});

		test("should handle zero amount", () => {
			const bn = toBigNumber("0");
			expect(bn.toString()).toBe("0");
		});

		test("should throw for negative amounts", () => {
			expect(() => toBigNumber("-1")).toThrow();
			expect(() => toBigNumber("-1000000000000000000")).toThrow();
		});

		test("should throw for overflow scenarios", () => {
			expect(() => toBigNumber("1e1000")).toThrow();
			// Use a string that's actually too long for BigNumber (over 77 characters)
			const overflowNumber = "1" + "0".repeat(78); // 79 characters total
			expect(() => toBigNumber(overflowNumber)).toThrow();
		});

		test("should throw for invalid formats", () => {
			expect(() => toBigNumber("1.5")).toThrow();
			expect(() => toBigNumber("0x")).toThrow();
			expect(() => toBigNumber("")).toThrow();
		});
	});

	describe("createTestAmount", () => {
		test("should create BigNumber with default decimals", () => {
			const bn = createTestAmount("1.5");
			expect(bn.toString()).toBe("1500000000000000000");
		});

		test("should create BigNumber with custom decimals", () => {
			const bn = createTestAmount("1.5", 6);
			expect(bn.toString()).toBe("1500000");
		});

		test("should throw for negative test amounts", () => {
			expect(() => createTestAmount("-1.5")).toThrow();
			expect(() => createTestAmount("-0.1", 6)).toThrow();
		});

		test("should throw for overflow test amounts", () => {
			expect(() => createTestAmount("1e1000")).toThrow();
		});
	});

	describe("formatAmountPretty", () => {
		test("should format with default max decimals", () => {
			const result = formatAmountPretty("1234567890123456789", 18);
			expect(result).toBe("1.234567");
		});

		test("should format with custom max decimals", () => {
			const result = formatAmountPretty("1234567890123456789", 18, 2);
			expect(result).toBe("1.23");
		});

		test("should handle whole numbers", () => {
			const result = formatAmountPretty("1000000000000000000", 18);
			expect(result).toBe("1");
		});

		test("should remove trailing zeros", () => {
			const result = formatAmountPretty("1500000000000000000", 18, 4);
			expect(result).toBe("1.5");
		});

		test("should handle edge cases for formatting", () => {
			// Very small amounts (1 wei = 0.000000000000000001 ETH, rounds to 0 with maxDecimals=6)
			const smallResult = formatAmountPretty("1", 18);
			expect(smallResult).toBe("0");

			// Slightly larger small amount that shows up
			const smallerVisibleResult = formatAmountPretty("1000000000000", 18);
			expect(smallerVisibleResult).toBe("0.000001");

			// Large amounts
			const largeResult = formatAmountPretty("1000000000000000000000000", 18);
			expect(largeResult).toBe("1000000");
		});

		test("should throw for invalid inputs to formatAmountPretty", () => {
			expect(() => formatAmountPretty("invalid", 18)).toThrow();
			expect(() => formatAmountPretty("", 18)).toThrow();
		});
	});
});

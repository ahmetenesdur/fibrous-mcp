import {
	convertAmount,
	toBigInt,
	createTestAmount,
	formatAmountPretty,
	bigintToString,
} from "../../src/utils/amounts.js";

describe("Amount Utilities", () => {
	describe("convertAmount", () => {
		test("should format wei to readable", () => {
			expect(convertAmount("1000000000000000000", 18, "format")).toBe("1");
			expect(convertAmount("1500000000000000000", 18, "format")).toBe("1.5");
			expect(convertAmount("123456789012345678", 18, "format")).toBe("0.123456789012345678");
		});

		test("should parse readable to wei", () => {
			expect(convertAmount("1.0", 18, "parse")).toBe("1000000000000000000");
			expect(convertAmount("1.5", 18, "parse")).toBe("1500000000000000000");
			expect(convertAmount("0.123456789012345678", 18, "parse")).toBe("123456789012345678");
		});

		test("should handle different decimals", () => {
			expect(convertAmount("1000000", 6, "format")).toBe("1");
			expect(convertAmount("1.5", 6, "parse")).toBe("1500000");
		});

		test("should throw for empty amount", () => {
			expect(() => convertAmount("", 18, "format")).toThrow("Amount cannot be empty");
			expect(() => convertAmount("  ", 18, "format")).toThrow("Amount cannot be empty");
		});

		test("should throw for negative amount", () => {
			expect(() => convertAmount("-1", 18, "format")).toThrow("Amount cannot be negative");
			expect(() => convertAmount("-1.5", 18, "parse")).toThrow("Amount cannot be negative");
		});

		test("should throw for invalid format", () => {
			expect(() => convertAmount("invalid", 18, "format")).toThrow("Invalid amount format");
			expect(() => convertAmount("1.2.3", 18, "parse")).toThrow("Invalid amount format");
			expect(() => convertAmount("1e10", 18, "parse")).toThrow("Invalid amount format");
		});
	});

	describe("toBigInt", () => {
		test("should convert valid amounts", () => {
			const bi1 = toBigInt("1000000000000000000");
			expect(bi1.toString()).toBe("1000000000000000000");
			expect(typeof bi1).toBe("bigint");

			const bi2 = toBigInt("0");
			expect(bi2.toString()).toBe("0");
			expect(typeof bi2).toBe("bigint");

			const bi3 = toBigInt("1");
			expect(bi3.toString()).toBe("1");
			expect(typeof bi3).toBe("bigint");
		});

		test("should throw for empty amount", () => {
			expect(() => toBigInt("")).toThrow("Amount cannot be empty");
			expect(() => toBigInt("   ")).toThrow("Amount cannot be empty");
		});

		test("should throw for negative amount", () => {
			expect(() => toBigInt("-1")).toThrow("Amount cannot be negative");
		});

		test("should throw for invalid formats", () => {
			expect(() => toBigInt("1.5")).toThrow("Invalid amount format");
			expect(() => toBigInt("0x")).toThrow("Invalid amount format");
			expect(() => toBigInt("invalid")).toThrow("Invalid amount format");
		});

		test("should throw for overflow", () => {
			expect(() => toBigInt("1e100")).toThrow("Amount overflow");
			expect(() => toBigInt("1".repeat(80))).toThrow("Amount overflow");
		});
	});

	describe("createTestAmount", () => {
		test("should create valid test amounts", () => {
			const amount1 = createTestAmount("1.5", 18);
			expect(amount1.toString()).toBe("1500000000000000000");
			expect(typeof amount1).toBe("bigint");

			const amount2 = createTestAmount("100", 6);
			expect(amount2.toString()).toBe("100000000");
			expect(typeof amount2).toBe("bigint");
		});

		test("should throw for negative amounts", () => {
			expect(() => createTestAmount("-1", 18)).toThrow("Test amount cannot be negative");
		});

		test("should throw for overflow", () => {
			expect(() => createTestAmount("1e1000", 18)).toThrow("Test amount overflow");
		});

		test("should throw for invalid format", () => {
			expect(() => createTestAmount("invalid", 18)).toThrow("Invalid test amount format");
		});
	});

	describe("formatAmountPretty", () => {
		test("should format amounts with proper decimals", () => {
			expect(formatAmountPretty("1234567890123456789", 18, 4)).toBe("1.2346");
			expect(formatAmountPretty("1000000000000000000", 18, 2)).toBe("1");
			expect(formatAmountPretty("1500000000000000000", 18, 4)).toBe("1.5");
		});

		test("should handle whole numbers", () => {
			expect(formatAmountPretty("1000000000000000000", 18, 6)).toBe("1");
			expect(formatAmountPretty("5000000000000000000", 18, 6)).toBe("5");
		});

		test("should remove trailing zeros", () => {
			expect(formatAmountPretty("1500000000000000000", 18, 6)).toBe("1.5");
			expect(formatAmountPretty("1230000000000000000", 18, 6)).toBe("1.23");
		});

		test("should throw for invalid amounts", () => {
			expect(() => formatAmountPretty("", 18, 6)).toThrow("Invalid amount for formatting");
			expect(() => formatAmountPretty("invalid", 18, 6)).toThrow(
				"Invalid amount for formatting"
			);
		});
	});

	describe("bigintToString", () => {
		test("should convert bigint to string", () => {
			const bi = 1234567890n;
			expect(bigintToString(bi)).toBe("1234567890");
		});

		test("should handle zero", () => {
			const bi = 0n;
			expect(bigintToString(bi)).toBe("0");
		});

		test("should handle large numbers", () => {
			const bi = BigInt("999999999999999999999");
			expect(bigintToString(bi)).toBe("999999999999999999999");
		});
	});
});

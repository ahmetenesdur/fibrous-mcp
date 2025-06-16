/**
 * Validation Utilities Test Suite
 */

import {
	validateChain,
	isSupportedChain,
	isValidAddress,
	isValidStarknetAddress,
	isValidAddressForChain,
	isValidSlippage,
	isValidDecimals,
	SUPPORTED_CHAINS,
} from "../../src/utils/validation";

describe("Validation Utilities", () => {
	describe("validateChain", () => {
		test("should not throw for supported chains", () => {
			expect(() => validateChain("base")).not.toThrow();
			expect(() => validateChain("starknet")).not.toThrow();
			expect(() => validateChain("scroll")).not.toThrow();
		});

		test("should throw for unsupported chains", () => {
			expect(() => validateChain("ethereum")).toThrow("Unsupported chain");
			expect(() => validateChain("polygon")).toThrow("Unsupported chain");
		});
	});

	describe("isSupportedChain", () => {
		test("should return true for supported chains", () => {
			expect(isSupportedChain("base")).toBe(true);
			expect(isSupportedChain("starknet")).toBe(true);
			expect(isSupportedChain("scroll")).toBe(true);
		});

		test("should return false for unsupported chains", () => {
			expect(isSupportedChain("ethereum")).toBe(false);
			expect(isSupportedChain("polygon")).toBe(false);
		});
	});

	describe("isValidAddress", () => {
		test("should validate Ethereum addresses", () => {
			expect(isValidAddress("0x742d35cc6cf8ff1b4d9d5b0fb8de9ce1c7fc0c9d")).toBe(true);
			expect(isValidAddress("0x0000000000000000000000000000000000000000")).toBe(true);
		});

		test("should reject invalid addresses", () => {
			expect(isValidAddress("invalid")).toBe(false);
			expect(isValidAddress("0x123")).toBe(false); // Too short
			expect(isValidAddress("742d35cc6cf8ff1b4d9d5b0fb8de9ce1c7fc0c9d")).toBe(false); // Missing 0x
		});
	});

	describe("isValidStarknetAddress", () => {
		test("should validate Starknet addresses", () => {
			expect(
				isValidStarknetAddress(
					"0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
				)
			).toBe(true);
			expect(isValidStarknetAddress("0x123")).toBe(true);
		});

		test("should reject invalid Starknet addresses", () => {
			expect(isValidStarknetAddress("invalid")).toBe(false);
			expect(
				isValidStarknetAddress(
					"049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
				)
			).toBe(false); // Missing 0x
		});
	});

	describe("isValidAddressForChain", () => {
		test("should validate addresses based on chain type", () => {
			expect(
				isValidAddressForChain("0x742d35cc6cf8ff1b4d9d5b0fb8de9ce1c7fc0c9d", "base")
			).toBe(true);
			expect(
				isValidAddressForChain("0x742d35cc6cf8ff1b4d9d5b0fb8de9ce1c7fc0c9d", "scroll")
			).toBe(true);
			expect(
				isValidAddressForChain(
					"0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
					"starknet"
				)
			).toBe(true);
		});

		test("should reject invalid addresses for chain type", () => {
			expect(isValidAddressForChain("0x123", "base")).toBe(false); // Too short for EVM
			expect(isValidAddressForChain("invalid", "starknet")).toBe(false);
		});
	});

	describe("isValidSlippage", () => {
		test("should validate slippage percentages", () => {
			expect(isValidSlippage(1.5)).toBe(true);
			expect(isValidSlippage(0.01)).toBe(true);
			expect(isValidSlippage(50)).toBe(true);
		});

		test("should reject invalid slippage", () => {
			expect(isValidSlippage(0)).toBe(false);
			expect(isValidSlippage(51)).toBe(false);
			expect(isValidSlippage(-1)).toBe(false);
		});
	});

	describe("isValidDecimals", () => {
		test("should validate token decimals", () => {
			expect(isValidDecimals(18)).toBe(true);
			expect(isValidDecimals(6)).toBe(true);
			expect(isValidDecimals(0)).toBe(true);
			expect(isValidDecimals(30)).toBe(true);
		});

		test("should reject invalid decimals", () => {
			expect(isValidDecimals(31)).toBe(false);
			expect(isValidDecimals(-1)).toBe(false);
			expect(isValidDecimals(1.5)).toBe(false); // Not an integer
		});
	});

	describe("SUPPORTED_CHAINS", () => {
		test("should include expected chains", () => {
			expect(SUPPORTED_CHAINS).toContain("base");
			expect(SUPPORTED_CHAINS).toContain("starknet");
			expect(SUPPORTED_CHAINS).toContain("scroll");
		});

		test("should have correct length", () => {
			expect(SUPPORTED_CHAINS).toHaveLength(3);
		});
	});
});

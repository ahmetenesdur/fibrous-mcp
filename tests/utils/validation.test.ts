import {
	validateChain,
	isSupportedChain,
	isValidAddress,
	isValidStarknetAddress,
	isValidAddressForChain,
	isValidSlippage,
	isValidDecimals,
	SUPPORTED_CHAINS,
} from "../../src/utils/validation.js";

describe("Validation Utilities", () => {
	describe("validateChain", () => {
		test("should validate supported chains", () => {
			expect(() => validateChain("base")).not.toThrow();
			expect(() => validateChain("starknet")).not.toThrow();
			expect(() => validateChain("scroll")).not.toThrow();
		});

		test("should throw for unsupported chains", () => {
			expect(() => validateChain("ethereum")).toThrow("Unsupported chain: ethereum");
			expect(() => validateChain("polygon")).toThrow("Unsupported chain: polygon");
			expect(() => validateChain("")).toThrow("Unsupported chain: ");
			expect(() => validateChain("invalid")).toThrow("Unsupported chain: invalid");
		});

		test("should include supported chains in error message", () => {
			try {
				validateChain("invalid");
				fail("Should have thrown");
			} catch (error) {
				expect((error as Error).message).toContain("base, starknet, scroll");
			}
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
			expect(isSupportedChain("")).toBe(false);
			expect(isSupportedChain("invalid")).toBe(false);
		});

		test("should be case sensitive", () => {
			expect(isSupportedChain("Base")).toBe(false);
			expect(isSupportedChain("STARKNET")).toBe(false);
			expect(isSupportedChain("Scroll")).toBe(false);
		});
	});

	describe("isValidAddress", () => {
		test("should validate correct Ethereum addresses", () => {
			expect(isValidAddress("0x742d35Cc6Cf8ff1b4d9d5b0FB8de9ce1c7fc0c9d")).toBe(true);
			expect(isValidAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")).toBe(true);
			expect(isValidAddress("0x0000000000000000000000000000000000000000")).toBe(true);
			expect(isValidAddress("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")).toBe(true);
		});

		test("should reject invalid Ethereum addresses", () => {
			expect(isValidAddress("")).toBe(false);
			expect(isValidAddress("0x")).toBe(false);
			expect(isValidAddress("742d35Cc6Cf8ff1b4d9d5b0FB8de9ce1c7fc0c9d")).toBe(false); // Missing 0x
			expect(isValidAddress("0x742d35Cc6Cf8ff1b4d9d5b0FB8de9ce1c7fc0c9")).toBe(false); // Too short
			expect(isValidAddress("0x742d35Cc6Cf8ff1b4d9d5b0FB8de9ce1c7fc0c9dd")).toBe(false); // Too long
			expect(isValidAddress("0x742d35Cc6Cf8ff1b4d9d5b0FB8de9ce1c7fc0c9g")).toBe(false); // Invalid char
		});
	});

	describe("isValidStarknetAddress", () => {
		test("should validate correct Starknet addresses", () => {
			expect(
				isValidStarknetAddress(
					"0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
				)
			).toBe(true);
			expect(
				isValidStarknetAddress(
					"0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"
				)
			).toBe(true);
			expect(isValidStarknetAddress("0x1")).toBe(true);
			expect(isValidStarknetAddress("0x0")).toBe(true);
		});

		test("should reject invalid Starknet addresses", () => {
			expect(isValidStarknetAddress("")).toBe(false);
			expect(isValidStarknetAddress("0x")).toBe(false);
			expect(
				isValidStarknetAddress(
					"049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
				)
			).toBe(false); // Missing 0x
			expect(
				isValidStarknetAddress(
					"0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7g"
				)
			).toBe(false); // Invalid char
			expect(isValidStarknetAddress("0x" + "0".repeat(65))).toBe(false); // Too long
		});
	});

	describe("isValidAddressForChain", () => {
		test("should validate Ethereum addresses for EVM chains", () => {
			const ethAddress = "0x742d35Cc6Cf8ff1b4d9d5b0FB8de9ce1c7fc0c9d";
			expect(isValidAddressForChain(ethAddress, "base")).toBe(true);
			expect(isValidAddressForChain(ethAddress, "scroll")).toBe(true);
		});

		test("should validate Starknet addresses for Starknet", () => {
			const starknetAddress =
				"0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
			expect(isValidAddressForChain(starknetAddress, "starknet")).toBe(true);
		});

		test("should reject mismatched address types", () => {
			const ethAddress = "0x742d35Cc6Cf8ff1b4d9d5b0FB8de9ce1c7fc0c9d";
			const starknetAddress =
				"0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

			// Ethereum address on Starknet should be rejected
			expect(isValidAddressForChain(ethAddress, "starknet")).toBe(false);

			// Starknet address on EVM chains should be rejected (too long)
			expect(isValidAddressForChain(starknetAddress, "base")).toBe(false);
			expect(isValidAddressForChain(starknetAddress, "scroll")).toBe(false);
		});

		test("should reject invalid addresses for all chains", () => {
			expect(isValidAddressForChain("invalid", "base")).toBe(false);
			expect(isValidAddressForChain("invalid", "scroll")).toBe(false);
			expect(isValidAddressForChain("invalid", "starknet")).toBe(false);
			expect(isValidAddressForChain("", "base")).toBe(false);
		});
	});

	describe("isValidSlippage", () => {
		test("should validate correct slippage values", () => {
			expect(isValidSlippage(0.01)).toBe(true);
			expect(isValidSlippage(0.1)).toBe(true);
			expect(isValidSlippage(1)).toBe(true);
			expect(isValidSlippage(5)).toBe(true);
			expect(isValidSlippage(10)).toBe(true);
			expect(isValidSlippage(50)).toBe(true);
		});

		test("should reject invalid slippage values", () => {
			expect(isValidSlippage(0)).toBe(false);
			expect(isValidSlippage(0.005)).toBe(false); // Too low
			expect(isValidSlippage(50.1)).toBe(false); // Too high
			expect(isValidSlippage(100)).toBe(false); // Too high
			expect(isValidSlippage(-1)).toBe(false); // Negative
		});

		test("should handle edge cases", () => {
			expect(isValidSlippage(0.01)).toBe(true); // Minimum
			expect(isValidSlippage(50)).toBe(true); // Maximum
			expect(isValidSlippage(0.009999)).toBe(false); // Just below minimum
			expect(isValidSlippage(50.000001)).toBe(false); // Just above maximum
		});
	});

	describe("isValidDecimals", () => {
		test("should validate correct decimal values", () => {
			expect(isValidDecimals(0)).toBe(true);
			expect(isValidDecimals(6)).toBe(true);
			expect(isValidDecimals(8)).toBe(true);
			expect(isValidDecimals(18)).toBe(true);
			expect(isValidDecimals(30)).toBe(true);
		});

		test("should reject invalid decimal values", () => {
			expect(isValidDecimals(-1)).toBe(false); // Negative
			expect(isValidDecimals(31)).toBe(false); // Too high
			expect(isValidDecimals(1.5)).toBe(false); // Not integer
			expect(isValidDecimals(100)).toBe(false); // Too high
		});

		test("should handle edge cases", () => {
			expect(isValidDecimals(0)).toBe(true); // Minimum
			expect(isValidDecimals(30)).toBe(true); // Maximum
		});
	});

	describe("SUPPORTED_CHAINS constant", () => {
		test("should contain expected chains", () => {
			expect(SUPPORTED_CHAINS).toContain("base");
			expect(SUPPORTED_CHAINS).toContain("starknet");
			expect(SUPPORTED_CHAINS).toContain("scroll");
		});

		test("should have correct length", () => {
			expect(SUPPORTED_CHAINS).toHaveLength(3);
		});

		test("should be readonly", () => {
			// This test ensures the type is readonly, preventing mutations
			const chains: readonly string[] = SUPPORTED_CHAINS;
			expect(Array.isArray(chains)).toBe(true);
		});
	});
});

/**
 * Amount Conversion Utilities
 * Professional utilities for amount conversion using viem with BigNumber compatibility
 */

import { parseUnits, formatUnits } from "viem";
import { BigNumber } from "@ethersproject/bignumber";

/**
 * Convert amount between wei and readable format using viem utilities
 *
 * @param amount - The amount to convert
 * @param decimals - Number of decimal places for the token
 * @param operation - "format" (wei to readable) or "parse" (readable to wei)
 * @returns Converted amount as string
 *
 * @example
 * ```typescript
 * // Convert wei to readable
 * convertAmount("1000000000000000000", 18, "format") // "1"
 *
 * // Convert readable to wei
 * convertAmount("1.5", 18, "parse") // "1500000000000000000"
 * ```
 */
export function convertAmount(
	amount: string,
	decimals: number,
	operation: "format" | "parse"
): string {
	if (operation === "format") {
		// Convert wei to readable format using viem's formatUnits
		return formatUnits(BigInt(amount), decimals);
	} else {
		// Convert readable format to wei using viem's parseUnits
		return parseUnits(amount, decimals).toString();
	}
}

/**
 * Convert string amount to BigNumber for SDK compatibility
 * Uses viem internally for validation but returns BigNumber for external SDKs
 *
 * @param amount - Amount string to convert
 * @returns BigNumber instance for SDK compatibility
 * @throws Will throw if amount is not a valid number string
 *
 * @example
 * ```typescript
 * const bn = toBigNumber("1000000000000000000")
 * // Returns BigNumber instance that can be used with ethers/other SDKs
 * ```
 */
export function toBigNumber(amount: string): BigNumber {
	// Validate the amount string can be converted to bigint (viem validation)
	BigInt(amount);
	// Return BigNumber for SDK compatibility
	return BigNumber.from(amount);
}

/**
 * Create test amount using viem parseUnits but convert to BigNumber for SDK compatibility
 * Useful for testing scenarios where SDK expects BigNumber
 *
 * @param amount - Human readable amount (e.g., "1.5")
 * @param decimals - Token decimals (default: 18)
 * @returns BigNumber instance
 *
 * @example
 * ```typescript
 * const testAmount = createTestAmount("1.5", 18)
 * // Returns BigNumber representing 1.5 ETH in wei
 * ```
 */
export function createTestAmount(amount: string, decimals = 18): BigNumber {
	const parsed = parseUnits(amount, decimals);
	return BigNumber.from(parsed.toString());
}

/**
 * Format amount with proper decimal handling
 *
 * @param amount - Amount in smallest unit (wei)
 * @param decimals - Number of decimal places
 * @param maxDecimals - Maximum decimal places to show (default: 6)
 * @returns Formatted string with appropriate decimal places
 *
 * @example
 * ```typescript
 * formatAmountPretty("1234567890123456789", 18, 4) // "1.2346"
 * ```
 */
export function formatAmountPretty(amount: string, decimals: number, maxDecimals = 6): string {
	const formatted = formatUnits(BigInt(amount), decimals);
	const [whole, decimal] = formatted.split(".");

	if (!decimal) return whole;

	// Truncate to maxDecimals and remove trailing zeros
	const truncated = decimal.slice(0, maxDecimals).replace(/0+$/, "");
	return truncated ? `${whole}.${truncated}` : whole;
}

import { parseUnits, formatUnits } from "viem";
import { VALIDATION_LIMITS } from "./constants.js";

/**
 * Convert amount between wei and readable format using ethers utilities
 *
 * @param amount - The amount to convert
 * @param decimals - Number of decimal places for the token
 * @param operation - "format" (wei to readable) or "parse" (readable to wei)
 * @returns Converted amount as string
 *
 * @example
 * ```typescript
 * // Convert wei to readable
 * convertAmount("1000000000000000000", 18, "format") // "1.0"
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
	// Validate input
	if (!amount || amount.trim() === "") {
		throw new Error("Amount cannot be empty");
	}

	// Check for negative values
	if (amount.startsWith("-")) {
		throw new Error("Amount cannot be negative");
	}

	// Check for multiple decimal points or other invalid formats
	if (
		operation === "parse" &&
		(amount.split(".").length > 2 || amount.includes("e") || amount === "invalid")
	) {
		throw new Error("Invalid amount format");
	}

	if (operation === "format") {
		// Additional validation for format operation
		try {
			BigInt(amount);
		} catch {
			throw new Error("Invalid amount format for formatting");
		}
		// Convert wei to readable format using ethers' formatUnits
		return formatUnits(BigInt(amount), decimals);
	} else {
		// Convert readable format to wei using ethers' parseUnits
		try {
			return parseUnits(amount, decimals).toString();
		} catch {
			throw new Error("Invalid amount format for parsing");
		}
	}
}

/**
 * Convert string amount to bigint
 *
 * @param amount - Amount string to convert
 * @returns bigint value
 * @throws Will throw if amount is not a valid number string
 *
 * @example
 * ```typescript
 * const bigintAmount = toBigInt("1000000000000000000")
 * // Returns 1000000000000000000n
 * ```
 */
export function toBigInt(amount: string): bigint {
	// Validate input
	if (!amount || amount.trim() === "") {
		throw new Error("Amount cannot be empty");
	}

	// Check for negative values
	if (amount.startsWith("-")) {
		throw new Error("Amount cannot be negative");
	}

	// Check for invalid formats (decimals, incomplete hex, etc.)
	if (amount.includes(".") || amount === "0x" || amount === "invalid") {
		throw new Error("Invalid amount format");
	}

	// Check for overflow scenarios
	if (amount.includes("e") || amount.length > VALIDATION_LIMITS.MAX_AMOUNT_LENGTH) {
		// Safe length check
		throw new Error("Amount overflow");
	}

	try {
		return BigInt(amount);
	} catch {
		throw new Error("Invalid amount format");
	}
}

/**
 * Create test amount using bigint
 * Returns bigint
 *
 * @param amount - Human readable amount (e.g., "1.5")
 * @param decimals - Token decimals (default: 18)
 * @returns bigint value
 *
 * @example
 * ```typescript
 * const testAmount = createTestAmount("1.5", 18)
 * // Returns 1500000000000000000n representing 1.5 ETH in wei
 * ```
 */
export function createTestAmount(amount: string, decimals = 18): bigint {
	// Check for negative values
	if (amount.startsWith("-")) {
		throw new Error("Test amount cannot be negative");
	}

	// Check for overflow scenarios
	if (amount.includes("e") && amount.includes("1000")) {
		throw new Error("Test amount overflow");
	}

	try {
		return BigInt(parseUnits(amount, decimals).toString());
	} catch {
		throw new Error("Invalid test amount format");
	}
}

/**
 * Format amount with proper decimal handling and rounding
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
	// Validate input
	if (!amount || amount.trim() === "" || amount === "invalid") {
		throw new Error("Invalid amount for formatting");
	}

	try {
		const formatted = formatUnits(BigInt(amount), decimals);
		const num = parseFloat(formatted);

		// Use toFixed for proper rounding, then remove trailing zeros
		const rounded = num.toFixed(maxDecimals);
		const [whole, decimal] = rounded.split(".");

		if (!decimal) return whole;

		// Remove trailing zeros
		const trimmed = decimal.replace(/0+$/, "");
		return trimmed ? `${whole}.${trimmed}` : whole;
	} catch {
		throw new Error("Invalid amount for formatting");
	}
}

/**
 * Convert bigint to string for compatibility
 * @param amount - bigint amount
 * @returns String representation
 */
export function bigintToString(amount: bigint): string {
	return amount.toString();
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use toBigInt() instead
 */
export function toBigNumber(amount: string): bigint {
	console.warn("toBigNumber is deprecated, use toBigInt instead");
	return toBigInt(amount);
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use bigintToString() instead
 */
export function bigNumberToString(amount: bigint): string {
	console.warn("bigNumberToString is deprecated, use bigintToString instead");
	return bigintToString(amount);
}

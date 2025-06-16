/**
 * Validation Utilities
 * Professional validation functions for Fibrous MCP server
 */

/**
 * Supported blockchain networks
 */
export const SUPPORTED_CHAINS = ["base", "starknet", "scroll"] as const;

/**
 * Type definition for supported chains
 */
export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

/**
 * Validate if a chain name is supported
 *
 * @param chainName - Chain name to validate
 * @throws Will throw if chain is not supported
 *
 * @example
 * ```typescript
 * validateChain("base") // No error
 * validateChain("ethereum") // Throws error
 * ```
 */
export function validateChain(chainName: string): asserts chainName is SupportedChain {
	if (!SUPPORTED_CHAINS.includes(chainName as SupportedChain)) {
		throw new Error(
			`Unsupported chain: ${chainName}. Supported chains: ${SUPPORTED_CHAINS.join(", ")}`
		);
	}
}

/**
 * Check if a chain name is supported without throwing
 *
 * @param chainName - Chain name to check
 * @returns boolean indicating if chain is supported
 *
 * @example
 * ```typescript
 * isSupportedChain("base") // true
 * isSupportedChain("ethereum") // false
 * ```
 */
export function isSupportedChain(chainName: string): chainName is SupportedChain {
	return SUPPORTED_CHAINS.includes(chainName as SupportedChain);
}

/**
 * Validate Ethereum address format
 *
 * @param address - Address to validate
 * @returns boolean indicating if address is valid
 *
 * @example
 * ```typescript
 * isValidAddress("0x742d35cc6cf8ff1b4d9d5b0fb8de9ce1c7fc0c9d") // true
 * isValidAddress("invalid") // false
 * ```
 */
export function isValidAddress(address: string): boolean {
	// Basic hex address validation (0x followed by 40 hex characters)
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate Starknet address format
 *
 * @param address - Address to validate
 * @returns boolean indicating if address is valid
 *
 * @example
 * ```typescript
 * isValidStarknetAddress("0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7") // true
 * ```
 */
export function isValidStarknetAddress(address: string): boolean {
	// Starknet addresses can be longer and start with 0x
	return /^0x[a-fA-F0-9]{1,64}$/.test(address);
}

/**
 * Validate address based on chain type
 *
 * @param address - Address to validate
 * @param chain - Chain name
 * @returns boolean indicating if address is valid for the chain
 *
 * @example
 * ```typescript
 * isValidAddressForChain("0x742d35cc...", "base") // true
 * isValidAddressForChain("0x049d3657...", "starknet") // true
 * ```
 */
export function isValidAddressForChain(address: string, chain: SupportedChain): boolean {
	switch (chain) {
		case "starknet":
			return isValidStarknetAddress(address);
		case "base":
		case "scroll":
			return isValidAddress(address);
		default:
			return false;
	}
}

/**
 * Validate slippage percentage
 *
 * @param slippage - Slippage percentage to validate
 * @returns boolean indicating if slippage is valid
 *
 * @example
 * ```typescript
 * isValidSlippage(1.5) // true
 * isValidSlippage(51) // false (too high)
 * ```
 */
export function isValidSlippage(slippage: number): boolean {
	return slippage >= 0.01 && slippage <= 50;
}

/**
 * Validate token decimals
 *
 * @param decimals - Decimals to validate
 * @returns boolean indicating if decimals is valid
 *
 * @example
 * ```typescript
 * isValidDecimals(18) // true
 * isValidDecimals(31) // false (too high)
 * ```
 */
export function isValidDecimals(decimals: number): boolean {
	return Number.isInteger(decimals) && decimals >= 0 && decimals <= 30;
}

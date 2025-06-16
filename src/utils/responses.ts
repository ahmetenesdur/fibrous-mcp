/**
 * Response Utilities
 * Professional response helpers for MCP server communication
 */

import { SUPPORTED_CHAINS } from "./validation";

/**
 * Standard MCP response content structure
 */
export interface McpResponseContent {
	[x: string]: unknown;
	type: "text";
	text: string;
}

/**
 * Standard success response structure
 */
export interface McpSuccessResponse {
	[x: string]: unknown;
	content: McpResponseContent[];
}

/**
 * Standard error response structure
 */
export interface McpErrorResponse {
	[x: string]: unknown;
	content: McpResponseContent[];
	isError: true;
}

/**
 * Create a standardized error response for MCP tools
 *
 * @param error - Error object or message
 * @param context - Context where error occurred
 * @param chainName - Optional chain name for context
 * @returns Formatted error response
 *
 * @example
 * ```typescript
 * const errorResponse = createErrorResponse(
 *   new Error("Token not found"),
 *   "get-token",
 *   "base"
 * )
 * ```
 */
export function createErrorResponse(
	error: unknown,
	context: string,
	chainName?: string
): McpErrorResponse {
	const errorMessage = error instanceof Error ? error.message : "Unknown error";

	return {
		content: [
			{
				type: "text",
				text: `Error in ${context}: ${errorMessage}

Supported chains: ${SUPPORTED_CHAINS.join(", ")}
${chainName ? `Chain: ${chainName}` : ""}`,
			},
		],
		isError: true,
	};
}

/**
 * Create a standardized success response for MCP tools
 *
 * @param data - Data to include in response
 * @param context - Context description
 * @returns Formatted success response
 *
 * @example
 * ```typescript
 * const successResponse = createSuccessResponse(
 *   { tokens: [...] },
 *   "Supported tokens for base"
 * )
 * ```
 */
export function createSuccessResponse(data: unknown, context: string): McpSuccessResponse {
	return {
		content: [
			{
				type: "text",
				text: `${context}:\n\n${JSON.stringify(data, null, 2)}`,
			},
		],
	};
}

/**
 * Create a formatted info response without data
 *
 * @param message - Information message
 * @returns Formatted info response
 *
 * @example
 * ```typescript
 * const infoResponse = createInfoResponse("No tokens found for this chain")
 * ```
 */
export function createInfoResponse(message: string): McpSuccessResponse {
	return {
		content: [
			{
				type: "text",
				text: message,
			},
		],
	};
}

/**
 * Create a response for empty results
 *
 * @param resourceType - Type of resource that was empty
 * @param chainName - Chain name for context
 * @returns Formatted empty response
 *
 * @example
 * ```typescript
 * const emptyResponse = createEmptyResponse("tokens", "base")
 * ```
 */
export function createEmptyResponse(resourceType: string, chainName: string): McpSuccessResponse {
	return createInfoResponse(`No ${resourceType} found for ${chainName}. Check API connectivity.`);
}

/**
 * Create a help response with usage information
 *
 * @param toolName - Name of the tool
 * @param usage - Usage description
 * @param examples - Optional examples
 * @returns Formatted help response
 *
 * @example
 * ```typescript
 * const helpResponse = createHelpResponse(
 *   "get-best-route",
 *   "Find optimal swap routes",
 *   ["amount: '1000000000000000000'"]
 * )
 * ```
 */
export function createHelpResponse(
	toolName: string,
	usage: string,
	examples?: string[]
): McpSuccessResponse {
	let text = `${toolName}: ${usage}\n\n`;

	if (examples && examples.length > 0) {
		text += "Examples:\n";
		examples.forEach((example, index) => {
			text += `${index + 1}. ${example}\n`;
		});
	}

	return {
		content: [
			{
				type: "text",
				text: text.trim(),
			},
		],
	};
}

/**
 * Format large numbers for display
 *
 * @param value - Numeric value to format
 * @returns Formatted string with appropriate suffixes
 *
 * @example
 * ```typescript
 * formatLargeNumber(1500000) // "1.5M"
 * formatLargeNumber(1200) // "1.2K"
 * ```
 */
export function formatLargeNumber(value: number): string {
	const suffixes = ["", "K", "M", "B", "T"];
	let suffixIndex = 0;

	while (value >= 1000 && suffixIndex < suffixes.length - 1) {
		value /= 1000;
		suffixIndex++;
	}

	return `${value.toFixed(1).replace(/\.0$/, "")}${suffixes[suffixIndex]}`;
}

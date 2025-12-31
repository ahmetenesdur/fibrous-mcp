import { SUPPORTED_CHAINS } from "./validation.js";
import { RESPONSE_LIMITS } from "./constants.js";

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
	const timestamp = new Date().toISOString();

	return {
		content: [
			{
				type: "text",
				text: `Error in ${context}: ${errorMessage}
		
Timestamp: ${timestamp}
Supported chains: ${SUPPORTED_CHAINS.join(", ")}
${chainName ? `Chain: ${chainName}` : ""}
		
Tip: Check your parameters and try again. For help, use the "help" prompt.`,
			},
		],
		isError: true,
	};
}

/**
 * Sanitize and truncate large objects to prevent memory issues
 */
function sanitizeObject(obj: unknown, maxDepth = 3, currentDepth = 0): unknown {
	if (currentDepth >= maxDepth) {
		return "[Max depth reached]";
	}

	if (obj === null || obj === undefined) {
		return obj;
	}

	if (typeof obj === "string") {
		return obj.length > RESPONSE_LIMITS.MAX_STRING_LENGTH
			? obj.substring(0, RESPONSE_LIMITS.MAX_STRING_LENGTH) +
					RESPONSE_LIMITS.TRUNCATION_INDICATOR
			: obj;
	}

	if (typeof obj === "number" || typeof obj === "boolean") {
		return obj;
	}

	if (Array.isArray(obj)) {
		if (obj.length > RESPONSE_LIMITS.MAX_ARRAY_LENGTH) {
			const truncated = obj
				.slice(0, RESPONSE_LIMITS.MAX_ARRAY_LENGTH)
				.map((item) => sanitizeObject(item, maxDepth, currentDepth + 1));
			truncated.push(`[... ${obj.length - RESPONSE_LIMITS.MAX_ARRAY_LENGTH} more items]`);
			return truncated;
		}
		return obj.map((item) => sanitizeObject(item, maxDepth, currentDepth + 1));
	}

	if (typeof obj === "object") {
		const sanitized: Record<string, unknown> = {};
		const entries = Object.entries(obj as Record<string, unknown>);

		for (const [key, value] of entries.slice(0, RESPONSE_LIMITS.MAX_OBJECT_PROPERTIES)) {
			// Limit object properties
			sanitized[key] = sanitizeObject(value, maxDepth, currentDepth + 1);
		}

		if (entries.length > RESPONSE_LIMITS.MAX_OBJECT_PROPERTIES) {
			sanitized["[truncated]"] =
				`${entries.length - RESPONSE_LIMITS.MAX_OBJECT_PROPERTIES} more properties`;
		}

		return sanitized;
	}

	return String(obj);
}

/**
 * Format JSON with size limits
 */
function formatJsonSafely(data: unknown): string {
	try {
		const sanitized = sanitizeObject(data);
		const jsonString = JSON.stringify(sanitized, null, 2);

		if (jsonString.length > RESPONSE_LIMITS.MAX_SIZE) {
			const truncated = jsonString.substring(0, RESPONSE_LIMITS.MAX_SIZE - 100);
			return truncated + "\n... (Response truncated due to size limit)";
		}

		return jsonString;
	} catch (error) {
		return `[Error formatting response: ${error instanceof Error ? error.message : "Unknown error"}]`;
	}
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
	const timestamp = new Date().toISOString();
	const formattedData = formatJsonSafely(data);

	return {
		content: [
			{
				type: "text",
				text: `${context}
		
Timestamp: ${timestamp}
		
Data:
${formattedData}`,
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
	const timestamp = new Date().toISOString();

	return {
		content: [
			{
				type: "text",
				text: `${message}
		
Timestamp: ${timestamp}`,
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
	return createInfoResponse(
		`No ${resourceType} found for ${chainName}. This could indicate:
• Network connectivity issues
• API service temporarily unavailable
• Chain configuration problems

Try again in a moment or check your network connection.`
	);
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

export const SERVER_CONSTANTS = {
	VERSION: "1.0.0",
	NAME: "fibrous-mcp",
	DESCRIPTION: "Fibrous SDK MCP server for DeFi token swaps",
	RATE_LIMIT: "200 requests per minute",
} as const;

// --- API Endpoints ---

export const API_ENDPOINTS = {
	FIBROUS_API: "https://api.fibrous.finance",
	GRAPH_API: "https://graph.fibrous.finance",
} as const;

// --- Explorer URLs ---

export const EXPLORER_URLS = {
	base: "https://basescan.org/tx",
	scroll: "https://scrollscan.com/tx",
	starknet: "https://starkscan.co/tx",
} as const;

// --- Validation Limits ---

export const VALIDATION_LIMITS = {
	MIN_SLIPPAGE: 0.01,
	MAX_SLIPPAGE: 50,
	MIN_DECIMALS: 0,
	MAX_DECIMALS: 30,
	MIN_STRING_LENGTH: 1,
	MIN_PRIVATE_KEY_LENGTH: 32,
	MAX_AMOUNT_LENGTH: 77, // Safe BigInt length
} as const;

// --- Gas Estimation Fallbacks ---

export const GAS_FALLBACKS = {
	STARKNET: {
		GAS_ESTIMATE: "50000",
		GAS_PRICE: "1000000000", // 1 GWEI
	},
	EVM: {
		GAS_ESTIMATE: "200000",
		GAS_PRICE: "20000000000", // 20 GWEI
	},
} as const;

// --- Response Limits ---

export const RESPONSE_LIMITS = {
	MAX_SIZE: 1024 * 1024, // 1MB
	MAX_ARRAY_LENGTH: 1000,
	MAX_STRING_LENGTH: 10000,
	MAX_OBJECT_PROPERTIES: 100,
	MAX_DEPTH: 3,
	TRUNCATION_INDICATOR: "... (truncated)",
} as const;

// --- Default Values ---

export const DEFAULTS = {
	SLIPPAGE: 1,
	DECIMALS: 18,
	GAS_MULTIPLIER: 1.2,
	TRANSACTION_TIMEOUT: 300, // 5 minutes
	MAX_DECIMALS_DISPLAY: 6,
} as const;

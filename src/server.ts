import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Router as FibrousRouter } from "fibrous-router-sdk";
import {
	SUPPORTED_CHAINS,
	SERVER_CONSTANTS,
	API_ENDPOINTS,
	VALIDATION_LIMITS,
	getValidChains,
	logConfigStatus,
	validateChain,
} from "./utils/index.js";
import {
	getSupportedTokensHandler,
	getSupportedProtocolsHandler,
	getBestRouteHandler,
	buildTransactionHandler,
	formatTokenAmountHandler,
	getTokenHandler,
	executeSwapHandler,
	estimateSwapHandler,
} from "./tools/handlers.js";

// --- Configuration ---

export const SERVER_CONFIG = {
	name: SERVER_CONSTANTS.NAME,
	version: SERVER_CONSTANTS.VERSION,
	description: SERVER_CONSTANTS.DESCRIPTION,
	supportedChains: SUPPORTED_CHAINS,
	apiEndpoints: {
		api: API_ENDPOINTS.FIBROUS_API,
		graph: API_ENDPOINTS.GRAPH_API,
	},
	rateLimit: SERVER_CONSTANTS.RATE_LIMIT,
} as const;

export const schemas = {
	chainName: z.enum(SUPPORTED_CHAINS).describe("Supported blockchain network"),
	tokenAddress: z
		.string()
		.min(VALIDATION_LIMITS.MIN_STRING_LENGTH)
		.describe("Token contract address"),
	amount: z
		.string()
		.min(VALIDATION_LIMITS.MIN_STRING_LENGTH)
		.describe("Token amount as string (wei format)"),
	slippage: z
		.number()
		.min(VALIDATION_LIMITS.MIN_SLIPPAGE)
		.max(VALIDATION_LIMITS.MAX_SLIPPAGE)
		.describe("Slippage percentage (0.01-50%)"),
	decimals: z
		.number()
		.int()
		.min(VALIDATION_LIMITS.MIN_DECIMALS)
		.max(VALIDATION_LIMITS.MAX_DECIMALS)
		.describe("Token decimal places"),
	operation: z.enum(["format", "parse"]).describe("Amount conversion operation"),
} as const;

// --- Initialization ---

export let fibrousRouter: FibrousRouter;

(async () => {
	try {
		fibrousRouter = new FibrousRouter({ apiVersion: "v2" });
		await fibrousRouter.refreshSupportedChains();
		console.error("[INFO] Fibrous Router initialized with V2 API");

		logConfigStatus();
	} catch (error) {
		console.error("Failed to initialize Fibrous Router:", error);
		process.exit(1);
	}
})();

export const server = new McpServer({
	name: SERVER_CONFIG.name,
	version: SERVER_CONFIG.version,
});

// --- Tool Registration ---
const tools: any[] = [
	{
		name: "get-supported-tokens",
		description: "Get a list of supported tokens for a given chain",
		inputSchema: z.object({
			chainName: schemas.chainName,
		}),
		handler: getSupportedTokensHandler,
	},
	{
		name: "get-supported-protocols",
		description: "Get a list of supported protocols for a given chain",
		inputSchema: z.object({
			chainName: schemas.chainName,
		}),
		handler: getSupportedProtocolsHandler,
	},
	{
		name: "get-best-route",
		description: "Find the best swap route between two tokens",
		inputSchema: z.object({
			amount: schemas.amount,
			tokenInAddress: schemas.tokenAddress,
			tokenOutAddress: schemas.tokenAddress,
			chainName: schemas.chainName,
			options: z
				.object({
					direct: z.boolean().optional(),
					excludeProtocols: z.array(z.string()).optional(),
				})
				.optional(),
		}),
		handler: getBestRouteHandler,
	},
	{
		name: "get-best-route-batch",
		description: "Find the best routes for multiple swaps (Starknet only)",
		inputSchema: z.object({
			amounts: z.array(schemas.amount),
			tokenInAddresses: z.array(schemas.tokenAddress),
			tokenOutAddresses: z.array(schemas.tokenAddress),
			chainName: z.literal("starknet"),
		}),
		// We'll update imports to include this handler next
		handler: async (args: any, router: FibrousRouter) => {
			const { getBestRouteBatchHandler } = await import("./tools/handlers.js");
			return getBestRouteBatchHandler(args, router);
		},
	},
	{
		name: "build-transaction",
		description: "Build the transaction data for a swap",
		inputSchema: z.object({
			amount: schemas.amount,
			tokenInAddress: schemas.tokenAddress,
			tokenOutAddress: schemas.tokenAddress,
			slippage: schemas.slippage,
			receiverAddress: z.string().min(1).describe("Recipient wallet address"),
			chainName: schemas.chainName,
			options: z
				.object({
					direct: z.boolean().optional(),
					excludeProtocols: z.array(z.string()).optional(),
				})
				.optional(),
		}),
		handler: buildTransactionHandler,
	},
	{
		name: "build-batch-transaction",
		description: "Build transaction data for multiple swaps (Starknet only)",
		inputSchema: z.object({
			amounts: z.array(schemas.amount),
			tokenInAddresses: z.array(schemas.tokenAddress),
			tokenOutAddresses: z.array(schemas.tokenAddress),
			slippage: schemas.slippage,
			receiverAddress: z.string().min(1).describe("Recipient wallet address"),
			chainName: z.literal("starknet"),
		}),
		// We'll update imports to include this handler next
		handler: async (args: any, router: FibrousRouter) => {
			const { buildBatchTransactionHandler } = await import("./tools/handlers.js");
			return buildBatchTransactionHandler(args, router);
		},
	},
	{
		name: "format-token-amount",
		description: "Convert token amount between human-readable and wei formats",
		inputSchema: z.object({
			amount: schemas.amount,
			decimals: schemas.decimals,
			operation: schemas.operation,
		}),
		handler: formatTokenAmountHandler,
	},
	{
		name: "get-token",
		description: "Get token information by address",
		inputSchema: z.object({
			address: schemas.tokenAddress,
			chainName: schemas.chainName,
		}),
		handler: getTokenHandler,
	},
];

// Conditionally add tools that require wallet configuration
const validChains = getValidChains();
if (validChains.length > 0) {
	tools.push(
		{
			name: "execute-swap",
			description: `Execute a token swap (Available for: ${validChains.join(", ")})`,
			inputSchema: z.object({
				amount: schemas.amount,
				tokenInAddress: schemas.tokenAddress,
				tokenOutAddress: schemas.tokenAddress,
				slippage: schemas.slippage.optional(),
				receiverAddress: z
					.string()
					.optional()
					.describe("Address to receive swapped tokens"),
				chainName: schemas.chainName,
			}),
			handler: executeSwapHandler,
		},
		{
			name: "estimate-swap",
			description: `Estimate gas cost for a token swap (Available for: ${validChains.join(", ")})`,
			inputSchema: z.object({
				amount: schemas.amount,
				tokenInAddress: schemas.tokenAddress,
				tokenOutAddress: schemas.tokenAddress,
				slippage: schemas.slippage.optional(),
				chainName: schemas.chainName,
			}),
			handler: estimateSwapHandler,
		}
	);
}

// Register all tools
tools.forEach((tool) => {
	const { name, description, inputSchema, handler } = tool;

	// Create wrapper function to inject fibrousRouter
	const wrappedHandler = async (args: any) => {
		return (handler as any)(args, fibrousRouter);
	};

	server.tool(name, { description, input: inputSchema } as any, wrappedHandler);
});

// Log total number of tools

// --- Resources ---

server.resource("fibrous-config", "fibrous://config", async (uri) => ({
	contents: [
		{
			uri: uri.href,
			text: JSON.stringify(
				{
					serverInfo: {
						name: SERVER_CONFIG.name,
						version: SERVER_CONFIG.version,
						description: SERVER_CONFIG.description,
					},
					capabilities: {
						supportedChains: SERVER_CONFIG.supportedChains,
						rateLimit: SERVER_CONFIG.rateLimit,
						features: [
							"Token discovery",
							"Protocol aggregation",
							"Route optimization",
							"Transaction building",
						],
					},
					endpoints: SERVER_CONFIG.apiEndpoints,
					documentation: "https://docs.fibrous.finance/",
					lastUpdated: new Date().toISOString(),
				},
				null,
				2
			),
		},
	],
}));

server.resource(
	"chain-info",
	new ResourceTemplate("chain://{chainName}/info", { list: undefined }),
	async (uri, { chainName }) => {
		const chainNameStr = Array.isArray(chainName) ? chainName[0] : chainName;

		try {
			validateChain(chainNameStr);

			const [tokens, protocols] = await Promise.allSettled([
				fibrousRouter.supportedTokens(chainNameStr),
				fibrousRouter.supportedProtocols(chainNameStr),
			]);

			const tokensResult = tokens.status === "fulfilled" ? tokens.value : null;
			const protocolsResult = protocols.status === "fulfilled" ? protocols.value : null;

			return {
				contents: [
					{
						uri: uri.href,
						text: JSON.stringify(
							{
								chainName: chainNameStr,
								lastUpdated: new Date().toISOString(),
								tokenCount: tokensResult ? tokensResult.size : 0,
								protocolCount: protocolsResult ? protocolsResult.size : 0,
							},
							null,
							2
						),
					},
				],
			};
		} catch (error) {
			return {
				contents: [
					{
						uri: uri.href,
						text: JSON.stringify(
							{
								chainName: chainNameStr,
								error: error instanceof Error ? error.message : "Unknown error",
								timestamp: new Date().toISOString(),
							},
							null,
							2
						),
					},
				],
			};
		}
	}
);

server.resource(
	"greeting",
	new ResourceTemplate("greeting://{name}", { list: undefined }),
	async (uri, { name }) => ({
		contents: [
			{
				uri: uri.href,
				text: `Hello ${name}! Welcome to Fibrous MCP Server.

Available tools: get-supported-tokens, get-supported-protocols, get-best-route, build-transaction, format-token-amount, get-token

Supported chains: ${SERVER_CONFIG.supportedChains.join(", ")}

Use "help" prompt for detailed documentation.`,
			},
		],
	})
);

// --- Prompts ---

server.prompt(
	"analyze-swap",
	{
		tokenIn: z.string().describe("Input token"),
		tokenOut: z.string().describe("Output token"),
		amount: z.string().describe("Amount to swap"),
		chainName: schemas.chainName as any,
	} as any,
	(({
		tokenIn,
		tokenOut,
		amount,
		chainName,
	}: {
		tokenIn: string;
		tokenOut: string;
		amount: string;
		chainName: string;
	}) => ({
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: `Analyze this token swap on ${chainName}:

From: ${tokenIn}
To: ${tokenOut}
Amount: ${amount}

Please use Fibrous SDK tools to:
1. Get route analysis with get-best-route
2. Provide slippage recommendations
3. Assess costs and risks
4. Suggest optimization strategies`,
				},
			},
		],
	})) as any
);

server.prompt(
	"defi-strategy",
	{
		portfolio: z.string().describe("Current portfolio"),
		goal: z.string().describe("Investment goal"),
		riskTolerance: z.string().optional().describe("Risk tolerance"),
	} as any,
	(({
		portfolio,
		goal,
		riskTolerance,
	}: {
		portfolio: string;
		goal: string;
		riskTolerance?: string;
	}) => ({
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: `Analyze DeFi portfolio strategy:

Portfolio: ${portfolio}
Goal: ${goal}
Risk Tolerance: ${riskTolerance || "Not specified"}

Use Fibrous tools to analyze rebalancing opportunities and provide actionable recommendations.`,
				},
			},
		],
	})) as any
);

server.prompt("help", {}, () => ({
	messages: [
		{
			role: "user",
			content: {
				type: "text",
				text: `Fibrous MCP Server Documentation

TOOLS:
• get-supported-tokens - Get available tokens for a chain
• get-supported-protocols - List DEX protocols  
• get-best-route - Find optimal swap routes
• build-transaction - Generate transaction data
• format-token-amount - Convert amounts
• get-token - Get token info by address
• execute-swap - Execute token swap with real transactions
• estimate-swap - Estimate gas costs for swaps

SUPPORTED CHAINS: ${SERVER_CONFIG.supportedChains.join(", ")}

EXAMPLE USAGE:
{
	"name": "get-best-route",
	"arguments": {
		"amount": "1000000000000000000",
		"tokenInAddress": "0x...",
		"tokenOutAddress": "0x...",
		"chainName": "base"
	}
}

{
	"name": "execute-swap",
	"arguments": {
		"amount": "1000000000000000000",
		"tokenInAddress": "0x...",
		"tokenOutAddress": "0x...",
		"slippage": 1,
		"chainName": "base"
	}
}

⚠️  IMPORTANT: execute-swap requires wallet configuration in environment variables!

For detailed help with any specific tool or operation, just ask!`,
			},
		},
	],
}));

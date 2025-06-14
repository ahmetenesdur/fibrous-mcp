/**
 * Fibrous MCP Server - Model Context Protocol Server
 * Enterprise-grade MCP server integrating Fibrous Finance DeFi aggregation
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Router as FibrousRouter } from "fibrous-router-sdk";
import { BigNumber } from "@ethersproject/bignumber";
import type { Token } from "fibrous-router-sdk";

// =============================================================================
// CONFIGURATION
// =============================================================================

const SERVER_CONFIG = {
	name: "fibrous-mcp",
	version: "1.0.0",
	description: "Fibrous SDK MCP server for DeFi token swaps",
	supportedChains: ["base", "starknet", "scroll"] as const,
	apiEndpoints: {
		api: "https://api.fibrous.finance",
		graph: "https://graph.fibrous.finance",
	},
	rateLimit: "200 requests per minute",
} as const;

type SupportedChain = (typeof SERVER_CONFIG.supportedChains)[number];

const schemas = {
	chainName: z.enum(SERVER_CONFIG.supportedChains).describe("Supported blockchain network"),
	tokenAddress: z.string().min(1).describe("Token contract address"),
	amount: z.string().min(1).describe("Token amount as string (wei format)"),
	slippage: z.number().min(0.01).max(50).describe("Slippage percentage (0.01-50%)"),
	decimals: z.number().int().min(0).max(30).describe("Token decimal places"),
	operation: z.enum(["format", "parse"]).describe("Amount conversion operation"),
} as const;

// =============================================================================
// INITIALIZATION
// =============================================================================

let fibrousRouter: FibrousRouter;

try {
	fibrousRouter = new FibrousRouter();
	console.log("Fibrous Router initialized");
} catch (error) {
	console.error("Failed to initialize Fibrous Router:", error);
	process.exit(1);
}

const server = new McpServer({
	name: SERVER_CONFIG.name,
	version: SERVER_CONFIG.version,
});

console.log(`Starting ${SERVER_CONFIG.name} v${SERVER_CONFIG.version}`);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function createErrorResponse(
	error: unknown,
	context: string,
	chainName?: string
): { content: { type: "text"; text: string }[]; isError: true } {
	const errorMessage = error instanceof Error ? error.message : "Unknown error";

	return {
		content: [
			{
				type: "text",
				text: `Error in ${context}: ${errorMessage}

Supported chains: ${SERVER_CONFIG.supportedChains.join(", ")}
${chainName ? `Chain: ${chainName}` : ""}`,
			},
		],
		isError: true,
	};
}

function createSuccessResponse(
	data: unknown,
	context: string
): { content: { type: "text"; text: string }[] } {
	return {
		content: [
			{
				type: "text",
				text: `${context}:\n\n${JSON.stringify(data, null, 2)}`,
			},
		],
	};
}

function validateChain(chainName: string): asserts chainName is SupportedChain {
	if (!SERVER_CONFIG.supportedChains.includes(chainName as SupportedChain)) {
		throw new Error(`Unsupported chain: ${chainName}`);
	}
}

function convertAmount(amount: string, decimals: number, operation: "format" | "parse"): string {
	if (operation === "format") {
		const amountBN = BigNumber.from(amount);
		const divisor = BigNumber.from(10).pow(decimals);
		const readable = amountBN.div(divisor).toString();
		const remainder = amountBN.mod(divisor);

		let result = readable;
		if (!remainder.isZero()) {
			const decimal = remainder.toString().padStart(decimals, "0");
			result = `${readable}.${decimal}`.replace(/\.?0+$/, "");
		}
		return result;
	} else {
		const [whole, decimal = ""] = amount.split(".");
		const paddedDecimal = decimal.padEnd(decimals, "0").slice(0, decimals);
		return whole + paddedDecimal;
	}
}

// =============================================================================
// TOOLS
// =============================================================================

server.tool("get-supported-tokens", { chainName: schemas.chainName }, async ({ chainName }) => {
	try {
		validateChain(chainName);
		const tokens = await fibrousRouter.supportedTokens(chainName);

		const tokensObject: Record<string, Token> = {};
		if (tokens instanceof Map) {
			tokens.forEach((token, symbol) => {
				tokensObject[symbol] = token;
			});
		} else {
			Object.assign(tokensObject, tokens);
		}

		const tokenCount = Object.keys(tokensObject).length;
		if (tokenCount === 0) {
			return {
				content: [
					{
						type: "text",
						text: `No tokens found for ${chainName}. Check API connectivity.`,
					},
				],
			};
		}

		return createSuccessResponse(tokensObject, `Supported tokens for ${chainName}`);
	} catch (error) {
		return createErrorResponse(error, "get-supported-tokens", chainName);
	}
});

server.tool("get-supported-protocols", { chainName: schemas.chainName }, async ({ chainName }) => {
	try {
		validateChain(chainName);
		const protocols = await fibrousRouter.supportedProtocols(chainName);
		return createSuccessResponse(protocols, `Supported protocols for ${chainName}`);
	} catch (error) {
		return createErrorResponse(error, "get-supported-protocols", chainName);
	}
});

server.tool(
	"get-best-route",
	{
		amount: schemas.amount,
		tokenInAddress: schemas.tokenAddress,
		tokenOutAddress: schemas.tokenAddress,
		chainName: schemas.chainName,
	},
	async ({ amount, tokenInAddress, tokenOutAddress, chainName }) => {
		try {
			validateChain(chainName);
			const amountBN = BigNumber.from(amount);
			const route = await fibrousRouter.getBestRoute(
				amountBN,
				tokenInAddress,
				tokenOutAddress,
				chainName
			);
			return createSuccessResponse(route, `Best route for ${chainName} swap`);
		} catch (error) {
			return createErrorResponse(error, "get-best-route", chainName);
		}
	}
);

server.tool(
	"build-transaction",
	{
		amount: schemas.amount,
		tokenInAddress: schemas.tokenAddress,
		tokenOutAddress: schemas.tokenAddress,
		slippage: schemas.slippage,
		receiverAddress: z.string().min(1).describe("Recipient wallet address"),
		chainName: schemas.chainName,
	},
	async ({ amount, tokenInAddress, tokenOutAddress, slippage, receiverAddress, chainName }) => {
		try {
			validateChain(chainName);
			const amountBN = BigNumber.from(amount);
			const transaction = await fibrousRouter.buildTransaction(
				amountBN,
				tokenInAddress,
				tokenOutAddress,
				slippage,
				receiverAddress,
				chainName
			);
			return createSuccessResponse(transaction, `Transaction data for ${chainName} swap`);
		} catch (error) {
			return createErrorResponse(error, "build-transaction", chainName);
		}
	}
);

server.tool(
	"format-token-amount",
	{
		amount: schemas.amount,
		decimals: schemas.decimals,
		operation: schemas.operation,
	},
	async ({ amount, decimals, operation }) => {
		try {
			const result = convertAmount(amount, decimals, operation);
			return {
				content: [
					{
						type: "text",
						text: `Amount conversion: ${amount} → ${result} (${operation}, ${decimals} decimals)`,
					},
				],
			};
		} catch (error) {
			return createErrorResponse(error, "format-token-amount");
		}
	}
);

server.tool(
	"get-token",
	{
		address: schemas.tokenAddress,
		chainName: schemas.chainName,
	},
	async ({ address, chainName }) => {
		try {
			validateChain(chainName);
			const token = await fibrousRouter.getToken(address, chainName);

			if (!token) {
				return {
					content: [
						{
							type: "text",
							text: `Token not found: ${address} on ${chainName}`,
						},
					],
				};
			}

			return createSuccessResponse(token, `Token information for ${token.symbol}`);
		} catch (error) {
			return createErrorResponse(error, "get-token", chainName);
		}
	}
);

// =============================================================================
// RESOURCES
// =============================================================================

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
								tokenCount: tokensResult ? Object.keys(tokensResult).length : 0,
								protocolCount: protocolsResult
									? Object.keys(protocolsResult).length
									: 0,
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

// =============================================================================
// PROMPTS
// =============================================================================

server.prompt(
	"analyze-swap",
	{
		tokenIn: z.string().describe("Input token"),
		tokenOut: z.string().describe("Output token"),
		amount: z.string().describe("Amount to swap"),
		chainName: schemas.chainName,
	},
	({ tokenIn, tokenOut, amount, chainName }) => ({
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
	})
);

server.prompt(
	"defi-strategy",
	{
		portfolio: z.string().describe("Current portfolio"),
		goal: z.string().describe("Investment goal"),
		riskTolerance: z.string().optional().describe("Risk tolerance"),
	},
	({ portfolio, goal, riskTolerance }) => ({
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
	})
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

For detailed help with any specific tool or operation, just ask!`,
			},
		},
	],
}));

// =============================================================================
// SERVER STARTUP
// =============================================================================

async function startServer(): Promise<void> {
	try {
		console.log("📡 Initializing transport...");
		const transport = new StdioServerTransport();

		console.log("🔗 Connecting server...");
		await server.connect(transport);

		console.log(`${SERVER_CONFIG.name} v${SERVER_CONFIG.version} started`);
		console.log(`Supported chains: ${SERVER_CONFIG.supportedChains.join(", ")}`);
		console.log(`Tools: ${6} available`);
		console.log("Server ready for DeFi operations");
	} catch (error) {
		console.error(`Failed to start server:`, error);
		process.exit(1);
	}
}

function setupGracefulShutdown(): void {
	const shutdown = (signal: string) => {
		console.log(`\nReceived ${signal}, shutting down...`);
		process.exit(0);
	};

	process.on("SIGINT", () => shutdown("SIGINT"));
	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("uncaughtException", (error) => {
		console.error("Uncaught Exception:", error);
		process.exit(1);
	});
	process.on("unhandledRejection", (reason) => {
		console.error("Unhandled Rejection:", reason);
		process.exit(1);
	});
}

setupGracefulShutdown();
startServer();

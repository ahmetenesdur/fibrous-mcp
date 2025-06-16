/**
 * Fibrous MCP Server - Model Context Protocol Server
 * Enterprise-grade MCP server integrating Fibrous Finance DeFi aggregation
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Router as FibrousRouter } from "fibrous-router-sdk";
import type { Token } from "fibrous-router-sdk";
import {
	convertAmount,
	toBigNumber,
	validateChain,
	createErrorResponse,
	createSuccessResponse,
	createEmptyResponse,
	SUPPORTED_CHAINS,
} from "./utils/index";

// =============================================================================
// CONFIGURATION
// =============================================================================

export const SERVER_CONFIG = {
	name: "fibrous-mcp",
	version: "1.0.0",
	description: "Fibrous SDK MCP server for DeFi token swaps",
	supportedChains: SUPPORTED_CHAINS,
	apiEndpoints: {
		api: "https://api.fibrous.finance",
		graph: "https://graph.fibrous.finance",
	},
	rateLimit: "200 requests per minute",
} as const;

export const schemas = {
	chainName: z.enum(SUPPORTED_CHAINS).describe("Supported blockchain network"),
	tokenAddress: z.string().min(1).describe("Token contract address"),
	amount: z.string().min(1).describe("Token amount as string (wei format)"),
	slippage: z.number().min(0.01).max(50).describe("Slippage percentage (0.01-50%)"),
	decimals: z.number().int().min(0).max(30).describe("Token decimal places"),
	operation: z.enum(["format", "parse"]).describe("Amount conversion operation"),
} as const;

// =============================================================================
// INITIALIZATION
// =============================================================================

export let fibrousRouter: FibrousRouter;

try {
	fibrousRouter = new FibrousRouter();
	console.log("Fibrous Router initialized");
} catch (error) {
	console.error("Failed to initialize Fibrous Router:", error);
	process.exit(1);
}

export const server = new McpServer({
	name: SERVER_CONFIG.name,
	version: SERVER_CONFIG.version,
});

// =============================================================================
// TOOL HANDLERS
// =============================================================================

export async function getSupportedTokensHandler({
	chainName,
}: {
	chainName: string;
}): Promise<any> {
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
			return createEmptyResponse("tokens", chainName);
		}

		return createSuccessResponse(tokensObject, `Supported tokens for ${chainName}`);
	} catch (error) {
		return createErrorResponse(error, "get-supported-tokens", chainName);
	}
}

export async function getSupportedProtocolsHandler({
	chainName,
}: {
	chainName: string;
}): Promise<any> {
	try {
		validateChain(chainName);
		const protocols = await fibrousRouter.supportedProtocols(chainName);
		return createSuccessResponse(protocols, `Supported protocols for ${chainName}`);
	} catch (error) {
		return createErrorResponse(error, "get-supported-protocols", chainName);
	}
}

export async function getBestRouteHandler({
	amount,
	tokenInAddress,
	tokenOutAddress,
	chainName,
}: {
	amount: string;
	tokenInAddress: string;
	tokenOutAddress: string;
	chainName: string;
}): Promise<any> {
	try {
		validateChain(chainName);
		const amountBN = toBigNumber(amount);
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

export async function buildTransactionHandler({
	amount,
	tokenInAddress,
	tokenOutAddress,
	slippage,
	receiverAddress,
	chainName,
}: {
	amount: string;
	tokenInAddress: string;
	tokenOutAddress: string;
	slippage: number;
	receiverAddress: string;
	chainName: string;
}): Promise<any> {
	try {
		validateChain(chainName);
		const amountBN = toBigNumber(amount);
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

export async function formatTokenAmountHandler({
	amount,
	decimals,
	operation,
}: {
	amount: string;
	decimals: number;
	operation: "format" | "parse";
}): Promise<any> {
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

export async function getTokenHandler({
	address,
	chainName,
}: {
	address: string;
	chainName: string;
}): Promise<any> {
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

// =============================================================================
// TOOLS REGISTRATION
// =============================================================================

server.tool("get-supported-tokens", { chainName: schemas.chainName }, getSupportedTokensHandler);

server.tool(
	"get-supported-protocols",
	{ chainName: schemas.chainName },
	getSupportedProtocolsHandler
);

server.tool(
	"get-best-route",
	{
		amount: schemas.amount,
		tokenInAddress: schemas.tokenAddress,
		tokenOutAddress: schemas.tokenAddress,
		chainName: schemas.chainName,
	},
	getBestRouteHandler
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
	buildTransactionHandler
);

server.tool(
	"format-token-amount",
	{
		amount: schemas.amount.describe(
			"Amount string (wei for 'format' operation, readable for 'parse' operation)"
		),
		decimals: schemas.decimals,
		operation: schemas.operation,
	},
	formatTokenAmountHandler
);

server.tool(
	"get-token",
	{
		address: schemas.tokenAddress,
		chainName: schemas.chainName,
	},
	getTokenHandler
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

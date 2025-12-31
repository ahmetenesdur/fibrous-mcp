import type { Router as FibrousRouter } from "fibrous-router-sdk";
import {
	type Token,
	type getBestRouteParams,
	type buildRouteAndCalldataParams,
	type getBestRouteBatchParams,
	type buildBatchTransactionParams,
} from "fibrous-router-sdk";
import {
	convertAmount,
	toBigInt,
	validateChain,
	createErrorResponse,
	createSuccessResponse,
	createEmptyResponse,
	executeSwap,
	validateSwapParams,
	estimateSwapGas,
	getChainConfig,
	validateChainConfig,
	DEFAULTS,
	type SwapParams,
	type SupportedChain,
	type McpSuccessResponse,
	type McpErrorResponse,
	mapProtocolIds,
} from "../utils/index.js";

type ToolResponse = McpSuccessResponse | McpErrorResponse;

// --- Core Tool Handlers ---

/**
 * Get supported tokens for a given chain
 */
export async function getSupportedTokensHandler(
	{ chainName }: { chainName: string },
	fibrousRouter: FibrousRouter
): Promise<ToolResponse> {
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

		if (Object.keys(tokensObject).length === 0) {
			return createEmptyResponse("tokens", chainName);
		}

		return createSuccessResponse(tokensObject, `Supported tokens for ${chainName}`);
	} catch (error) {
		return createErrorResponse(error, "get-supported-tokens", chainName);
	}
}

/**
 * Get supported protocols for a given chain
 */
export async function getSupportedProtocolsHandler(
	{ chainName }: { chainName: string },
	fibrousRouter: FibrousRouter
): Promise<ToolResponse> {
	try {
		validateChain(chainName);
		const protocols = await fibrousRouter.supportedProtocols(chainName);

		return createSuccessResponse(protocols, `Supported protocols for ${chainName}`);
	} catch (error) {
		return createErrorResponse(error, "get-supported-protocols", chainName);
	}
}

/**
 * Find the best route between two tokens
 */
export async function getBestRouteHandler(
	{
		amount,
		tokenInAddress,
		tokenOutAddress,
		chainName,
		options,
	}: {
		amount: string;
		tokenInAddress: string;
		tokenOutAddress: string;
		chainName: string;
		options?: { direct?: boolean; excludeProtocols?: string[] };
	},
	fibrousRouter: FibrousRouter
): Promise<ToolResponse> {
	try {
		validateChain(chainName);
		const amountBI = toBigInt(amount);

		// Resolve chainId (V2 best practice)
		const supportedChains = fibrousRouter.supportedChains;
		const chainId = supportedChains.find((c) => c.chain_name === chainName)?.chain_id;

		const params: getBestRouteParams = {
			amount: amountBI,
			tokenInAddress,
			tokenOutAddress,
			chainId: chainId!, // chainName is validated, but chainId might be missing if refresh failed
			options: options
				? {
						...options,
						excludeProtocols: options.excludeProtocols
							? mapProtocolIds(options.excludeProtocols)
							: undefined,
					}
				: undefined,
		};

		const route = await fibrousRouter.getBestRoute(params);

		return createSuccessResponse(route, `Best route for ${chainName} swap`);
	} catch (error) {
		console.error(`Error finding route on ${chainName}:`, error);
		return createErrorResponse(error, "get-best-route", chainName);
	}
}

/**
 * Find best routes for multiple swaps (Batch - Starknet only)
 */
export async function getBestRouteBatchHandler(
	{
		amounts,
		tokenInAddresses,
		tokenOutAddresses,
		chainName,
	}: {
		amounts: string[];
		tokenInAddresses: string[];
		tokenOutAddresses: string[];
		chainName: "starknet";
	},
	fibrousRouter: FibrousRouter
): Promise<ToolResponse> {
	try {
		validateChain(chainName);
		if (chainName !== "starknet") {
			throw new Error("Batch routes are only supported on Starknet");
		}

		// Convert strings to bigints
		const amountsBI = amounts.map((a) => toBigInt(a));

		console.error(`Finding batch routes on ${chainName}: ${amounts.length} swaps`);

		// Resolve chainId
		const supportedChains = fibrousRouter.supportedChains;
		const chainId = supportedChains.find((c) => c.chain_name === chainName)?.chain_id;

		const params: getBestRouteBatchParams = {
			amounts: amountsBI,
			tokenInAddresses,
			tokenOutAddresses,
			chainId: chainId!,
		};

		const routes = await fibrousRouter.getBestRouteBatch(params);

		return createSuccessResponse(routes, `Batch routes for ${chainName}`);
	} catch (error) {
		console.error(`Error finding batch routes on ${chainName}:`, error);
		return createErrorResponse(error, "get-best-route-batch", chainName);
	}
}

/**
 * Build transaction data for a swap (Refactored to buildRouteAndCalldata)
 */
export async function buildTransactionHandler(
	{
		amount,
		tokenInAddress,
		tokenOutAddress,
		slippage,
		receiverAddress,
		chainName,
		options,
	}: {
		amount: string;
		tokenInAddress: string;
		tokenOutAddress: string;
		slippage: number;
		receiverAddress: string;
		chainName: string;
		options?: { direct?: boolean; excludeProtocols?: string[] };
	},
	fibrousRouter: FibrousRouter
): Promise<ToolResponse> {
	try {
		validateChain(chainName);
		const amountBI = toBigInt(amount);

		// Resolve chainId
		const supportedChains = fibrousRouter.supportedChains;
		const chainId = supportedChains.find((c) => c.chain_name === chainName)?.chain_id;

		const params: buildRouteAndCalldataParams = {
			inputAmount: amountBI,
			tokenInAddress,
			tokenOutAddress,
			slippage,
			destination: receiverAddress,
			chainId: chainId!,
			options: options
				? {
						...options,
						excludeProtocols: options.excludeProtocols
							? mapProtocolIds(options.excludeProtocols)
							: undefined,
					}
				: undefined,
		};

		// Call buildRouteAndCalldata instead of deprecated buildTransaction
		// V2 returns object with { route, calldata }
		const { route, calldata } = await fibrousRouter.buildRouteAndCalldata(params);

		// Combine them to mimic useful output for the agent, or return standardized format
		const result = {
			route,
			calldata,
		};

		return createSuccessResponse(result, `Transaction data for ${chainName} swap`);
	} catch (error) {
		console.error(`Error building transaction on ${chainName}:`, error);
		return createErrorResponse(error, "build-transaction", chainName);
	}
}

/**
 * Build batch transaction (Starknet only)
 */
export async function buildBatchTransactionHandler(
	{
		amounts,
		tokenInAddresses,
		tokenOutAddresses,
		slippage,
		receiverAddress,
		chainName,
	}: {
		amounts: string[];
		tokenInAddresses: string[];
		tokenOutAddresses: string[];
		slippage: number;
		receiverAddress: string;
		chainName: "starknet";
	},
	fibrousRouter: FibrousRouter
): Promise<ToolResponse> {
	try {
		validateChain(chainName);
		if (chainName !== "starknet") {
			throw new Error("Batch transactions are only supported on Starknet");
		}

		console.error(`Building batch transaction on ${chainName}`);
		const amountsBI = amounts.map((a) => toBigInt(a));

		// Resolve chainId
		const supportedChains = fibrousRouter.supportedChains;
		const chainId = supportedChains.find((c) => c.chain_name === chainName)?.chain_id;

		const params: buildBatchTransactionParams = {
			inputAmounts: amountsBI,
			tokenInAddresses,
			tokenOutAddresses,
			slippage,
			destination: receiverAddress,
			chainId: chainId!,
		};

		const calls = await fibrousRouter.buildBatchTransaction(params);

		return createSuccessResponse(calls, `Batch transaction calls for ${chainName}`);
	} catch (error) {
		console.error(`Error building batch transaction on ${chainName}:`, error);
		return createErrorResponse(error, "build-batch-transaction", chainName);
	}
}

/**
 * Format token amount between different representations
 */
export async function formatTokenAmountHandler({
	amount,
	decimals,
	operation,
}: {
	amount: string;
	decimals: number;
	operation: "format" | "parse";
}): Promise<ToolResponse> {
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
		console.error(`Error formatting amount:`, error);
		return createErrorResponse(error, "format-token-amount");
	}
}

/**
 * Get token information by address
 */
export async function getTokenHandler(
	{
		address,
		chainName,
	}: {
		address: string;
		chainName: string;
	},
	fibrousRouter: FibrousRouter
): Promise<ToolResponse> {
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

		console.error(`Found token: ${token.symbol} (${token.name})`);
		return createSuccessResponse(token, `Token information for ${token.symbol}`);
	} catch (error) {
		console.error(`Error fetching token ${address} on ${chainName}:`, error);
		return createErrorResponse(error, "get-token", chainName);
	}
}

// --- Swap Execution Handlers ---

/**
 * Execute a token swap with real transactions
 */
export async function executeSwapHandler(
	{
		amount,
		tokenInAddress,
		tokenOutAddress,
		slippage,
		receiverAddress,
		chainName,
		options,
	}: {
		amount: string;
		tokenInAddress: string;
		tokenOutAddress: string;
		slippage?: number;
		receiverAddress?: string;
		chainName: string;
		options?: { direct?: boolean; excludeProtocols?: string[] };
	},
	fibrousRouter: FibrousRouter
): Promise<ToolResponse> {
	try {
		validateChain(chainName);

		// Validate wallet configuration for specific chain
		const chainValidation = validateChainConfig(chainName as SupportedChain);
		if (!chainValidation.isValid) {
			return createErrorResponse(
				new Error(
					`Wallet configuration invalid for ${chainName}: ${chainValidation.errors.join(", ")}`
				),
				"execute-swap",
				chainName
			);
		}

		// Prepare swap parameters
		const swapParams: SwapParams = {
			amount,
			tokenInAddress,
			tokenOutAddress,
			slippage: slippage ?? DEFAULTS.SLIPPAGE,
			receiverAddress,
			chainName,
			options,
		};

		// Validate swap parameters
		const paramValidation = validateSwapParams(swapParams);
		if (!paramValidation.isValid) {
			return createErrorResponse(
				new Error(`Invalid swap parameters: ${paramValidation.errors.join(", ")}`),
				"execute-swap",
				chainName
			);
		}

		// Get chain configuration
		const chainConfig = getChainConfig(chainName);

		console.error(`[INFO] Executing swap on ${chainName}...`);
		// Execute swap
		const swapResult = await executeSwap(swapParams, chainConfig, fibrousRouter);

		if (swapResult.success) {
			console.error(`[SUCCESS] Swap successful: ${swapResult.transactionHash}`);
			return createSuccessResponse(
				{
					success: true,
					transactionHash: swapResult.transactionHash,
					explorerUrl: swapResult.explorerUrl,
					gasUsed: swapResult.gasUsed,
					outputAmount: swapResult.outputAmount,
				},
				`Swap executed successfully on ${chainName}`
			);
		} else {
			console.error(`Swap failed: ${swapResult.error}`);
			return createErrorResponse(
				new Error(swapResult.error || "Swap execution failed"),
				"execute-swap",
				chainName
			);
		}
	} catch (error) {
		console.error(`Error executing swap on ${chainName}:`, error);
		return createErrorResponse(error, "execute-swap", chainName);
	}
}

/**
 * Estimate gas cost for a token swap
 */
export async function estimateSwapHandler(
	{
		amount,
		tokenInAddress,
		tokenOutAddress,
		slippage,
		chainName,
	}: {
		amount: string;
		tokenInAddress: string;
		tokenOutAddress: string;
		slippage?: number;
		chainName: string;
	},
	fibrousRouter: FibrousRouter
): Promise<ToolResponse> {
	try {
		validateChain(chainName);

		// Validate wallet configuration for specific chain
		const chainValidation = validateChainConfig(chainName as SupportedChain);
		if (!chainValidation.isValid) {
			return createErrorResponse(
				new Error(
					`Wallet configuration invalid for ${chainName}: ${chainValidation.errors.join(", ")}`
				),
				"estimate-swap",
				chainName
			);
		}

		// Prepare swap parameters
		const swapParams: SwapParams = {
			amount,
			tokenInAddress,
			tokenOutAddress,
			slippage: slippage ?? DEFAULTS.SLIPPAGE,
			chainName,
		};

		// Get chain configuration
		const chainConfig = getChainConfig(chainName);

		console.error(`Estimating gas for ${chainName} swap...`);
		// Estimate gas
		const gasEstimate = await estimateSwapGas(swapParams, chainConfig, fibrousRouter);

		return createSuccessResponse(gasEstimate, `Gas estimation for ${chainName} swap`);
	} catch (error) {
		console.error(`Error estimating gas on ${chainName}:`, error);
		return createErrorResponse(error, "estimate-swap", chainName);
	}
}

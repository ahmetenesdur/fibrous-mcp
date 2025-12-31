import type { Router as FibrousRouter } from "fibrous-router-sdk";
import type { buildRouteAndCalldataParams } from "fibrous-router-sdk";
import { createPublicClient, createWalletClient, http, type Hex, erc20Abi, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, scroll } from "viem/chains";
import { Account as StarknetAccount, RpcProvider, type Call } from "starknet";
import type { SupportedChain, ChainConfig } from "./index.js";
import { getServerConfig } from "./config.js";
import { toBigInt } from "./amounts.js";
import { EXPLORER_URLS, GAS_FALLBACKS, DEFAULTS } from "./constants.js";
import { mapProtocolIds } from "./index.js";

export interface SwapParams {
	amount: string;
	tokenInAddress: string;
	tokenOutAddress: string;
	slippage?: number;
	receiverAddress?: string;
	chainName: SupportedChain;
	options?: {
		direct?: boolean;
		excludeProtocols?: string[];
	};
}

export interface SwapResult {
	success: boolean;
	transactionHash?: string;
	error?: string;
	explorerUrl?: string;
	gasUsed?: string;
	outputAmount?: string;
}

export interface GasEstimate {
	gasEstimate: string;
	gasPrice: string;
	estimatedCost: string;
	costInUSD?: string;
}

// --- Helper for Viem Chains ---
function getViemChain(chainName: string): Chain {
	switch (chainName) {
		case "base":
			return base;
		case "scroll":
			return scroll;
		default:
			throw new Error(`Unsupported EVM chain: ${chainName}`);
	}
}

// --- Core Swap Execution ---

/**
 * Execute a token swap on any supported chain
 * @param params - Swap parameters
 * @param chainConfig - Chain configuration
 * @param fibrousRouter - Fibrous router instance
 * @returns Swap result with transaction details
 */
export async function executeSwap(
	params: SwapParams,
	chainConfig: ChainConfig,
	fibrousRouter: FibrousRouter
): Promise<SwapResult> {
	try {
		const {
			amount,
			tokenInAddress,
			tokenOutAddress,
			slippage = DEFAULTS.SLIPPAGE,
			receiverAddress,
			chainName,
		} = params;

		// Convert amount to bigint
		const amountBI = toBigInt(amount);

		// Use receiver address or derive from private key
		const finalReceiverAddress =
			receiverAddress || (await getWalletAddress(chainConfig, chainName));

		console.error(`[INFO] Starting ${chainName} swap: ${amount} wei`);
		console.error(`[INFO] From: ${tokenInAddress}`);
		console.error(`[INFO] To: ${tokenOutAddress}`);
		console.error(`[INFO] Receiver: ${finalReceiverAddress}`);
		console.error(`[INFO] Slippage: ${slippage}%`);

		if (chainName === "starknet") {
			return executeStarknetSwap(
				amountBI,
				tokenInAddress,
				tokenOutAddress,
				slippage,
				finalReceiverAddress,
				chainConfig,
				fibrousRouter,
				params.options
			);
		} else {
			return executeEvmSwap(
				amountBI,
				tokenInAddress,
				tokenOutAddress,
				slippage,
				finalReceiverAddress,
				chainName,
				chainConfig,
				fibrousRouter,
				params.options
			);
		}
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error during swap execution";
		console.error(`[ERROR] Swap execution failed: ${errorMessage}`);
		return {
			success: false,
			error: errorMessage,
		};
	}
}

// --- Starknet Swap Execution ---

async function executeStarknetSwap(
	amount: bigint,
	tokenInAddress: string,
	tokenOutAddress: string,
	slippage: number,
	receiverAddress: string,
	chainConfig: ChainConfig,
	fibrousRouter: FibrousRouter,
	options?: { direct?: boolean; excludeProtocols?: string[] }
): Promise<SwapResult> {
	try {
		if (!chainConfig.publicKey) {
			throw new Error("Starknet public key is required");
		}

		// Create Starknet account
		const provider = new RpcProvider({ nodeUrl: chainConfig.rpcUrl });
		const account = new StarknetAccount(
			provider,
			chainConfig.publicKey,
			chainConfig.privateKey
		);

		// Build approve call
		const approveCall: Call = await fibrousRouter.buildApproveStarknet(amount, tokenInAddress);

		// Resolve chainId
		const supportedChains = fibrousRouter.supportedChains;
		const chainId = supportedChains.find((c) => c.chain_name === "starknet")?.chain_id;

		const params: buildRouteAndCalldataParams = {
			inputAmount: amount,
			tokenInAddress,
			tokenOutAddress,
			slippage,
			destination: receiverAddress,
			chainId: chainId!,
			options: options
				? { ...options, excludeProtocols: options.excludeProtocols as any }
				: undefined,
		};

		// Build swap call using V2 API
		const { calldata } = await fibrousRouter.buildRouteAndCalldata(params);

		const routerAddress = supportedChains.find(
			(c) => c.chain_name === "starknet"
		)?.router_address;
		if (!routerAddress) throw new Error("Starknet router address not found");

		const swapCall: Call = {
			contractAddress: routerAddress,
			entrypoint: "swap",
			calldata: calldata as any,
		};

		// Execute transaction
		const result = await account.execute([approveCall, swapCall]);

		return {
			success: true,
			transactionHash: result.transaction_hash,
			explorerUrl: `https://starkscan.co/tx/${result.transaction_hash}`,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Starknet swap failed",
		};
	}
}

// --- EVM Swap Execution ---

async function executeEvmSwap(
	amount: bigint,
	tokenInAddress: string,
	tokenOutAddress: string,
	slippage: number,
	receiverAddress: string,
	chainName: SupportedChain,
	chainConfig: ChainConfig,
	fibrousRouter: FibrousRouter,
	options?: { direct?: boolean; excludeProtocols?: string[] }
): Promise<SwapResult> {
	try {
		const chain = getViemChain(chainName);
		const account = privateKeyToAccount(chainConfig.privateKey as Hex);

		const publicClient = createPublicClient({
			chain,
			transport: http(chainConfig.rpcUrl),
		});

		const walletClient = createWalletClient({
			account,
			chain,
			transport: http(chainConfig.rpcUrl),
		});

		// Resolve router address
		const supportedChains = fibrousRouter.supportedChains;
		const chainData = supportedChains.find((c) => c.chain_name === chainName);
		if (!chainData?.router_address) {
			throw new Error("Router address not found");
		}
		const routerAddress = chainData.router_address as Hex;
		const chainId = chainData.chain_id;

		// Handle Approval
		await approveTokenIfNeeded(
			publicClient,
			walletClient,
			tokenInAddress as Hex,
			routerAddress,
			amount,
			account.address
		);

		const params: buildRouteAndCalldataParams = {
			inputAmount: amount,
			tokenInAddress,
			tokenOutAddress,
			slippage,
			destination: receiverAddress,
			chainId: chainId!,
			options: options
				? { ...options, excludeProtocols: options.excludeProtocols as any }
				: undefined,
		};

		// Build swap transaction
		const { calldata } = await fibrousRouter.buildRouteAndCalldata(params);

		// Get gas price with multiplier from server config
		const serverConfig = getServerConfig();
		const gasPrice = await publicClient.getGasPrice();

		// Calculate gas price with multiplier using bigint
		const multiplierBI = BigInt(Math.round(serverConfig.gasPriceMultiplier * 100));
		const finalGasPrice = (gasPrice * multiplierBI) / 100n;

		// Execute swap
		const hash = await walletClient.sendTransaction({
			to: routerAddress,
			data: calldata as any as Hex,
			gasPrice: finalGasPrice,
			// value: ... (if native) - TODO: Handle native token wrapping if needed, assume mapped handling by router-sdk
		});

		// Wait for confirmation
		const receipt = await publicClient.waitForTransactionReceipt({ hash });

		const explorerUrl = getEvmExplorerUrl(hash, chainName as SupportedChain);

		return {
			success: true,
			transactionHash: hash,
			explorerUrl,
			gasUsed: receipt.gasUsed.toString(),
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "EVM swap failed";
		console.error(`EVM Swap Error: ${errorMessage}`);
		return {
			success: false,
			error: errorMessage,
		};
	}
}

// --- Helper Functions ---

async function getWalletAddress(
	chainConfig: ChainConfig,
	chainName: SupportedChain
): Promise<string> {
	if (chainName === "starknet") {
		if (!chainConfig.publicKey) {
			throw new Error("Starknet public key is required");
		}
		return chainConfig.publicKey;
	} else {
		// Derive address from private key for EVM chains
		const account = privateKeyToAccount(chainConfig.privateKey as Hex);
		return account.address;
	}
}

function getEvmExplorerUrl(txHash: string, chainName: SupportedChain): string {
	return `${EXPLORER_URLS[chainName]}/${txHash}`;
}

async function approveTokenIfNeeded(
	publicClient: any,
	walletClient: any,
	tokenAddress: Hex,
	spender: Hex,
	amount: bigint,
	owner: Hex
) {
	// 0x0...0 is native token in some contexts, but usually handled by router-sdk.
	// If tokenAddress is native token address, we skip approval.
	// Fibrous SDK usually uses specific address for native.
	if (tokenAddress === "0x0000000000000000000000000000000000000000") {
		return;
	}

	const allowance = (await publicClient.readContract({
		address: tokenAddress,
		abi: erc20Abi,
		functionName: "allowance",
		args: [owner, spender],
	})) as bigint;

	if (allowance >= amount) {
		return;
	}

	const hash = await walletClient.writeContract({
		address: tokenAddress,
		abi: erc20Abi,
		functionName: "approve",
		args: [spender, amount],
	});

	await publicClient.waitForTransactionReceipt({ hash });
}

// --- Validation Helpers ---

export function validateSwapParams(params: SwapParams): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!params.amount || params.amount === "0") {
		errors.push("Amount must be greater than 0");
	}

	if (!params.tokenInAddress) {
		errors.push("Token in address is required");
	}

	if (!params.tokenOutAddress) {
		errors.push("Token out address is required");
	}

	if (params.tokenInAddress === params.tokenOutAddress) {
		errors.push("Token in and token out addresses must be different");
	}

	if (params.slippage !== undefined && (params.slippage < 0.01 || params.slippage > 50)) {
		errors.push("Slippage must be between 0.01% and 50%");
	}

	if (params.amount) {
		try {
			toBigInt(params.amount);
		} catch {
			errors.push("Invalid amount format");
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Estimate gas cost for a token swap
 * @param params - Swap parameters
 * @param chainConfig - Chain configuration
 * @param fibrousRouter - Fibrous router instance
 * @returns Gas estimation details
 */
export async function estimateSwapGas(
	params: SwapParams,
	chainConfig: ChainConfig,
	fibrousRouter: FibrousRouter
): Promise<GasEstimate> {
	const { amount, tokenInAddress, tokenOutAddress, slippage = 1, chainName } = params;
	const amountBI = toBigInt(amount);

	try {
		const receiverAddress = await getWalletAddress(chainConfig, chainName);

		console.error(`[INFO] Estimating gas for ${chainName} swap...`);

		// Resolve chainId
		const supportedChains = fibrousRouter.supportedChains;
		const chainData = supportedChains.find((c) => c.chain_name === chainName);
		const chainId = chainData?.chain_id;

		const buildParams: buildRouteAndCalldataParams = {
			inputAmount: amountBI,
			tokenInAddress,
			tokenOutAddress,
			slippage,
			destination: receiverAddress,
			chainId: chainId!,
			options: params.options
				? {
						...params.options,
						excludeProtocols: params.options.excludeProtocols
							? mapProtocolIds(params.options.excludeProtocols)
							: undefined,
					}
				: undefined,
		};

		if (chainName === "starknet") {
			// Starknet gas estimation
			if (!chainConfig.publicKey) {
				throw new Error("Starknet public key is required");
			}

			const provider = new RpcProvider({ nodeUrl: chainConfig.rpcUrl });
			const account = new StarknetAccount(
				provider,
				chainConfig.publicKey,
				chainConfig.privateKey
			);

			const approveCallRaw = await fibrousRouter.buildApproveStarknet(
				amountBI,
				tokenInAddress
			);
			// Normalize generic call object to Starknet Call type (handling SDK versions)
			const approveCall: Call = {
				contractAddress: approveCallRaw.contractAddress,
				entrypoint: approveCallRaw.entrypoint,
				calldata: approveCallRaw.calldata,
			};

			const { calldata } = await fibrousRouter.buildRouteAndCalldata(buildParams);
			const routerAddress = supportedChains.find(
				(c) => c.chain_name === "starknet"
			)?.router_address;

			const swapCall: Call = {
				contractAddress: routerAddress!,
				entrypoint: "swap",
				calldata: calldata as any,
			};

			const estimate = await account.estimateFee([approveCall, swapCall]);

			console.error(
				`[INFO] Starknet gas estimate - Consumed: ${estimate.gas_consumed}, Fee: ${estimate.overall_fee}`
			);

			return {
				gasEstimate: estimate.gas_consumed?.toString() ?? "0",
				gasPrice: estimate.gas_price?.toString() ?? "0",
				estimatedCost: estimate.overall_fee?.toString() ?? "0",
			};
		} else {
			// EVM gas estimation
			const chain = getViemChain(chainName);
			const publicClient = createPublicClient({
				chain,
				transport: http(chainConfig.rpcUrl),
			});
			const account = privateKeyToAccount(chainConfig.privateKey as Hex);

			const { calldata } = await fibrousRouter.buildRouteAndCalldata(buildParams);
			const routerAddress = chainData?.router_address as Hex;

			// Estimate gas
			const gasEstimateBI = await publicClient.estimateGas({
				account,
				to: routerAddress,
				data: calldata as any as Hex,
			});

			const gasPrice = await publicClient.getGasPrice();
			const serverConfig = getServerConfig();

			const multiplier = BigInt(Math.round(serverConfig.gasPriceMultiplier * 100));
			const finalGasPrice = (gasPrice * multiplier) / 100n;
			const estimatedCost = gasEstimateBI * finalGasPrice;

			console.error(
				`[INFO] EVM gas estimate - Gas: ${gasEstimateBI}, Price: ${finalGasPrice}, Cost: ${estimatedCost}`
			);

			return {
				gasEstimate: gasEstimateBI.toString(),
				gasPrice: finalGasPrice.toString(),
				estimatedCost: estimatedCost.toString(),
			};
		}
	} catch (error) {
		console.error(`[WARN] Gas estimation failed for ${chainName}:`, error);

		// Return fallback estimates
		const fallback = chainName === "starknet" ? GAS_FALLBACKS.STARKNET : GAS_FALLBACKS.EVM;
		const fallbackCostBI = BigInt(fallback.GAS_ESTIMATE) * BigInt(fallback.GAS_PRICE);

		return {
			gasEstimate: fallback.GAS_ESTIMATE,
			gasPrice: fallback.GAS_PRICE,
			estimatedCost: fallbackCostBI.toString(),
		};
	}
}

import type { SupportedChain } from "./validation.js";

export interface ChainConfig {
	rpcUrl: string;
	privateKey: string;
	publicKey?: string; // Only for Starknet
}

export interface WalletConfig {
	base: ChainConfig;
	scroll: ChainConfig;
	starknet: ChainConfig;
}

export interface ServerConfig {
	defaultSlippage: number;
	gasPriceMultiplier: number;
	transactionTimeout: number;
	fibrousApiKey?: string;
}

// --- Security Constants ---

const PLACEHOLDER_VALUES = ["0x...", "YOUR_PRIVATE_KEY", "YOUR_PUBLIC_KEY", ""];
const MIN_PRIVATE_KEY_LENGTH = 32;
const MAX_TIMEOUT = 3600; // 1 hour max
const MIN_TIMEOUT = 30; // 30 seconds min
const MAX_GAS_MULTIPLIER = 5.0; // 5x max
const MIN_GAS_MULTIPLIER = 1.0; // 1x min
const MAX_SLIPPAGE = 50; // 50% max
const MIN_SLIPPAGE = 0.01; // 0.01% min

// --- Environment Variable Helpers ---

function getEnvVar(key: string, required = true): string {
	const value = process.env[key];
	if (required && !value) {
		throw new Error(`Environment variable ${key} is required but not set`);
	}
	return value || "";
}

function getEnvNumber(key: string, defaultValue: number, min?: number, max?: number): number {
	const value = process.env[key];
	if (!value) return defaultValue;

	const num = parseFloat(value);
	if (isNaN(num)) {
		throw new Error(`Environment variable ${key} must be a valid number, got: ${value}`);
	}

	if (min !== undefined && num < min) {
		throw new Error(`Environment variable ${key} must be >= ${min}, got: ${num}`);
	}

	if (max !== undefined && num > max) {
		throw new Error(`Environment variable ${key} must be <= ${max}, got: ${num}`);
	}

	return num;
}

/**
 * Validate private key format and security
 */
function validatePrivateKey(privateKey: string, chainName: string): string[] {
	const errors: string[] = [];

	if (!privateKey) {
		errors.push(`Private key is required for ${chainName}`);
		return errors;
	}

	if (PLACEHOLDER_VALUES.includes(privateKey)) {
		errors.push(`Private key for ${chainName} appears to be placeholder value`);
		return errors;
	}

	if (privateKey.length < MIN_PRIVATE_KEY_LENGTH) {
		errors.push(
			`Private key for ${chainName} is too short (minimum ${MIN_PRIVATE_KEY_LENGTH} characters)`
		);
	}

	// Basic hex validation for private keys starting with 0x
	if (privateKey.startsWith("0x") && !/^0x[a-fA-F0-9]+$/.test(privateKey)) {
		errors.push(`Private key for ${chainName} contains invalid hex characters`);
	}

	return errors;
}

/**
 * Validate RPC URL format
 */
function validateRpcUrl(rpcUrl: string, chainName: string): string[] {
	const errors: string[] = [];

	if (!rpcUrl) {
		errors.push(`RPC URL is required for ${chainName}`);
		return errors;
	}

	try {
		const url = new URL(rpcUrl);
		if (!["http:", "https:"].includes(url.protocol)) {
			errors.push(`RPC URL for ${chainName} must use HTTP or HTTPS protocol`);
		}
	} catch {
		errors.push(`RPC URL for ${chainName} is not a valid URL`);
	}

	return errors;
}

// --- Configuration Builders ---

function buildChainConfig(chainName: string): ChainConfig {
	const chainUpper = chainName.toUpperCase();

	if (chainName === "starknet") {
		return {
			rpcUrl: getEnvVar(`${chainUpper}_RPC_URL`),
			privateKey: getEnvVar(`${chainUpper}_PRIVATE_KEY`),
			publicKey: getEnvVar(`${chainUpper}_PUBLIC_KEY`),
		};
	}

	return {
		rpcUrl: getEnvVar(`${chainUpper}_RPC_URL`),
		privateKey: getEnvVar(`${chainUpper}_PRIVATE_KEY`),
	};
}

export function getWalletConfig(): WalletConfig {
	return {
		base: buildChainConfig("base"),
		scroll: buildChainConfig("scroll"),
		starknet: buildChainConfig("starknet"),
	};
}

export function getServerConfig(): ServerConfig {
	return {
		defaultSlippage: getEnvNumber("DEFAULT_SLIPPAGE", 1.0, MIN_SLIPPAGE, MAX_SLIPPAGE),
		gasPriceMultiplier: getEnvNumber(
			"GAS_PRICE_MULTIPLIER",
			1.2,
			MIN_GAS_MULTIPLIER,
			MAX_GAS_MULTIPLIER
		),
		transactionTimeout: getEnvNumber("TRANSACTION_TIMEOUT", 300, MIN_TIMEOUT, MAX_TIMEOUT),
		fibrousApiKey: getEnvVar("FIBROUS_API_KEY", false),
	};
}

// --- Configuration Access ---

export function getChainConfig(chainName: SupportedChain): ChainConfig {
	const walletConfig = getWalletConfig();
	return walletConfig[chainName];
}

export function validateChainConfig(chainName: SupportedChain): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	try {
		const chainConfig = getChainConfig(chainName);

		// Validate RPC URL
		errors.push(...validateRpcUrl(chainConfig.rpcUrl, chainName));

		// Validate private key
		errors.push(...validatePrivateKey(chainConfig.privateKey, chainName));

		// Starknet-specific validation
		if (chainName === "starknet") {
			if (!chainConfig.publicKey) {
				errors.push(`Missing public key for Starknet`);
			} else if (PLACEHOLDER_VALUES.includes(chainConfig.publicKey)) {
				errors.push(`Public key for Starknet appears to be placeholder value`);
			}
		}
	} catch (error) {
		errors.push(error instanceof Error ? error.message : "Unknown configuration error");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

export function validateWalletConfig(): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	try {
		const config = getWalletConfig();
		const chains: SupportedChain[] = ["base", "scroll", "starknet"];

		for (const chain of chains) {
			const chainConfig = config[chain];

			if (!chainConfig.rpcUrl) {
				errors.push(`Missing RPC URL for ${chain}`);
			}

			if (!chainConfig.privateKey) {
				errors.push(`Missing private key for ${chain}`);
			}

			// Check for placeholder values
			if (chainConfig.privateKey === "0x..." || chainConfig.privateKey.length < 32) {
				errors.push(`Invalid private key for ${chain} (appears to be placeholder)`);
			}

			if (chain === "starknet") {
				if (!chainConfig.publicKey) {
					errors.push(`Missing public key for Starknet`);
				}
				if (
					chainConfig.publicKey === "0x..." ||
					(chainConfig.publicKey && chainConfig.publicKey.length < 32)
				) {
					errors.push(`Invalid public key for Starknet (appears to be placeholder)`);
				}
			}
		}
	} catch (error) {
		errors.push(error instanceof Error ? error.message : "Unknown configuration error");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

export function getValidChains(): SupportedChain[] {
	const validChains: SupportedChain[] = [];
	const chains: SupportedChain[] = ["base", "scroll", "starknet"];

	for (const chain of chains) {
		const validation = validateChainConfig(chain);
		if (validation.isValid) {
			validChains.push(chain);
		}
	}

	return validChains;
}

// --- Security Helpers ---

export function maskPrivateKey(privateKey: string): string {
	if (privateKey.length <= 8) return "****";
	return privateKey.slice(0, 4) + "****" + privateKey.slice(-4);
}

export function logConfigStatus(): void {
	const serverConfig = getServerConfig();
	const validChains = getValidChains();
	const chains: SupportedChain[] = ["base", "scroll", "starknet"];

	console.error("[INFO] Configuration Status:");
	console.error(`  - Default Slippage: ${serverConfig.defaultSlippage}%`);
	console.error(`  - Gas Price Multiplier: ${serverConfig.gasPriceMultiplier}x`);
	console.error(`  - Transaction Timeout: ${serverConfig.transactionTimeout}s`);
	console.error(`  - API Key: ${serverConfig.fibrousApiKey ? "Set" : "Not set"}`);

	console.error("[INFO] Chain Configurations:");
	for (const chain of chains) {
		const validation = validateChainConfig(chain);
		if (validation.isValid) {
			console.error(`    [+] ${chain}: Valid`);
		} else {
			console.error(`    [-] ${chain}: Invalid`);
			validation.errors.forEach((error) => console.error(`      - ${error}`));
		}
	}

	if (validChains.length > 0) {
		console.error(`[INFO] Available for swaps: ${validChains.join(", ")}`);
	} else {
		console.error("[WARN] No chains available for swaps (all configurations invalid)");
	}
}

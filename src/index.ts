#!/usr/bin/env node

import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./server.js";

// --- Configuration ---

console.error("[INFO] Environment configuration loaded");

// --- Server Initialization ---

export async function startServer(): Promise<void> {
	try {
		console.error("[INFO] Starting Fibrous MCP Server...");

		const transport = new StdioServerTransport();
		await server.connect(transport);

		console.error("[SUCCESS] Fibrous MCP Server started successfully");
	} catch (error) {
		console.error("[ERROR] Failed to start Fibrous MCP Server:", error);
		process.exit(1);
	}
}

// --- Process Management ---

export async function gracefulShutdown(signal: string): Promise<void> {
	console.error(`\n[INFO] Received ${signal}, initiating graceful shutdown...`);

	try {
		console.error("[INFO] Fibrous MCP Server shutdown complete");
		process.exit(0);
	} catch (error) {
		console.error("[ERROR] Error during shutdown:", error);
		process.exit(1);
	}
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("uncaughtException", (error) => {
	console.error("[CRITICAL] Uncaught Exception:", error);
	process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
	console.error("[CRITICAL] Unhandled Promise Rejection at:", promise);
	process.exit(1);
});

// --- Start Server ---

startServer().catch((error) => {
	console.error("[CRITICAL] Fatal error during server startup:", error);
	process.exit(1);
});

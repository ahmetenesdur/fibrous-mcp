/**
 * Fibrous MCP Server - Startup script
 * This file is responsible for starting the server.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server, SERVER_CONFIG } from "./server.js";

// =============================================================================
// SERVER STARTUP
// =============================================================================

async function startServer(): Promise<void> {
	try {
		console.log(`Starting ${SERVER_CONFIG.name} v${SERVER_CONFIG.version}...`);
		console.log("📡 Initializing transport...");
		const transport = new StdioServerTransport();

		console.log("🔗 Connecting server...");
		await server.connect(transport);

		console.log(`${SERVER_CONFIG.name} v${SERVER_CONFIG.version} started`);
		console.log(`Supported chains: ${SERVER_CONFIG.supportedChains.join(", ")}`);
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

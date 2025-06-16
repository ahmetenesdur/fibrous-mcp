/**
 * Fibrous MCP Server - Startup script
 * This file is responsible for starting the server.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server, SERVER_CONFIG } from "./server.js";

// =============================================================================
// SERVER STARTUP
// =============================================================================

let transport: StdioServerTransport | null = null;

async function startServer(): Promise<void> {
	try {
		console.log(`Starting ${SERVER_CONFIG.name} v${SERVER_CONFIG.version}...`);
		console.log("📡 Initializing transport...");
		transport = new StdioServerTransport();

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
	const shutdown = async (signal: string) => {
		console.log(`\nReceived ${signal}, shutting down...`);
		try {
			if (transport) {
				await transport.close();
			}
		} catch (error) {
			console.error("Error during cleanup:", error);
		}
		process.exit(0);
	};

	process.on("SIGINT", () => shutdown("SIGINT"));
	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("uncaughtException", async (error) => {
		console.error("Uncaught Exception:", error);
		try {
			if (transport) {
				await transport.close();
			}
		} catch (cleanupError) {
			console.error("Error during cleanup:", cleanupError);
		}
		process.exit(1);
	});
	process.on("unhandledRejection", async (reason) => {
		console.error("Unhandled Rejection:", reason);
		try {
			if (transport) {
				await transport.close();
			}
		} catch (cleanupError) {
			console.error("Error during cleanup:", cleanupError);
		}
		process.exit(1);
	});
}

setupGracefulShutdown();
startServer();

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

/**
 * Fibrous MCP Server
 * This server contains example tools, resources and prompts
 */

// Initialize MCP Server
const server = new McpServer({
	name: "fibrous-mcp",
	version: "1.0.0",
});

console.log("🚀 Starting Fibrous MCP Server...");

// ===== TOOLS =====

// Simple calculation tool
server.tool(
	"add",
	{
		a: z.number().describe("First number"),
		b: z.number().describe("Second number"),
	},
	async ({ a, b }) => ({
		content: [
			{
				type: "text",
				text: `Result: ${a} + ${b} = ${a + b}`,
			},
		],
	})
);

// Multiplication tool
server.tool(
	"multiply",
	{
		a: z.number().describe("First number"),
		b: z.number().describe("Second number"),
	},
	async ({ a, b }) => ({
		content: [
			{
				type: "text",
				text: `Result: ${a} × ${b} = ${a * b}`,
			},
		],
	})
);

// Advanced mathematical calculation tool
server.tool(
	"calculate",
	{
		expression: z.string().describe("Mathematical expression to calculate (e.g., '2+3*4')"),
	},
	async ({ expression }) => {
		try {
			// Basic security check - only allow numbers and basic operators
			if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
				throw new Error("Invalid characters detected");
			}

			const result = eval(expression);
			return {
				content: [
					{
						type: "text",
						text: `${expression} = ${result}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
					},
				],
				isError: true,
			};
		}
	}
);

// Time tool
server.tool("get-time", {}, async () => {
	const now = new Date();
	return {
		content: [
			{
				type: "text",
				text: `Current time: ${now.toLocaleString("en-US")}`,
			},
		],
	};
});

// ===== RESOURCES =====

// Static configuration resource
server.resource("config", "config://fibrous", async (uri) => ({
	contents: [
		{
			uri: uri.href,
			text: JSON.stringify(
				{
					serverName: "Fibrous MCP",
					version: "1.0.0",
					description: "Example MCP server application",
					supportedOperations: ["mathematics", "time", "configuration"],
				},
				null,
				2
			),
		},
	],
}));

// Dynamic greeting resource
server.resource(
	"greeting",
	new ResourceTemplate("greeting://{name}", { list: undefined }),
	async (uri, { name }) => ({
		contents: [
			{
				uri: uri.href,
				text: `Hello ${name}! Welcome to Fibrous MCP Server.

This server has the following capabilities:
- Mathematical calculations
- Time information
- Dynamic resources
- Code review prompts

How can I help you today?`,
			},
		],
	})
);

// User profile resource
server.resource(
	"user-info",
	new ResourceTemplate("user://{userId}/info", { list: undefined }),
	async (uri, { userId }) => ({
		contents: [
			{
				uri: uri.href,
				text: JSON.stringify(
					{
						userId,
						lastAccess: new Date().toISOString(),
						serverVersion: "1.0.0",
						availableTools: ["add", "multiply", "calculate", "get-time"],
					},
					null,
					2
				),
			},
		],
	})
);

// ===== PROMPTS =====

// Code review prompt
server.prompt(
	"review-code",
	{
		code: z.string().describe("Code to review"),
		language: z.string().optional().describe("Programming language (optional)"),
	},
	({ code, language }) => ({
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: `Please review this ${language || "code"} snippet:

\`\`\`${language || ""}
${code}
\`\`\`

Focus on the following aspects:
- Code quality and readability
- Potential bugs
- Performance improvements
- Best practice recommendations
- Security review

Provide a detailed analysis.`,
				},
			},
		],
	})
);

// Math problem solving prompt
server.prompt(
	"solve-math",
	{
		problem: z.string().describe("Math problem to solve"),
	},
	({ problem }) => ({
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: `Solve this math problem step by step:

${problem}

Please:
1. Analyze the problem
2. Explain the solution steps
3. Detail each step
4. Provide the final answer

Explain in detail.`,
				},
			},
		],
	})
);

// General help prompt
server.prompt("help", {}, () => ({
	messages: [
		{
			role: "user",
			content: {
				type: "text",
				text: `Provide information about Fibrous MCP Server. This server has the following features:

TOOLS:
- add: Adds two numbers
- multiply: Multiplies two numbers
- calculate: Calculates mathematical expressions
- get-time: Returns current time

RESOURCES:
- config://fibrous: Server configuration
- greeting://{name}: Personalized greeting
- user://{userId}/info: User information

PROMPTS:
- review-code: Code review
- solve-math: Math problem solving
- help: Help information

Explain how I can use this server.`,
			},
		},
	],
}));

// Start the server
async function startServer() {
	try {
		console.log("📡 Setting up transport connection...");
		const transport = new StdioServerTransport();

		console.log("🔗 Connecting server...");
		await server.connect(transport);

		console.log("✅ Fibrous MCP Server started successfully!");
		console.log("📋 Available tools: add, multiply, calculate, get-time");
		console.log("📂 Available resources: config, greeting, user-info");
		console.log("💬 Available prompts: review-code, solve-math, help");
	} catch (error) {
		console.error("❌ Server startup error:", error);
		process.exit(1);
	}
}

// Start the server
startServer();

# 🚀 Fibrous MCP Server

**Model Context Protocol (MCP) Server** - A comprehensive TypeScript implementation of an MCP server with tools, resources, and prompts.

## 📋 Features

This MCP server provides the following capabilities:

### 🛠️ Tools

- **add**: Adds two numbers together
- **multiply**: Multiplies two numbers
- **calculate**: Evaluates mathematical expressions safely
- **get-time**: Returns the current time in English format

### 📂 Resources

- **config://fibrous**: Server configuration information
- **greeting://{name}**: Personalized greeting messages
- **user://{userId}/info**: User information and access details

### 💬 Prompts

- **review-code**: Code review and analysis prompts
- **solve-math**: Math problem solving prompts
- **help**: General help and usage guide

## 🛠️ Installation

### Prerequisites

- Node.js ≥ 18.0.0
- pnpm package manager

### Steps

1. **Navigate to project directory:**

    ```bash
    cd fibrous-mcp
    ```

2. **Install dependencies:**

    ```bash
    pnpm install
    ```

3. **Build the project:**
    ```bash
    pnpm build
    ```

## 🚀 Usage

### Development Mode

```bash
pnpm dev
```

### Production Mode

```bash
pnpm start
```

### MCP Client Connection

You can use your MCP server with any MCP client (Claude Desktop, etc.):

```json
{
	"mcpServers": {
		"fibrous-mcp": {
			"command": "node",
			"args": ["build/index.js"],
			"cwd": "/path/to/fibrous-mcp"
		}
	}
}
```

## 📡 API Usage

### Tool Examples

**Addition:**

```json
{
	"name": "add",
	"arguments": {
		"a": 5,
		"b": 3
	}
}
```

**Calculation:**

```json
{
	"name": "calculate",
	"arguments": {
		"expression": "2 + 3 * 4"
	}
}
```

**Time:**

```json
{
	"name": "get-time",
	"arguments": {}
}
```

### Resource Examples

**Configuration:**

```
config://fibrous
```

**Greeting:**

```
greeting://John
```

**User Information:**

```
user://123/info
```

### Prompt Examples

**Code Review:**

```json
{
	"name": "review-code",
	"arguments": {
		"code": "function hello() { console.log('Hello'); }",
		"language": "javascript"
	}
}
```

**Math Problem:**

```json
{
	"name": "solve-math",
	"arguments": {
		"problem": "Solve the equation x^2 + 5x + 6 = 0"
	}
}
```

## 🏗️ Project Structure

```
fibrous-mcp/
├── src/
│   └── index.ts          # Main MCP server code
├── build/                # Compiled JavaScript files
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint v9 flat config
├── .prettierrc.json      # Prettier formatting settings
├── .prettierignore       # Prettier ignore rules
└── README.md             # This file
```

## 🔧 Development

### Adding New Tools

```typescript
server.tool(
	"new-tool",
	{
		parameter: z.string().describe("Parameter description"),
	},
	async ({ parameter }) => ({
		content: [
			{
				type: "text",
				text: `Result: ${parameter}`,
			},
		],
	})
);
```

### Adding New Resources

```typescript
server.resource(
	"resource-name",
	new ResourceTemplate("resource://{param}", { list: undefined }),
	async (uri, { param }) => ({
		contents: [
			{
				uri: uri.href,
				text: `Resource content for ${param}`,
			},
		],
	})
);
```

### Adding New Prompts

```typescript
server.prompt(
	"prompt-name",
	{
		input: z.string().describe("Input description"),
	},
	({ input }) => ({
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: `Process this input: ${input}`,
				},
			},
		],
	})
);
```

## 🧪 Testing

```bash
pnpm test
```

## 📝 Code Quality

### Linting

```bash
pnpm lint
pnpm lint:fix
```

### Formatting

```bash
pnpm format
pnpm format:check
```

### Combined

```bash
pnpm format:lint
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) by Anthropic
- [TypeScript](https://www.typescriptlang.org/) for type safety
- [Zod](https://github.com/colinhacks/zod) for schema validation

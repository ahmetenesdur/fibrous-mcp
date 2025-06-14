# Fibrous MCP Server

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Fibrous SDK](https://img.shields.io/badge/Fibrous%20SDK-v0.5.1-purple.svg)](https://docs.fibrous.finance/)

> Model Context Protocol server integrating Fibrous Finance DeFi aggregation.

## Overview

Fibrous MCP Server provides access to Fibrous Finance's DeFi aggregation technology through the **Model Context Protocol (MCP)**. Enables optimal token swaps across Base, Starknet, and Scroll networks.

## Features

### 🛠️ MCP Tools (6 Available)

- **`get-supported-tokens`** - Retrieve available tokens for any supported chain
- **`get-supported-protocols`** - List all available DEX protocols
- **`get-best-route`** - Find optimal swap routes
- **`build-transaction`** - Generate transaction data
- **`format-token-amount`** - Convert between wei and readable amounts
- **`get-token`** - Get token information by address

### 🌐 Supported Networks

- **Base** - Uniswap V3, Aerodrome, SwapBased
- **Starknet** - JediSwap, MySwap, 10kSwap, Ekubo
- **Scroll** - Uniswap V3, SyncSwap, iZiSwap

## Installation

```bash
# Install dependencies
pnpm install

# Build project
pnpm build

# Start server
pnpm start
```

## Development

```bash
# Development mode
pnpm dev

# Run tests
pnpm test

# Linting and formatting
pnpm format:lint
```

## MCP Client Configuration

### Claude Desktop

```json
{
	"mcpServers": {
		"fibrous-mcp": {
			"command": "node",
			"args": ["/path/to/fibrous-mcp/build/index.js"]
		}
	}
}
```

### Other MCP Clients

Compatible with any MCP client supporting stdio transport and MCP protocol version 2025-03-26.

## Usage Examples

### Get Supported Tokens

```json
{
	"name": "get-supported-tokens",
	"arguments": { "chainName": "base" }
}
```

### Find Best Route

```json
{
	"name": "get-best-route",
	"arguments": {
		"amount": "1000000000000000000",
		"tokenInAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
		"tokenOutAddress": "0x4200000000000000000000000000000000000006",
		"chainName": "base"
	}
}
```

### Build Transaction

```json
{
	"name": "build-transaction",
	"arguments": {
		"amount": "1000000000000000000",
		"tokenInAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
		"tokenOutAddress": "0x4200000000000000000000000000000000000006",
		"slippage": 1,
		"receiverAddress": "0xYourWalletAddress",
		"chainName": "base"
	}
}
```

## API Reference

- **Fibrous API**: `https://api.fibrous.finance`
- **Graph API**: `https://graph.fibrous.finance`
- **Rate Limit**: 200 requests/minute
- **Supported Chains**: `base`, `starknet`, `scroll`

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Make your changes with tests
4. Run tests (`pnpm test`)
5. Commit changes (`git commit -m 'Add feature'`)
6. Push to branch (`git push origin feature/name`)
7. Open Pull Request

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Links

- [Fibrous Finance](https://fibrous.finance/)
- [Documentation](https://docs.fibrous.finance/)
- [MCP Protocol](https://modelcontextprotocol.io/)

---

⚠️ **Disclaimer**: This software is for educational purposes. DeFi operations involve financial risk. Always verify transactions and understand the risks.

---

<div align="center">

**Built with ❤️ by the Fibrous Team**

[Website](https://fibrous.finance/) • [Documentation](https://docs.fibrous.finance/) • [Discord](https://discord.gg/fibrous) • [X](https://x.com/fibrousfinance)

</div>

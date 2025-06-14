# Fibrous MCP Server

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Fibrous SDK](https://img.shields.io/badge/Fibrous%20SDK-v0.5.1-purple.svg)](https://docs.fibrous.finance/)

> Model Context Protocol server integrating Fibrous Finance DeFi aggregation for cross-chain token swaps.

## Overview

Fibrous MCP Server provides access to Fibrous Finance's DeFi aggregation technology through the Model Context Protocol. Enables optimal token swaps across Base, Starknet, and Scroll networks.

## Features

### Tools

- `get-supported-tokens` - Retrieve available tokens for a chain
- `get-supported-protocols` - List available DEX protocols
- `get-best-route` - Find optimal swap routes
- `build-transaction` - Generate transaction data
- `format-token-amount` - Convert between raw/readable amounts
- `get-token` - Get token information by address

### Supported Networks

- **Base** - Ethereum L2 with low fees
- **Starknet** - ZK-rollup with Cairo VM
- **Scroll** - ZK-rollup with EVM compatibility

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

# Linting and formatting
pnpm format:lint

# Run tests
pnpm test
```

## MCP Client Configuration

Configure your MCP client (Claude Desktop, Cursor, etc.):

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

## Resources

- `fibrous://config` - Server configuration
- `chain://{chainName}/info` - Chain information
- `greeting://{name}` - Personalized greeting
- `user://{userId}/info` - User session info

## AI Prompts

- `analyze-swap` - Comprehensive swap analysis
- `defi-strategy` - Portfolio optimization
- `review-code` - Code security review
- `help` - Usage documentation

## API Reference

- **Base URL**: `https://api.fibrous.finance`
- **Graph API**: `https://graph.fibrous.finance`
- **Rate Limit**: 200 requests/minute
- **Supported Chains**: base, starknet, scroll

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/name`)
5. Open Pull Request

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Links

- [Fibrous Finance](https://fibrous.finance/)
- [Documentation](https://docs.fibrous.finance/)
- [MCP Protocol](https://modelcontextprotocol.io/)

---

## **Disclaimer**: This software is for educational purposes. DeFi operations involve financial risk. Always verify transactions and understand the risks.

---

<div align="center">

**Built with ❤️ by the Fibrous Team**

[Website](https://fibrous.finance/) • [Documentation](https://docs.fibrous.finance/) • [Discord](https://discord.gg/fibrous) • [X](https://x.com/fibrousfinance)

</div>

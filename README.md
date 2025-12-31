# Fibrous MCP Server

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Fibrous SDK](https://img.shields.io/badge/Fibrous%20SDK-v0.6.0-purple.svg)](https://docs.fibrous.finance/)
[![Test Coverage](https://img.shields.io/badge/Coverage-82.6%25-brightgreen.svg)](#testing)

MCP server providing AI agents with tools for multi-chain DeFi operations using the Fibrous SDK.

## Features

**10 Available Tools:**

- `get-supported-tokens` - List available tokens
- `get-supported-protocols` - List DEX protocols
- `get-best-route` - Find optimal swap routes
- `get-best-route-batch` - Find optimal routes for batch swaps (Starknet only)
- `build-transaction` - Generate transaction data
- `build-batch-transaction` - Generate batch transaction data (Starknet only)
- `format-token-amount` - Convert between human and wei formats
- `get-token` - Fetch token details by address
- `execute-swap` - Execute token swaps (requires wallet config)
- `estimate-swap` - Estimate gas costs (requires wallet config)

**Supported Networks:**

- **Base** - Uniswap V3, Aerodrome, SwapBased
- **Starknet** - JediSwap, MySwap, 10kSwap, Ekubo
- **Scroll** - Uniswap V3, SyncSwap, iZiSwap

## Quick Start

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your RPC URLs and private keys

# Build the project
pnpm build

# Start server
pnpm start
```

## Configuration

### Environment Variables

**Core Configuration:**

```bash
NODE_ENV=development
DEFAULT_SLIPPAGE=1.0
```

**Network Configuration:**

```bash
# Base Network
BASE_RPC_URL=https://mainnet.base.org
BASE_PRIVATE_KEY=0x...

# Starknet Network
STARKNET_RPC_URL=https://starknet-mainnet.public.blastapi.io
STARKNET_PRIVATE_KEY=0x...
STARKNET_PUBLIC_KEY=0x...

# Scroll Network
SCROLL_RPC_URL=https://rpc.scroll.io
SCROLL_PRIVATE_KEY=0x...
```

**Optional Settings:**

```bash
# Debug configuration
DEBUG=false
LOG_LEVEL=info
ENABLE_METRICS=false

# API optimization
FIBROUS_API_KEY=your_api_key_here
```

### MCP Client Setup

Add to your MCP client configuration:

```json
{
	"mcpServers": {
		"fibrous-mcp": {
			"command": "node",
			"args": ["/path/to/fibrous-mcp/build/src/index.js"]
		}
	}
}
```

## Development

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- TypeScript 5.0+

### Setup

```bash
# Clone repository
git clone <repository-url>
cd fibrous-mcp

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Watch mode with auto-reload
pnpm dev:watch
```

### Code Quality

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Code formatting
pnpm format
pnpm format:check
```

## Testing

Comprehensive test suite with **82.6% coverage** across all modules:

```bash
# Run all tests
pnpm test

# Watch mode for development
pnpm test:watch

# Coverage report
pnpm test:coverage

# CI mode
pnpm test:ci
```

**Test Results:**

- **167/167 tests passing**
- **10 test suites, ~3.1s execution**
- **Native BigInt with router-sdk v0.6.0**

### Test Coverage by Module

- **API endpoints**: 17 tests
- **Server configuration**: 14 tests
- **Tool handlers**: 14 tests
- **Utilities**: 122 tests (BigInt operations, configuration, responses, swap logic, validation)

### Coverage Details

- **Statements**: 82.56%
- **Branches**: 73.46%
- **Functions**: 75.71%
- **Lines**: 83.18%

## Technical Details

### Native BigInt Integration

- **Router SDK v0.6.0**: Latest Fibrous SDK compatibility
- **50KB smaller bundle**: Removed BigNumber.js dependency
- **Faster calculations**: Native JavaScript `bigint` operations
- **Modern standards**: ES2022+ features

```typescript
// Example: Native BigInt usage
const amount = BigInt("1000000000000000000"); // 1 ETH
const route = await router.getBestRoute(amount, tokenIn, tokenOut, "base");
```

### Architecture

- **MCP Protocol**: Model Context Protocol compliance
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error management
- **Security**: Environment variable validation and masking

## Production Deployment

### Environment Setup

```bash
# Production build
pnpm build:clean

# Production start
NODE_ENV=production pnpm start:prod
```

### Security Considerations

- Store private keys securely (use secrets management)
- Configure appropriate RPC endpoints
- Set up monitoring and logging
- Use HTTPS for all external connections

### Performance

- **Native BigInt**: 2-3x faster than BigNumber.js
- **Bundle Size**: 50KB reduction vs v0.5.x
- **Memory Usage**: Optimized for long-running processes
- **Rate Limiting**: 200 req/min (configurable)

## Resources

- [Fibrous Finance](https://fibrous.finance/) - Main website
- [Documentation](https://docs.fibrous.finance/) - API docs
- [MCP Protocol](https://modelcontextprotocol.io/) - MCP specifications
- [Router SDK v0.6.0](./router-sdk/README.md) - Local SDK documentation

**API Endpoints:**

- https://api.fibrous.finance (200 req/min)
- https://graph.fibrous.finance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `pnpm test`
6. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Maintain test coverage above 75%
- Use conventional commit messages
- Update documentation for new features

## License

MIT - see [LICENSE](./LICENSE)

---

**Risk Warning**: DeFi operations involve financial risk. Always verify transactions and use testnet for development.

**Status**: Production ready with comprehensive test coverage and native BigInt support.

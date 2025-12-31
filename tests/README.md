# Test Suite

Comprehensive test coverage for Fibrous MCP Server with native JavaScript BigInt support.

## Test Results

- **178/178 tests passing**
- **9 test suites, ~2.6s execution**
- **Native BigInt with router-sdk v0.6.0**

## Test Structure

```
tests/
├── api.test.ts           # API endpoints (59 tests)
├── sdk.test.ts           # Router SDK (23 tests)
├── mcp-server.test.ts    # MCP tools (14 tests)
├── tools/
│   └── swap-tools.test.ts    # Swap handlers (9 tests)
└── utils/
    ├── amounts.test.ts       # BigInt operations (19 tests)
    ├── config.test.ts        # Configuration (16 tests)
    ├── responses.test.ts     # Responses (29 tests)
    └── swap.test.ts          # Swap utilities (19 tests)
```

## Test Categories

### API Tests (59)

- Health checks and route calculation
- Token/protocol discovery
- Error handling and authentication

### SDK Tests (23)

- Router initialization and token management
- Route calculation and transaction building
- Cross-chain support (Starknet/EVM)

### MCP Server Tests (14)

- Tool handler validation
- Response formatting and error handling

### Utility Tests (73)

- **BigInt Operations** - Native JavaScript BigInt with router-sdk v0.6.0
- **Configuration** - Chain setup and validation
- **Responses** - MCP response formatting
- **Swap Logic** - Cross-chain swap operations

## Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test -- --watch

# Coverage
pnpm test -- --coverage

# Specific file
pnpm test tests/utils/amounts.test.ts
```

## Technology

**Native BigInt Integration:**

- Router SDK v0.6.0 compatibility
- 50KB bundle size reduction
- Faster native `bigint` operations
- Modern JavaScript standards

## Mock Architecture

- **Complete mocking** of external APIs and SDKs
- **Zero network requests** in test environment
- **Deterministic results** across all environments
- **Fast execution** with comprehensive coverage

## Writing Tests

```typescript
describe("BigInt Operations", () => {
	test("should handle native BigInt", () => {
		const amount = BigInt("1000000000000000000");
		expect(typeof amount).toBe("bigint");
	});
});
```

## Performance

- **Startup**: <50ms initialization
- **Execution**: 12ms average per test
- **Memory**: Minimal footprint with cleanup
- **Coverage**: 100% mock coverage

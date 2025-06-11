// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default tseslint.config(
	// Global ignore patterns
	{
		ignores: ["build/**", "dist/**", "node_modules/**", "*.js", "*.mjs"],
	},

	// Base ESLint recommended rules
	eslint.configs.recommended,

	// TypeScript ESLint recommended rules
	...tseslint.configs.recommended,

	// TypeScript ESLint stylistic rules
	...tseslint.configs.stylistic,

	// Main configuration for TypeScript files
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.node,
				...globals.es2022,
			},
			parser: tseslint.parser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			"@typescript-eslint": tseslint.plugin,
		},
		rules: {
			// ESLint rules
			"prefer-const": "error",
			"no-var": "error",
			"no-console": "warn",
			eqeqeq: ["error", "always"],

			// TypeScript ESLint rules
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-inferrable-types": "error",
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{
					prefer: "type-imports",
					fixStyle: "separate-type-imports",
				},
			],

			// Stylistic rules
			"@typescript-eslint/prefer-nullish-coalescing": [
				"warn",
				{
					ignoreConditionalTests: true,
					ignoreMixedLogicalExpressions: true,
					ignorePrimitives: {
						string: true,
					},
				},
			],
			"@typescript-eslint/prefer-optional-chain": "error",
		},
	},

	// Configuration for JavaScript files (if any)
	{
		files: ["**/*.js", "**/*.mjs"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.node,
			},
		},
		rules: {
			"prefer-const": "error",
			"no-var": "error",
			"no-console": "warn",
		},
	},

	// Configuration for test files
	{
		files: ["**/*.test.ts", "**/*.spec.ts", "**/__tests__/**/*.ts"],
		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"no-console": "off",
		},
	},

	// Prettier configuration - MUST be last to override other configs
	prettier
);

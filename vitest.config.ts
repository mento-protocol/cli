import type { ViteUserConfig } from 'vitest/config' with { 'resolution-mode': 'import' };

// This package is CommonJS ("type": "commonjs", module Node16), so a value
// import of `defineConfig` from the ESM-only `vitest/config` would not
// typecheck. A type-only import with an explicit resolution-mode gives the
// same checking without the require() call. Vite loads this file with its own
// bundler, which is happy either way.
const config: ViteUserConfig = {
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    server: {
      deps: {
        // The SDK's ESM build uses extensionless internal imports that Node
        // cannot resolve. The CLI itself loads the CommonJS build at runtime;
        // inlining lets Vite transform the package instead of failing on it.
        inline: ['@mento-protocol/mento-sdk'],
      },
    },
  },
};

export default config;

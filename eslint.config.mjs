import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore public assets (service workers, workbox)
    "public/*.js",
    // Ignore CommonJS utility scripts
    "*.cjs",
    // Ignore database fix scripts
    "fix-*.js",
    "inspect-*.js",
    // Ignore Capacitor config (uses Capacitor types)
    "capacitor.config.ts",
  ]),
]);

export default eslintConfig;

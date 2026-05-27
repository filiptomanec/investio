const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Workspace root — two levels up from apps/mobile/
const workspaceRoot = path.resolve(__dirname, "../..");
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Watch workspace packages so Metro picks up changes in @investio/* packages
config.watchFolders = [workspaceRoot];

// Resolve modules from workspace root first (hoisted deps), then project root.
// With node-linker=hoisted and pnpm.overrides pinning react to 19.0.0, there
// is only one copy of react in the workspace — no deduplication hacks needed.
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(projectRoot, "node_modules"),
];

// Enable symlinks for pnpm workspace packages
config.resolver.unstable_enableSymlinks = true;

// Ensure .cjs and .mjs are resolved for workspace packages
config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs", "cjs"];

module.exports = withNativeWind(config, { input: "./global.css" });

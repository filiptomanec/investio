// Metro config for Expo + pnpm monorepo
// @ts-check
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Critical for pnpm monorepo: watch monorepo root so Metro can resolve
// workspace packages like @investio/shared, @investio/auth, etc.
config.watchFolders = [monorepoRoot];

// nodeModulesPaths allows Metro to find hoisted deps in root node_modules
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(monorepoRoot, "node_modules"),
  ],
};

module.exports = config;

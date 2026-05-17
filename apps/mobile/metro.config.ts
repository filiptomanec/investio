import { getDefaultConfig } from "expo/metro-config";
import path from "path";

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

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

export default config;

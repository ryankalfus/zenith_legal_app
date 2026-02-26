const path = require("path");
const fs = require("fs");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

function resolvePackageDir(name) {
  const mobilePath = path.resolve(__dirname, "node_modules", name);
  if (fs.existsSync(mobilePath)) {
    return mobilePath;
  }

  return path.resolve(__dirname, "../../node_modules", name);
}

function resolveVirtualizedListsPath() {
  const rnNestedPath = path.resolve(
    resolvePackageDir("react-native"),
    "node_modules",
    "@react-native",
    "virtualized-lists"
  );
  if (fs.existsSync(rnNestedPath)) {
    return rnNestedPath;
  }

  return resolvePackageDir("@react-native/virtualized-lists");
}

// Force Metro to resolve React Native packages from the mobile workspace first.
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../../node_modules")
];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  react: resolvePackageDir("react"),
  "react-dom": resolvePackageDir("react-dom"),
  "react-native": resolvePackageDir("react-native"),
  "@react-native/virtualized-lists": resolveVirtualizedListsPath()
};
config.resolver.disableHierarchicalLookup = true;

module.exports = config;

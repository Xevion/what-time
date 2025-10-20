import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tanstackRouter from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";

// Extract version from Cargo.toml
function getVersion() {
  const filename = "Cargo.toml";
  const paths = [
    resolve(__dirname, filename),
    resolve(__dirname, "..", filename),
  ];

  for (const path of paths) {
    try {
      if (!existsSync(path)) {
        continue;
      }

      const cargoTomlContent = readFileSync(path, "utf8");
      const versionMatch = cargoTomlContent.match(/^version\s*=\s*"([^"]+)"/m);
      if (versionMatch) {
        return versionMatch[1];
      }
    } catch (error) {
      console.warn("Failed to read Cargo.toml at path: ", path, error);
    }
  }

  console.warn("Could not read version from Cargo.toml");
  return "unknown";
}

const version = getVersion();

export default defineConfig({
  plugins: [tanstackRouter({ autoCodeSplitting: true }), viteReact()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
});

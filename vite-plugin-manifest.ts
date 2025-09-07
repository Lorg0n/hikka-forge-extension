import path from "path";
import fs from "fs";
import type { Plugin, ResolvedConfig } from "vite";
import { generateManifest } from "./src/utils/manifest.config.ts";

type BrowserType = 'chrome' | 'firefox';

interface ManifestPluginOptions {
  browser: BrowserType;
}

export function manifestAndAssetPlugin(options: ManifestPluginOptions): Plugin {
  let config: ResolvedConfig;
  const { browser } = options;

  if (!browser || !['chrome', 'firefox'].includes(browser)) {
      console.error(`❌ [manifest-plugin] Invalid browser type specified for manifest plugin: ${browser}. Use 'chrome' or 'firefox'.`);
      process.exit(1);
  }

  return {
    name: "generate-manifest-and-copy-assets",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    writeBundle() {
      const finalOutDir = config.build.outDir;
      const rootDir = config.root;

      if (!finalOutDir) {
          console.error("❌ [manifest-plugin] Output directory (outDir) is not defined in Vite config.");
          process.exit(1);
      }

      const manifestContent = generateManifest(browser);
      const manifestJson = JSON.stringify(manifestContent, null, 2);
      const destManifest = path.resolve(finalOutDir, "manifest.json");

      try {
        fs.mkdirSync(path.dirname(destManifest), { recursive: true });
        fs.writeFileSync(destManifest, manifestJson);
        console.log(`✅ [manifest-plugin] Generated manifest.json for ${browser} -> ${path.relative(rootDir, destManifest)}`);
      } catch (error) {
        console.error(`❌ [manifest-plugin] Error generating manifest.json for ${browser}:`, error);
        process.exit(1);
      }

      const srcAssets = path.resolve(rootDir, "public/assets");
      const destAssets = path.resolve(finalOutDir, "assets");

      if (fs.existsSync(srcAssets)) {
        try {
          fs.mkdirSync(destAssets, { recursive: true });
          fs.cpSync(srcAssets, destAssets, { recursive: true });
          console.log(`📦 [manifest-plugin] Copied assets -> ${path.relative(rootDir, destAssets)}`);
        } catch (error) {
           console.error(`❌ [manifest-plugin] Error copying assets from ${srcAssets} to ${destAssets}:`, error);
        }
      } else {
        console.warn(`⚠️ [manifest-plugin] Assets directory not found, skipping copy: ${srcAssets}`);
      }
    },
  };
};
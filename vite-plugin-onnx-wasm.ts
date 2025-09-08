import path from "path";
import fs from "fs";
import { createRequire } from "module";
import type { Plugin, ResolvedConfig } from "vite";

type BrowserType = "chrome" | "firefox";

interface WasmPluginOptions {
  browser: BrowserType;
}

/**
 * A custom Vite plugin to find and copy ONNX Runtime Web .wasm files
 * to the build output directory.
 */
export function onnxWasmPlugin(options: WasmPluginOptions): Plugin {
  let config: ResolvedConfig;
  let onnxWasmDirectory: string | null = null;
  const { browser } = options;

  return {
    name: "copy-onnx-wasm-files",

    configResolved(resolvedConfig) {
      config = resolvedConfig;

      try {
        const require = createRequire(import.meta.url);
        const onnxruntimeWebMain = require.resolve("onnxruntime-web");
        onnxWasmDirectory = path.dirname(onnxruntimeWebMain);
      } catch (error) {
        // Only triggers if 'onnxruntime-web' is not installed
      }
    },

    writeBundle() {
      const rootDir = config.root;
      const finalOutDir = config.build.outDir;

      if (!browser || !["chrome", "firefox"].includes(browser)) {
        console.error(
          `❌ [onnx-plugin] Invalid browser type specified: ${browser}. Use 'chrome' or 'firefox'.`
        );
        process.exit(1);
      }

      if (!finalOutDir) {
        console.error(
          "❌ [onnx-plugin] Output directory (outDir) is not defined in Vite config."
        );
        process.exit(1);
      }

      if (!onnxWasmDirectory) {
        console.error(
          "❌ [onnx-plugin] Could not locate 'onnxruntime-web' package. Please install it (`npm install onnxruntime-web`)."
        );
        process.exit(1);
      }

      if (!fs.existsSync(onnxWasmDirectory)) {
        console.warn(
          `⚠️ [onnx-plugin] ONNX Runtime Web asset directory not found, skipping copy: ${onnxWasmDirectory}`
        );
        return;
      }

      if (browser === "firefox") {
        try {
          const allFiles = fs.readdirSync(onnxWasmDirectory!);

          const onnxFiles = allFiles.filter(
            (file) => file.endsWith(".wasm") || file.endsWith(".mjs")
          );

          if (onnxFiles.length === 0) {
            console.warn(
              `⚠️ [onnx-plugin] No .wasm/.mjs files found in: ${onnxWasmDirectory}`
            );
            return;
          }

          fs.mkdirSync(finalOutDir, { recursive: true });

          onnxFiles.forEach((onnxFile) => {
            const srcPath = path.join(onnxWasmDirectory!, onnxFile);
            const destPath = path.join(finalOutDir, "assets", onnxFile);
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            fs.copyFileSync(srcPath, destPath);
          });

          const relativeOutDir = path.relative(
            rootDir,
            path.join(finalOutDir, "assets")
          );
          console.log(
            `✅ [onnx-plugin] Copied ${onnxFiles.length} ONNX file(s) -> ${relativeOutDir}`
          );
        } catch (error) {
          console.error(
            `❌ [onnx-plugin] Error copying ONNX files for Firefox:`,
            error
          );
          process.exit(1);
        }
      }

      if (browser === "chrome") {
        try {
          const allFiles = fs.readdirSync(onnxWasmDirectory!);
          const wasmFiles = allFiles.filter((file) => file.endsWith(".wasm"));

          if (wasmFiles.length === 0) {
            console.warn(
              `⚠️ [onnx-plugin] No .wasm files found in: ${onnxWasmDirectory}`
            );
            return;
          }

          fs.mkdirSync(finalOutDir, { recursive: true });

          wasmFiles.forEach((wasmFile) => {
            const srcPath = path.join(onnxWasmDirectory!, wasmFile);
            const destPath = path.join(finalOutDir, wasmFile);
            fs.copyFileSync(srcPath, destPath);
          });

          const relativeOutDir = path.relative(rootDir, finalOutDir);
          console.log(
            `✅ [onnx-plugin] Copied ${wasmFiles.length} ONNX .wasm file(s) -> ${relativeOutDir}`
          );
        } catch (error) {
          console.error(
            `❌ [onnx-plugin] Error copying ONNX .wasm files for Chrome from ${onnxWasmDirectory}:`,
            error
          );
          process.exit(1);
        }
      }
    },
  };
}

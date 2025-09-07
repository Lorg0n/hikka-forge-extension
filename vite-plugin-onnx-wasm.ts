// vite-plugin-onnx-wasm.ts

import path from "path";
import fs from "fs";
import { createRequire } from "module";
import type { Plugin, ResolvedConfig } from "vite";

/**
 * A custom Vite plugin to find and copy ONNX Runtime Web .wasm files
 * to the build output directory.
 */
export function onnxWasmPlugin(): Plugin {
  let config: ResolvedConfig;
  let onnxWasmDirectory: string | null = null;

  return {
    name: "copy-onnx-wasm-files",

    configResolved(resolvedConfig) {
      config = resolvedConfig;

      // This is the CORRECT way to find the wasm files, as you originally had.
      // It resolves the main package entry and then gets its directory.
      try {
        const require = createRequire(import.meta.url);
        const onnxruntimeWebMain = require.resolve('onnxruntime-web');
        onnxWasmDirectory = path.dirname(onnxruntimeWebMain);
      } catch (error) {
        // This error will now correctly trigger only if 'onnxruntime-web' is truly not installed.
      }
    },

    writeBundle() {
      const rootDir = config.root;
      const finalOutDir = config.build.outDir;

      // 1. Pre-flight checks
      if (!finalOutDir) {
        console.error("❌ [onnx-plugin] Output directory (outDir) is not defined in Vite config.");
        process.exit(1);
      }
      
      if (!onnxWasmDirectory) {
        console.error("❌ [onnx-plugin] Could not locate 'onnxruntime-web' package. Please ensure it is installed (`npm install onnxruntime-web`).");
        process.exit(1);
      }
      
      if (!fs.existsSync(onnxWasmDirectory)) {
          console.warn(`⚠️ [onnx-plugin] ONNX Runtime Web asset directory not found, skipping copy: ${onnxWasmDirectory}`);
          return;
      }

      // 2. Find and copy .wasm files
      try {
        const allFiles = fs.readdirSync(onnxWasmDirectory);
        const wasmFiles = allFiles.filter(file => file.endsWith('.wasm'));

        if (wasmFiles.length === 0) {
          console.warn(`⚠️ [onnx-plugin] No .wasm files found in the ONNX directory: ${onnxWasmDirectory}`);
          return;
        }

        fs.mkdirSync(finalOutDir, { recursive: true });

        wasmFiles.forEach(wasmFile => {
          const srcPath = path.join(onnxWasmDirectory!, wasmFile);
          const destPath = path.join(finalOutDir, wasmFile);
          fs.copyFileSync(srcPath, destPath);
        });

        // 3. Log success message
        const relativeOutDir = path.relative(rootDir, finalOutDir);
        console.log(`✅ [onnx-plugin] Copied ${wasmFiles.length} ONNX .wasm file(s) -> ${relativeOutDir}`);

      } catch (error) {
        console.error(`❌ [onnx-plugin] Error copying ONNX .wasm files from ${onnxWasmDirectory}:`, error);
        process.exit(1);
      }
    },
  };
};
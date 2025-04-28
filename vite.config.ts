import path from "path"
import fs from "fs"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, Plugin } from "vite"

const browser = process.env.BROWSER || "chrome" // chrome | firefox

const manifestPath = `./public/manifest.${browser}.json`
const outDir = path.resolve(__dirname, `dist/${browser}`)

const copyManifestPlugin = (): Plugin => ({
  name: "copy-manifest",
  writeBundle() { 
    const destManifest = path.resolve(outDir, "manifest.json")
    if (!fs.existsSync(manifestPath)) {
      console.error(`❌ Manifest not found: ${manifestPath}`)
      process.exit(1)
    }
    fs.mkdirSync(path.dirname(destManifest), { recursive: true });
    fs.copyFileSync(manifestPath, destManifest)
    console.log(`✅ Copied ${manifestPath} → ${path.relative(__dirname, destManifest)}`)

    const srcAssets = path.resolve(__dirname, "public/assets")
    const destAssets = path.resolve(outDir, "assets")
    if (fs.existsSync(srcAssets)) {
        fs.mkdirSync(path.dirname(destAssets), { recursive: true });
        fs.cpSync(srcAssets, destAssets, { recursive: true })
        console.log(`📦 Copied assets → ${path.relative(__dirname, destAssets)}`)
    } else {
        console.warn(`⚠️ Assets directory not found, skipping copy: ${srcAssets}`)
    }
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), copyManifestPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  publicDir: false,
  build: {
    outDir,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "popup.html"),
        background: path.resolve(__dirname, "src/background.ts"),
        content_loader: path.resolve(__dirname, "src/content-loader.js"), 
        content: path.resolve(__dirname, "src/content.tsx"), 
      },
      output: {
        entryFileNames: `src/[name].js`,
        chunkFileNames: `src/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
      },
    },
  },
})
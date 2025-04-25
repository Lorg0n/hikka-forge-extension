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
  closeBundle() {
    const dest = path.resolve(outDir, "manifest.json")
    if (!fs.existsSync(manifestPath)) {
      console.error(`❌ Manifest not found: ${manifestPath}`)
      process.exit(1)
    }
    fs.copyFileSync(manifestPath, dest)
    console.log(`✅ Copied ${manifestPath} → dist/${browser}/manifest.json`)
    
    const srcAssets = path.resolve(__dirname, "public/assets")
    const destAssets = path.resolve(outDir, "assets")
    fs.cpSync(srcAssets, destAssets, { recursive: true })
    console.log(`📦 Copied assets → dist/${browser}/assets`)
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
        main: path.resolve(__dirname, "index.html"),
        background: path.resolve(__dirname, "src/background.ts"),
        content: path.resolve(__dirname, "src/content.tsx"),
      },
      output: {
        entryFileNames: (chunk) => {
          return `src/${chunk.name}.js`
        },
      },
    },
  },
})

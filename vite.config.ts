import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import { manifestAndAssetPlugin } from './vite-plugin-manifest'

const browser = (process.env.BROWSER || "chrome") as 'chrome' | 'firefox';
const outDir = path.resolve(__dirname, `dist/${browser}`)

export default defineConfig({
  plugins: [react(), tailwindcss(), manifestAndAssetPlugin({ browser })],
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
        popup: path.resolve(__dirname, "src/pages/popup/popup.html"),
        background: path.resolve(__dirname, "src/background.ts"),
        content_loader: path.resolve(__dirname, "src/utils/content-loader.js"), 
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
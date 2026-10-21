import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import { manifestAndAssetPlugin } from './vite-plugin-manifest.js'

const browser = (process.env.BROWSER || "chrome") as 'chrome' | 'firefox';
const projectDir = process.cwd()
const outDir = path.resolve(projectDir, `dist/${browser}`)

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), manifestAndAssetPlugin({ browser })],
  resolve: {
    alias: {
      "@": path.resolve(projectDir, "./src"),
    },
  },
  publicDir: false,
  build: {
    outDir,
    rollupOptions: {
      input: {
        popup: path.resolve(projectDir, "src/pages/popup/popup.html"),
        stickers_admin: path.resolve(projectDir, "src/pages/stickers-admin/stickers-admin.html"),
        background: path.resolve(projectDir, "src/background.ts"),
        content: path.resolve(projectDir, "src/content.tsx"),
      },
      output: {
        entryFileNames: `src/[name].js`,
        chunkFileNames: `src/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
      },
    },
  },
})

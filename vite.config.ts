import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

/** Preloads the Greek subsets used above the fold (serif headings + sans body). */
function preloadGreekFonts(): Plugin {
  const wanted = [/noto-serif-display-greek-wght-normal-.*\.woff2$/, /manrope-greek-wght-normal-.*\.woff2$/]
  return {
    name: 'preload-greek-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const base = process.env.VITE_BASE ?? '/'
        return Object.keys(ctx.bundle ?? {})
          .filter((f) => wanted.some((re) => re.test(f)))
          .map((f) => ({ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: base + f, crossorigin: '' }, injectTo: 'head' as const }))
      },
    },
  }
}

// Relative-safe base so the build can be hosted at a domain root or a sub-path.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss(), preloadGreekFonts()],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/gsap') || id.includes('@gsap')) return 'gsap'
          if (id.includes('node_modules/react')) return 'react'
        },
      },
    },
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
})

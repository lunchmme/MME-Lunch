import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Give every admin page a canonical trailing slash.
// (GitHub Pages does this by itself once deployed)
const adminSlash = () => {
  const fix = (req, res, next) => {
    const m = req.url.match(/^(\/admin(?:\/(?:checkout|deadline|overview|scan))?)(\?.*)?$/)
    if (m) { res.statusCode = 302; res.setHeader('Location', m[1] + '/' + (m[2] || '')); return res.end() }
    next()
  }
  return { name: 'admin-slash', configureServer(s) { s.middlewares.use(fix) }, configurePreviewServer(s) { s.middlewares.use(fix) } }
}

export default defineConfig({
  base: './',
  plugins: [react(), adminSlash()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        checkout: resolve(__dirname, 'admin/checkout/index.html'),
        deadline: resolve(__dirname, 'admin/deadline/index.html'),
        overview: resolve(__dirname, 'admin/overview/index.html'),
        scanner: resolve(__dirname, 'admin/scan/index.html'),
      }
    }
  }
})

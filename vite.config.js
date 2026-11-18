import { defineConfig } from 'vite'
import { networkInterfaces } from 'node:os'
import { fileURLToPath } from 'node:url'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Address of this computer on the Wi-Fi network (e.g. http://192.168.1.20:5173),
// so the QR code on the page can be scanned by a phone on the same Wi-Fi during development.
function lanAddress(port) {
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) return `http://${net.address}:${port}`
    }
  }
  return ''
}

// Demo build (npm run build:demo): one self-contained HTML file with sample data and no Supabase
const demoConfig = {
  base: './',
  plugins: [viteSingleFile()],
  resolve: { alias: [{ find: /^.*\/supabaseClient(\.js)?$/, replacement: fileURLToPath(new URL('./demo/demoClient.js', import.meta.url)) }] },
  build: { outDir: 'dist-demo', assetsInlineLimit: 100000000 },
  define: { __DEV_LAN_URL__: JSON.stringify('') }
}

export default defineConfig(({ command, mode }) => mode === 'demo' ? demoConfig : ({
  // '/' normally; '/dhoom-vivekananda-samiti/' when the GitHub Pages workflow builds the site
  base: process.env.VITE_BASE_PATH || '/',
  server: { host: true, port: 5173 },
  define: {
    __DEV_LAN_URL__: JSON.stringify(command === 'serve' ? lanAddress(5173) : '')
  }
}))

import { defineConfig } from 'vite'
import { networkInterfaces } from 'node:os'

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

export default defineConfig(({ command }) => ({
  server: { host: true, port: 5173 },
  define: {
    __DEV_LAN_URL__: JSON.stringify(command === 'serve' ? lanAddress(5173) : '')
  }
}))

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const PORT = 443

const certDir = path.resolve(__dirname, 'certs')
const hasLocalCerts = fs.existsSync(path.join(certDir, 'localhost.crt'))

export default defineConfig({
  plugins: [react()],
  server: {
    port: PORT,
    ...(hasLocalCerts && {
      https: {
        key: fs.readFileSync(path.join(certDir, 'localhost.key')),
        cert: fs.readFileSync(path.join(certDir, 'localhost.crt')),
        ca: fs.readFileSync(path.join(certDir, 'ca.crt')),
      },
    }),
  },
})

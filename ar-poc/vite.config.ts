import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// basicSsl: phones only allow camera access on HTTPS, so the dev server
// is served over HTTPS with a self-signed certificate (accept the warning once).
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: { host: true, port: 5173 },
  build: { chunkSizeWarningLimit: 4000 },
});

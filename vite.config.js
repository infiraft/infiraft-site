import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        katering: resolve(__dirname, 'demo/katering/index.html'),
        klinikGigi: resolve(__dirname, 'demo/klinik-gigi/index.html'),
        bengkelMotor: resolve(__dirname, 'demo/bengkel-motor/index.html'),
        laundry: resolve(__dirname, 'demo/laundry/index.html'),
        bimbel: resolve(__dirname, 'demo/bimbel/index.html'),
        weddingPlanner: resolve(__dirname, 'demo/wedding-planner/index.html'),
        kosKosan: resolve(__dirname, 'demo/kos-kosan/index.html'),
      },
    },
  },
  server: {
    host: '127.0.0.1',
    allowedHosts: true,
  },
  preview: {
    host: '127.0.0.1',
    allowedHosts: true,
  },
});

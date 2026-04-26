import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    host: "127.0.0.1",
    port: 5847,
    strictPort: true
  },
  preview: {
    host: "127.0.0.1",
    port: 5848,
    strictPort: true
  },
  resolve: {
    alias: {
      phaser: "phaser/dist/phaser.esm.js"
    }
  },
  optimizeDeps: {
    exclude: ["phaser"]
  }
});

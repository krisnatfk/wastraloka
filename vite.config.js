import { resolve } from "node:path";

import { defineConfig, loadEnv } from "vite";

import { createApi } from "./server/api.js";

// Endpoint server (/api/token, /api/usage, /api/image, /api/admin/*) dipasang di dev server Vite.
// Logikanya ada di folder server/ supaya nanti bisa dipindah ke server produksi apa adanya.
function apiPlugin(env) {
  return {
    name: "virtualfit-api",
    configureServer(server) {
      server.middlewares.use(createApi({ env, rootDir: process.cwd() }));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [apiPlugin(env)],
    server: {
      port: 3210,
      open: true,
      // data/ berisi API key terenkripsi: jangan sampai ikut di-watch atau disajikan
      watch: { ignored: ["**/data/**"] },
      fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/data/**", "**/server/**", "**/scripts/**"] },
    },
    build: {
      rollupOptions: {
        input: { main: resolve(process.cwd(), "index.html"), admin: resolve(process.cwd(), "admin/index.html") },
      },
    },
    // SDK Decart memuat Web Worker lewat new URL("./frame-metadata-worker.js", import.meta.url).
    // Kalau SDK di-prebundle Vite, URL itu jadi /node_modules/.vite/deps/... (404), worker mati diam-diam,
    // frame kamera tidak pernah terkirim, dan server AI tidak pernah mulai generate.
    optimizeDeps: {
      exclude: ["@decartai/sdk"],
      include: [
        "@decartai/sdk > livekit-client",
        "@decartai/sdk > zod",
        "@decartai/sdk > mitt",
        "@decartai/sdk > p-retry",
        "@decartai/sdk > jose",
      ],
    },
  };
});

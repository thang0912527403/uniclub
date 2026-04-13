import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    host: true,
    hmr: false,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://localhost:7237',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

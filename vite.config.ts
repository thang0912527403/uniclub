import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    host: true, // Cho phép truy cập từ điện thoại/máy khác trong mạng (http://<IP-máy>:5173)
    hmr: false, // Tắt hẳn HMR — tránh lỗi khi truy cập qua ngrok/proxy từ điện thoại
  },
});

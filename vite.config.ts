import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Expose environment variables to the frontend
    __VITE_API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3000'),
    __VITE_APP_NAME__: JSON.stringify(process.env.VITE_APP_NAME || 'MicroCare'),
  },
}));

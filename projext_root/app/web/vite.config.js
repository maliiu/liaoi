import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@chat/ui": path.resolve(__dirname, "../../packages/ui/src")
        }
    },
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:4000",
                changeOrigin: true
            },
            "/socket.io": {
                target: "http://localhost:4100",
                ws: true
            }
        }
    },
    build: {
        outDir: "dist",
        emptyOutDir: true
    }
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    globals: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Group node_modules by category
          if (id.includes("node_modules")) {
            // Core React libraries
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            // Chart libraries
            if (id.includes("recharts") || id.includes("d3-")) {
              return "vendor-charts";
            }
            // Date utilities
            if (id.includes("date-fns")) {
              return "vendor-dates";
            }
            // Supabase
            if (id.includes("@supabase")) {
              return "vendor-supabase";
            }
            // UI libraries
            if (
              id.includes("lucide-react") ||
              id.includes("@headlessui") ||
              id.includes("tailwind")
            ) {
              return "vendor-ui";
            }
            // Everything else from node_modules
            return "vendor-misc";
          }

          // Group our application code
          if (id.includes("/src/services/")) {
            return "app-services";
          }
          if (id.includes("/src/components/")) {
            return "app-components";
          }
          if (id.includes("/src/pages/")) {
            return "app-pages";
          }
          if (id.includes("/src/features/")) {
            return "app-features";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000kb
  },
});

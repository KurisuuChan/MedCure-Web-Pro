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
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Group node_modules by category
          if (id.includes("node_modules")) {
            // Core React libraries
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            // Chart libraries - split these more granularly
            if (id.includes("chart.js") || id.includes("react-chartjs")) {
              return "vendor-charts";
            }
            if (id.includes("recharts") || id.includes("d3-")) {
              return "vendor-charts-d3";
            }
            // Date utilities
            if (id.includes("date-fns")) {
              return "vendor-dates";
            }
            // Supabase
            if (id.includes("@supabase")) {
              return "vendor-supabase";
            }
            // Form libraries
            if (
              id.includes("react-hook-form") ||
              id.includes("@hookform") ||
              id.includes("zod")
            ) {
              return "vendor-forms";
            }
            // PDF and canvas libraries (these are typically large)
            if (
              id.includes("jspdf") ||
              id.includes("html2canvas") ||
              id.includes("canvas")
            ) {
              return "vendor-pdf";
            }
            // UI libraries
            if (
              id.includes("lucide-react") ||
              id.includes("@headlessui") ||
              id.includes("tailwind")
            ) {
              return "vendor-ui";
            }
            // Router
            if (id.includes("react-router")) {
              return "vendor-router";
            }
            // Query libraries
            if (id.includes("@tanstack/react-query")) {
              return "vendor-query";
            }
            // State management
            if (id.includes("zustand")) {
              return "vendor-state";
            }
            // Everything else from node_modules
            return "vendor-misc";
          }

          // Group our application code more granularly
          if (id.includes("/src/services/")) {
            // Split services by domain
            if (id.includes("/src/services/domains/analytics/")) {
              return "app-services-analytics";
            }
            if (id.includes("/src/services/domains/inventory/")) {
              return "app-services-inventory";
            }
            if (id.includes("/src/services/domains/auth/")) {
              return "app-services-auth";
            }
            return "app-services-core";
          }
          if (id.includes("/src/components/")) {
            // Split large component groups
            if (id.includes("/src/components/admin/")) {
              return "app-components-admin";
            }
            if (id.includes("/src/components/ui/")) {
              return "app-components-ui";
            }
            return "app-components";
          }
          if (id.includes("/src/pages/")) {
            return "app-pages";
          }
          if (id.includes("/src/features/")) {
            // Split features by domain
            if (id.includes("/src/features/pos/")) {
              return "app-features-pos";
            }
            if (id.includes("/src/features/inventory/")) {
              return "app-features-inventory";
            }
            return "app-features";
          }
        },
      },
    },
    chunkSizeWarningLimit: 500, // Lower the warning limit to catch issues earlier
  },
});

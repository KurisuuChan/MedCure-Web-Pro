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
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    target: "esnext",
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        // Ensure proper chunk loading order
        inlineDynamicImports: false,
        manualChunks: (id) => {
          // Group node_modules by category
          if (id.includes("node_modules")) {
            // Core React libraries + UI libraries that depend on React
            // CRITICAL: lucide-react MUST be in the same chunk as React
            // because it uses React.forwardRef internally
            if (
              id.includes("node_modules/react") ||
              id.includes("node_modules/scheduler") ||
              id.includes("node_modules/lucide-react")
            ) {
              // Exclude React-based libraries that can be separated
              if (
                !id.includes("react-router") &&
                !id.includes("react-hook-form") &&
                !id.includes("react-chartjs") &&
                !id.includes("@tanstack/react-query")
              ) {
                return "vendor-react";
              }
            }
            // Chart libraries
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
            // Other UI libraries (not lucide-react, that's with React now)
            if (id.includes("@headlessui") || id.includes("tailwind")) {
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

          // DON'T SPLIT APPLICATION CODE
          // Let Vite automatically bundle app code to prevent React being undefined
          // Only node_modules are manually chunked above
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});

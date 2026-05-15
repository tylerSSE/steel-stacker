import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for Steel Stacker. React plugin is the only thing we need beyond
// defaults. The build outputs to dist/ which Vercel auto-detects.
export default defineConfig({
  plugins: [react()],
  build: {
    // Sourcemaps off for production — keep the deployment lean. Toggle to true
    // if you need to debug a production-only bug.
    sourcemap: false,
  },
});

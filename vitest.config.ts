import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: fileURLToPath(new URL("./", import.meta.url)) },
      // "server-only" throws outside an RSC build. Use its no-op entry so pure helpers in those files can be tested.
      {
        find: /^server-only$/,
        replacement: fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", ".agents/**"],
  },
});

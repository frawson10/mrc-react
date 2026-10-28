import { build } from "vite";
import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
await build({
  root,
  logLevel: "error",
  build: {
    ssr: "src/test-entry.ts",
    outDir: ".test-server",
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: "test-entry.mjs" } },
  },
});
const files = (await readdir(join(root, "tests")))
  .filter((name) => name.endsWith(".test.mjs"))
  .map((name) => join(root, "tests", name));
const child = spawn(process.execPath, ["--test", ...files], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "test" },
});
child.on("exit", (code) => process.exit(code ?? 1));

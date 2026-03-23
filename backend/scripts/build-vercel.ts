import { mkdirSync, rmSync } from "fs";
import { resolve } from "path";

const projectRoot = resolve(import.meta.dir, "..");

rmSync(resolve(projectRoot, "api"), { recursive: true, force: true });
mkdirSync(resolve(projectRoot, "api"), { recursive: true });

const result = Bun.spawnSync({
    cmd: [
        "bun",
        "build",
        "src/vercel.ts",
        "--outfile",
        "api/[...route].js",
        "--target",
        "node",
        "--format",
        "esm",
    ],
    cwd: projectRoot,
    stdout: "inherit",
    stderr: "inherit",
});

if (result.exitCode !== 0) process.exit(result.exitCode);

console.log("Generated Vercel function: api/[...route].js");

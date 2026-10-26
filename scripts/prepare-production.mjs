import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const shippedFiles = [
  ".gitignore",
  ".prettierignore",
  "eslint.config.js",
  "CHANGELOG.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
];
const shippedDirectories = ["src", "assets", "licenses"];
const testDependencies = [
  "tsx",
  "react-test-renderer",
  "@types/react-test-renderer",
];

export function prepareProduction({ repoRoot, output, preview = false }) {
  output = resolve(output);
  if (basename(output) !== "blazwitcher")
    throw new Error("Output directory must be named blazwitcher.");
  if (existsSync(output)) throw new Error(`Output already exists: ${output}`);
  const git = (...args) =>
    execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();
  if (git("branch", "--show-current") !== "master")
    throw new Error("Run from the master checkout.");
  if (!preview && git("status", "--porcelain"))
    throw new Error(
      "Release generation requires a clean master. Use --preview for a local packaging review.",
    );
  const sourceCommit = git("rev-parse", "refs/heads/master");
  const temporary = mkdtempSync(join(tmpdir(), "blazwitcher-production-"));
  let createdOutput = false;
  try {
    const snapshot = join(temporary, "source");
    const bundle = join(temporary, "bundle");
    mkdirSync(snapshot);
    mkdirSync(bundle);
    const archive = execFileSync("git", ["archive", sourceCommit], {
      cwd: repoRoot,
      maxBuffer: 64 * 1024 * 1024,
    });
    execFileSync("tar", ["-xf", "-", "-C", snapshot], { input: archive });
    const readJSON = (file) =>
      JSON.parse(readFileSync(join(snapshot, file), "utf8"));
    const writeJSON = (file, value) =>
      writeFileSync(join(bundle, file), `${JSON.stringify(value, null, 2)}\n`);
    const copy = (file) =>
      cpSync(join(snapshot, file), join(bundle, file), { recursive: true });
    for (const file of [...shippedFiles, ...shippedDirectories]) copy(file);
    mkdirSync(join(bundle, "metadata"));
    for (const file of readdirSync(join(snapshot, "metadata"))) {
      if (/^blazwitcher(?:-raycast)?-\d+\.png$/.test(file)) {
        cpSync(
          join(snapshot, "metadata", file),
          join(
            bundle,
            "metadata",
            file.replace("blazwitcher-raycast-", "blazwitcher-"),
          ),
        );
      }
    }
    // Preview permits local Store metadata and README drafts; runtime and dependencies always come from committed master.
    const readme = readFileSync(
      join(preview ? repoRoot : snapshot, "store/README.md"),
      "utf8",
    );
    for (const match of readme.matchAll(
      /(?:\]\(|src=")([^\s)"#]+)(?:#[^\s)"]*)?[)"]/g,
    )) {
      const link = match[1];
      if (/^https?:\/\//.test(link)) continue;
      if (
        !shippedFiles.includes(link) &&
        !/^media\/[\w-]+\.(gif|png)$/.test(link)
      )
        throw new Error(`Unsupported local README link: ${link}`);
      copy(link);
    }
    writeFileSync(join(bundle, "README.md"), readme);

    const manifest = readJSON("package.json");
    const metadata = JSON.parse(
      readFileSync(
        join(preview ? repoRoot : snapshot, "store/manifest.json"),
        "utf8",
      ),
    );
    if (metadata.name !== "blazwitcher")
      throw new Error("Store name must match the blazwitcher directory.");
    manifest.name = metadata.name;
    manifest.title = metadata.title;
    manifest.contributors = metadata.contributors;
    manifest.scripts = {
      build: "ray build -e dist",
      dev: "ray develop",
      lint: "ray lint",
      "fix-lint": "ray lint --fix",
      publish: "npx @raycast/api@latest publish",
    };
    for (const name of testDependencies)
      delete manifest.devDependencies?.[name];
    writeJSON("package.json", manifest);
    const tsconfig = readJSON("tsconfig.json");
    tsconfig.include = ["src/**/*", "raycast-env.d.ts"];
    writeJSON("tsconfig.json", tsconfig);
    copy("package-lock.json");
    // npm removes only unreachable test packages, retaining versions from master's lockfile.
    execFileSync(
      "npm",
      [
        "install",
        "--package-lock-only",
        "--ignore-scripts",
        "--offline",
        "--no-audit",
        "--no-fund",
      ],
      { cwd: bundle, stdio: "pipe" },
    );

    mkdirSync(dirname(output), { recursive: true });
    mkdirSync(output); // Exclusive creation also refuses a concurrent output or a dangling symlink.
    createdOutput = true;
    cpSync(bundle, output, { recursive: true });
    return { sourceCommit, preview, output };
  } catch (error) {
    if (createdOutput) rmSync(output, { recursive: true, force: true });
    throw error;
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const { values } = parseArgs({
      options: {
        output: { type: "string" },
        preview: { type: "boolean", default: false },
      },
    });
    if (!values.output)
      throw new Error(
        "Usage: npm run prepare:production -- --output <new-directory>/blazwitcher [--preview]",
      );
    const result = prepareProduction({
      repoRoot: resolve(dirname(fileURLToPath(import.meta.url)), ".."),
      output: values.output,
      preview: values.preview,
    });
    console.log(JSON.stringify(result, null, 2));
    if (result.preview)
      console.error(
        "PREVIEW ONLY: commit the packaging changes to master and regenerate before publishing.",
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

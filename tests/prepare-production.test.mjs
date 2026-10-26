import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { prepareProduction } from "../scripts/prepare-production.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "blazwitcher-production-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repo = join(root, "source");
  mkdirSync(repo);
  const write = (path, content) => {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), content);
  };
  const git = (...args) =>
    execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "master");
  git("config", "user.name", "Production Test");
  git("config", "user.email", "production-test@example.invalid");
  write(
    "package.json",
    JSON.stringify({
      name: "blazwitcher-raycast",
      title: "Blazwitcher",
      author: "julian0197",
      scripts: { test: "tsx tests", publish: "ray publish" },
      devDependencies: {
        tsx: "4.0.0",
        "react-test-renderer": "19.0.0",
        "@types/react-test-renderer": "19.0.0",
      },
    }),
  );
  write(
    "package-lock.json",
    JSON.stringify({
      name: "blazwitcher-raycast",
      lockfileVersion: 3,
      requires: true,
      packages: {
        "": {
          name: "blazwitcher-raycast",
          devDependencies: {
            tsx: "4.0.0",
            "react-test-renderer": "19.0.0",
            "@types/react-test-renderer": "19.0.0",
          },
        },
        "node_modules/tsx": { version: "4.0.0", dev: true },
        "node_modules/react-test-renderer": { version: "19.0.0", dev: true },
        "node_modules/@types/react-test-renderer": {
          version: "19.0.0",
          dev: true,
        },
      },
    }),
  );
  write(
    "tsconfig.json",
    JSON.stringify({
      include: ["src/**/*", "tests/**/*"],
      compilerOptions: {},
    }),
  );
  write(
    "store/manifest.json",
    JSON.stringify({
      name: "blazwitcher",
      title: "Blazwitcher - Pinyin Browser Search",
      contributors: ["cjinhuo"],
    }),
  );
  write(
    "store/README.md",
    "# Blazwitcher\n\n![Demo](media/demo.gif)\n\n[License](LICENSE)\n",
  );
  for (const path of [
    ".gitignore",
    ".prettierignore",
    "eslint.config.js",
    "CHANGELOG.md",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "src/search-all.tsx",
    "assets/extension-icon.png",
    "licenses/original.txt",
    "metadata/blazwitcher-raycast-1.png",
    "media/demo.gif",
    "README.md",
    "README.zh-CN.md",
    "AGENTS.md",
    "CONTRIBUTING.md",
    "docs/private.md",
    "openspec/plan.md",
    "tests/sample.test.ts",
    "scripts/inspect-local.ts",
    "media/demo.mp4",
    "media/recording-manifest.json",
    "media/unused.png",
  ])
    write(path, `original ${path}\n`);
  git("add", ".");
  git("commit", "-qm", "Fixture");
  return { repo, write, git, output: join(root, "blazwitcher") };
}

test("exports only Store files, with unchanged committed runtime and a pruned lockfile", (t) => {
  const f = fixture(t);
  const result = prepareProduction({ repoRoot: f.repo, output: f.output });
  assert.equal(result.sourceCommit, f.git("rev-parse", "master"));
  assert.equal(result.preview, false);
  assert.equal(
    readFileSync(join(f.output, "src/search-all.tsx"), "utf8"),
    "original src/search-all.tsx\n",
  );
  for (const path of [
    "AGENTS.md",
    "CONTRIBUTING.md",
    "docs",
    "openspec",
    "tests",
    "scripts",
    "store",
    "README.zh-CN.md",
    "media/demo.mp4",
    "media/recording-manifest.json",
    "media/unused.png",
  ])
    assert.equal(existsSync(join(f.output, path)), false, path);
  assert.ok(existsSync(join(f.output, "media/demo.gif")));
  assert.ok(existsSync(join(f.output, "metadata/blazwitcher-1.png")));
  const manifest = JSON.parse(
    readFileSync(join(f.output, "package.json"), "utf8"),
  );
  assert.equal(manifest.name, "blazwitcher");
  assert.deepEqual(manifest.contributors, ["cjinhuo"]);
  assert.equal(manifest.title, "Blazwitcher - Pinyin Browser Search");
  assert.deepEqual(Object.keys(manifest.scripts).sort(), [
    "build",
    "dev",
    "fix-lint",
    "lint",
    "publish",
  ]);
  assert.deepEqual(manifest.devDependencies, {});
  const lock = JSON.parse(
    readFileSync(join(f.output, "package-lock.json"), "utf8"),
  );
  assert.equal(lock.name, manifest.name);
  assert.equal(lock.packages[""].name, manifest.name);
  assert.equal(Object.keys(lock.packages).length, 1);
  assert.equal(f.git("status", "--porcelain"), "");
});

test("refuses dirty releases; preview uses committed runtime and a local README only", (t) => {
  const f = fixture(t);
  f.write("src/search-all.tsx", "unreleased runtime\n");
  f.write("store/README.md", "# Preview README\n");
  assert.throws(
    () => prepareProduction({ repoRoot: f.repo, output: f.output }),
    /clean master/,
  );
  assert.equal(existsSync(f.output), false);
  const result = prepareProduction({
    repoRoot: f.repo,
    output: f.output,
    preview: true,
  });
  assert.equal(result.preview, true);
  assert.equal(
    readFileSync(join(f.output, "src/search-all.tsx"), "utf8"),
    "original src/search-all.tsx\n",
  );
  assert.equal(
    readFileSync(join(f.output, "README.md"), "utf8"),
    "# Preview README\n",
  );
  assert.equal(
    readFileSync(join(f.repo, "src/search-all.tsx"), "utf8"),
    "unreleased runtime\n",
  );
});

test("never overwrites an existing output directory", (t) => {
  const f = fixture(t);
  mkdirSync(f.output);
  writeFileSync(join(f.output, "keep.txt"), "keep");
  assert.throws(
    () => prepareProduction({ repoRoot: f.repo, output: f.output }),
    /exists/,
  );
  assert.equal(readFileSync(join(f.output, "keep.txt"), "utf8"), "keep");
});

test("rejects missing README assets without leaving a partial release", (t) => {
  const f = fixture(t);
  f.write("store/README.md", "![Missing](media/missing.gif)\n");
  assert.throws(
    () =>
      prepareProduction({ repoRoot: f.repo, output: f.output, preview: true }),
    /missing.gif/,
  );
  assert.equal(existsSync(f.output), false);
});

test("requires a blazwitcher destination and refuses a non-master checkout", (t) => {
  const f = fixture(t);
  assert.throws(
    () =>
      prepareProduction({ repoRoot: f.repo, output: join(f.repo, "wrong") }),
    /blazwitcher/,
  );
  f.git("switch", "-qc", "feature");
  assert.throws(
    () => prepareProduction({ repoRoot: f.repo, output: f.output }),
    /master/,
  );
});

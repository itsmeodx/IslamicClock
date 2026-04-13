import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mkdtempSync,
  chmodSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SCRIPT_SRC = path.resolve("scripts/set-ci-version.sh");

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
  });
  return result;
}

function setupRepo(version = "1.0.0") {
  const dir = mkdtempSync(path.join(tmpdir(), "ic-set-ci-version-"));

  mkdirSync(path.join(dir, "scripts"), { recursive: true });
  copyFileSync(SCRIPT_SRC, path.join(dir, "scripts/set-ci-version.sh"));
  chmodSync(path.join(dir, "scripts/set-ci-version.sh"), 0o755);

  writeFileSync(
    path.join(dir, "package.json"),
    `${JSON.stringify(
      {
        name: "tmp-repo",
        version,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  let r = run("git", ["init"], dir);
  assert.equal(r.status, 0, r.stderr);

  r = run("git", ["config", "user.email", "test@example.com"], dir);
  assert.equal(r.status, 0, r.stderr);

  r = run("git", ["config", "user.name", "Test User"], dir);
  assert.equal(r.status, 0, r.stderr);

  r = run("git", ["add", "."], dir);
  assert.equal(r.status, 0, r.stderr);

  r = run("git", ["commit", "-m", "init"], dir);
  assert.equal(r.status, 0, r.stderr);

  return dir;
}

function parseOutputFile(filePath) {
  const output = readFileSync(filePath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("="));

  return Object.fromEntries(output);
}

test("computes next patch from existing tags and publishes", () => {
  const dir = setupRepo("1.0.0");

  let r = run("git", ["tag", "firefox-v1.0.0"], dir);
  assert.equal(r.status, 0, r.stderr);

  r = run("git", ["tag", "firefox-v1.0.4"], dir);
  assert.equal(r.status, 0, r.stderr);

  // Move HEAD forward so existing tags are historical, not rerun tags on HEAD.
  r = run("git", ["commit", "--allow-empty", "-m", "after-tags"], dir);
  assert.equal(r.status, 0, r.stderr);

  const outputPath = path.join(dir, "out.txt");
  r = run("bash", ["scripts/set-ci-version.sh", outputPath], dir);
  assert.equal(r.status, 0, `${r.stderr}\n${r.stdout}`);

  const outputs = parseOutputFile(outputPath);
  assert.equal(outputs.ci_version, "1.0.5");
  assert.equal(outputs.should_publish, "true");

  const pkg = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
  assert.equal(pkg.version, "1.0.5");
});

test("reuses existing tag on HEAD and skips publish", () => {
  const dir = setupRepo("1.0.0");

  let r = run("git", ["tag", "firefox-v1.0.7"], dir);
  assert.equal(r.status, 0, r.stderr);

  const outputPath = path.join(dir, "out.txt");
  r = run("bash", ["scripts/set-ci-version.sh", outputPath], dir);
  assert.equal(r.status, 0, `${r.stderr}\n${r.stdout}`);

  const outputs = parseOutputFile(outputPath);
  assert.equal(outputs.ci_version, "1.0.7");
  assert.equal(outputs.should_publish, "false");

  const pkg = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
  assert.equal(pkg.version, "1.0.7");
});

test("fails on non-semver package version", () => {
  const dir = setupRepo("1.0");

  const outputPath = path.join(dir, "out.txt");
  const r = run("bash", ["scripts/set-ci-version.sh", outputPath], dir);

  assert.notEqual(r.status, 0);
  assert.match(
    `${r.stderr}${r.stdout}`,
    /package\.json version must be semver \(major\.minor\.patch\)/,
  );
});

test("starts at base.0 when no matching tags exist", () => {
  const dir = setupRepo("2.3.0");

  const outputPath = path.join(dir, "out.txt");
  const r = run("bash", ["scripts/set-ci-version.sh", outputPath], dir);
  assert.equal(r.status, 0, `${r.stderr}\n${r.stdout}`);

  const outputs = parseOutputFile(outputPath);
  assert.equal(outputs.ci_version, "2.3.0");
  assert.equal(outputs.should_publish, "true");
});

test("ignores non-matching tags while calculating next patch", () => {
  const dir = setupRepo("1.0.0");

  let r = run("git", ["tag", "firefox-v2.0.9"], dir);
  assert.equal(r.status, 0, r.stderr);

  r = run("git", ["tag", "firefox-v1.0.bad"], dir);
  assert.equal(r.status, 0, r.stderr);

  r = run("git", ["tag", "v1.0.8"], dir);
  assert.equal(r.status, 0, r.stderr);

  r = run("git", ["tag", "firefox-v1.0.3"], dir);
  assert.equal(r.status, 0, r.stderr);

  r = run("git", ["commit", "--allow-empty", "-m", "after-tags"], dir);
  assert.equal(r.status, 0, r.stderr);

  const outputPath = path.join(dir, "out.txt");
  r = run("bash", ["scripts/set-ci-version.sh", outputPath], dir);
  assert.equal(r.status, 0, `${r.stderr}\n${r.stdout}`);

  const outputs = parseOutputFile(outputPath);
  assert.equal(outputs.ci_version, "1.0.4");
  assert.equal(outputs.should_publish, "true");
});

test("increments correctly across multi-digit patch numbers", () => {
  const dir = setupRepo("1.0.0");

  let r = run("git", ["tag", "firefox-v1.0.9"], dir);
  assert.equal(r.status, 0, r.stderr);

  r = run("git", ["tag", "firefox-v1.0.10"], dir);
  assert.equal(r.status, 0, r.stderr);

  r = run("git", ["commit", "--allow-empty", "-m", "after-tags"], dir);
  assert.equal(r.status, 0, r.stderr);

  const outputPath = path.join(dir, "out.txt");
  r = run("bash", ["scripts/set-ci-version.sh", outputPath], dir);
  assert.equal(r.status, 0, `${r.stderr}\n${r.stdout}`);

  const outputs = parseOutputFile(outputPath);
  assert.equal(outputs.ci_version, "1.0.11");
  assert.equal(outputs.should_publish, "true");
});

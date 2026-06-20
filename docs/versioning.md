# Release Versioning

Releases are cut from git tags. `package.json` is the single source of truth for
the version, and pushing a `v*` tag triggers the release workflow.

## Version Format

- `package.json` version is SemVer: `major.minor.patch` (example: `1.0.6`).
- Each release has a matching tag `v<version>` (example: `v1.0.6`).

## Cutting a Release

Use `pnpm version`, which bumps `package.json`, commits it, and creates the
matching annotated tag in one atomic step — no hand-edited version strings:

```bash
pnpm version patch     # 1.0.6 -> 1.0.7  (bug fixes)
pnpm version minor     # 1.0.6 -> 1.1.0  (features)
pnpm version major     # 1.0.6 -> 2.0.0  (breaking changes)

git push --follow-tags # push the commit (deploys web app) AND the tag (cuts release)
```

The working tree must be clean before running `pnpm version`.

## What a Tag Triggers

Pushing a `v*` tag runs [release.yml](../.github/workflows/release.yml):

1. **Asserts** the tag matches `package.json` — the release fails on a mismatch,
   so the tag and the version can never silently diverge.
2. Builds the Chrome and Firefox extension packages.
3. Submits the listed Firefox build to AMO for review.
4. Creates a draft GitHub Release with the packaged artifacts.

Pushing a commit to `main` **without** a tag only runs [ci.yml](../.github/workflows/ci.yml)
(verify + deploy the web app). It does **not** cut a release.

## Why This Scheme

- A release is an explicit act — a tag — not a side effect of every commit. This
  matches Mozilla's guidance against signing add-ons on every commit or nightly
  build.
- The tag and `package.json` can never drift: CI rejects a tag that disagrees
  with the committed version.
- `pnpm version` makes the bump atomic, so the commit, the version, and the tag
  always agree by construction.

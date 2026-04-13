# Release Versioning

This project uses a SemVer package version and a CI release version derived from its `major.minor` base.

## Version Format

- `package.json` version must be SemVer: `major.minor.patch` (example: `1.0.0`).
- CI release version is `major.minor.patch` (example: `1.0.5`).

## How Patch Is Calculated

- CI extracts `major.minor` from `package.json` version.
- CI fetches tags and looks for tags matching `v<major.minor>.<patch>`.
- It finds the highest existing patch for the current base version.
- Next patch is highest + 1.
- If no tags exist for the current base, patch starts at `0`.
- If the current commit already has a matching `v<major.minor>.<patch>` tag, CI reuses it (no new publish).

## Examples

- `package.json` is `1.0.0`, highest tag `v1.0.4` -> next release `1.0.5`.
- Base changes to `1.1.x` (example `1.1.0`) with no matching tags -> next release `1.1.0`.

## Why This Scheme

- Build numbers reset naturally when you bump minor version.
- Releases remain monotonic within each `major.minor` line.
- Avoids coupling version numbers to global GitHub run count.

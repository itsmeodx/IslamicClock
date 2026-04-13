# Firefox Extension Signing

Firefox stable release does not allow unsigned extensions.
Use AMO signing to produce installable release artifacts.

## Prerequisites

- AMO developer account
- AMO API credentials (JWT issuer + secret)
- Project dependencies installed

## Generate AMO API Credentials

1. Open AMO Developer Hub: <https://addons.mozilla.org/developers/>
2. Go to API Keys / JWT credentials.
3. Create a key pair for your account.
4. Save issuer and secret.

## Configure Environment Variables

Set credentials in your shell session:

export WEB_EXT_API_KEY="your_amo_jwt_issuer"
export WEB_EXT_API_SECRET="your_amo_jwt_secret"

## GitHub Actions (CI Signing)

GitHub Actions cannot read local shell variables. Store credentials in
environment `firefox-signing`.

1. Open repository settings.
2. Go to Environments -> `firefox-signing`.
3. Add environment secrets:
   - WEB_EXT_API_KEY
   - WEB_EXT_API_SECRET
4. Re-run workflow.

The package job reads these secrets and runs `pnpm sign:firefox`.
If both secrets exist, CI signs the Firefox build and replaces unsigned
`firefox.xpi` before uploading artifacts and creating release. If publish
is required and either secret is missing, package job fails instead of
publishing unsigned build.

## Sign for Listed Distribution

Run:

pnpm build:extension
pnpm sign:firefox

What this does:

- Submits extension-dist/firefox to AMO signing API.
- Writes signed output to extension-dist/signed.

## Sign for Unlisted Distribution

Run:

pnpm build:extension
pnpm sign:firefox:unlisted

Use this channel for self-hosted/private distribution.

## Notes

- Keep browser_specific_settings.gecko.id stable in Firefox manifest.
- If signing fails, verify credentials and AMO account permissions.
- First listed submission may require AMO review before public install.
- Release version rules are documented in `docs/versioning.md`.

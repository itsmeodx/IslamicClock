#!/bin/bash
set -euo pipefail

if [[ -z "${WEB_EXT_API_KEY:-}" || -z "${WEB_EXT_API_SECRET:-}" ]]; then
    echo "Error: WEB_EXT_API_KEY and WEB_EXT_API_SECRET are required."
    echo "Create API credentials in AMO Developer Hub, then export both env vars."
    exit 1
fi

FIREFOX_CHANNEL="${FIREFOX_CHANNEL:-listed}"
ARTIFACTS_DIR="extension-dist/signed"
AMO_METADATA_FILE="amo-metadata.json"
USE_AMO_METADATA="${USE_AMO_METADATA:-true}"
REQUIRE_SIGNED_XPI="${REQUIRE_SIGNED_XPI:-auto}"
UPLOAD_UUID_FILE="extension-dist/firefox/.amo-upload-uuid"

if [[ "$REQUIRE_SIGNED_XPI" == "auto" ]]; then
    if [[ "$FIREFOX_CHANNEL" == "listed" ]]; then
        REQUIRE_SIGNED_XPI="false"
    else
        REQUIRE_SIGNED_XPI="true"
    fi
fi

if [[ ! -f "extension-dist/firefox/manifest.json" ]]; then
    echo "Error: extension-dist/firefox/manifest.json not found."
    echo "Run pnpm run build:extension before signing."
    exit 1
fi

rm -rf "$ARTIFACTS_DIR"
mkdir -p "$ARTIFACTS_DIR"

# web-ext caches the last upload UUID here; stale values can trigger
# "This upload has already been submitted" on retries.
rm -f "$UPLOAD_UUID_FILE"

sign_args=(
    --source-dir extension-dist/firefox
    --artifacts-dir "$ARTIFACTS_DIR"
    --api-key "$WEB_EXT_API_KEY"
    --api-secret "$WEB_EXT_API_SECRET"
    --channel "$FIREFOX_CHANNEL"
)

if [[ "$FIREFOX_CHANNEL" == "listed" && "$USE_AMO_METADATA" == "true" ]]; then
    if [[ ! -f "$AMO_METADATA_FILE" ]]; then
        echo "Error: USE_AMO_METADATA=true but $AMO_METADATA_FILE was not found."
        exit 1
    fi
    sign_args+=(--amo-metadata "$AMO_METADATA_FILE")
fi

echo "Submitting Firefox extension for $FIREFOX_CHANNEL signing..."
pnpm exec web-ext sign "${sign_args[@]}"

signed_files=()
while IFS= read -r signed_file; do
    signed_files+=("$signed_file")
done < <(find "$ARTIFACTS_DIR" -maxdepth 1 -type f -name '*.xpi' | sort)
if [[ "$REQUIRE_SIGNED_XPI" == "true" ]]; then
    if [[ ${#signed_files[@]} -ne 1 ]]; then
        echo "Error: expected exactly one signed .xpi in $ARTIFACTS_DIR, found ${#signed_files[@]}."
        exit 1
    fi
else
    if [[ ${#signed_files[@]} -eq 0 ]]; then
        echo "No immediate signed .xpi artifact found (allowed for listed submissions pending review)."
    fi
fi

echo "Done. Signed artifact(s) in $ARTIFACTS_DIR"

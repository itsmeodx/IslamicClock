#!/bin/bash
set -euo pipefail

OUTPUT_FILE="${1:-}"

BASE_VERSION="$(node -e "const v=require('./package.json').version; const m=v.match(/^([0-9]+)\.([0-9]+)\.[0-9]+$/); if(!m){console.error('package.json version must be semver (major.minor.patch). Got: ' + v); process.exit(1);} process.stdout.write(m[1]+'.'+m[2]);")"
ESCAPED_BASE="${BASE_VERSION//./\\.}"

EXISTING_TAG_FOR_HEAD="$(git tag --points-at HEAD -l "v${BASE_VERSION}.*" \
  | grep -E "^v${ESCAPED_BASE}\.[0-9]+$" \
  | sort -V \
  | tail -1 || true)"

if [[ -n "${EXISTING_TAG_FOR_HEAD}" ]]; then
  CI_VERSION="${EXISTING_TAG_FOR_HEAD#v}"
  SHOULD_PUBLISH="false"
else
  LAST_SUFFIX="$(git tag -l "v${BASE_VERSION}.*" \
    | grep -E "^v${ESCAPED_BASE}\.[0-9]+$" \
    | sed -E "s/^v${ESCAPED_BASE}\.([0-9]+)$/\1/" \
    | sort -n \
    | tail -1 || true)"

  if [[ -z "${LAST_SUFFIX}" ]]; then
    NEXT_SUFFIX=0
  else
    NEXT_SUFFIX=$((LAST_SUFFIX + 1))
  fi

  CI_VERSION="${BASE_VERSION}.${NEXT_SUFFIX}"
  SHOULD_PUBLISH="true"
fi

CI_VERSION="$CI_VERSION" node -e "const fs=require('fs');const p=require('./package.json');p.version=process.env.CI_VERSION;fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\\n');"

if [[ -n "${OUTPUT_FILE}" ]]; then
  echo "ci_version=${CI_VERSION}" >> "${OUTPUT_FILE}"
  echo "should_publish=${SHOULD_PUBLISH}" >> "${OUTPUT_FILE}"
else
  echo "ci_version=${CI_VERSION}"
  echo "should_publish=${SHOULD_PUBLISH}"
fi

echo "Using extension version: ${CI_VERSION}"

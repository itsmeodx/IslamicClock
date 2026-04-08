#!/bin/bash

# Build the project with relative paths for extension compatibility
echo "Building Islamic Clock core..."
pnpm exec vite build --base ./ --outDir extension-dist/chrome

# Prepare Firefox version
echo "Preparing Firefox version..."
cp -r extension-dist/chrome extension-dist/firefox

# --- Generate Chrome Manifest ---
cat > extension-dist/chrome/manifest.json <<EOF
{
  "manifest_version": 3,
  "name": "Islamic Clock New Tab",
  "version": "1.0.0",
  "description": "Replaces the new tab page with a beautiful, premium Islamic Clock.",
  "chrome_url_overrides": {
    "newtab": "index.html"
  },
  "icons": {
    "16": "favicon.png",
    "48": "pwa-192x192.png",
    "128": "pwa-512x512.png"
  },
  "permissions": []
}
EOF

# --- Generate Firefox Manifest ---
cat > extension-dist/firefox/manifest.json <<EOF
{
  "manifest_version": 3,
  "name": "Islamic Clock New Tab",
  "version": "1.0.0",
  "description": "Replaces the new tab page with a beautiful, premium Islamic Clock.",
  "chrome_url_overrides": {
    "newtab": "index.html"
  },
  "icons": {
    "16": "favicon.png",
    "48": "pwa-192x192.png",
    "128": "pwa-512x512.png"
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "islamic-clock@itsmeodx.github.io"
    }
  },
  "permissions": []
}
EOF

# --- Create Packaging ---
echo "Creating packages..."
cd extension-dist
zip -r ../chrome.zip chrome > /dev/null
cd firefox
zip -r ../../firefox.xpi . > /dev/null
cd ../..

echo "-------------------------------------------------------"
echo "Build complete!"
echo "-------------------------------------------------------"
echo "CHROME/EDGE/BRAVE: chrome.zip created."
echo "FIREFOX: firefox.xpi created."
echo "-------------------------------------------------------"

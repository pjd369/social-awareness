#!/usr/bin/env bash
# Rebuilds the tiny font used only for the language-switch label (ગુજરાતી),
# so it renders correctly on devices with no Gujarati font, without loading
# the full script font while English is active. Requires: pip install fonttools brotli
# Run from the repository root after changing the labels in src/i18n/languages.ts.
set -euo pipefail
OUT=src/assets/fonts
GU=node_modules/@fontsource/noto-sans-gujarati/files/noto-sans-gujarati-gujarati-400-normal.woff2
pyftsubset "$GU" --text="ગુજરાતી" --layout-features='*' --flavor=woff2 --output-file="$OUT/switch-gujarati.woff2"
cp node_modules/@fontsource/noto-sans-gujarati/LICENSE "$OUT/OFL-LICENSE.txt"
ls -la "$OUT"

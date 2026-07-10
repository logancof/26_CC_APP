#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"
npm run render-scoreboards

echo
echo "Scoreboard render complete. You can close this window."
read -r -p "Press Return to exit."

#!/bin/bash
# MarketBeaconPro Lighthouse CI Validation Script
# Runs Lighthouse and fails if thresholds are not met

set -e

echo "🔍 Running Lighthouse CI validation..."

# Install Lighthouse CLI if not present
if ! command -v lhci &> /dev/null; then
    echo "Installing Lighthouse CI..."
    npm install -g @lhci/cli
fi

# Run Lighthouse in CI mode
lhci autorun --target=https://marketbeaconpro.com

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ Lighthouse CI validation passed"
else
    echo "❌ Lighthouse CI validation failed"
    echo "Please review the failing URLs and metrics in the Lighthouse report"
    exit 1
fi

#!/bin/bash

# Codacy CLI wrapper using local binary
# This script runs Codacy analysis using the local binary

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_BINARY="$SCRIPT_DIR/codacy-cli-v2"

# Check if binary exists
if [ ! -f "$CLI_BINARY" ]; then
    echo "Error: Codacy CLI binary not found at $CLI_BINARY"
    exit 1
fi

# Run the CLI with provided arguments
"$CLI_BINARY" "$@"

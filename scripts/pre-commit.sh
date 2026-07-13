#!/bin/bash
# AegisAI StadiumOS — Git Pre-Commit Quality Hook

echo "========================================="
echo "Running AegisAI pre-commit validation..."
echo "========================================="

# 1. Run type checks and linters
echo "Step 1: Running Linter & Compiler Check..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linter checks failed. Commit aborted."
  exit 1
fi
echo "✓ Linter check passed."

# 2. Run test suites
echo "Step 2: Running Automated Vitest Suite..."
npm run test
if [ $? -ne 0 ]; then
  echo "❌ Test suite failed. Commit aborted."
  exit 1
fi
echo "✓ All tests passed successfully."

echo "========================================="
echo "✓ AegisAI pre-commit validation SUCCESS."
echo "========================================="
exit 0

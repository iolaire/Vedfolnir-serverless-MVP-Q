#!/bin/bash
# Test that app builds and runs locally

set -e

echo "🧪 Testing local development..."

# Test 1: Build works
echo "1. Testing build..."
npm run build
echo "✅ Build successful"

# Test 2: Dev server starts and responds
echo "2. Testing dev server..."
npm run dev & sleep 5

# Test if server is responding
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Dev server running and responding"
else
    echo "❌ Dev server not responding"
    pkill -f "vite" || true
    exit 1
fi

# Clean up
pkill -f "vite" || true
echo "✅ Local testing complete"

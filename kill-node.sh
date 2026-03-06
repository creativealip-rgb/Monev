#!/bin/bash
# ============================================
# Monev - Kill Background Node.js Processes
# ============================================
# This script kills all Node.js processes that may be holding ports
# Usage: ./kill-node.sh

echo ""
echo "=========================================="
echo " Monev - Kill Background Processes"
echo "=========================================="
echo ""

echo "[1/3] Finding Node.js processes..."
echo ""

# List all Node processes
ps aux | grep node | grep -v grep

if [ $? -eq 1 ]; then
    echo "[INFO] No Node.js processes found"
    exit 0
fi

echo ""
echo "[2/3] Killing Node.js processes..."
echo ""

# Kill all Node.js processes
pkill -9 node

if [ $? -eq 0 ]; then
    echo "[OK] All Node.js processes killed successfully"
else
    echo "[WARN] Some processes could not be killed"
    echo "Try running with: sudo ./kill-node.sh"
fi

echo ""
echo "[3/3] Cleaning up..."
echo ""

# Wait a moment for processes to fully terminate
sleep 2

# Clean up .next cache (optional - uncomment if needed)
# echo "Cleaning .next cache..."
# if [ -d ".next" ]; then
#     rm -rf .next
#     echo "[OK] .next cache cleaned"
# fi

echo ""
echo "=========================================="
echo " Done! You can now run: npm run dev"
echo "=========================================="
echo ""

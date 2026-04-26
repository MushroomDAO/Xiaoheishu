#!/bin/bash
pkill -f "vite" 2>/dev/null || true
pkill -f "electron" 2>/dev/null || true
sleep 0.5
pnpm run dev

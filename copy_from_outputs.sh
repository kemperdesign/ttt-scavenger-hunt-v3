#!/bin/bash
# Copies all TimeQuest project files from the Claude outputs folder to this directory.
# Run once from ~/Desktop/TTT:  bash copy_from_outputs.sh

SRC="/Users/damiankemper/Library/Application Support/Claude/local-agent-mode-sessions/01f343ff-9990-4f37-a01e-9619175bbce5/b264d91c-5b18-4361-8629-4d150c42503e/agent/local_ditto_b264d91c-5b18-4361-8629-4d150c42503e/outputs"
DST="$(cd "$(dirname "$0")" && pwd)"

echo "Copying TimeQuest project files..."
echo "  From: $SRC"
echo "  To:   $DST"
echo ""

rsync -av \
  --exclude="CalendarDigest.gs" \
  --exclude="CalendarDigest-Setup.md" \
  --exclude="timequest-tracker.html" \
  --exclude="copy_from_outputs.sh" \
  "$SRC/" "$DST/"

echo ""
echo "Done! Files in $DST:"
find "$DST" -type f | sort

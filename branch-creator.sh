#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
#  branch-creator.sh
#
#  1️⃣  Verify we’re in a Git repo.
#  2️⃣  Show a short menu: (c) Switch branch, (a) Add branch, (s) Stage commit.
#  3️⃣  *Switch branch*: list all local branches → checkout chosen one.
#  4️⃣  *Add branch*:  prompt for name → create from main → push new branch.
#  5️⃣  *Stage commit*: git add . → ask for message → confirm → commit → push.
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail
IFS=$'\n\t'

# ---------- 1️⃣  Verify we’re inside a Git repo --------------------------------
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  echo "❌  This script must be run inside a Git repository." >&2
  exit 1
fi

# ---------- 2️⃣  Show menu ----------------------------------------------------
echo
echo "⚙️  What would you like to do?"
echo "   (c) Switch to an existing branch"
echo "   (a) Add a new branch"
echo "   (s) Stage a commit & push"
read -r -p "Choose: [c/a/s] " choice
choice=${choice:-c}
case $choice in
  c|C) action=switch ;;
  a|A) action=create ;;
  s|S) action=stage ;;
  *) echo "❌  Unknown choice." >&2; exit 1 ;;
esac

# ---------- 3️⃣  Action: Switch branch ----------------------------------------
if [[ $action == switch ]]; then
  branches=$(git branch --format="%(refname:short)")
  echo
  echo "📁  Local branches:"
  i=0
  declare -a BR
  while IFS= read -r b; do
    BR+=("$b")
    echo "   [$i] $b"
    ((i++))
  done <<<"$branches"

  read -r -p "Select branch number to checkout: " idx
  if ! [[ $idx =~ ^[0-9]+$ ]] || (( idx < 0 || idx >= ${#BR[@]} )); then
    echo "❌  Invalid index." >&2; exit 1
  fi
  git checkout "${BR[$idx]}"
  echo "✔  Switched to branch '${BR[$idx]}'."
  exit 0
fi

# ---------- 4️⃣  Action: Add new branch ---------------------------------------
if [[ $action == create ]]; then
  read -r -p "Enter name for new branch (default: upgrades): " nb
  nb=${nb:-upgrades}

  # If branch already exists, abort
  if git rev-parse --verify "$nb" >/dev/null 2>&1; then
    echo "⚠️  Branch '$nb' already exists."
    exit 1
  fi

  echo
  echo "⚠️  About to create branch '$nb' from 'main' and push it."
  read -r -p "Proceed? (y/N): " pr
  pr=${pr:-N}
  if [[ ! $pr =~ ^[Yy]$ ]]; then
    echo "❌  Aborted."
    exit 0
  fi

  git fetch origin
  git checkout main
  git pull origin main
  git checkout -b "$nb"
  git push -u origin "$nb"

  echo "✔  Branch '$nb' created, checked out, and pushed."
  exit 0
fi

# ---------- 5️⃣  Action: Stage commit -----------------------------------------
if [[ $action == stage ]]; then
  # Stage everything
  git add .
  echo
  echo "✅  Staged changes."
  read -r -p "Enter commit message: " msg
  msg=${msg:-"No message"}
  current_branch=$(git rev-parse --abbrev-ref HEAD)
  echo
  echo "📝  Commit details:"
  echo "   Branch : $current_branch"
  echo "   Message: $msg"
  read -r -p "Commit and push to '$current_branch'? (y/N): " push_choice
  push_choice=${push_choice:-N}
  if [[ $push_choice =~ ^[Yy]$ ]]; then
    git commit -m "$msg"
    git push
    echo "✔  Commit pushed to '$current_branch'."
  else
    echo "❌  Commit not pushed."
  fi
  exit 0
fi
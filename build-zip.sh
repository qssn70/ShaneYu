#!/usr/bin/env bash
set -euo pipefail

# The build command has already compiled and packaged the Halo theme.
# Only normalize the archive name here; do not mutate theme.yaml or rebuild.
dist_dir="dist"
target="$dist_dir/halo-theme-ShaneYu.zip"

shopt -s nullglob
archives=("$dist_dir"/*.zip)

if [ "${#archives[@]}" -ne 1 ]; then
  echo "Expected exactly one ZIP in $dist_dir, found ${#archives[@]}." >&2
  exit 1
fi

source_archive="${archives[0]}"
if [ "$source_archive" != "$target" ]; then
  mv -f -- "$source_archive" "$target"
fi

unzip -tqq "$target"
echo "Halo theme package ready: $target"

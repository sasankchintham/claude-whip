#!/usr/bin/env bash
# Installs the Whip GNOME Shell extension for the current user (GNOME 46 on Wayland or X11).
# Press Super+W to crack the whip anywhere on screen; the Claude Code plugin cracks it too.
set -eu
src="$(cd "$(dirname "$0")" && pwd)/whip-groomer@local"
dest="$HOME/.local/share/gnome-shell/extensions/whip-groomer@local"

command -v gnome-shell >/dev/null || { echo "GNOME Shell not found; this extension only works on GNOME." >&2; exit 1; }
mkdir -p "$(dirname "$dest")"
rm -rf "$dest"
cp -r "$src" "$dest"
glib-compile-schemas "$dest/schemas"
gnome-extensions enable whip-groomer@local 2>/dev/null || true

echo "Installed. Log out and back in once, then press Super+W."

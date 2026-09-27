# claude-whip

Crack a whip on your screen when Claude is taking its time. A tiny stress-buster for developers.

It comes in three pieces; use whichever fit your setup.

| Piece | What it does | Works on |
|---|---|---|
| **Claude Code plugin** | Once Claude has been working for 10 seconds, cracks the whip every 3 seconds, at most 5 times per task | Anywhere Claude Code runs |
| **VS Code extension** ("Whip Crack") | Draws the whip at your cursor in the editor; `Ctrl+Alt+W` or the plugin triggers it | macOS, Windows, Linux |
| **GNOME extension** | Draws the whip anywhere on screen at your mouse; `Super+W` or the plugin triggers it | Linux with GNOME 46 |

The plugin only decides *when* to crack. The whip itself is drawn by the GNOME extension if it's installed, otherwise by the VS Code extension.

## Install

**Claude Code plugin**

```
/plugin marketplace add sasankchintham/claude-whip
/plugin install claude-whip@claude-whip
```

**VS Code extension:** search for "Whip Crack" in the Extensions view.

**GNOME extension (Linux):**

```
git clone https://github.com/sasankchintham/claude-whip
./claude-whip/gnome-extension/install.sh
```

Then log out and back in once.

## Settings

- `CLAUDE_WHIP_DELAY`: seconds before the first crack (default `10`).
- `CLAUDE_WHIP_INTERVAL`: seconds between cracks after that (default `3`).

Set them in the `env` section of `~/.claude/settings.json`, for example `"env": {"CLAUDE_WHIP_INTERVAL": "5"}`.
- VS Code: `whip.sound` and `whip.claudeCode` in Settings.

## It never disturbs Claude

The plugin's hooks print nothing, return immediately, and run a small background timer that stops as soon as Claude finishes, asks for permission, or the session ends. Claude never sees any of it. It cracks at most 5 times per task, and stops early if Claude asks you a question or needs permission, so it never keeps going while you type.

## Security

- No network access, no telemetry, no third-party dependencies.
- The plugin only writes one empty file, `~/.claude-whip/crack` (in a folder only you can read), to signal the VS Code extension. The VS Code extension never writes anything and only checks that file's timestamp.
- No shell ever sees input from Claude or your projects; the only data taken from hook input is the session ID, reduced to letters, digits and dashes.
- The GNOME extension accepts one D-Bus call, `Crack`, which takes no arguments and shows at most 3 whips at once.

## Credits

Whip sound: ["Whip 06" by Universfield](https://pixabay.com/sound-effects/film-special-effects-whip-06-487886/) on Pixabay, used under the Pixabay Content License.

## License

The code is MIT. The whip sound is not: it is covered by the Pixabay Content License (see [LICENSE](LICENSE) and Credits above).

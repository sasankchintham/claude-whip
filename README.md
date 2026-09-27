# claude-whip

Crack a whip on your screen when Claude is taking its time. A tiny stress-buster for developers.

It comes in two pieces:

| Piece | What it does |
|---|---|
| **Claude Code plugin** | Once Claude has been working for 10 seconds, cracks the whip every 3 seconds, at most 5 times per task |
| **GNOME extension** | Draws the whip anywhere on screen at your mouse, with sound; `Super+W` or the plugin triggers it |

The plugin only decides *when* to crack; the GNOME extension draws it. Currently this needs **Linux with GNOME 46** (e.g. Ubuntu 24.04). On other systems the plugin installs fine but does nothing.

## Install

**1. GNOME extension**

```
git clone https://github.com/sasankchintham/claude-whip ~/claude-whip
~/claude-whip/gnome-extension/install.sh
```

Log out and back in once, then press `Super+W` to test it.

**2. Claude Code plugin** (inside Claude Code)

```
/plugin marketplace add sasankchintham/claude-whip
/plugin install claude-whip@claude-whip
```

Then restart Claude Code.

## Settings

- `CLAUDE_WHIP_DELAY`: seconds before the first crack (default `10`).
- `CLAUDE_WHIP_INTERVAL`: seconds between cracks after that (default `3`).

Set them in the `env` section of `~/.claude/settings.json`, for example `"env": {"CLAUDE_WHIP_INTERVAL": "5"}`.

## It never disturbs Claude

The plugin contains only hooks: no skills, commands, agents, or MCP servers. Its hooks print nothing, return immediately, and run a small background timer that stops as soon as Claude finishes, asks you a question, needs permission, or the session ends. Claude never sees any of it. It cracks at most 5 times per task, so it never keeps going while you type.

## Security

- No network access, no telemetry, no third-party dependencies.
- It never reads, changes, or creates files in your projects. The only file it writes is its own timer's process ID, in your private runtime folder (`$XDG_RUNTIME_DIR/claude-whip/`).
- From the hook input it uses only the session ID, reduced to letters, digits and dashes. Your prompts and project paths are ignored.
- The GNOME extension accepts one D-Bus call, `Crack`, which takes no arguments and shows at most 3 whips at once.

## Credits

Whip sound: ["Whip 06" by Universfield](https://pixabay.com/sound-effects/film-special-effects-whip-06-487886/) on Pixabay, used under the Pixabay Content License.

## License

The code is MIT. The whip sound is not: it is covered by the Pixabay Content License (see [LICENSE](LICENSE) and Credits above).

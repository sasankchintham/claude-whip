# Whip Crack

Crack a whip right at your cursor. A tiny stress-buster for when the build is red, the tests are flaky, or the AI is taking its time.

## Usage

Put your cursor anywhere in a file and press **Ctrl+Alt+W**, or run **Whip: Crack the Whip** from the Command Palette.

The lash swings in, snaps at your cursor, and cracks. Near the left edge of a line it swings in from the right instead.

To change the shortcut, open **Keyboard Shortcuts** and search for `whip.crack`.

## Crack it when Claude is slow

Install the [claude-whip plugin for Claude Code](https://github.com/sasankchintham/claude-whip) and the whip cracks in your editor whenever Claude has been thinking for more than 10 seconds. It never interrupts or slows down Claude.

## Settings

| Setting | Default | Description |
|---|---|---|
| `whip.sound` | `true` | Play the whip-crack sound. |
| `whip.claudeCode` | `true` | Crack when the Claude Code plugin says Claude is taking a while. |

## Privacy and security

- No network access, no telemetry.
- Never writes, modifies, or deletes any file. It only reads its own bundled image and sound, and checks the timestamp (never the contents) of `~/.claude-whip/crack`, which the Claude Code plugin touches.
- No third-party dependencies.
- The only process it starts is your system's audio player (`afplay` on macOS, `pw-play`/`paplay`/`aplay` on Linux, PowerShell's `SoundPlayer` on Windows), with the bundled sound file as its only input and no shell.
- Safe in untrusted workspaces: it never reads workspace files.
- In remote sessions (SSH, WSL, containers) it runs on your local machine, so the sound plays where you are.

## Credits

Whip sound: ["Whip 06" by Universfield](https://pixabay.com/sound-effects/film-special-effects-whip-06-487886/) on Pixabay, used under the Pixabay Content License.

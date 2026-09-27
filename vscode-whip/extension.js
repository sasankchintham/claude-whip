'use strict';
// Security model: no network, no file writes, no shell. The only files read are this
// extension's own media, plus the modification time (never the contents) of the Claude Code
// plugin's signal file. The only process started is the OS audio player with our bundled
// sound file as its sole argument. Nothing from the workspace reaches either.
const vscode = require('vscode');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFile} = require('child_process');

// the claude-whip Claude Code plugin updates this file's timestamp when Claude is slow
const SIGNAL_FILE = path.join(os.homedir(), '.claude-whip', 'crack');
const SIGNAL_POLL_MS = 400;

// must match the size and tip position printed by tools/make-vscode-svg.js
const WHIP = {width: 405, height: 374, tipX: 270, tipY: 284};
const DURATION_MS = 800;
const MAX_ACTIVE = 3;
// the editor clips anything outside it, so flip the whip when the handle would be cut off
const GUTTER_PX = 60;
const CHAR_WIDTH_RATIO = 0.6;

let images;
let soundPath;
let active = 0;
let count = 0;

function activate(context) {
    const media = name => fs.readFileSync(path.join(context.extensionPath, 'media', name), 'utf8');
    images = {
        '': media('whip.svg'),
        'left': media('whip-left.svg'),
        'up': media('whip-up.svg'),
        'left-up': media('whip-left-up.svg'),
    };
    soundPath = path.join(context.extensionPath, 'media', 'whip.wav');
    context.subscriptions.push(vscode.commands.registerCommand('whip.crack', crack));

    // watchFile polls stat(), which also works before the plugin has created the file
    const onSignal = (curr, prev) => {
        if (curr.mtimeMs > prev.mtimeMs && vscode.window.state.focused &&
            vscode.workspace.getConfiguration('whip').get('claudeCode', true))
            crack();
    };
    fs.watchFile(SIGNAL_FILE, {interval: SIGNAL_POLL_MS, persistent: false}, onSignal);
    context.subscriptions.push({dispose: () => fs.unwatchFile(SIGNAL_FILE, onSignal)});
}

function visualColumn(editor, pos) {
    const tabSize = Number(editor.options.tabSize) || 4;
    let col = 0;
    for (const ch of editor.document.lineAt(pos.line).text.slice(0, pos.character))
        col = ch === '\t' ? col + tabSize - (col % tabSize) : col + 1;
    return col;
}

// rough pixel room above and left of the cursor; the API has no pixel coordinates
function roomAroundCursor(editor, pos) {
    const config = vscode.workspace.getConfiguration('editor', editor.document);
    const fontSize = Number(config.get('fontSize')) || 14;
    const lh = Number(config.get('lineHeight')) || 0;
    const lineHeight = lh === 0 ? fontSize * (process.platform === 'darwin' ? 1.5 : 1.35)
        : lh < 8 ? fontSize * lh : lh;
    const firstVisible = editor.visibleRanges.length ? editor.visibleRanges[0].start.line : 0;
    return {
        above: (pos.line - firstVisible) * lineHeight,
        left: GUTTER_PX + visualColumn(editor, pos) * fontSize * CHAR_WIDTH_RATIO,
    };
}

// The cursor, or when it's scrolled out of view (e.g. you're typing in the terminal),
// the end of the middle visible line so the whip still shows.
function targetPosition(editor) {
    const pos = editor.selection.active;
    if (!editor.visibleRanges.length || editor.visibleRanges.some(r => r.contains(pos)))
        return pos;
    const r = editor.visibleRanges[0];
    const line = Math.floor((r.start.line + r.end.line) / 2);
    return editor.document.lineAt(line).range.end;
}

function crack() {
    if (active >= MAX_ACTIVE)
        return;
    const editor = vscode.window.activeTextEditor ?? vscode.window.visibleTextEditors[0];
    if (!editor) {
        playSound();
        return;
    }

    const pos = targetPosition(editor);
    const room = roomAroundCursor(editor, pos);
    const flipX = room.left < WHIP.tipX * 0.8;
    const flipY = room.above < WHIP.tipY * 0.8;
    const tipX = flipX ? WHIP.width - WHIP.tipX : WHIP.tipX;
    const tipY = flipY ? WHIP.height - WHIP.tipY : WHIP.tipY;
    const variant = [flipX && 'left', flipY && 'up'].filter(Boolean).join('-');
    // a unique comment makes each crack a new image, so the animation restarts from frame one
    const svg = `<!--${++count}-->` + images[variant];
    const url = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

    // Decorations can't be positioned freely, so the CSS rides in textDecoration (the same
    // technique the Power Mode extension uses). Every value here is a constant or base64.
    const css = [
        'none',
        'position: absolute',
        'display: inline-block',
        `width: ${WHIP.width}px`,
        `height: ${WHIP.height}px`,
        `margin-left: -${tipX}px`,
        `margin-top: -${tipY - 10}px`,
        `background: url("${url}") no-repeat`,
        'background-size: contain',
        'pointer-events: none',
        'z-index: 100',
    ].join('; ');

    const decoration = vscode.window.createTextEditorDecorationType({
        before: {contentText: '', textDecoration: css},
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    });
    editor.setDecorations(decoration, [new vscode.Range(pos, pos)]);
    active++;
    playSound();
    setTimeout(() => {
        decoration.dispose();
        active--;
    }, DURATION_MS);
}

function playSound() {
    if (!vscode.workspace.getConfiguration('whip').get('sound', true))
        return;
    const players = {
        darwin: [['afplay', [soundPath]]],
        linux: [['pw-play', [soundPath]], ['paplay', [soundPath]], ['aplay', ['-q', soundPath]]],
        // the path goes in through an environment variable so it is never parsed as PowerShell code
        win32: [['powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
            '(New-Object Media.SoundPlayer $env:WHIP_SOUND).PlaySync()']]],
    }[process.platform] ?? [];
    const options = {timeout: 5000, windowsHide: true, env: {...process.env, WHIP_SOUND: soundPath}};

    const tryPlayer = i => {
        if (i >= players.length)
            return;
        const [cmd, args] = players[i];
        execFile(cmd, args, options, err => {
            if (err && err.code === 'ENOENT')
                tryPlayer(i + 1);
        });
    };
    tryPlayer(0);
}

function deactivate() {}

module.exports = {activate, deactivate};

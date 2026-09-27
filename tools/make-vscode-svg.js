// Renders the GNOME whip animation into self-contained animated SVGs for the VS Code extension.
// Run: gjs -m tools/make-vscode-svg.js
import GLib from 'gi://GLib';
import {WHIP, ropePoints, segmentAngle, segmentWidth} from
    '../gnome-extension/whip-groomer@local/draw.js';

const ROOT = GLib.path_get_dirname(GLib.path_get_dirname(GLib.filename_from_uri(import.meta.url)[0]));
const OUT = GLib.build_filenamev([ROOT, 'vscode-whip', 'media']);
const SCALE = 0.45;
const FPS = 30;
// shrunk to editor size the laptop whip's lines go sub-pixel, so thicken the lash and its edge
const THICKEN = 1.8;
const EDGE = 7;

const r = v => Math.round(v * 10) / 10;
const clamp01 = v => Math.max(0, Math.min(1, v));
const ln = (x1, y1, x2, y2, w) =>
    `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke-width="${r(w)}"/>`;
const dot = (x, y, rad) => `<circle cx="${r(x)}" cy="${r(y)}" r="${rad}"/>`;

function frame(t) {
    const pts = ropePoints(t);
    const segs = extra => pts.slice(0, -1).map((p, i) => ln(...p, ...pts[i + 1], segmentWidth(i) * THICKEN + extra)).join('');
    const [gx, gy] = WHIP.grip;
    const ha = segmentAngle(0, t);
    const hx = gx - 105 * Math.cos(ha), hy = gy - 105 * Math.sin(ha);
    const px = -Math.sin(ha), py = Math.cos(ha);

    let s = `<g stroke="#c8c8c8" fill="#c8c8c8">${ln(hx, hy, gx, gy, 24 + EDGE)}${dot(hx, hy, 14 + EDGE / 2)}${segs(EDGE)}</g>`;
    s += `<g stroke="#050505" fill="#050505">${segs(0)}${ln(hx, hy, gx, gy, 24)}${dot(hx, hy, 14)}</g><g stroke="#4a4a4a">`;
    for (let k = 1; k <= 7; k++) {
        const cx = hx + (gx - hx) * k / 8, cy = hy + (gy - hy) * k / 8;
        s += ln(cx - 10 * px, cy - 10 * py, cx + 10 * px, cy + 10 * py, 3.5);
    }
    s += '</g>';

    const age = (t - WHIP.crackMs) / 240;
    if (age >= 0 && age < 1) {
        const [bx, by] = ropePoints(WHIP.crackMs).at(-1);
        if (age < 0.3)
            s += `<circle cx="${r(bx)}" cy="${r(by)}" r="${r(6 + 30 * age)}" fill="#fff" opacity="${r(0.85 * (1 - age / 0.3))}"/>`;
        s += `<g stroke="#ffed8c" opacity="${r(1 - age)}">`;
        for (let k = 0; k < 12; k++) {
            const a = k * Math.PI / 6 + 0.2, r0 = 12 + 40 * age, r1 = r0 + 16 + 16 * (k % 2);
            s += ln(bx + r0 * Math.cos(a), by + r0 * Math.sin(a), bx + r1 * Math.cos(a), by + r1 * Math.sin(a), 6);
        }
        s += '</g>';
    }
    const fade = r(1 - clamp01((t - (WHIP.totalMs - 180)) / 180));
    return `<g opacity="${fade}">${s}</g>`;
}

function svg(flipX, flipY) {
    const dt = 1 / FPS;
    const n = Math.ceil(WHIP.totalMs / 1000 * FPS);
    let frames = '';
    for (let i = 0; i < n; i++) {
        frames += `<g visibility="hidden"><set attributeName="visibility" to="visible" begin="${r(i * dt * 1000) / 1000}s" dur="${r(dt * 1000) / 1000}s"/>${frame(i * dt * 1000)}</g>`;
    }
    const flip = flipX || flipY
        ? ` transform="translate(${flipX ? WHIP.width : 0} ${flipY ? WHIP.height : 0}) scale(${flipX ? -1 : 1} ${flipY ? -1 : 1})"`
        : '';
    const w = Math.round(WHIP.width * SCALE), h = Math.round(WHIP.height * SCALE);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WHIP.width} ${WHIP.height}" width="${w}" height="${h}">` +
        `<g stroke-linecap="round"${flip}>${frames}</g></svg>\n`;
}

// whip.svg swings down from the upper left; the others are mirrored for cursors near an edge
GLib.file_set_contents(`${OUT}/whip.svg`, svg(false, false));
GLib.file_set_contents(`${OUT}/whip-left.svg`, svg(true, false));
GLib.file_set_contents(`${OUT}/whip-up.svg`, svg(false, true));
GLib.file_set_contents(`${OUT}/whip-left-up.svg`, svg(true, true));
print(`size ${Math.round(WHIP.width * SCALE)}x${Math.round(WHIP.height * SCALE)}, ` +
    `tip at ${Math.round(WHIP.tip[0] * SCALE)},${Math.round(WHIP.tip[1] * SCALE)}`);

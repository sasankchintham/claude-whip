// Renders the 128x128 marketplace icon from the whip mid-crack. Run: gjs -m tools/make-icon.js
import Cairo from 'cairo';
import GLib from 'gi://GLib';
import {WHIP, drawWhip} from
    '../gnome-extension/whip-groomer@local/draw.js';

const SIZE = 128;
const surface = new Cairo.ImageSurface(Cairo.Format.ARGB32, SIZE, SIZE);
const cr = new Cairo.Context(surface);

cr.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, 2 * Math.PI);
cr.setSourceRGB(0.96, 0.78, 0.3);
cr.fill();

// crop to the handle, the curling lash and the tip
const crop = {x: 170, y: 260, w: 500, h: 440};
const s = SIZE / Math.max(crop.w, crop.h) * 0.9;
cr.translate(SIZE / 2 - (crop.x + crop.w / 2) * s, SIZE / 2 - (crop.y + crop.h / 2) * s);
cr.scale(s, s);
drawWhip(cr, 265);

// bold burst at the tip; the animation's own burst is too thin to read at icon size
const [tx, ty] = WHIP.tip;
cr.setSourceRGB(1, 1, 1);
cr.setLineWidth(14);
cr.setLineCap(Cairo.LineCap.ROUND);
for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4 + 0.3;
    const r0 = 30, r1 = k % 2 ? 62 : 80;
    cr.moveTo(tx + r0 * Math.cos(a), ty + r0 * Math.sin(a));
    cr.lineTo(tx + r1 * Math.cos(a), ty + r1 * Math.sin(a));
    cr.stroke();
}

const root = GLib.path_get_dirname(GLib.path_get_dirname(GLib.filename_from_uri(import.meta.url)[0]));
surface.writeToPNG(GLib.build_filenamev([root, 'vscode-whip', 'media', 'icon.png']));
cr.$dispose();

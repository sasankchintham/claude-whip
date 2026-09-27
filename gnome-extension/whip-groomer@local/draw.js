import Cairo from 'cairo';

export const WHIP = {
    width: 900,
    height: 830,
    tip: [600, 630],
    grip: [290, 370],
    segments: 40,
    swingMs: 420,
    crackMs: 300,
    totalMs: 760,
};

const ROPE_LEN = Math.hypot(WHIP.tip[0] - WHIP.grip[0], WHIP.tip[1] - WHIP.grip[1]);
const AIM = Math.atan2(WHIP.tip[1] - WHIP.grip[1], WHIP.tip[0] - WHIP.grip[0]);
const LAG = 0.5;

const clamp01 = v => Math.max(0, Math.min(1, v));

function easeOutBack(s) {
    const c1 = 1.4;
    return 1 + (c1 + 1) * (s - 1) ** 3 + c1 * (s - 1) ** 2;
}

function line(cr, x1, y1, x2, y2, w) {
    cr.setLineWidth(w);
    cr.moveTo(x1, y1);
    cr.lineTo(x2, y2);
    cr.stroke();
}

// Each segment starts curled back over the shoulder and swings toward the cursor;
// segments further down the rope start later, so a loop travels out to the tip.
export function segmentAngle(i, elapsed) {
    const f = i / (WHIP.segments - 1);
    const start = AIM - 2.3 - 1.4 * f;
    const s = clamp01((clamp01(elapsed / WHIP.swingMs) - LAG * f) / (1 - LAG));
    const droop = 0.45 * f ** 1.5 * clamp01((elapsed - WHIP.swingMs) / 260);
    return start + (AIM - start) * easeOutBack(s) + droop;
}

// the last few segments are the thin "cracker" string tied to the end of the lash
const CRACKER = WHIP.segments - 5;
export const segmentWidth = i => i >= CRACKER ? 1.6 : 1.8 + 8 * (1 - i / CRACKER) ** 1.3;

export function ropePoints(elapsed) {
    const segLen = ROPE_LEN / WHIP.segments;
    let [x, y] = WHIP.grip;
    const pts = [[x, y]];
    for (let i = 0; i < WHIP.segments; i++) {
        const a = segmentAngle(i, elapsed);
        x += segLen * Math.cos(a);
        y += segLen * Math.sin(a);
        pts.push([x, y]);
    }
    return pts;
}

function drawCrack(cr, elapsed) {
    const age = (elapsed - WHIP.crackMs) / 240;
    if (age < 0 || age >= 1)
        return;
    const pts = ropePoints(WHIP.crackMs);
    const [bx, by] = pts[pts.length - 1];
    const a = 1 - age;

    if (age < 0.3) {
        cr.setSourceRGBA(1, 1, 1, 0.85 * (1 - age / 0.3));
        cr.arc(bx, by, 6 + 30 * age, 0, 2 * Math.PI);
        cr.fill();
    }

    cr.setSourceRGBA(1, 0.93, 0.55, a);
    for (let k = 0; k < 12; k++) {
        const ang = k * Math.PI / 6 + 0.2;
        const r0 = 10 + 34 * age;
        const r1 = r0 + 10 + 12 * (k % 2);
        line(cr, bx + r0 * Math.cos(ang), by + r0 * Math.sin(ang),
            bx + r1 * Math.cos(ang), by + r1 * Math.sin(ang), 3);
    }
}

export function drawWhip(cr, elapsed) {
    const pts = ropePoints(elapsed);
    const n = WHIP.segments;
    const width = segmentWidth;
    const [gx, gy] = WHIP.grip;
    const ha = segmentAngle(0, elapsed);
    const hx = gx - 105 * Math.cos(ha);
    const hy = gy - 105 * Math.sin(ha);

    const fade = 1 - clamp01((elapsed - (WHIP.totalMs - 180)) / 180);
    cr.pushGroup();
    cr.setLineCap(Cairo.LineCap.ROUND);

    // thin grey edge keeps the black whip visible on dark terminals
    cr.setSourceRGBA(0.55, 0.55, 0.55, 1);
    line(cr, hx, hy, gx, gy, 18);
    cr.arc(hx, hy, 12, 0, 2 * Math.PI);
    cr.fill();
    for (let i = 0; i < n; i++)
        line(cr, ...pts[i], ...pts[i + 1], width(i) + 2.5);

    cr.setSourceRGBA(0.02, 0.02, 0.02, 1);
    for (let i = 0; i < n; i++)
        line(cr, ...pts[i], ...pts[i + 1], width(i));
    line(cr, hx, hy, gx, gy, 15);
    cr.arc(hx, hy, 10, 0, 2 * Math.PI);
    cr.fill();
    cr.setSourceRGBA(0.22, 0.22, 0.22, 1);
    const px = -Math.sin(ha), py = Math.cos(ha);
    for (let k = 1; k <= 7; k++) {
        const cx = hx + (gx - hx) * k / 8;
        const cy = hy + (gy - hy) * k / 8;
        line(cr, cx - 6 * px, cy - 6 * py, cx + 6 * px, cy + 6 * py, 2);
    }

    drawCrack(cr, elapsed);
    cr.popGroupToSource();
    cr.paintWithAlpha(fade);
}

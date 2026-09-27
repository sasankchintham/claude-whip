"""Synthesizes an original whip-crack sound (no samples used), so it can be shipped under our own licence.

A real crack is a sonic boom from the tip: an air whoosh rising in pitch as the lash accelerates,
then a ~1 ms N-shaped pressure spike, a few echoes of it, and a short room tail.
Usage: python3 make-whip-sound.py OUT.wav [variant a|b|c]
"""
import math
import random
import struct
import sys
import wave

RATE = 44100
CRACK_AT = 0.30  # seconds; the on-screen tip snaps at 300 ms

VARIANTS = {
    # whoosh loudness, crack echoes (delay ms, gain), body weight, room size, seed
    'a': dict(whoosh=0.18, echoes=[(2.5, 0.45), (6.0, 0.2)], body=0.35, room=0.18, seed=11),
    'b': dict(whoosh=0.28, echoes=[(1.8, 0.6), (4.2, 0.35), (9.0, 0.15)], body=0.5, room=0.25, seed=23),
    'c': dict(whoosh=0.12, echoes=[(3.0, 0.3)], body=0.2, room=0.12, seed=5),
}


def svf_bandpass(samples, cutoff_fn, q=0.7):
    low = band = 0.0
    out = []
    for i, x in enumerate(samples):
        f = 2 * math.sin(math.pi * min(cutoff_fn(i), RATE / 6) / RATE)
        low += f * band
        high = x - low - q * band
        band += f * high
        out.append(band)
    return out


def one_pole_lowpass(samples, a):
    y = 0.0
    out = []
    for x in samples:
        y += a * (x - y)
        out.append(y)
    return out


def n_wave(duration_ms):
    """Sharp rise, linear fall through zero, sharp return: the shape of a sonic boom."""
    n = max(4, int(RATE * duration_ms / 1000))
    return [1 - 2 * k / (n - 1) for k in range(n)]


def reverb(samples, size, wet):
    combs = [int(d * size * 10) for d in (1557, 1617, 1491, 1422)]
    out = [0.0] * len(samples)
    for d in combs:
        buf = [0.0] * d
        idx = 0
        for i, x in enumerate(samples):
            y = buf[idx]
            buf[idx] = x + y * 0.78
            idx = (idx + 1) % d
            out[i] += y / len(combs)
    for d, g in ((225, 0.5), (556, 0.5)):
        buf = [0.0] * d
        idx = 0
        for i in range(len(out)):
            b = buf[idx]
            y = -out[i] + b
            buf[idx] = out[i] + b * g
            idx = (idx + 1) % d
            out[i] = y
    return [s + wet * r for s, r in zip(samples, out)]


def make(v):
    random.seed(v['seed'])
    n = int(RATE * 0.8)
    c = int(RATE * CRACK_AT)
    noise = [random.uniform(-1, 1) for _ in range(n)]

    # whoosh: pitch and loudness climb as the lash speeds up, cut off by the crack
    lead = int(RATE * 0.26)
    start = c - lead
    whoosh = svf_bandpass(noise, lambda i: 250 + 3500 * max(0, (i - start) / lead) ** 2, q=0.9)
    out = [0.0] * n
    for i in range(start, c):
        t = (i - start) / lead
        out[i] = whoosh[i] * v['whoosh'] * (t ** 2.2) * 3

    # the crack: an N-wave plus echoes from the lash and the ground
    for delay_ms, gain in [(0, 1.0)] + v['echoes']:
        at = c + int(RATE * delay_ms / 1000)
        for k, s in enumerate(n_wave(0.9 - 0.15 * (delay_ms > 0))):
            if at + k < n:
                out[at + k] += gain * s

    # bright hiss and a low body right after the boom make it sound like air, not a click
    bright = [x - y for x, y in zip(noise, one_pole_lowpass(noise, 0.25))]
    body = one_pole_lowpass(noise, 0.04)
    for i in range(c, n):
        dt = (i - c) / RATE
        out[i] += 0.55 * bright[i] * math.exp(-dt / 0.006)
        out[i] += v['body'] * 6 * body[i] * math.exp(-dt / 0.025)

    out = reverb(out, v['room'], 0.35)
    out = [math.tanh(1.6 * s) for s in out]
    fade = int(RATE * 0.08)
    for k in range(fade):
        out[n - fade + k] *= 1 - k / fade
    return out


def write(path, samples):
    peak = max(abs(s) for s in samples) or 1.0
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b''.join(struct.pack('<h', int(s / peak * 0.95 * 32767)) for s in samples))


if __name__ == '__main__':
    write(sys.argv[1], make(VARIANTS[sys.argv[2] if len(sys.argv) > 2 else 'a']))

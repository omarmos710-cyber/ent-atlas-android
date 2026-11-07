"""Draw ENT Atlas teaching figures as small inline SVGs (audiograms, tympanograms, speech, ABR, ECochG).
Colours come from CSS classes (clinic.css .ardraw) so the figures follow light and dark themes.
Output: content/clinic/draw/<name>.svg, inlined into articles by `!draw name | caption`."""
import math, os
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'content', 'clinic', 'draw')
F = [250, 500, 1000, 2000, 4000, 8000]
FL = {250: '250', 500: '500', 1000: '1k', 2000: '2k', 3000: '3k', 4000: '4k', 6000: '6k', 8000: '8k'}

def esc(s): return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def audiogram(name, title, series, note=None, normal=True):
    """series: list of (kind, {freq: dB or None}) kind in ACR, ACL, BCR, BCL, MBCR, MBCL. None = no response at 120."""
    W, H = 340, 314; x0, x1, y0, y1 = 46, 326, 48, 284
    lo, hi = math.log2(250), math.log2(8000)
    X = lambda f: x0 + (math.log2(f) - lo) / (hi - lo) * (x1 - x0)
    Y = lambda d: y0 + (d + 10) / 130 * (y1 - y0)
    s = ['<svg viewBox="0 0 %d %d" role="img" aria-label="%s" xmlns="http://www.w3.org/2000/svg">' % (W, H, esc(title))]
    s.append('<text class="tt" x="%d" y="16">%s</text>' % (x0, esc(title)))
    if normal: s.append('<rect class="nz" x="%.1f" y="%.1f" width="%.1f" height="%.1f"/>' % (x0, Y(-10), x1 - x0, Y(20) - Y(-10)))
    for d in range(-10, 121, 10):
        s.append('<line class="%s" x1="%d" y1="%.1f" x2="%d" y2="%.1f"/>' % ('g2' if d == 0 else 'g', x0, Y(d), x1, Y(d)))
        s.append('<text class="lb" x="%d" y="%.1f" text-anchor="end">%d</text>' % (x0 - 6, Y(d) + 3.5, d))
    for f in [250, 500, 1000, 2000, 3000, 4000, 6000, 8000]:
        s.append('<line class="%s" x1="%.1f" y1="%d" x2="%.1f" y2="%d"/>' % ('g' if f in F else 'g3', X(f), y0, X(f), y1))
        s.append('<text class="lb" x="%.1f" y="%d" text-anchor="middle">%s</text>' % (X(f), y0 - 5, FL[f]))
    s.append('<text class="lb" x="%d" y="%d" text-anchor="middle" transform="rotate(-90 %d %d)">Hearing level (dB HL)</text>' % (12, (y0 + y1) // 2, 12, (y0 + y1) // 2))
    s.append('<text class="lb" x="%d" y="%d" text-anchor="middle">Frequency (Hz)</text>' % ((x0 + x1) // 2, y1 + 18))
    for kind, pts in series:
        side = 'r' if kind.endswith('R') else 'l'
        fs = sorted(pts)
        if kind.startswith('AC'):
            path = []
            for f in fs:
                if pts[f] is not None: path.append('%.1f,%.1f' % (X(f), Y(pts[f])))
            if len(path) > 1: s.append('<polyline class="ln %s" points="%s"/>' % (side, ' '.join(path)))
        for f in fs:
            d = pts[f]; nr = d is None; d = (120 if kind.startswith('AC') else 70) if nr else d
            cx, cy = X(f), Y(d)
            if kind == 'ACR': s.append('<circle class="sy r" cx="%.1f" cy="%.1f" r="5.5"/>' % (cx, cy))
            elif kind == 'ACL': s.append('<path class="sy l" d="M%.1f %.1fl10 10m0 -10l-10 10"/>' % (cx - 5, cy - 5))
            elif kind == 'BCR': s.append('<path class="sy r" d="M%.1f %.1fl-7 6l7 6"/>' % (cx - 8, cy - 6))
            elif kind == 'BCL': s.append('<path class="sy l" d="M%.1f %.1fl7 6l-7 6"/>' % (cx + 8, cy - 6))
            elif kind == 'MBCR': s.append('<path class="sy r" d="M%.1f %.1fh-5v14h5"/>' % (cx - 8, cy - 7))
            elif kind == 'MBCL': s.append('<path class="sy l" d="M%.1f %.1fh5v14h-5"/>' % (cx + 8, cy - 7))
            if nr:
                ox = -7 if kind.endswith('R') else 7
                s.append('<path class="sy %s" d="M%.1f %.1fl%d 9"/>' % (side, cx + ox * .3, cy + 6, ox))
    if note: s.append('<text class="lb" x="%d" y="%d">%s</text>' % (x0, H + 14, esc(note))); s[0] = s[0].replace('0 0 %d %d' % (W, H), '0 0 %d %d' % (W, H + 20))
    s.append('</svg>')
    open(os.path.join(OUT, name + '.svg'), 'w').write('\n'.join(s))

def legend():
    W, H = 340, 86
    s = ['<svg viewBox="0 0 %d %d" role="img" aria-label="Audiogram symbols" xmlns="http://www.w3.org/2000/svg">' % (W, H)]
    rows = [('Air conduction', 'ACR', 'ACL'), ('Bone conduction, unmasked', 'BCR', 'BCL'), ('Bone conduction, masked', 'MBCR', 'MBCL')]
    s.append('<text class="tt" x="196" y="16" text-anchor="middle">Right</text><text class="tt" x="262" y="16" text-anchor="middle">Left</text>')
    for i, (t, a, b) in enumerate(rows):
        y = 34 + i * 22
        s.append('<text class="lb" x="8" y="%d">%s</text>' % (y + 4, t))
        for kind, cx in ((a, 196), (b, 262)):
            side = 'r' if kind.endswith('R') else 'l'
            if kind == 'ACR': s.append('<circle class="sy r" cx="%d" cy="%d" r="5.5"/>' % (cx, y))
            elif kind == 'ACL': s.append('<path class="sy l" d="M%d %dl10 10m0 -10l-10 10"/>' % (cx - 5, y - 5))
            elif kind == 'BCR': s.append('<path class="sy r" d="M%d %dl-8 6l8 6"/>' % (cx + 3, y - 6))
            elif kind == 'BCL': s.append('<path class="sy l" d="M%d %dl8 6l-8 6"/>' % (cx - 3, y - 6))
            elif kind == 'MBCR': s.append('<path class="sy r" d="M%d %dh-6v14h6"/>' % (cx + 2, y - 7))
            elif kind == 'MBCL': s.append('<path class="sy l" d="M%d %dh6v14h-6"/>' % (cx - 2, y - 7))
    s.append('</svg>')
    open(os.path.join(OUT, 'aud-key.svg'), 'w').write('\n'.join(s))

def tymps():
    W, H = 340, 346; s = ['<svg viewBox="0 0 %d %d" role="img" aria-label="Tympanogram types" xmlns="http://www.w3.org/2000/svg">' % (W, H)]
    panels = [('A', 'Normal', 0, .9, 1.0, '1.0 ml'), ('As', 'Shallow (stiff)', 0, .25, 1.0, '1.0 ml'),
              ('Ad', 'Deep (flaccid)', 0, 2.1, 1.0, '1.1 ml'), ('B', 'Flat, normal volume', None, 0, 0.9, '0.9 ml'),
              ('B', 'Flat, large volume', None, 0, 4.0, '4.0 ml'), ('C', 'Negative pressure', -220, .7, 1.0, '1.0 ml')]
    for i, (t, sub, peak, amp, vol, vl) in enumerate(panels):
        cx, cy = (i % 2) * 170, (i // 2) * 108
        x0, x1, y0, y1 = cx + 14, cx + 160, cy + 26, cy + 92
        X = lambda p: x0 + (p + 400) / 600 * (x1 - x0)
        Y = lambda c: y1 - c / 2.6 * (y1 - y0)
        s.append('<text class="tt" x="%d" y="%d">Type %s</text><text class="lb" x="%d" y="%d" text-anchor="end">%s</text>' % (x0, cy + 16, t, x1, cy + 16, esc(sub)))
        s.append('<rect class="fr" x="%d" y="%d" width="%d" height="%d"/>' % (x0, y0, x1 - x0, y1 - y0))
        s.append('<rect class="nz" x="%.1f" y="%.1f" width="%.1f" height="%.1f"/>' % (X(-100), Y(1.5), X(50) - X(-100), Y(.3) - Y(1.5)))
        s.append('<line class="g" x1="%.1f" y1="%d" x2="%.1f" y2="%d"/>' % (X(0), y0, X(0), y1))
        pts = []
        for p in range(-400, 201, 10):
            c = .15 if peak is None else .15 + amp * math.exp(-((p - peak) / 55) ** 2)
            if peak is None: c = .2 + .02 * math.sin(p / 90)
            pts.append('%.1f,%.1f' % (X(p), Y(min(c, 2.55))))
        s.append('<polyline class="ln k" points="%s"/>' % ' '.join(pts))
        s.append('<text class="lb" x="%d" y="%d">−400</text><text class="lb" x="%d" y="%d" text-anchor="end">+200</text>' % (x0, y1 + 12, x1, y1 + 12))
        s.append('<text class="lb" x="%d" y="%d">ECV %s</text>' % (x0 + 4, y0 + 12, vl))
    s.append('<text class="lb" x="170" y="%d" text-anchor="middle">Pressure (daPa) across; compliance (ml) up; centre line 0 daPa</text>' % (H - 4))
    s.append('</svg>')
    open(os.path.join(OUT, 'tymp-types.svg'), 'w').write('\n'.join(s))

def speech():
    W, H = 340, 270; x0, x1, y0, y1 = 46, 326, 30, 230
    X = lambda d: x0 + d / 120 * (x1 - x0); Y = lambda p: y1 - p / 100 * (y1 - y0)
    s = ['<svg viewBox="0 0 %d %d" role="img" aria-label="Speech audiogram patterns" xmlns="http://www.w3.org/2000/svg">' % (W, H)]
    s.append('<text class="tt" x="%d" y="16">Speech audiogram</text>' % x0)
    for p in range(0, 101, 20):
        s.append('<line class="g" x1="%d" y1="%.1f" x2="%d" y2="%.1f"/><text class="lb" x="%d" y="%.1f" text-anchor="end">%d</text>' % (x0, Y(p), x1, Y(p), x0 - 6, Y(p) + 3.5, p))
    for d in range(0, 121, 20):
        s.append('<line class="g" x1="%.1f" y1="%d" x2="%.1f" y2="%d"/><text class="lb" x="%.1f" y="%d" text-anchor="middle">%d</text>' % (X(d), y0, X(d), y1, X(d), y1 + 14, d))
    s.append('<text class="lb" x="%d" y="%d" text-anchor="middle">Speech level (dB)</text>' % ((x0 + x1) // 2, y1 + 30))
    s.append('<text class="lb" x="12" y="%d" text-anchor="middle" transform="rotate(-90 12 %d)">Words correct (%%)</text>' % ((y0 + y1) // 2, (y0 + y1) // 2))
    def curve(cls, mid, top, fall=None, lab=None, lx=None, ly=None):
        pts = []
        for d in range(0, 121, 3):
            p = top / (1 + math.exp(-(d - mid) / 4.5))
            if fall and d > fall: p -= (d - fall) * 1.1
            pts.append('%.1f,%.1f' % (X(d), Y(max(p, 0))))
        s.append('<polyline class="ln %s" points="%s"/>' % (cls, ' '.join(pts)))
        if lab: s.append('<text class="lb %s" x="%.1f" y="%.1f">%s</text>' % (cls, X(lx), Y(ly), esc(lab)))
    curve('k', 22, 100, lab='Normal', lx=26, ly=104)
    curve('r', 62, 100, lab='Conductive', lx=72, ly=96)
    curve('l', 58, 72, lab='Cochlear', lx=74, ly=62)
    curve('a', 60, 60, fall=78, lab='Retrocochlear (roll-over)', lx=42, ly=24)
    s.append('</svg>')
    open(os.path.join(OUT, 'speech-curves.svg'), 'w').write('\n'.join(s))

def wave(lat, amps, t0=0):
    """sum of gaussian peaks at given latencies (ms)"""
    def f(t):
        return sum(a * math.exp(-((t - l) / .22) ** 2) for l, a in zip(lat, amps)) - .25 * math.exp(-((t - (lat[-1] + .9)) / .5) ** 2)
    return f

def abr():
    W, H = 340, 340; x0, x1 = 30, 326
    X = lambda t: x0 + t / 10 * (x1 - x0)
    s = ['<svg viewBox="0 0 %d %d" role="img" aria-label="ABR traces" xmlns="http://www.w3.org/2000/svg">' % (W, H)]
    traces = [('Normal', 'k', [1.6, 2.7, 3.8, 4.9, 5.7], [.5, .35, .55, .45, .9], 'I–V 4.1 ms'),
              ('Conductive loss', 'r', [2.3, 3.4, 4.5, 5.6, 6.4], [.35, .25, .45, .35, .8], 'all waves late; I–V 4.1 ms (normal)'),
              ('Cochlear loss', 'l', [1.9, 2.9, 3.9, 4.9, 5.8], [.15, .2, .4, .35, .8], 'wave I small; I–V normal or short'),
              ('Retrocochlear', 'a', [1.6, 3.3, 4.8, 6.0, 6.9], [.5, .2, .3, .25, .5], 'I–V 5.3 ms: prolonged; interaural V >0.2 ms')]
    for i, (t, c, lat, am, note) in enumerate(traces):
        base = 66 + i * 72
        s.append('<text class="tt" x="%d" y="%d">%s</text><text class="lb" x="%d" y="%d">%s</text>' % (x0, base - 44, t, x0, base - 31, esc(note)))
        f = wave(lat, am)
        pts = ['%.1f,%.1f' % (X(tt / 20), base - 26 * f(tt / 20)) for tt in range(0, 201)]
        s.append('<polyline class="ln %s" points="%s"/>' % (c, ' '.join(pts)))
        for k, (l, a) in enumerate(zip(lat, am)):
            if k in (0, 2, 4):
                s.append('<text class="lb" x="%.1f" y="%.1f" text-anchor="middle">%s</text>' % (X(l), base - 26 * a - 5, ['I', 'II', 'III', 'IV', 'V'][k]))
    s.append('<line class="g2" x1="%d" y1="%d" x2="%d" y2="%d"/>' % (x0, H - 22, x1, H - 22))
    for t in range(0, 11, 2):
        s.append('<line class="g2" x1="%.1f" y1="%d" x2="%.1f" y2="%d"/><text class="lb" x="%.1f" y="%d" text-anchor="middle">%s</text>' % (X(t), H - 25, X(t), H - 19, X(t) - (8 if t == 10 else 0), H - 8, '10 ms' if t == 10 else t))
    s.append('</svg>')
    open(os.path.join(OUT, 'abr-traces.svg'), 'w').write('\n'.join(s))

def ecochg():
    W, H = 340, 190; s = ['<svg viewBox="0 0 %d %d" role="img" aria-label="Electrocochleography" xmlns="http://www.w3.org/2000/svg">' % (W, H)]
    for i, (t, sp, ap, c, note) in enumerate([('Normal', .25, 1.0, 'k', 'SP/AP 0.25'), ("Ménière's disease", .6, 1.0, 'a', 'SP/AP 0.6: raised')]):
        ox = 10 + i * 168; x0, x1, base = ox + 6, ox + 156, 62
        X = lambda t: x0 + t / 4 * (x1 - x0)
        def f(t):
            v = 0
            if .5 < t < 3.2: v -= sp * (1 / (1 + math.exp(-(t - .7) / .05))) * (1 / (1 + math.exp((t - 3) / .08)))
            v -= (ap - sp) * math.exp(-((t - 1.6) / .18) ** 2)
            return v
        pts = ['%.1f,%.1f' % (X(k / 40), base - 80 * f(k / 40)) for k in range(0, 161)]
        s.append('<text class="tt" x="%d" y="18">%s</text><text class="lb" x="%d" y="34">%s</text>' % (x0, t, x0, note))
        s.append('<polyline class="ln %s" points="%s"/>' % (c, ' '.join(pts)))
        s.append('<line class="g" x1="%d" y1="%d" x2="%d" y2="%d"/>' % (x0, base, x1, base))
        s.append('<text class="lb" x="%.1f" y="%.1f">SP</text><text class="lb" x="%.1f" y="%.1f">AP</text>' % (X(2.4), base + 80 * sp + 14, X(1.75), base + 80 * ap + 4))
    s.append('<text class="lb" x="10" y="%d">Negative down: SP is the plateau, AP the sharp trough.</text>' % (H - 6))
    s.append('</svg>')
    open(os.path.join(OUT, 'ecochg.svg'), 'w').write('\n'.join(s))

def vhit():
    W, H = 340, 190; s = ['<svg viewBox="0 0 %d %d" role="img" aria-label="Video head impulse test" xmlns="http://www.w3.org/2000/svg">' % (W, H)]
    for i, (t, gain, sac, note) in enumerate([('Right lateral canal', .95, None, 'gain 0.95, no saccades'), ('Left lateral canal', .45, (170, 230), 'gain 0.45, catch-up saccades')]):
        ox = 10 + i * 168; x0, x1, base = ox + 6, ox + 156, 140
        X = lambda ms: x0 + ms / 400 * (x1 - x0)
        head = lambda ms: 250 * math.exp(-((ms - 110) / 45) ** 2)
        pts_h = ['%.1f,%.1f' % (X(m), base - head(m) / 3) for m in range(0, 401, 4)]
        def eye(m):
            v = gain * head(m)
            if sac:
                for c, a in zip(sac, (150, 110)): v += a * math.exp(-((m - c) / 14) ** 2)
            return v
        pts_e = ['%.1f,%.1f' % (X(m), base - eye(m) / 3) for m in range(0, 401, 4)]
        s.append('<text class="tt" x="%d" y="18">%s</text><text class="lb" x="%d" y="33">%s</text>' % (x0, t, x0, esc(note)))
        s.append('<line class="g" x1="%d" y1="%d" x2="%d" y2="%d"/>' % (x0, base, x1, base))
        s.append('<polyline class="ln k" points="%s"/>' % ' '.join(pts_h))
        s.append('<polyline class="ln %s" points="%s"/>' % ('l' if i == 0 else 'a', ' '.join(pts_e)))
        s.append('<text class="lb" x="%d" y="%d">0</text><text class="lb" x="%d" y="%d" text-anchor="end">400 ms</text>' % (x0, base + 13, x1, base + 13))
    s.append('<text class="lb" x="10" y="%d">Black: head velocity. Colour: eye velocity. Gain = eye ÷ head.</text>' % (H - 8))
    s.append('</svg>')
    open(os.path.join(OUT, 'vhit.svg'), 'w').write('\n'.join(s))

def hu_scale():
    W, H = 340, 300; x0, x1 = 20, 320
    s = ['<svg viewBox="0 0 %d %d" role="img" aria-label="Hounsfield scale and CT windows" xmlns="http://www.w3.org/2000/svg">' % (W, H)]
    s.append('<defs><linearGradient id="hug" x1="0" x2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>'
             '<linearGradient id="hug2" x1="0" x2="1"><stop offset="0" stop-color="#3a3a3a"/><stop offset="1" stop-color="#b8b8b8"/></linearGradient></defs>')
    X = lambda hu: x0 + (hu + 1000) / 3000 * (x1 - x0)
    s.append('<text class="tt" x="%d" y="16">The whole scale (HU)</text>' % x0)
    s.append('<rect x="%d" y="24" width="%d" height="14" fill="url(#hug)" stroke="currentColor" stroke-opacity=".3"/>' % (x0, x1 - x0))
    for hu, t, anc in ((-1000, 'Air −1000', 'start'), (0, 'Water 0', 'middle'), (1000, 'Dense bone +1000', 'middle'), (2000, 'Metal', 'end')):
        s.append('<line class="g2" x1="%.1f" y1="38" x2="%.1f" y2="44"/><text class="lb" x="%.1f" y="55" text-anchor="%s">%s</text>' % (X(hu), X(hu), X(hu), anc, t))
    wins = [('Bone window', 700, 4000, 'r'), ('Soft-tissue window', 50, 350, 'l'), ('Lung window', -600, 1500, 'a')]
    for i, (t, L, Wd, c) in enumerate(wins):
        y = 80 + i * 22; a_, b_ = max(-1000, L - Wd / 2), min(2000, L + Wd / 2)
        s.append('<line class="ln %s" x1="%.1f" y1="%d" x2="%.1f" y2="%d" stroke-width="5"/>' % (c, X(a_), y, X(b_), y))
        s.append('<text class="lb %s" x="%.1f" y="%d">%s (L %d, W %d)</text>' % (c, max(x0, X(a_)), y - 6, t, L, Wd))
    # zoom
    Z = lambda hu: x0 + (hu + 150) / 450 * (x1 - x0); zy = 178
    s.append('<text class="tt" x="%d" y="%d">Zoom: −150 to +300 HU, where soft tissues differ</text>' % (x0, zy - 14))
    s.append('<rect x="%d" y="%d" width="%d" height="14" fill="url(#hug2)" stroke="currentColor" stroke-opacity=".3"/>' % (x0, zy - 6, x1 - x0))
    lab = [(-100, 'Fat −100', 0), (0, 'Water, CSF 0', 1), (20, 'Fluid with protein 10–30', 2), (45, 'Muscle, node 40–50', 3), (70, 'Fresh blood 60–80', 4), (180, 'Enhancing vessel 150–300', 5)]
    for hu, t, row in lab:
        y = zy + 22 + row * 14
        anc, tx = ('end', x1) if hu > 150 else ('start', Z(hu) + 3)
        s.append('<line class="g2" x1="%.1f" y1="%d" x2="%.1f" y2="%d"/><text class="lb" x="%.1f" y="%d" text-anchor="%s">%s</text>' % (Z(hu), zy + 8, Z(hu), y - 4, tx, y, anc, esc(t)))
    s.append('<text class="lb" x="%d" y="%d">Inside the window: greys. Below it: black. Above it: white.</text>' % (x0, H - 6))
    s.append('</svg>')
    open(os.path.join(OUT, 'hu-scale.svg'), 'w').write('\n'.join(s))

def mri_signal():
    W, H = 340, 236
    s = ['<svg viewBox="0 0 %d %d" role="img" aria-label="Tissue brightness on MRI sequences" xmlns="http://www.w3.org/2000/svg">' % (W, H)]
    cols = ['T1', 'T2', 'T1 fat-sat + Gd', 'DWI (b1000)']
    rows = [('Fluid, CSF', [.1, .95, .1, .15]), ('Fat', [.95, .75, .1, .1]), ('Muscle', [.35, .3, .35, .3]), ('Cortical bone, air', [0, 0, 0, 0]),
            ('Enhancing tumour', [.35, .6, .85, .55]), ('Abscess pus', [.2, .9, .15, .95]), ('Cholesteatoma', [.25, .75, .15, .95]), ('Subacute blood', [.9, .85, .9, .5])]
    x0, cw, rh, y0 = 118, 54, 22, 34
    s.append('<text class="tt" x="8" y="16">Brightness on common sequences</text>')
    for j, c in enumerate(cols):
        s.append('<text class="lb" x="%d" y="%d" text-anchor="middle">%s</text>' % (x0 + j * cw + cw // 2, y0 - 6, esc(c)))
    for i, (t, v) in enumerate(rows):
        y = y0 + i * rh
        s.append('<text class="lb" x="8" y="%d">%s</text>' % (y + 15, esc(t)))
        for j, g in enumerate(v):
            gv = int(20 + g * 225)
            s.append('<rect x="%d" y="%d" width="%d" height="%d" rx="3" fill="rgb(%d,%d,%d)" stroke="currentColor" stroke-opacity=".25"/>' % (x0 + j * cw + 3, y + 2, cw - 6, rh - 4, gv, gv, gv))
    s.append('<text class="lb" x="8" y="%d">Schematic. Gd = gadolinium; fat-sat = fat suppressed.</text>' % (H - 6))
    s.append('</svg>')
    open(os.path.join(OUT, 'mri-signal.svg'), 'w').write('\n'.join(s))

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    legend()
    n = {250: 10, 500: 5, 1000: 5, 2000: 10, 4000: 10, 8000: 15}
    audiogram('aud-normal', 'Normal hearing', [('ACR', n), ('ACL', {k: v + 5 for k, v in n.items()}), ('BCR', {500: 5, 1000: 5, 2000: 5, 4000: 10})])
    audiogram('aud-otosc', 'Left otosclerosis (Carhart notch)', [('ACR', n), ('ACL', {250: 50, 500: 50, 1000: 45, 2000: 40, 4000: 40, 8000: 40}),
              ('MBCL', {500: 10, 1000: 15, 2000: 30, 4000: 10})])
    audiogram('aud-mixed', 'Right mixed loss (chronic otitis media)', [('ACR', {250: 65, 500: 65, 1000: 60, 2000: 65, 4000: 75, 8000: 85}),
              ('MBCR', {500: 30, 1000: 35, 2000: 40, 4000: 55}), ('ACL', {250: 15, 500: 10, 1000: 10, 2000: 15, 4000: 25, 8000: 35})])
    audiogram('aud-presby', 'Presbycusis: symmetrical, sloping', [('ACR', {250: 15, 500: 20, 1000: 25, 2000: 40, 4000: 60, 8000: 75}),
              ('ACL', {250: 20, 500: 20, 1000: 30, 2000: 45, 4000: 60, 8000: 80}), ('BCR', {500: 20, 1000: 25, 2000: 40, 4000: 55})])
    audiogram('aud-noise', 'Noise-induced: 4 kHz notch with recovery', [('ACR', {250: 10, 500: 10, 1000: 15, 2000: 20, 3000: 40, 4000: 55, 6000: 45, 8000: 25}),
              ('ACL', {250: 10, 500: 15, 1000: 15, 2000: 25, 3000: 45, 4000: 60, 6000: 50, 8000: 30})])
    audiogram('aud-meniere', "Left Ménière's: low-frequency loss", [('ACR', n), ('ACL', {250: 55, 500: 50, 1000: 40, 2000: 30, 4000: 25, 8000: 30}),
              ('MBCL', {500: 45, 1000: 40, 2000: 30, 4000: 20})])
    audiogram('aud-asym', 'Asymmetric: right retrocochlear until MRI', [('ACR', {250: 20, 500: 30, 1000: 40, 2000: 55, 4000: 65, 8000: 70}),
              ('ACL', {250: 10, 500: 10, 1000: 10, 2000: 15, 4000: 20, 8000: 25}), ('MBCR', {500: 30, 1000: 40, 2000: 55, 4000: 65})])
    audiogram('aud-dead', 'Right dead ear: the shadow curve', [('ACR', {250: 65, 500: 65, 1000: 70, 2000: 70, 4000: 75, 8000: 80}),
              ('BCR', {500: 5, 1000: 10, 2000: 10, 4000: 15}), ('MBCR', {500: None, 1000: None, 2000: None, 4000: None}),
              ('ACL', {250: 5, 500: 5, 1000: 10, 2000: 10, 4000: 15, 8000: 20})], note='Unmasked thresholds were the left ear answering.')
    audiogram('aud-cookie', 'Cookie-bite: mid-frequency (genetic)', [('ACR', {250: 15, 500: 30, 1000: 50, 2000: 50, 4000: 30, 8000: 20}),
              ('ACL', {250: 20, 500: 35, 1000: 55, 2000: 50, 4000: 35, 8000: 20})])
    tymps(); speech(); abr(); ecochg(); vhit(); hu_scale(); mri_signal()
    print(sorted(os.listdir(OUT)))

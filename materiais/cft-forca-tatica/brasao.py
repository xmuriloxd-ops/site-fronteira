"""Brasao (emblema) da Forca Tatica desenhado em PIL, alta resolucao.

Escudo frances com campo xadrez preto/prata, monograma FT dourado e
listel curvo com a inscricao FORCA TATICA.
"""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

import os
FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fontes")

INK = (17, 20, 25, 255)
RIM_BLACK = (9, 10, 12, 255)
SILVER = (200, 205, 211, 255)
GOLD = (187, 146, 56, 255)
GOLD_HI = (243, 214, 146, 255)
WHITE = (249, 250, 251, 255)


def font(name, size):
    return ImageFont.truetype(f"{FONT_DIR}/{name}", int(size))


def cubic(p0, p1, p2, p3, n=90):
    out = []
    for i in range(n + 1):
        t = i / n
        mt = 1 - t
        out.append((
            mt**3 * p0[0] + 3 * mt**2 * t * p1[0] + 3 * mt * t**2 * p2[0] + t**3 * p3[0],
            mt**3 * p0[1] + 3 * mt**2 * t * p1[1] + 3 * mt * t**2 * p2[1] + t**3 * p3[1],
        ))
    return out


def shield_path(W, H, top=0.0):
    r = W * 0.10
    x0, x1 = 0.0, W
    y0 = top
    yside = top + H * 0.62
    tip = (W / 2, top + H)
    pts = []
    pts += cubic((x0, y0 + r), (x0, y0 + r * 0.35), (x0 + r * 0.35, y0), (x0 + r, y0), 24)
    pts += [(x1 - r, y0)]
    pts += cubic((x1 - r, y0), (x1 - r * 0.35, y0), (x1, y0 + r * 0.35), (x1, y0 + r), 24)
    pts += [(x1, yside)]
    pts += cubic((x1, yside), (x1, top + H * 0.80), (W * 0.64, top + H * 0.965), tip, 140)
    pts += cubic(tip, (W * 0.36, top + H * 0.965), (x0, top + H * 0.80), (x0, yside), 140)
    pts += [(x0, y0 + r)]
    return pts


def ft_monogram(px_w: int) -> Image.Image:
    U = 100.0
    Wc, Hc = 238.0, 150.0
    k = px_w / Wc
    img = Image.new("RGBA", (int(Wc * k), int(Hc * k)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def P(pts):
        return [(x * k, (y + 5) * k) for x, y in pts]

    F = [(0, 0), (96, 0), (96, 25), (26, 25), (26, 56), (75, 56), (75, 81), (26, 81), (26, 140), (0, 140)]
    T = [(0, 0), (96, 0), (96, 25), (61, 25), (61, 113), (36, 139), (36, 25), (0, 25)]
    T = [(x + 142, y) for x, y in T]

    off = 2.0 * k
    for pts in (F, T):
        d.polygon([(x + off, y + off) for x, y in P(pts)], fill=(0, 0, 0, 170))
    for pts in (F, T):
        d.polygon(P(pts), fill=GOLD, outline=(10, 9, 6, 255), width=int(max(1, 1.3 * k)))

    hi = Image.new("RGBA", img.size, (0, 0, 0, 0))
    hd = ImageDraw.Draw(hi)
    for pts in (F, T):
        hd.polygon(P(pts), fill=GOLD_HI)
    grad = Image.new("L", img.size, 0)
    gd = ImageDraw.Draw(grad)
    tot = max(1, int(58 * k))
    for i in range(tot):
        gd.line([(0, 5 * k + i), (img.width, 5 * k + i)], fill=int(255 * (1 - i / tot) ** 1.8))
    hi.putalpha(Image.composite(hi.getchannel("A"), Image.new("L", img.size, 0), grad))
    img.alpha_composite(hi)
    return img


def curved_text(img, text, fnt, cx, cy, amp, tracking=0.0, fill=WHITE):
    d = ImageDraw.Draw(img)
    widths = [d.textlength(ch, font=fnt) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    half = max(1.0, total / 2)
    x = cx - total / 2
    margin = int(fnt.size * 0.75) + 4
    for ch, wch in zip(text, widths):
        t = (x + wch / 2 - cx) / half
        dy = -amp * (t * t)
        angle = float(np.degrees(np.arctan2(2 * amp * t, half)))
        tw, th = int(np.ceil(wch)) + 2 * margin, 2 * margin
        tile = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
        bb = d.textbbox((0, 0), ch, font=fnt)
        ink_w, ink_h = bb[2] - bb[0], bb[3] - bb[1]
        ImageDraw.Draw(tile).text(((tw - ink_w) / 2 - bb[0], (th - ink_h) / 2 - bb[1]),
                                  ch, font=fnt, fill=fill, anchor="la")
        tile = tile.rotate(angle, resample=Image.BICUBIC, center=(tw / 2, th / 2))
        img.alpha_composite(tile, (int(round(x + wch / 2 - tw / 2)), int(round(cy + dy - th / 2))))
        x += wch + tracking


def _norm(v):
    d = (v[0] ** 2 + v[1] ** 2) ** 0.5
    return (v[0] / d, v[1] / d) if d else (0.0, 0.0)


def offset_poly(pts, dist, miter_limit=2.6):
    """Desloca um poligono fechado (horario em coordenadas de tela) para dentro."""
    n = len(pts)
    out = []
    for i in range(n):
        p_prev, p, p_next = pts[(i - 1) % n], pts[i], pts[(i + 1) % n]
        e1 = _norm((p[0] - p_prev[0], p[1] - p_prev[1]))
        e2 = _norm((p_next[0] - p[0], p_next[1] - p[1]))
        n1 = (-e1[1], e1[0])
        n2 = (-e2[1], e2[0])
        nx, ny = _norm((n1[0] + n2[0], n1[1] + n2[1]))
        scale = 1.0
        cos_half = nx * n1[0] + ny * n1[1]
        if cos_half > 1e-6:
            scale = min(miter_limit, 1.0 / cos_half)
        out.append((p[0] + nx * dist * scale, p[1] + ny * dist * scale))
    return out


def make_crest(width=1200, ss=3, drop_shadow=True):
    SW, SH = 240.0, 234.0
    PADX = 22.0
    TOP = 8.0
    CW, CH = SW + 2 * PADX, 274.0
    k = width / CW * ss
    W, H = int(CW * k), int(CH * k)

    crest = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    path = [((x + PADX) * k, y * k) for x, y in shield_path(SW, SH, top=TOP)]

    # ---------------- aneis concentricos ----------------
    d = ImageDraw.Draw(crest)
    rings = [(0.0, RIM_BLACK), (2.7, GOLD), (4.8, RIM_BLACK), (6.2, WHITE)]
    for off, col in rings:
        poly = offset_poly(path, off * k) if off else path
        d.polygon(poly, fill=col)

    field_mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(field_mask).polygon(offset_poly(path, 7.2 * k), fill=255)
    x0f, y0f = min(p[0] for p in offset_poly(path, 7.2 * k)), min(p[1] for p in offset_poly(path, 7.2 * k))

    # ---------------- campo xadrez ----------------
    inner = Image.new("RGBA", (W, H), INK)
    fd = ImageDraw.Draw(inner)
    cols = 5
    cell = (SW - 14.0) * k / cols
    x_start, y_start = (PADX + 7.0) * k, (TOP + 7.0) * k
    rows = int(SH * k / cell) + 2
    for r in range(rows):
        for c in range(cols):
            if (r + c) % 2 == 0:
                x1, y1 = x_start + c * cell, y_start + r * cell
                fd.rectangle([x1, y1, x1 + cell + 1, y1 + cell + 1], fill=SILVER)
    shade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    step = max(2, int(1.3 * k))
    for i in range(-H, W + H, step):
        t = (i + H) / (W + 2 * H)
        sd.line([(i, 0), (i + H, H)], fill=(0, 0, 0, int(72 * t)), width=step)
    inner.alpha_composite(shade)

    mono = ft_monogram(int(126 * k))
    inner.alpha_composite(mono, (int((W - mono.width) / 2), int((TOP + 44) * k)))
    inner.putalpha(field_mask)
    crest.alpha_composite(inner)

    # ---------------- listel ----------------
    bx0, bx1 = 15.0 * k, W - 15.0 * k
    ycen = 246.0 * k
    amp = 14.0 * k
    thick = 34.0 * k
    notch = 22.0 * k

    yc = ycen - amp
    top_y, bot_y = yc - thick / 2, yc + thick / 2
    top_pts, bot_pts = [], []
    n = 200
    xs, xe = bx0 + notch, bx1 - notch
    for i in range(n + 1):
        x = xs + (xe - xs) * i / n
        t = (x - (bx0 + bx1) / 2) / ((bx1 - bx0) / 2)
        dy = -amp * (t * t) + amp
        top_pts.append((x, top_y + dy))
        bot_pts.append((x, bot_y + dy))
    ribbon = [(bx0, yc)] + top_pts + [(bx1, yc)] + bot_pts[::-1]

    rb = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rb)
    rd.polygon(ribbon, fill=(54, 58, 65, 255))
    # filetes internos
    rd.line(top_pts, fill=(236, 239, 242, 205), width=max(1, int(1.3 * k)))
    rd.line(bot_pts, fill=(236, 239, 242, 205), width=max(1, int(1.3 * k)))
    rd.line([(x, y - 4.6 * k) for x, y in bot_pts], fill=(0, 0, 0, 90), width=max(1, int(2.2 * k)))
    rd.polygon(ribbon, outline=RIM_BLACK, width=max(1, int(2.2 * k)))

    # sombra do listel
    sh_alpha = rb.getchannel("A").filter(ImageFilter.GaussianBlur(2.2 * k))
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow.putalpha(sh_alpha.point(lambda v: int(v * 0.85)))
    crest.alpha_composite(shadow, (0, int(2.2 * k)))
    crest.alpha_composite(rb)

    # texto: ajuste exato por largura e altura do listel
    label = "FORÇA TÁTICA"
    probe = ImageDraw.Draw(Image.new("RGBA", (8, 8)))
    ref = 100.0 * k
    f_ref = font("barlowcond-800.ttf", ref)
    tr_ref = 0.055 * ref
    w_ref = sum(probe.textlength(c, font=f_ref) for c in label) + tr_ref * (len(label) - 1)
    target_w = (xe - xs - 16 * k)
    fs_w = ref * target_w / w_ref
    fs_h = thick * 0.58 / 0.72
    fs = min(fs_w, fs_h)
    best = font("barlowcond-800.ttf", fs)
    best_tr = 0.055 * fs
    txt = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    curved_text(txt, label, best, (bx0 + bx1) / 2, ycen + 0.6 * k, amp,
                tracking=best_tr, fill=(252, 252, 253, 255))
    sh = txt.getchannel("A").filter(ImageFilter.GaussianBlur(max(1, 1.0 * k)))
    sh_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh_layer.putalpha(sh.point(lambda v: int(v * 0.7)))
    crest.alpha_composite(sh_layer, (int(0.5 * k), int(0.9 * k)))
    crest.alpha_composite(txt)

    if not drop_shadow:
        return crest.resize((width, int(CH * width / CW)), Image.LANCZOS)

    # sombra geral
    a = crest.getchannel("A")
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow.putalpha(a.filter(ImageFilter.GaussianBlur(2.4 * k)).point(lambda v: int(v * 0.7)))
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out.alpha_composite(glow)
    out.alpha_composite(crest)
    return out.resize((width, int(CH * width / CW)), Image.LANCZOS)


if __name__ == "__main__":
    import time
    t = time.time()
    c = make_crest(1000, ss=3)
    bg = Image.new("RGBA", (c.width + 60, c.height + 60), (20, 22, 26, 255))
    bg.alpha_composite(c, (30, 30))
    bg.convert("RGB").save(os.path.join(FONT_DIR, "..", "brasao-preview.png"))
    print("ok", c.size, round(time.time() - t, 1), "s")

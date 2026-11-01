"""Poster CFT - Curso de Forca Tatica | Policia Militar de Goias."""
from __future__ import annotations

import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

import brasao as crest2

WORK = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(WORK, "fontes")

DW = 1080
DH = int(os.environ.get("POSTER_DH", "1350"))   # design units
EXTRA = DH - 1350                               # espaco vertical adicional
S = int(os.environ.get("POSTER_SS", "2"))       # supersampling
W, H = DW * S, DH * S

GOLD_L = (247, 231, 190)
GOLD = (214, 178, 104)
GOLD_M = (188, 148, 66)
GOLD_D = (122, 90, 30)
WHITE = (246, 247, 249)


def F(name, size):
    return ImageFont.truetype(f"{FONTS}/{name}", max(1, int(round(size * S))))


def tw(text, fnt, tracking=0.0):
    d = ImageDraw.Draw(Image.new("L", (4, 4)))
    return sum(d.textlength(c, font=fnt) for c in text) + tracking * S * (len(text) - 1)


def put(d, text, fnt, x, baseline, tracking=0.0, fill=(255, 255, 255, 255),
        anchor="l", stroke=0, stroke_fill=None):
    """Desenha texto com espacamento extra. x = esquerda/centro/direita do baseline y."""
    tr = tracking * S
    total = sum(d.textlength(c, font=fnt) for c in text) + tr * (len(text) - 1)
    if anchor == "c":
        x -= total / 2
    elif anchor == "r":
        x -= total
    for ch in text:
        d.text((x, baseline), ch, font=fnt, fill=fill, anchor="ls",
               stroke_width=int(stroke * S), stroke_fill=stroke_fill)
        x += d.textlength(ch, font=fnt) + tr
    return total


def metal_text(canvas, text, fnt, center_x, baseline, tracking=0.0,
               stops=((0.00, (255, 246, 214)), (0.16, (246, 212, 134)), (0.34, (204, 158, 70)),
                      (0.50, (176, 129, 48)), (0.66, (222, 179, 101)), (0.84, (183, 136, 50)),
                      (1.00, (124, 86, 26))),
               outline=0.0, shadow=(0, 7, 16, 150), glow=None, anchor="c",
               warm_hi=True):
    """Texto com preenchimento em gradiente metalico + sombra/brilho."""
    mask = Image.new("L", canvas.size, 0)
    md = ImageDraw.Draw(mask)
    put(md, text, fnt, center_x * S, baseline * S, tracking, fill=255, anchor=anchor,
        stroke=outline, stroke_fill=255)
    bbox = mask.getbbox()
    if not bbox:
        return
    y0, y1 = bbox[1], bbox[3]
    grad = Image.new("RGB", (1, max(1, y1 - y0)))
    gp = grad.load()
    hspan = max(1, y1 - y0 - 1)
    for i in range(y1 - y0):
        t = i / hspan
        for k in range(len(stops) - 1):
            a, ca = stops[k]
            b, cb = stops[k + 1]
            if a <= t <= b:
                f = (t - a) / max(1e-6, b - a)
                col = tuple(int(ca[j] + (cb[j] - ca[j]) * f) for j in range(3))
                break
        else:
            col = stops[-1][1]
        gp[0, i] = col
    grad = grad.resize((canvas.width, max(1, y1 - y0)), Image.BILINEAR)
    grad_full = Image.new("RGB", canvas.size, (0, 0, 0))
    grad_full.paste(grad, (0, y0))
    grad = grad_full

    halo = mask.filter(ImageFilter.GaussianBlur(15 * S))
    halo_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 255))
    halo_layer.putalpha(halo.point(lambda v: int(v * 0.55)))
    canvas.alpha_composite(halo_layer)

    if shadow:
        dx, dy, blur, alpha = shadow
        sh = mask.filter(ImageFilter.GaussianBlur(blur * S))
        sh_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        sh_layer.putalpha(sh.point(lambda v: int(v * alpha / 255)))
        canvas.alpha_composite(sh_layer, (int(dx * S), int(dy * S)))

    if glow:
        gcol, gblur, galpha = glow
        gl = mask.filter(ImageFilter.GaussianBlur(gblur * S))
        gl_layer = Image.new("RGBA", canvas.size, gcol)
        gl_layer.putalpha(gl.point(lambda v: int(v * galpha / 255)))
        canvas.alpha_composite(gl_layer)

    col_layer = grad.convert("RGBA")
    col_layer.putalpha(mask)
    canvas.alpha_composite(col_layer)

    # brilho superior (bisel)
    if warm_hi:
        hi = Image.new("L", canvas.size, 0)
        ImageDraw.Draw(hi).bitmap((0, 0), mask, fill=255)
        off = int(2.2 * S)
        hi = Image.fromarray(np.roll(np.array(hi), off, axis=0))
        band = np.array(hi).astype(int) - np.array(mask).astype(int)
        hi_mask = Image.fromarray(np.clip(band, 0, 255).astype(np.uint8))
        hl = Image.new("RGBA", canvas.size, (255, 246, 220, 255))
        hl.putalpha(hi_mask.point(lambda v: int(v * 0.40)))
        canvas.alpha_composite(hl)


def hairline(canvas, y, x0, x1, color, w=1.0, diamond=True, dsize=5.0):
    d = ImageDraw.Draw(canvas)
    if diamond:
        gap = dsize * 2.6 * S
        d.line([(x0 * S, y * S), (x1 / 2 * S - gap, y * S)], fill=color, width=max(1, int(w * S)))
        d.line([(x1 * S + 0, y * S), (x1 * S, y * S)], fill=color, width=1)
        cx = (x0 + x1) / 2 * S
        cy = y * S
        s = dsize * S
        d.polygon([(cx, cy - s), (cx + s, cy), (cx, cy + s), (cx - s, cy)], fill=color)
        d.line([(cx + gap, y * S), (x1 * S, y * S)], fill=color, width=max(1, int(w * S)))
    else:
        d.line([(x0 * S, y * S), (x1 * S, y * S)], fill=color, width=max(1, int(w * S)))


def rounded_panel(canvas, box, radius, fill, outline=None, ow=1.0, inner_outline=None):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    b = [c * S for c in box]
    d.rounded_rectangle(b, radius=radius * S, fill=fill,
                        outline=outline, width=max(1, int(ow * S)))
    if inner_outline:
        pad = 7 * S
        d.rounded_rectangle([b[0] + pad, b[1] + pad, b[2] - pad, b[3] - pad],
                            radius=max(2, radius * S - pad), outline=inner_outline,
                            width=max(1, int(0.9 * S)))
    canvas.alpha_composite(layer)


def corners(canvas, inset=26.0, arm=44.0, color=(196, 158, 74, 190), wgt=2.0):
    d = ImageDraw.Draw(canvas)
    i, a = inset * S, arm * S
    wd = max(1, int(wgt * S))
    for sx, sy, dx, dy in ((i, i, 1, 1), (W - i, i, -1, 1), (i, H - i, 1, -1), (W - i, H - i, -1, -1)):
        d.line([(sx, sy), (sx + dx * a, sy)], fill=color, width=wd)
        d.line([(sx, sy), (sx, sy + dy * a)], fill=color, width=wd)


def background():
    img = Image.open(os.path.join(WORK, "fundo-operadores.jpg")).convert("RGB")
    sc = max(W / img.width, H / img.height)
    nw, nh = int(img.width * sc + 0.5), int(img.height * sc + 0.5)
    img = img.resize((nw, nh), Image.LANCZOS)
    img = img.crop(((nw - W) // 2, 0, (nw - W) // 2 + W, H))
    a = np.array(img).astype(np.float32) / 255.0
    # contraste + escurecer + leve dessaturacao
    a = np.clip((a - 0.5) * 1.10 + 0.5, 0, 1) ** 1.28
    lum = a.mean(axis=2, keepdims=True)
    a = lum + (a - lum) * 0.92
    a *= 1.02
    img = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8))

    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    # topo e base escuros
    for i in range(320 * S):
        t = i / (320 * S)
        d.line([(0, i), (W, i)], fill=(2, 4, 7, int(232 * (1 - t) ** 1.5)))
    for i in range(560 * S):
        t = i / (560 * S)
        y = H - 560 * S + i
        d.line([(0, y), (W, y)], fill=(2, 4, 7, int(250 * t ** 1.25)))
    img = Image.alpha_composite(img.convert("RGBA"), ov)

    # vinheta
    vig = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vig)
    vd.ellipse([-W * 0.35, -H * 0.22, W * 1.35, H * 1.22], fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(120 * S / 2))
    dark = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    dark.putalpha(vig.point(lambda v: int((255 - v) * 0.55)))
    img = Image.alpha_composite(img, dark)

    # escurecimento lateral
    lr = Image.new("L", (W, H), 0)
    ld = ImageDraw.Draw(lr)
    for i in range(int(W * 0.20)):
        t = 1 - i / (W * 0.20)
        ld.line([(i, 0), (i, H)], fill=int(150 * t ** 1.6))
        ld.line([(W - 1 - i, 0), (W - 1 - i, H)], fill=int(150 * t ** 1.6))
    side = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    side.putalpha(lr.filter(ImageFilter.GaussianBlur(28 * S)))
    img = Image.alpha_composite(img, side)

    # brilho dourado atras do brasao
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([(540 - 360) * S, (520 - 330) * S, (540 + 360) * S, (520 + 330) * S],
               fill=(255, 190, 92, 34))
    glow = glow.filter(ImageFilter.GaussianBlur(90 * S))
    img = Image.alpha_composite(img, glow)

    # grao
    rng = np.random.default_rng(7)
    noise = rng.normal(0, 5.2, (H, W, 1)).repeat(3, axis=2)
    a = np.clip(np.array(img.convert("RGB")).astype(np.float32) + noise, 0, 255)
    return Image.fromarray(a.astype(np.uint8)).convert("RGBA")


def soft_band(canvas, y0, y1, alpha, feather=26):
    """Faixa horizontal escura com bordas suaves."""
    bh = int((y1 - y0) * S)
    col = Image.new("L", (1, bh), 0)
    px = col.load()
    f = feather * S
    for i in range(bh):
        if i < f:
            v = alpha * (i / f) ** 0.85
        elif i > bh - f:
            v = alpha * ((bh - i) / f) ** 0.85
        else:
            v = alpha
        px[0, i] = int(v)
    band = col.resize((W, bh), Image.BILINEAR)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer.paste(Image.new("RGBA", (W, bh), (2, 4, 7, 255)), (0, int(y0 * S)))
    layer.putalpha(Image.new("L", (W, H), 0))
    a = Image.new("L", (W, H), 0)
    a.paste(band, (0, int(y0 * S)))
    layer.putalpha(a)
    canvas.alpha_composite(layer)


def build():
    canvas = background()
    d = ImageDraw.Draw(canvas)

    # ---------------- moldura ----------------
    d.rectangle([26 * S, 26 * S, W - 26 * S, H - 26 * S], outline=(188, 150, 74, 96), width=max(1, int(1.1 * S)))
    corners(canvas)

    # ---------------- cabecalho ----------------
    f_head = F("barlowcond-700.ttf", 23)
    put(d, "POLÍCIA MILITAR DE GOIÁS", f_head, 540 * S, 74 * S, 9.0,
        fill=(228, 206, 156, 245), anchor="c")
    hairline(canvas, 93, 320, 760, (200, 168, 100, 140), 1.0, True, 4.5)

    # ---------------- titulo ----------------
    f_cft = F("anton.ttf", 246)
    metal_text(canvas, "CFT", f_cft, 540, 326, tracking=5,
               outline=2.2, shadow=(0, 10, 22, 185),
               glow=((255, 168, 56, 255), 30, 30))

    f_sub = F("barlowcond-700.ttf", 42)
    put(d, "CURSO DE FORÇA TÁTICA", f_sub, 540 * S, 388 * S, 6.2,
        fill=(241, 244, 247, 250), anchor="c", stroke=0.7, stroke_fill=(0, 0, 0, 120))

    # ---------------- brasao ----------------
    crest = crest2.make_crest(int(312 * S), ss=2)
    cx = (W - crest.width) // 2
    cy = int(398 * S)
    glow = crest.getchannel("A").filter(ImageFilter.GaussianBlur(24 * S))
    gl = Image.new("RGBA", crest.size, (255, 186, 84, 255))
    gl.putalpha(glow.point(lambda v: int(v * 0.28)))
    canvas.alpha_composite(gl, (cx, cy))
    canvas.alpha_composite(crest, (cx, cy))

    # ---------------- bloco do horario ----------------
    soft_band(canvas, 700, 1010, 198, 64)

    f_lab = F("barlowcond-700.ttf", 26)
    put(d, "HORÁRIO DE INÍCIO", f_lab, 540 * S, 800 * S, 11.5,
        fill=(245, 226, 182, 255), anchor="c", stroke=0.5, stroke_fill=(0, 0, 0, 130))

    f_time = F("anton.ttf", 186)
    metal_text(canvas, "20:00", f_time, 540, 968, tracking=2,
               outline=2.0, shadow=(0, 9, 20, 185),
               glow=((255, 168, 56, 255), 26, 32))

    # ---------------- convite ----------------
    panel = (70, 1010 + EXTRA, 1010, 1246 + EXTRA)
    rounded_panel(canvas, panel, 16, (6, 8, 12, 214), (198, 160, 76, 140), 1.3, (255, 255, 255, 26))

    f_inv = F("barlowcond-800.ttf", 29)
    close_inv = put(d, "CONVITE AOS POLICIAIS MILITARES", f_inv, 540 * S, (1052 + EXTRA) * S, 2.2,
                    fill=(228, 201, 143, 255), anchor="c")
    for sgn in (-1, 1):
        cxd = 540 + sgn * (close_inv / (2 * S) + 24)
        s = 4.2
        cy_d = 1046 + EXTRA
        d.polygon([((cxd) * S, (cy_d - s) * S), ((cxd + s) * S, cy_d * S),
                   ((cxd) * S, (cy_d + s) * S), ((cxd - s) * S, cy_d * S)],
                  fill=(198, 160, 76, 215))

    f_body = F("inter-400.ttf", 21)
    lines = [
        "Policiais militares interessados em integrar a Força Tática estão",
        "convidados a participar do Curso de Força Tática (CFT). Venha",
        "aprimorar seu preparo técnico, físico e operacional com a tropa.",
    ]
    y = 1092 + EXTRA
    for ln in lines:
        put(d, ln, f_body, 540 * S, y * S, 0.2, fill=(219, 224, 231, 242), anchor="c")
        y += 34

    # linha de acao destacada
    cta = "INSCRIÇÕES E INFORMAÇÕES NO COMANDO DA SUA UNIDADE"
    f_cta = F("barlowcond-700.ttf", 23)
    wcta = tw(cta, f_cta, 3.0) / S
    pill = (540 - wcta / 2 - 22, 1192 + EXTRA, 540 + wcta / 2 + 22, 1228 + EXTRA)
    rounded_panel(canvas, pill, 6, (196, 158, 74, 26), (198, 160, 76, 150), 1.1)
    put(d, cta, f_cta, 540 * S, (1216 + EXTRA) * S, 3.0, fill=(240, 219, 168, 255), anchor="c")

    # ---------------- rodape ----------------
    f_foot = F("inter-600.ttf", 15)
    put(d, "FORÇA TÁTICA  •  POLÍCIA MILITAR DE GOIÁS", f_foot, 540 * S, (1296 + EXTRA) * S, 3.6,
        fill=(178, 185, 194, 200), anchor="c")

    return canvas.convert("RGB")


if __name__ == "__main__":
    out = build()
    dst = os.environ.get("POSTER_OUT", os.path.join(WORK, "poster-cft-1080x1350.png"))
    fw, fh = os.environ.get("POSTER_FINAL_W"), os.environ.get("POSTER_FINAL_H")
    if fw and fh:
        out = out.resize((int(fw), int(fh)), Image.LANCZOS)
    out.save(dst)
    print("ok", out.size, dst)


def export_crest(path, width=1600, ss=3, drop_shadow=True):
    c = crest2.make_crest(width, ss=ss, drop_shadow=drop_shadow)
    c.save(path)
    return c.size

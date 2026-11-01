"""Poster CFT - Curso de Forca Tatica | Policia Militar de Goias."""
from __future__ import annotations

import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont


WORK = os.path.dirname(os.path.abspath(__file__))
FONT_DIR_LOCAL = os.path.join(WORK, "fontes")
FONTS = FONT_DIR_LOCAL

DW = 1080
DH = int(os.environ.get("POSTER_DH", "1350"))   # design units
EXTRA = DH - 1350                               # espaco vertical adicional

def Y(v):
    return v + EXTRA
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

    halo = mask.filter(ImageFilter.GaussianBlur(13 * S))
    halo_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 255))
    halo_layer.putalpha(halo.point(lambda v: int(v * 0.42)))
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


def load_photo():
    """Foto da viatura FT, cortada na proporcao pedida (cover)."""
    img = Image.open(os.path.join(WORK, "foto-viatura-ft.jpg")).convert("RGB")
    return img


def background():
    """Fundo ambiente: a propria foto, desfocada e escurecida."""
    img = load_photo()
    sc = max(W / img.width, H / img.height) * 1.08
    nw, nh = int(img.width * sc), int(img.height * sc)
    img = img.resize((nw, nh), Image.BICUBIC)
    img = img.crop(((nw - W) // 2, (nh - H) // 2, (nw - W) // 2 + W, (nh - H) // 2 + H))
    img = img.filter(ImageFilter.GaussianBlur(26 * S))
    a = np.array(img).astype(np.float32) / 255.0

    # tinta azul da corporacao nas sombras
    lum = a.mean(axis=2, keepdims=True)
    a = a * 0.34
    a += np.array([0.010, 0.020, 0.045], dtype=np.float32) * (1.0 - lum)

    canvas = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8)).convert("RGBA")

    # gradientes: topo e base pretos
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for i in range(300 * S):
        t = i / (300 * S)
        d.line([(0, i), (W, i)], fill=(2, 4, 7, int(252 * (1 - t) ** 1.05)))
    for i in range(int(H * 0.55)):
        t = i / (H * 0.55)
        d.line([(0, H - int(H * 0.55) + i), (W, H - int(H * 0.55) + i)],
               fill=(2, 4, 7, int(252 * t ** 1.15)))
    canvas = Image.alpha_composite(canvas, ov)

    # vinheta
    vig = Image.new("L", (W, H), 0)
    ImageDraw.Draw(vig).ellipse([-W * 0.30, -H * 0.18, W * 1.30, H * 1.18], fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(90 * S))
    dark = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    dark.putalpha(vig.point(lambda v: int((255 - v) * 0.60)))
    canvas = Image.alpha_composite(canvas, dark)

    # brilho dourado morno atras do titulo e do horario
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([(540 - 330) * S, (300 - 190) * S, (540 + 330) * S, (300 + 190) * S],
               fill=(255, 172, 62, 26))
    gd.ellipse([(540 - 300) * S, (1080 - 150) * S, (540 + 300) * S, (1080 + 150) * S],
               fill=(255, 172, 62, 22))
    glow = glow.filter(ImageFilter.GaussianBlur(80 * S))
    canvas = Image.alpha_composite(canvas, glow)

    rng = np.random.default_rng(11)
    noise = rng.normal(0, 5.0, (H, W, 1)).repeat(3, axis=2)
    a = np.clip(np.array(canvas.convert("RGB")).astype(np.float32) + noise, 0, 255)
    return Image.fromarray(a.astype(np.uint8)).convert("RGBA")


def photo_band(canvas, y0, y1, fade=70, inset=26):
    """Faixa com a foto nitida da viatura, dentro da moldura."""
    x0, x1 = inset, DW - inset
    bw = int((x1 - x0) * S)
    bh = int((y1 - y0) * S)
    img = load_photo()
    sc = max(bw / img.width, bh / img.height)
    nw, nh = int(img.width * sc + 0.5), int(img.height * sc + 0.5)
    img = img.resize((nw, nh), Image.LANCZOS)
    off_x = (nw - bw) // 2
    off_y = int((nh - bh) * 0.34)
    img = img.crop((off_x, off_y, off_x + bw, off_y + bh))
    img = img.filter(ImageFilter.UnsharpMask(radius=1.8, percent=70, threshold=4))

    a = np.array(img).astype(np.float32) / 255.0
    img = Image.fromarray(np.clip((a ** 1.06) * 255, 0, 255).astype(np.uint8)).convert("RGBA")

    grad = Image.new("L", (1, bh), 255)
    gp = grad.load()
    f = fade * S
    for i in range(bh):
        v = 255
        if i < f:
            v = int(255 * (i / f) ** 0.75)
        elif i > bh - f:
            v = int(255 * ((bh - i) / f) ** 0.75)
        gp[0, i] = v
    img.putalpha(grad.resize((bw, bh), Image.BILINEAR))
    canvas.alpha_composite(img, (int(x0 * S), int(y0 * S)))

    d = ImageDraw.Draw(canvas)
    for yy in (y0, y1):
        d.line([(x0 * S, yy * S), (x1 * S, yy * S)], fill=(206, 170, 92, 110),
               width=max(1, int(1.1 * S)))


def place_badge(canvas, path, size, center_x, top, pad=7.0):
    """Escudo FT apresentado como medalhao emoldurado (ouro sobre fundo escuro)."""
    x0 = int((center_x - size / 2) * S)
    y0 = int(top * S)
    sz = int(size * S)
    # sombra externa
    sh = Image.new("RGBA", (sz + int(28 * S), sz + int(28 * S)), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle(
        [int(6 * S), int(10 * S), sh.width - int(6 * S), sh.height - int(6 * S)],
        radius=int(sz * 0.16), fill=(0, 0, 0, 175))
    sh = sh.filter(ImageFilter.GaussianBlur(9 * S))
    canvas.alpha_composite(sh, (x0 - int(14 * S), y0 - int(4 * S)))

    plate = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
    pd = ImageDraw.Draw(plate)
    pd.rounded_rectangle([0, 0, sz - 1, sz - 1], radius=int(sz * 0.16), fill=(10, 11, 14, 255))
    # borda: preta, ouro, filete interno
    pd.rounded_rectangle([0, 0, sz - 1, sz - 1], radius=int(sz * 0.16),
                         outline=(6, 7, 9, 255), width=int(7.0 * S))
    pd.rounded_rectangle([int(3.2 * S), int(3.2 * S), sz - int(3.2 * S), sz - int(3.2 * S)],
                         radius=int(sz * 0.145), outline=(214, 178, 104, 255), width=int(2.6 * S))
    pd.rounded_rectangle([int(8.6 * S), int(8.6 * S), sz - int(8.6 * S), sz - int(8.6 * S)],
                         radius=int(sz * 0.125), outline=(255, 246, 220, 60), width=max(1, int(1.0 * S)))

    badge = Image.open(path).convert("RGB")
    inner = int((size - 2 * pad) * S)
    badge = badge.resize((inner, inner), Image.LANCZOS)
    badge = badge.filter(ImageFilter.UnsharpMask(radius=2.2, percent=80, threshold=3))
    bmask = Image.new("L", (inner, inner), 0)
    ImageDraw.Draw(bmask).rounded_rectangle([0, 0, inner - 1, inner - 1],
                                            radius=int(inner * 0.11), fill=255)
    bmask = bmask.filter(ImageFilter.GaussianBlur(1.6 * S))
    badge = badge.convert("RGBA")
    badge.putalpha(bmask)
    plate.alpha_composite(badge, (int(pad * S), int(pad * S)))
    canvas.alpha_composite(plate, (x0, y0))
    return top + size


def place_crest_pmgo(canvas, path, height, x, top):
    img = Image.open(path).convert("RGBA")
    w = int(img.width * height * S / img.height)
    h = int(height * S)
    img = img.resize((w, h), Image.LANCZOS)
    canvas.alpha_composite(img, (int(x * S), int(top * S)))
    return w / S




def build():
    canvas = background()
    d = ImageDraw.Draw(canvas)

    # ---------------- moldura ----------------
    d.rectangle([26 * S, 26 * S, W - 26 * S, H - 26 * S],
                outline=(188, 150, 74, 96), width=max(1, int(1.1 * S)))
    corners(canvas)

    # ---------------- cabecalho (brasao oficial PMGO) ----------------
    f_top = F("barlowcond-700.ttf", 26)
    w1 = tw("POLÍCIA MILITAR", f_top, 4.4) / S
    w2 = tw("DE GOIÁS", f_top, 4.4) / S
    wtxt = max(w1, w2)
    group_w = 88 + 26 + wtxt
    gx = 540 - group_w / 2
    place_crest_pmgo(canvas, os.path.join(WORK, "Brasao_PMGO.png"), 88, gx, 42)
    tx = gx + 88 + 26
    put(d, "POLÍCIA MILITAR", f_top, tx * S, 78 * S, 4.4, fill=(242, 245, 248, 252))
    put(d, "DE GOIÁS", f_top, tx * S, 110 * S, 4.4, fill=(242, 245, 248, 252))

    # ---------------- titulo ----------------
    f_cft = F("anton.ttf", 176)
    metal_text(canvas, "CFT", f_cft, 540, 318, tracking=5,
               outline=2.2, shadow=(0, 10, 22, 185),
               glow=((255, 168, 56, 255), 30, 30))

    f_sub = F("barlowcond-700.ttf", 37)
    put(d, "CURSO DE FORÇA TÁTICA", f_sub, 540 * S, 358 * S, 6.0,
        fill=(241, 244, 247, 250), anchor="c", stroke=0.7, stroke_fill=(0, 0, 0, 130))

    # ---------------- escudo FT ----------------
    place_badge(canvas, os.path.join(WORK, "escudo-ft.png"), 216, 540, 372, pad=8.0)

    # ---------------- foto da viatura ----------------
    photo_band(canvas, 590, 966 + int(EXTRA * 0.60), fade=68)

    # ---------------- horario ----------------
    f_lab = F("barlowcond-700.ttf", 24)
    put(d, "HORÁRIO DE INÍCIO", f_lab, 540 * S, Y(1000) * S, 10.5,
        fill=(250, 236, 200, 255), anchor="c", stroke=0.9, stroke_fill=(0, 0, 0, 200))

    f_time = F("anton.ttf", 148)
    metal_text(canvas, "20:00", f_time, 540, Y(1136), tracking=2,
               outline=2.0, shadow=(0, 9, 20, 185),
               glow=((255, 168, 56, 255), 26, 32))

    # ---------------- convite ----------------
    panel = (70, Y(1150), 1010, Y(1298))
    rounded_panel(canvas, panel, 15, (6, 8, 12, 214), (198, 160, 76, 140), 1.3,
                  (255, 255, 255, 26))

    f_inv = F("barlowcond-800.ttf", 27)
    close_inv = put(d, "CONVITE AOS POLICIAIS MILITARES", f_inv, 540 * S, Y(1186) * S, 2.2,
                    fill=(228, 201, 143, 255), anchor="c")
    for sgn in (-1, 1):
        cxd = 540 + sgn * (close_inv / (2 * S) + 22)
        s = 4.0
        yy = Y(1180)
        d.polygon([(cxd * S, (yy - s) * S), ((cxd + s) * S, yy * S),
                   (cxd * S, (yy + s) * S), ((cxd - s) * S, yy * S)],
                  fill=(198, 160, 76, 215))

    f_body = F("inter-400.ttf", 20)
    for i, ln in enumerate([
        "Policiais militares interessados em integrar a Força Tática estão convidados",
        "a participar do Curso de Força Tática. Aprimore seu preparo técnico, físico",
        "e operacional com a tropa.",
    ]):
        put(d, ln, f_body, 540 * S, Y(1216 + i * 27) * S, 0.1,
            fill=(219, 224, 231, 240), anchor="c")

    # ---------------- rodape ----------------
    f_foot = F("inter-600.ttf", 14)
    put(d, "FORÇA TÁTICA  •  POLÍCIA MILITAR DE GOIÁS", f_foot, 540 * S, Y(1330) * S, 3.4,
        fill=(178, 185, 194, 195), anchor="c")

    return canvas.convert("RGB")


if __name__ == "__main__":
    out = build()
    dst = os.environ.get("POSTER_OUT", os.path.join(WORK, "poster-cft-1080x1350.png"))
    fw, fh = os.environ.get("POSTER_FINAL_W"), os.environ.get("POSTER_FINAL_H")
    if fw and fh:
        out = out.resize((int(fw), int(fh)), Image.LANCZOS)
    out.save(dst)
    print("ok", out.size, dst)

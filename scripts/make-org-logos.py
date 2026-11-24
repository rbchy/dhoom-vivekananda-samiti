"""
Makes one round logo for every institution of Dhoom Vivekananda Samiti: public/logos/<id>.svg

Each logo has the Samiti's ring (its name in Bangla on top, in English below — the same as the Samiti
emblem) and, inside, the institution's own symbol and name. All text is turned into outlines, so the
logos look the same everywhere (website, print, social media) without any font installed.

Fonts (not in the repository): Noto Serif Bengali 700 and Playfair Display 700 as .ttf, e.g.
    npm pack @fontsource/noto-serif-bengali @fontsource/playfair-display   (then convert the
    *-bengali-700-normal.woff2 / *-latin-700-normal.woff2 files to .ttf with fontTools)
Run:  pip install uharfbuzz fonttools brotli
      FONT_DIR=/path/to/ttf python3 scripts/make-org-logos.py
"""
import math
import os
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONT_DIR = os.environ.get('FONT_DIR', '/tmp/fonts')
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'logos')
C = 300  # centre of the 600 × 600 drawing


class Face:
    def __init__(self, path):
        data = open(path, 'rb').read()
        self.hb = hb.Font(hb.Face(data))
        self.tt = TTFont(path)
        self.glyphs = self.tt.getGlyphSet()
        self.order = self.tt.getGlyphOrder()
        self.upem = self.tt['head'].unitsPerEm

    def shape(self, text):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hb, buf, {})
        return list(zip(buf.glyph_infos, buf.glyph_positions))

    def width(self, text, size):
        return sum(p.x_advance for _, p in self.shape(text)) * size / self.upem

    def glyph_path(self, gid, transform):
        pen = SVGPathPen(self.glyphs, ntos=lambda v: ('%.1f' % v).rstrip('0').rstrip('.'))  # 0.1 px is plenty, keeps files small
        self.glyphs[self.order[gid]].draw(TransformPen(pen, transform))
        return pen.getCommands()


BN = Face(os.path.join(FONT_DIR, 'bn.ttf'))
EN = Face(os.path.join(FONT_DIR, 'pf.ttf'))


def straight(face, text, size, cx, baseline):
    """Text centred on cx, as outlines"""
    s = size / face.upem
    x = cx - face.width(text, size) / 2
    out = []
    for info, pos in face.shape(text):
        t = (s, 0, 0, -s, x + pos.x_offset * s, baseline - pos.y_offset * s)
        d = face.glyph_path(info.codepoint, t)
        if d:
            out.append(d)
        x += pos.x_advance * s
    return ' '.join(out)


def arc(face, text, size, radius, top=True, spacing=0.0):
    """Text along a circle (baseline on the circle), always reading left to right and upright:
    on top the letters stand outward, at the bottom they stand toward the centre."""
    s = size / face.upem
    shaped = face.shape(text)
    advances = [p.x_advance * s + spacing for _, p in shaped]
    total = sum(advances) - spacing
    r = radius
    start = -total / r / 2
    out = []
    used = 0.0
    for (info, pos), adv in zip(shaped, advances):
        th = start + (used + pos.x_advance * s / 2) / r  # angle of the glyph centre, negative = left
        used += adv
        cos, sin = math.cos(th), math.sin(th)
        gx, gy = -pos.x_advance * s / 2 + pos.x_offset * s, pos.y_offset * s
        if top:   # P = (C + r sin, C - r cos); baseline → (cos, sin); up → (sin, -cos)
            px, py = C + r * sin, C - r * cos
            t = (s * cos, s * sin, s * sin, -s * cos, px + cos * gx + sin * gy, py + sin * gx - cos * gy)
        else:     # P = (C + r sin, C + r cos); baseline → (cos, -sin); up → (-sin, -cos)
            px, py = C + r * sin, C + r * cos
            t = (s * cos, -s * sin, -s * sin, -s * cos, px + cos * gx - sin * gy, py - sin * gx - cos * gy)
        d = face.glyph_path(info.codepoint, t)
        if d:
            out.append(d)
    return ' '.join(out)


# ---------- The institutions' symbols (gold, centred on 300, ~150 tall, top ≈ 120) ----------

LOTUS = ('M300 302 C282 280 282 252 300 232 C318 252 318 280 300 302 Z '
         'M297 304 C270 300 250 282 244 258 C268 260 288 276 297 304 Z '
         'M303 304 C330 300 350 282 356 258 C332 260 312 276 303 304 Z '
         'M292 308 C262 312 232 304 214 286 C242 280 272 290 292 308 Z '
         'M308 308 C338 312 368 304 386 286 C358 280 328 290 308 308 Z '
         'M222 314 L378 314 L370 322 L230 322 Z')


def sym_kali():
    # khadga (sword) rising from the lotus, crescent moon above
    sword = ('M296 230 L296 160 C296 136 300 120 300 108 C306 122 310 140 308 166 L304 230 Z '
             'M276 236 L324 236 L324 244 L276 244 Z M294 244 L306 244 L306 262 L294 262 Z '
             'M300 262 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0')
    moon = 'M262 112 a24 24 0 1 0 22 34 a19 19 0 1 1 -22 -34 Z'
    star = 'M336 118 l4 10 l10 1 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 l10 -1 Z'
    return sword + ' ' + moon + ' ' + star + ' ' + LOTUS.replace('M300 302 C282 280 282 252 300 232 C318 252 318 280 300 302 Z ', '')


def sym_durga():
    # trishul (trident) on the lotus
    return ('M294 120 L306 120 L306 232 L294 232 Z '
            'M300 96 C292 108 288 118 288 128 L312 128 C312 118 308 108 300 96 Z '
            'M260 110 C254 140 266 160 292 164 L292 150 C278 146 272 134 274 116 Z '
            'M340 110 C346 140 334 160 308 164 L308 150 C322 146 328 134 326 116 Z '
            'M262 112 L254 104 L268 108 Z M338 112 L346 104 L332 108 Z '
            'M286 162 L314 162 L314 170 L286 170 Z '
            'M300 212 m-10 0 a10 6 0 1 0 20 0 a10 6 0 1 0 -20 0 '
            + LOTUS.replace('M300 302 C282 280 282 252 300 232 C318 252 318 280 300 302 Z ', ''))


def sym_shiv():
    # Lord Shiva and Ma Ganga together: the Shiva Linga with tripundra and crescent moon,
    # and Ganga flowing down from above onto the Linga (jalabhishek), ending in waves at its foot
    linga = ('M276 246 C276 196 284 166 300 166 C316 166 324 196 324 246 Z '
             'M284 196 L316 196 L316 200 L284 200 Z M282 206 L318 206 L318 210 L282 210 Z M281 216 L319 216 L319 220 L281 220 Z '
             'M300 184 m-3.5 0 a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0 '
             'M240 246 L360 246 C360 258 350 266 336 266 L264 266 C250 266 240 258 240 246 Z '
             'M360 250 L388 254 C390 260 386 264 380 264 L356 262 Z '
             'M256 266 L344 266 L338 280 L262 280 Z M246 280 L354 280 L354 290 L246 290 Z ')
    moon = 'M318 140 a15 15 0 1 0 22 18 a11 11 0 1 1 -22 -18 Z'
    ganga = ''
    waves = ('M214 304 C226 296 238 296 250 304 C262 312 274 312 286 304 C298 296 310 296 322 304 C334 312 346 312 358 304 C370 296 382 296 388 302 '
             'L388 308 C382 302 370 302 358 310 C346 318 334 318 322 310 C310 302 298 302 286 310 C274 318 262 318 250 310 C238 302 226 302 214 310 Z '
             'M232 318 C244 312 256 312 268 318 C280 324 292 324 304 318 C316 312 328 312 340 318 C352 324 364 324 370 320 '
             'L370 325 C364 329 352 329 340 323 C328 317 316 317 304 323 C292 329 280 329 268 323 C256 317 244 317 232 323 Z')
    return linga + moon + ' ' + waves


def sym_ramakrishna():
    # temple with a central dome and two side domes, flag on top
    return ('M300 98 L300 128 M300 98 L326 106 L300 114 Z '
            'M298 98 L302 98 L302 130 L298 130 Z M300 98 L326 106 L302 114 Z '
            'M262 180 C262 150 280 132 300 130 C320 132 338 150 338 180 Z '
            'M256 180 L344 180 L344 188 L256 188 Z '
            'M220 206 C220 190 228 182 238 180 C248 182 256 190 256 206 Z M344 206 C344 190 352 182 362 180 C372 182 380 190 380 206 Z '
            'M214 206 L386 206 L386 212 L214 212 Z '
            'M222 212 L378 212 L378 262 L222 262 Z '
            'M288 262 L288 230 C288 222 294 218 300 218 C306 218 312 222 312 230 L312 262 Z '
            'M240 226 L258 226 L258 248 L240 248 Z M342 226 L360 226 L360 248 L342 248 Z '
            'M206 262 L394 262 L394 272 L206 272 Z M196 272 L404 272 L404 282 L196 282 Z')


def sym_clinic():
    # medical cross in a circle, held by the lotus
    return ('M300 180 m-62 0 a62 62 0 1 0 124 0 a62 62 0 1 0 -124 0 Z '
            'M300 180 m-54 0 a54 54 0 1 1 108 0 a54 54 0 1 1 -108 0 Z '
            'M288 142 L312 142 L312 168 L338 168 L338 192 L312 192 L312 218 L288 218 L288 192 L262 192 L262 168 L288 168 Z '
            + LOTUS.replace('M300 302 C282 280 282 252 300 232 C318 252 318 280 300 302 Z ', ''))


def sym_gourishankar():
    # oil lamp (pradip) with flame, on a stand
    return ('M300 104 C286 128 284 146 300 162 C316 146 314 128 300 104 Z '
            'M300 124 C294 136 294 146 300 152 C306 146 306 136 300 124 Z '
            'M226 178 C240 210 270 222 300 222 C330 222 360 210 374 178 L356 178 C346 196 326 206 300 206 C274 206 254 196 244 178 Z '
            'M374 178 L396 166 L390 182 Z '
            'M290 166 L310 166 L306 180 L294 180 Z '
            'M292 222 L308 222 L306 262 L294 262 Z '
            'M262 262 L338 262 C338 274 326 282 312 282 L288 282 C274 282 262 274 262 262 Z')


# Lines drawn with a pen (gold stroke) on top of a symbol: Ma Ganga's stream onto the Shiva Linga
STROKES = {
    'shiv': '<path d="M218 118 C244 98 270 110 280 126 C288 140 294 150 300 160" fill="none" stroke="url(#gt)" stroke-width="10" stroke-linecap="round"/>'
            '<path d="M222 140 C240 128 256 132 266 142 C272 148 276 154 280 160" fill="none" stroke="url(#gt)" stroke-width="5" stroke-linecap="round"/>'
            '<circle cx="292" cy="172" r="3" fill="url(#gt)"/><circle cx="308" cy="174" r="2.5" fill="url(#gt)"/>'
}

def sym_clothes():
    # a folded garment (kurta) offered on open hands
    shirt = ('M262 120 L286 110 C290 122 310 122 314 110 L338 120 L362 150 L344 162 L334 150 L334 226 L266 226 L266 150 L256 162 L238 150 Z '
             'M300 132 L300 226 L296 226 L296 132 Z M290 140 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M290 160 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 ')
    hands = ('M206 250 C228 238 262 236 296 246 L296 262 C262 254 232 256 214 266 Z '
             'M394 250 C372 238 338 236 304 246 L304 262 C338 254 368 256 386 266 Z '
             'M228 270 L372 270 L364 282 L236 282 Z')
    return shirt + hands


def sym_gita():
    # the open Gita with the lamp of knowledge above it
    flame = ('M300 104 C288 124 286 140 300 154 C314 140 312 124 300 104 Z '
             'M300 122 C295 132 295 140 300 146 C305 140 305 132 300 122 Z '
             'M282 160 C290 168 310 168 318 160 L314 170 C306 176 294 176 286 170 Z ')
    book = ('M300 202 C276 186 246 182 218 188 L218 262 C246 256 276 260 300 276 Z '
            'M300 202 C324 186 354 182 382 188 L382 262 C354 256 324 260 300 276 Z '
            'M230 204 C250 200 270 202 288 212 L288 216 C270 206 250 204 230 208 Z M230 222 C250 218 270 220 288 230 L288 234 C270 224 250 222 230 226 Z '
            'M370 204 C350 200 330 202 312 212 L312 216 C330 206 350 204 370 208 Z M370 222 C350 218 330 220 312 230 L312 234 C330 224 350 222 370 226 Z '
            'M206 196 L214 196 L214 270 C246 264 276 268 300 284 C324 268 354 264 386 270 L386 196 L394 196 L394 280 C356 274 326 278 300 294 C274 278 244 274 206 280 Z')
    return flame + book


INSTITUTIONS = [
    ('dakshin-kalika', sym_kali, ['শ্রীশ্রী', 'দক্ষিণকালিকা মন্দির'], 'SREE SREE DOKKHIN KALIKA MANDIR'),
    ('durga', sym_durga, ['শ্রীশ্রী', 'বাসন্তী দুর্গা মন্দির'], 'SREE SREE BASANTI DURGA MANDIR'),
    ('shiv', sym_shiv, ['শ্রীশ্রী মহাদেব ও মা গঙ্গা', 'শিব মন্দির'], 'SHIV MANDIR · LORD SHIVA & MA GANGA'),
    ('ramakrishna', sym_ramakrishna, ['শ্রীশ্রী', 'রামকৃষ্ণ মন্দির'], 'SREE SREE RAMAKRISHNA MANDIR'),
    ('clinic', sym_clinic, ['কমিউনিটি', 'ক্লিনিক'], 'COMMUNITY CLINIC'),
    ('clothes', sym_clothes, ['বার্ষিক', 'বস্ত্র বিতরণ'], 'ANNUAL CLOTHES DISTRIBUTION'),
    ('gita', sym_gita, ['শিশুদের জন্য', 'গীতা শিক্ষা কেন্দ্র'], 'GITA LEARNING CENTRE FOR CHILDREN'),
    ('gourishankar', sym_gourishankar, ['শ্রীশ্রী গৌরীশংকর', 'শ্মশান মন্দির'], 'SREE SREE GOURISHANKAR FUNERAL TEMPLE'),
]


def fit(face, text, size, max_width):
    w = face.width(text, size)
    return size if w <= max_width else size * max_width / w


def logo(symbol, name_lines, name_en, strokes=''):
    ring_top = arc(BN, 'ধুম বিবেকানন্দ সমিতি', 40, 236, top=True, spacing=1.5)
    ring_bottom = arc(EN, 'DHOOM VIVEKANANDA SAMITI', 26, 262, top=False, spacing=3)
    small, big = name_lines
    s_big = fit(BN, big, 40, 300)
    s_small = fit(BN, small, 26, 260)
    s_en = fit(EN, name_en, 12.5, 250)
    text = ' '.join([
        straight(BN, small, s_small, C, 364),
        straight(BN, big, s_big, C, 364 + 10 + s_big),
        straight(EN, name_en, s_en, C, 364 + 10 + s_big + 26),
    ])
    star = lambda x, y: f'M{x} {y - 9} l3 6 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 Z'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
<defs><linearGradient id="gt" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="600"><stop offset="0" stop-color="#f6d77a"/><stop offset=".5" stop-color="#e3b23c"/><stop offset="1" stop-color="#c9971f"/></linearGradient></defs>
<circle cx="300" cy="300" r="292" fill="#2b1a05"/>
<circle cx="300" cy="300" r="286" fill="none" stroke="url(#gt)" stroke-width="5"/>
<circle cx="300" cy="300" r="278" fill="none" stroke="url(#gt)" stroke-width="1.5"/>
<circle cx="300" cy="300" r="214" fill="none" stroke="url(#gt)" stroke-width="1.5"/>
<circle cx="300" cy="300" r="207" fill="none" stroke="url(#gt)" stroke-width="4"/>
<circle cx="300" cy="300" r="200" fill="#3a2309"/>
<g fill="url(#gt)">
<path d="{ring_top}"/>
<path d="{ring_bottom}"/>
<path d="{star(54, 300)} {star(546, 300)}"/>
<path fill-rule="evenodd" d="{symbol()}"/>
{strokes}
<path d="{text}"/>
<rect x="200" y="334" width="200" height="2" rx="1"/>
</g>
</svg>
'''


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for oid, symbol, lines, en in INSTITUTIONS:
        with open(os.path.join(OUT, f'{oid}.svg'), 'w') as f:
            f.write(logo(symbol, lines, en, STROKES.get(oid, '')))
        print('wrote', oid)

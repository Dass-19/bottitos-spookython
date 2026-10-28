#!/usr/bin/env python3
"""
Generador de sprites pixel art de ALTA DEFINICIÓN para "La Plaga Zombie" (Spookython 2026, Track B).

Resolución: Cuadrícula de 48x56 píxeles por frame, escalada a 240x280 (escala 5x).
Paleta: 36 colores arcade con rampas tonales de 4 niveles (luz, medio, sombra, sombra profunda).
Animación: 6 frames por personaje en bucles fluidos (walk cycle zombie, saludo militar, temblores agónicos y levitación celestial).

Estados del modelo SEIR:
    S  Sano        -> sano.gif / sano_sheet.png        (soldadito civil táctico saludando con pañuelo rojo)
    E  Mordido     -> mordido.gif / mordido_sheet.png  (civil agónico con mordedura viva, venas virales y temblores)
    I  Zombie      -> zombie.gif / zombie_sheet.png    (no-muerto voraz con costillas expuestas, ropa rasgada y marcha arrastrada)
    R  Exorcizado  -> exorcizado.gif / exorcizado_sheet.png (alma purificada flotando con aureola dorada y túnica astral)
"""
import os
import sys
import math
from PIL import Image, ImageDraw, ImageFont

W, H = 48, 56          # Cuadrícula de alta definición (más del doble de resolución que 32x40)
SCALE = 5              # Factor de ampliación nearest-neighbour => 240 x 280 píxeles nítidos
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "assets", "sprites")

# ---------------------------------------------------------------- PALETA TÁCTICA ARCADE
PAL = {
    # 0 = Transparente
    "T": (0, 0, 0),
    # Contorno y negro profundo
    "O": (18, 14, 22),
    "O_SOFT": (36, 28, 40),
    
    # Piel Humana Sana (4 tonos de volumen)
    "SK_HI": (255, 224, 188),
    "SK_MID": (240, 182, 138),
    "SK_SH": (196, 134, 92),
    "SK_DARK": (145, 90, 58),

    # Piel Enfermiza / Mordido (Fiebre + venas virulentas)
    "PL_HI": (224, 238, 204),
    "PL_MID": (182, 206, 156),
    "PL_SH": (138, 166, 118),
    "PL_DARK": (96, 126, 82),
    "VEIN": (64, 146, 108),
    "VEIN_DARK": (38, 98, 72),

    # Piel Zombi No-Muerto (Gangrena y putrefacción)
    "ZSK_HI": (152, 194, 118),
    "ZSK_MID": (112, 162, 82),
    "ZSK_SH": (72, 116, 52),
    "ZSK_DARK": (42, 76, 32),
    "ZSK_PURP": (82, 62, 92),
    "ZSK_PURP_SH": (52, 38, 62),

    # Huesos, Costillas y Dientes
    "BONE_HI": (252, 250, 238),
    "BONE_MID": (224, 218, 192),
    "BONE_SH": (174, 166, 142),

    # Sangre y Tejido Vivo
    "BL_HI": (255, 54, 54),
    "BL_MID": (196, 22, 22),
    "BL_SH": (132, 12, 16),
    "BL_DEEP": (76, 4, 8),

    # Uniforme Militar / Gorra (Verde Oliva / Camo)
    "CAP_HI": (118, 162, 86),
    "CAP_MID": (76, 118, 56),
    "CAP_SH": (48, 80, 36),
    "CAP_DARK": (28, 50, 22),
    "GOLD_BADGE": (255, 216, 58),
    "GOLD_SH": (188, 142, 24),

    # Camisa / Chaqueta Caqui
    "SH_HI": (242, 218, 146),
    "SH_MID": (206, 174, 98),
    "SH_SH": (156, 124, 66),
    "SH_DARK": (108, 82, 38),

    # Pañuelo Rojo / Bandana
    "SC_HI": (248, 68, 68),
    "SC_MID": (198, 26, 26),
    "SC_SH": (132, 14, 14),

    # Pantalón Táctico Azul Denim
    "PA_HI": (98, 126, 180),
    "PA_MID": (64, 86, 138),
    "PA_SH": (42, 58, 102),
    "PA_DARK": (26, 36, 68),

    # Ropa Desgarrada Zombi (Violeta ceniza)
    "ZCL_HI": (146, 126, 158),
    "ZCL_MID": (106, 86, 118),
    "ZCL_SH": (70, 54, 80),
    "ZCL_DARK": (44, 32, 52),

    # Cuero, Botas y Cinturón
    "LT_HI": (152, 102, 62),
    "LT_MID": (108, 68, 38),
    "LT_SH": (72, 42, 22),
    "LT_DARK": (44, 24, 12),
    "STEEL": (212, 222, 232),

    # Ojos y Expresiones
    "WH": (255, 255, 255),
    "EYE_WH": (255, 255, 255),
    "EYE_YE": (255, 236, 58),
    "EYE_RD": (224, 28, 28),
    "PUPIL": (14, 14, 18),

    # Gotas de Sudor
    "SW_HI": (222, 246, 255),
    "SW_MID": (128, 212, 252),

    # Exorcizado: Túnica Sagrada, Halo y Destellos
    "ROBE_HI": (252, 252, 255),
    "ROBE_MID": (214, 228, 248),
    "ROBE_SH": (156, 178, 218),
    "ROBE_DARK": (104, 124, 172),
    "HALO_HI": (255, 248, 144),
    "HALO_MID": (255, 208, 42),
    "HALO_SH": (202, 144, 18),
    "DIVINE_SP": (255, 255, 210),
    "AURA_CY": (142, 220, 252),
    
    # Sombra suave en el suelo
    "GND_SH": (22, 18, 26),
}
IDX = {k: i for i, k in enumerate(PAL)}
PALFLAT = [c for rgb in PAL.values() for c in rgb] + [0] * (768 - 3 * len(PAL))


class CanvasHD:
    """Lienzo de dibujo pixel art en cuadrícula W x H con paleta indexada."""

    def __init__(self):
        self.im = Image.new("P", (W, H), 0)
        self.im.putpalette(PALFLAT)
        self.d = ImageDraw.Draw(self.im)
        self.ox = 0
        self.oy = 0

    def r(self, x, y, w, h, c):
        x += self.ox
        y += self.oy
        if w > 0 and h > 0:
            self.d.rectangle([x, y, x + w - 1, y + h - 1], fill=IDX[c])

    def p(self, x, y, c):
        self.r(x, y, 1, 1, c)

    def vline(self, x, y, h, c):
        self.r(x, y, 1, h, c)

    def hline(self, x, y, w, c):
        self.r(x, y, w, 1, c)


def outline_hd(im):
    """Genera contorno nítido de 1 pixel alrededor del personaje."""
    px = im.load()
    marks = []
    for y in range(H):
        for x in range(W):
            if px[x, y] == 0:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < W and 0 <= ny < H and px[nx, ny] not in (0, IDX["O"], IDX["GND_SH"]):
                        marks.append((x, y))
                        break
    for x, y in marks:
        px[x, y] = IDX["O"]
    return im


def draw_ground_shadow(c, cx=24, cy=52, rx=11, ry=2):
    """Sombra de contacto elíptica sobre el pavimento."""
    for dy in range(-ry, ry + 1):
        span = int(rx * math.sqrt(max(0, 1 - (dy / (ry + 0.5)) ** 2)))
        c.hline(cx - span, cy + dy, span * 2 + 1, "GND_SH")


# ---------------------------------------------------------------- SANO (S)
def sano():
    frames = []
    # 6 frames: respiración, parpadeo, saludo militar fluido y ondeado de pañuelo
    bobs = [0, -1, -2, -1, 0, 1]
    salute_dx = [0, 0, 1, 1, 0, 0]
    blink_frames = [False, False, False, True, False, False]
    scarf_flutter = [0, 1, 2, 2, 1, 0]

    for i in range(6):
        c = CanvasHD()
        bob = bobs[i]
        sdx = salute_dx[i]
        blink = blink_frames[i]
        fl = scarf_flutter[i]

        draw_ground_shadow(c, cx=24, cy=52, rx=11, ry=2)

        # 1. Piernas y Botas Militares (Firmeza en el suelo)
        # Pierna izquierda
        c.r(17, 36, 5, 10, "PA_MID")
        c.r(17, 36, 1, 10, "PA_HI")
        c.r(21, 36, 1, 10, "PA_SH")
        c.r(17, 41, 5, 1, "PA_DARK")  # pliegue rodilla

        # Pierna derecha
        c.r(26, 36, 5, 10, "PA_MID")
        c.r(26, 36, 1, 10, "PA_HI")
        c.r(30, 36, 1, 10, "PA_SH")
        c.r(26, 41, 5, 1, "PA_DARK")

        # Botas de combate con puntera y suela
        # Bota izquierda
        c.r(15, 46, 7, 5, "LT_MID")
        c.r(15, 46, 7, 1, "LT_HI")
        c.r(15, 47, 1, 4, "LT_HI")
        c.r(20, 48, 2, 3, "LT_SH")
        c.r(14, 50, 9, 2, "LT_DARK")  # suela
        c.r(17, 47, 2, 1, "STEEL")    # cordón
        c.r(17, 49, 2, 1, "STEEL")

        # Bota derecha
        c.r(26, 46, 7, 5, "LT_MID")
        c.r(26, 46, 7, 1, "LT_HI")
        c.r(26, 47, 1, 4, "LT_HI")
        c.r(31, 48, 2, 3, "LT_SH")
        c.r(25, 50, 9, 2, "LT_DARK")
        c.r(28, 47, 2, 1, "STEEL")
        c.r(28, 49, 2, 1, "STEEL")

        # 2. Torso, Chaqueta Táctica y Cinturón
        # Cinturón de combate
        c.r(17, 33 + bob, 14, 3, "LT_MID")
        c.r(17, 33 + bob, 14, 1, "LT_HI")
        c.r(17, 35 + bob, 14, 1, "LT_DARK")
        c.r(23, 33 + bob, 3, 3, "STEEL")  # hebilla metálica
        c.p(24, 34 + bob, "WH")
        c.r(15, 33 + bob, 3, 4, "LT_SH")  # cartuchera / pouch
        c.p(16, 34 + bob, "GOLD_SH")

        # Chaqueta de campaña
        c.r(17, 21 + bob, 14, 12, "SH_MID")
        c.r(17, 21 + bob, 2, 12, "SH_HI")
        c.r(29, 21 + bob, 2, 12, "SH_SH")
        # Bolsillos de pecho
        c.r(19, 24 + bob, 4, 4, "SH_HI")
        c.r(19, 28 + bob, 4, 1, "SH_SH")
        c.p(21, 25 + bob, "GOLD_SH")
        c.r(25, 24 + bob, 4, 4, "SH_MID")
        c.r(25, 28 + bob, 4, 1, "SH_SH")
        c.p(27, 25 + bob, "GOLD_SH")
        # Cuello de camisa
        c.r(21, 21 + bob, 6, 2, "SH_HI")

        # 3. Brazo izquierdo en reposo (mano en cadera)
        c.r(13, 22 + bob, 4, 7, "SH_MID")
        c.r(13, 22 + bob, 1, 7, "SH_HI")
        c.r(16, 22 + bob, 1, 7, "SH_SH")
        c.r(12, 28 + bob, 4, 4, "SH_MID")
        c.r(13, 31 + bob, 4, 4, "SK_MID")  # mano enguantada / piel
        c.r(13, 31 + bob, 1, 4, "SK_HI")
        c.r(16, 31 + bob, 1, 4, "SK_SH")

        # 4. Pañuelo Rojo Táctico (ondea con el viento)
        c.r(18, 19 + bob, 12, 3, "SC_MID")
        c.r(18, 19 + bob, 12, 1, "SC_HI")
        c.r(18, 21 + bob, 12, 1, "SC_SH")
        # Nudo y colas ondeando
        c.r(15 - fl, 20 + bob, 4, 4, "SC_MID")
        c.r(14 - fl, 21 + bob, 4, 4, "SC_HI")
        c.r(13 - fl, 23 + bob, 3, 3, "SC_SH")

        # 5. Cabeza, Rostro y Expresión
        c.r(18, 9 + bob, 12, 11, "SK_MID")
        c.r(18, 9 + bob, 2, 11, "SK_HI")
        c.r(28, 9 + bob, 2, 11, "SK_SH")
        c.r(19, 18 + bob, 10, 2, "SK_DARK")  # sombra de cuello
        c.r(16, 12 + bob, 2, 4, "SK_MID")   # oreja izquierda
        c.p(17, 13 + bob, "SK_SH")

        # Rasgos faciales
        if blink:
            c.hline(24, 14 + bob, 4, "O")
        else:
            c.r(24, 13 + bob, 4, 3, "EYE_WH")
            c.p(26, 14 + bob, "PUPIL")
            c.p(26, 13 + bob, "WH")          # brillo en la mirada
            c.hline(24, 12 + bob, 4, "SK_DARK") # ceja firme

        c.r(28, 14 + bob, 2, 2, "SK_SH")    # nariz perfilada
        c.hline(24, 17 + bob, 4, "SK_DARK") # sonrisa confiada
        c.p(27, 16 + bob, "SK_DARK")

        # 6. Gorra Militar Táctica con Insignia Dorada
        # Copa de la gorra
        c.r(16, 4 + bob, 15, 6, "CAP_MID")
        c.r(16, 4 + bob, 15, 2, "CAP_HI")
        c.r(29, 6 + bob, 2, 4, "CAP_SH")
        # Visera
        c.r(17, 9 + bob, 16, 2, "CAP_DARK")
        c.r(29, 10 + bob, 5, 2, "CAP_DARK")
        c.r(28, 9 + bob, 5, 1, "CAP_SH")
        # Insignia dorada
        c.r(23, 5 + bob, 3, 3, "GOLD_BADGE")
        c.p(24, 5 + bob, "WH")
        c.p(25, 7 + bob, "GOLD_SH")

        # 7. Brazo Derecho en Saludo Militar (levantado a la visera)
        c.r(29 + sdx, 21 + bob, 4, 5, "SH_MID")
        c.r(32 + sdx, 16 + bob, 4, 7, "SH_MID")
        c.r(33 + sdx, 16 + bob, 1, 7, "SH_HI")
        c.r(35 + sdx, 16 + bob, 1, 7, "SH_SH")
        # Antebrazo subiendo a la sien
        c.r(30 + sdx, 11 + bob, 5, 5, "SH_HI")
        # Mano enguantada en saludo perfecto
        c.r(28 + sdx, 8 + bob, 4, 4, "SK_HI")
        c.r(28 + sdx, 8 + bob, 4, 1, "SK_MID")
        c.r(31 + sdx, 9 + bob, 1, 3, "SK_SH")

        frames.append(outline_hd(c.im))

    return frames, 130


# ---------------------------------------------------------------- MORDIDO (E)
def mordido():
    frames = []
    # 6 frames con temblores violentos, sudor frío, venas pulsantes y ojo infectado
    shakes_x = [-1, 1, -2, 2, -1, 1]
    shakes_y = [0, 1, 0, 1, 0, 1]
    sweat_y = [0, 1, 2, 3, 1, 2]

    for i in range(6):
        c = CanvasHD()
        c.ox = shakes_x[i]
        bob = shakes_y[i]
        sw = sweat_y[i]
        vein_pulse = "VEIN_DARK" if (i % 2 == 0) else "VEIN"

        draw_ground_shadow(c, cx=24, cy=52, rx=11, ry=2)

        # 1. Piernas temblando
        # Izquierda
        c.r(17, 36, 5, 10, "PA_MID")
        c.r(17, 36, 1, 10, "PA_HI")
        c.r(21, 36, 1, 10, "PA_SH")
        c.r(17, 41, 5, 1, "PA_DARK")
        # Derecha
        c.r(26, 36, 5, 10, "PA_MID")
        c.r(26, 36, 1, 10, "PA_HI")
        c.r(30, 36, 1, 10, "PA_SH")

        # Botas
        c.r(15, 46, 7, 5, "LT_MID"); c.r(14, 50, 9, 2, "LT_DARK")
        c.r(26, 46, 7, 5, "LT_MID"); c.r(25, 50, 9, 2, "LT_DARK")

        # 2. Torso y Ropa Manchada
        c.r(17, 33 + bob, 14, 3, "LT_MID")
        c.r(23, 33 + bob, 3, 3, "STEEL")
        c.r(17, 21 + bob, 14, 12, "SH_MID")
        c.r(17, 21 + bob, 2, 12, "SH_HI")
        c.r(29, 21 + bob, 2, 12, "SH_SH")

        # 3. Mordedura brutal en hombro / brazo izquierdo
        c.r(13, 21 + bob, 5, 8, "SH_MID")
        # Desgarro de ropa con herida abierta
        c.r(13, 23 + bob, 4, 6, "PL_SH")
        c.r(14, 24 + bob, 4, 5, "BL_MID")
        c.r(14, 25 + bob, 3, 3, "BL_DEEP")
        # Marcas de dientes caninos humanos
        c.p(14, 24 + bob, "BONE_HI")
        c.p(16, 24 + bob, "BONE_HI")
        c.p(15, 27 + bob, "BONE_HI")
        # Sangre viva escurriendo hacia el brazo
        c.r(15, 29 + bob, 2, 4, "BL_HI")
        if i >= 3:
            c.p(15, 33 + bob, "BL_MID")  # gota cayendo

        # Venas infectadas ramificándose desde la mordida al pecho
        c.p(18, 23 + bob, vein_pulse)
        c.p(19, 24 + bob, vein_pulse)
        c.p(20, 23 + bob, vein_pulse)
        c.p(21, 25 + bob, vein_pulse)
        c.p(22, 24 + bob, vein_pulse)

        # 4. Mano derecha apretando el cuello / pecho con dolor
        c.r(27, 22 + bob, 4, 6, "SH_MID")
        c.r(25, 26 + bob, 4, 5, "SH_HI")
        c.r(22, 28 + bob, 5, 4, "PL_MID")  # dedos crispados
        c.r(22, 28 + bob, 1, 4, "PL_DARK")

        # 5. Pañuelo rojo desaliñado
        c.r(18, 19 + bob, 12, 3, "SC_MID")
        c.r(18, 19 + bob, 12, 1, "SC_HI")
        c.r(16, 21 + bob, 3, 4, "SC_SH")

        # 6. Cabeza Pálida y Traumatizada
        c.r(18, 9 + bob, 12, 11, "PL_MID")
        c.r(18, 9 + bob, 2, 11, "PL_HI")
        c.r(28, 9 + bob, 2, 11, "PL_SH")
        c.r(19, 18 + bob, 10, 2, "PL_DARK")
        c.r(16, 12 + bob, 2, 4, "PL_MID")

        # Venas faciales infectadas
        c.p(20, 11 + bob, vein_pulse)
        c.p(21, 12 + bob, vein_pulse)
        c.p(22, 11 + bob, vein_pulse)
        c.p(28, 13 + bob, vein_pulse)
        c.p(27, 14 + bob, vein_pulse)

        # Ojos agónicos: Izquierdo asustado, Derecho infectado
        # Ojo izquierdo
        c.r(20, 13 + bob, 3, 3, "EYE_WH")
        c.p(21, 14 + bob, "PUPIL")
        # Ojo derecho infectado (esclera amarilla, iris rojo pulsante)
        c.r(25, 13 + bob, 4, 3, "EYE_YE")
        c.p(26, 14 + bob, "EYE_RD")
        c.p(27, 14 + bob, "PUPIL" if i % 2 == 0 else "EYE_RD")
        c.hline(24, 12 + bob, 5, "PL_DARK")

        # Boca abierta sufriendo y jadeando
        c.r(23, 16 + bob, 5, 3, "O")
        c.p(24, 16 + bob, "BONE_HI")
        c.p(26, 16 + bob, "BONE_HI")
        c.p(25, 18 + bob, "PL_DARK")  # saliva ácida

        # Gorra militar torcida y desgastada
        c.r(16, 4 + bob, 15, 6, "CAP_MID")
        c.r(16, 4 + bob, 15, 2, "CAP_HI")
        c.r(17, 9 + bob, 16, 2, "CAP_DARK")
        c.r(28, 10 + bob, 5, 2, "CAP_DARK")
        c.p(24, 6 + bob, "GOLD_SH")

        # Gotas de sudor frío saltando del rostro
        c.p(14, 11 + sw, "SW_HI"); c.p(14, 12 + sw, "SW_MID")
        c.p(32, 10 + ((sw + 2) % 4), "SW_HI")
        c.p(33, 11 + ((sw + 2) % 4), "SW_MID")

        # Signo de advertencia (!) titilante sobre la cabeza
        if i < 3:
            c.r(36, 2, 2, 5, "BL_HI")
            c.r(36, 8, 2, 2, "BL_HI")

        frames.append(outline_hd(c.im))

    return frames, 120


# ---------------------------------------------------------------- ZOMBIE (I)
def zombie():
    frames = []
    # 6 frames: Marcha arrastrada, paso lisiado, costillas al aire y brazos voraces
    # (x pie izq, y lift izq, x pie der, y lift der, bob_torso, sway_brazos)
    walk_spec = [
        (16, 0, 27, 3, 0, 0),
        (17, 0, 26, 1, 1, 1),
        (18, 2, 25, 0, 0, 2),
        (19, 3, 24, 0, -1, 1),
        (18, 1, 25, 0, 0, 0),
        (17, 0, 26, 2, 1, -1),
    ]

    for i in range(6):
        c = CanvasHD()
        xl, ll, xr, lr, bob, sway = walk_spec[i]

        draw_ground_shadow(c, cx=24, cy=52, rx=13, ry=2)

        # 1. Piernas Asimétricas y Lisiadas
        # Pierna izquierda: pantalón rasgado con pierna zombi podrida expuesta
        c.r(xl, 35 - ll, 5, 8, "ZCL_MID")
        c.r(xl, 35 - ll, 1, 8, "ZCL_HI")
        c.r(xl, 42 - ll, 5, 2, "ZCL_DARK")  # jirones de tela
        # Pantorrilla de carne viva verdosa
        c.r(xl + 1, 44 - ll, 4, 5, "ZSK_MID")
        c.r(xl + 1, 44 - ll, 1, 5, "ZSK_HI")
        c.r(xl + 3, 44 - ll, 1, 5, "ZSK_SH")
        c.p(xl + 2, 45 - ll, "BONE_HI")     # hueso expuesto
        # Bota destrozada izquierda
        c.r(xl, 48 - ll, 7, 4, "LT_DARK")
        c.r(xl, 50 - ll, 8, 2, "O")

        # Pierna derecha: con bota descalza / rota
        c.r(xr, 35 - lr, 5, 10, "ZCL_MID")
        c.r(xr + 4, 35 - lr, 1, 10, "ZCL_SH")
        # Pie zombi descalzo podrido
        c.r(xr - 1, 46 - lr, 7, 4, "ZSK_MID")
        c.r(xr - 1, 48 - lr, 8, 2, "ZSK_SH")
        c.p(xr + 5, 48 - lr, "O")            # dedos zombi

        # 2. Torso Cadavérico con Costillas Expuestas
        # Cinturón roído
        c.r(18, 33 + bob, 13, 3, "LT_DARK")
        c.r(18, 33 + bob, 13, 1, "LT_SH")
        # Camisa despedazada
        c.r(18, 20 + bob, 13, 13, "ZCL_MID")
        c.r(18, 20 + bob, 2, 13, "ZCL_HI")
        c.r(28, 20 + bob, 3, 13, "ZCL_SH")

        # Desgarro Masivo del costado derecho: 3 COSTILLAS AL AIRE
        c.r(22, 23 + bob, 7, 8, "BL_DEEP")
        c.r(23, 24 + bob, 6, 7, "BL_SH")
        # Costilla 1
        c.r(23, 24 + bob, 5, 1, "BONE_HI")
        c.p(28, 24 + bob, "BONE_SH")
        # Costilla 2
        c.r(23, 26 + bob, 5, 1, "BONE_HI")
        c.p(28, 26 + bob, "BONE_SH")
        # Costilla 3
        c.r(23, 28 + bob, 5, 1, "BONE_HI")
        c.p(28, 28 + bob, "BONE_SH")
        # Sangre coagulada y vísceras
        c.p(22, 30 + bob, "BL_MID")
        c.p(25, 31 + bob, "BL_DEEP")
        c.p(27, 30 + bob, "BL_MID")

        # Jirones de tela colgantes
        c.p(19, 33 + bob, "ZCL_DARK"); c.p(21, 33 + bob, "ZCL_DARK")
        c.p(29, 32 + bob, "ZCL_DARK")

        # 3. Brazo Trasero Izquierdo extendido al frente
        c.r(24 + sway, 20 + bob, 10, 4, "ZCL_SH")
        c.r(33 + sway, 20 + bob, 5, 3, "ZSK_SH")
        c.p(37 + sway, 20 + bob, "ZSK_DARK") # garra

        # 4. Cabeza Cadavérica hacia Adelante
        c.ox = 2
        c.r(20, 8 + bob, 12, 12, "ZSK_MID")
        c.r(20, 8 + bob, 2, 12, "ZSK_HI")
        c.r(30, 8 + bob, 2, 12, "ZSK_SH")
        c.r(21, 18 + bob, 10, 2, "ZSK_DARK")

        # Pelo mugriento y desgreñado
        c.r(18, 5 + bob, 14, 5, "O_SOFT")
        c.p(17, 7 + bob, "O_SOFT"); c.p(19, 4 + bob, "O_SOFT")
        c.p(23, 3 + bob, "O_SOFT"); c.p(28, 4 + bob, "O_SOFT")
        c.p(31, 6 + bob, "O_SOFT")

        # Cicatriz gangrenosa en la frente
        c.hline(22, 9 + bob, 5, "ZSK_PURP_SH")
        c.p(23, 8 + bob, "STEEL"); c.p(25, 8 + bob, "STEEL") # grapas

        # Cuenca ocular y ojos zombi infernales
        c.r(24, 12 + bob, 5, 4, "O")
        c.r(25, 12 + bob, 4, 3, "EYE_YE")
        c.p(27, 13 + bob, "BL_MID")         # pupila roja voraz
        c.p(28, 13 + bob, "PUPIL")

        # Mandíbula rota abierta con colmillos
        c.r(24, 16 + bob, 7, 4, "O")
        c.p(25, 16 + bob, "BONE_HI")
        c.p(27, 16 + bob, "BONE_HI")
        c.p(29, 16 + bob, "BONE_HI")
        c.p(26, 19 + bob, "BONE_HI")
        c.p(28, 19 + bob, "BONE_HI")
        # Saliva sangrienta
        c.p(28, 20 + bob, "BL_MID")
        c.p(30, 19 + bob, "BL_HI")
        c.ox = 0

        # 5. Brazo Delantero Derecho extendido al frente (agresivo)
        c.r(26 - sway, 22 + bob, 11, 4, "ZCL_MID")
        c.r(26 - sway, 22 + bob, 11, 1, "ZCL_HI")
        c.r(26 - sway, 25 + bob, 11, 1, "ZCL_SH")
        # Mano zombi crispada y garras
        c.r(36 - sway, 21 + bob, 5, 4, "ZSK_MID")
        c.r(36 - sway, 21 + bob, 5, 1, "ZSK_HI")
        c.p(41 - sway, 21 + bob, "O")        # garra delantera
        c.p(41 - sway, 23 + bob, "O")
        c.p(40 - sway, 24 + bob, "ZSK_DARK")

        frames.append(outline_hd(c.im))

    return frames, 140


# ---------------------------------------------------------------- EXORCIZADO (R)
def exorcizado():
    frames = []
    # 6 frames con flotación senoidal, aureola radiante, túnica astral y destellos divinos
    floats_y = [0, -1, -3, -4, -3, -1]
    sparkles_spec = [
        [(8, 16), (38, 28), (35, 10), (12, 40)],
        [(6, 26), (40, 18), (10, 12), (36, 42)],
        [(36, 32), (8, 22), (38, 8), (14, 34)],
        [(10, 36), (40, 24), (7, 14), (32, 12)],
        [(38, 20), (12, 28), (35, 38), (9, 16)],
        [(7, 18), (36, 14), (11, 42), (39, 30)],
    ]

    for i in range(6):
        c = CanvasHD()
        fly = floats_y[i]
        c.oy = fly

        # Sombra mística tenue en el pavimento que se expande/contrae con la altura
        shadow_rx = 9 - abs(fly)
        draw_ground_shadow(c, cx=24, cy=52 - fly, rx=max(5, shadow_rx), ry=2)

        # 1. Túnica Sagrada Astral con Pliegues Fluidos
        # Cola de la túnica ondeando en energía espiritual
        tail_w = 16 + (i % 3) * 2
        c.r(24 - tail_w // 2, 42, tail_w, 5, "ROBE_MID")
        c.r(24 - tail_w // 2, 42, 2, 5, "ROBE_HI")
        c.r(24 + tail_w // 2 - 2, 42, 2, 5, "ROBE_SH")
        c.r(20, 46, 8, 3, "ROBE_DARK")
        # Volutas de luz espiritual en la base
        c.p(16 + (i % 2) * 2, 47, "AURA_CY")
        c.p(30 - (i % 2) * 2, 47, "AURA_CY")

        # Falda de la túnica
        c.r(16, 32, 16, 11, "ROBE_HI")
        c.r(16, 32, 3, 11, "ROBE_MID")
        c.r(28, 32, 4, 11, "ROBE_SH")
        # Pliegues verticales de tela
        c.vline(21, 33, 10, "ROBE_MID")
        c.vline(25, 33, 10, "ROBE_SH")

        # Cinturón / Estola Sagrada Dorada
        c.r(17, 30, 14, 3, "HALO_MID")
        c.r(17, 30, 14, 1, "HALO_HI")
        c.r(17, 32, 14, 1, "HALO_SH")
        # Pendón sagrado cayendo al centro
        c.r(23, 33, 3, 7, "HALO_HI")
        c.p(24, 36, "HALO_SH")

        # 2. Torso y Túnica Superior
        c.r(17, 19, 14, 12, "ROBE_HI")
        c.r(17, 19, 2, 12, "ROBE_MID")
        c.r(28, 19, 3, 12, "ROBE_SH")

        # Mangas acampanadas espirituales
        c.r(12, 20, 5, 8, "ROBE_HI")
        c.r(12, 26, 5, 2, "ROBE_MID")
        c.r(31, 20, 5, 8, "ROBE_SH")
        c.r(31, 26, 5, 2, "ROBE_DARK")

        # 3. Manos en Oración Piadosa
        c.r(22, 22, 5, 6, "SK_HI")
        c.r(22, 22, 5, 1, "SK_MID")
        c.vline(24, 23, 4, "SK_DARK")  # separación de dedos
        c.p(24, 21, "SK_HI")           # punta de los dedos orando

        # 4. Cabeza Serena Beatificada y Pelo Dorado
        c.r(18, 9, 12, 11, "SK_HI")
        c.r(18, 9, 2, 11, "SK_MID")
        c.r(28, 9, 2, 11, "SK_SH")
        c.r(19, 18, 10, 2, "SK_MID")

        # Cabello rubio celestial ondeando suavemente hacia arriba
        c.r(16, 5, 16, 5, "HALO_MID")
        c.r(16, 5, 16, 2, "HALO_HI")
        c.r(15, 7, 3, 9, "HALO_MID")
        c.r(30, 7, 3, 9, "HALO_SH")
        c.p(17, 4, "HALO_HI"); c.p(24, 4, "HALO_HI"); c.p(29, 4, "HALO_HI")

        # Ojos cerrados en beatitud y paz total
        c.hline(24, 13, 4, "SK_DARK")
        c.p(24, 14, "SK_SH"); c.p(27, 14, "SK_SH")
        c.r(21, 14, 2, 1, "SK_DARK")
        # Pómulos sonrosados de salud recuperada
        c.p(20, 15, "SC_HI"); c.p(26, 15, "SC_HI")
        # Sonrisa dulce y serena
        c.hline(23, 17, 4, "SK_DARK")
        c.p(26, 16, "SK_DARK")

        # 5. Gran Aureola Sagrada Radiante (Flota y pulsa)
        halo_y = 2 + (1 if i in (1, 4) else 0)
        # Anillo exterior
        c.hline(18, halo_y, 12, "HALO_MID")
        c.hline(16, halo_y + 1, 3, "HALO_MID"); c.hline(29, halo_y + 1, 3, "HALO_MID")
        c.vline(15, halo_y + 2, 2, "HALO_MID"); c.vline(32, halo_y + 2, 2, "HALO_MID")
        c.hline(16, halo_y + 4, 3, "HALO_MID"); c.hline(29, halo_y + 4, 3, "HALO_MID")
        c.hline(18, halo_y + 5, 12, "HALO_MID")
        # Núcleo brillante
        c.hline(19, halo_y + 1, 10, "HALO_HI")
        c.hline(19, halo_y + 4, 10, "HALO_SH")
        c.p(24, halo_y - 1, "DIVINE_SP") # rayo vertical norte
        c.p(24, halo_y + 6, "DIVINE_SP") # rayo vertical sur
        c.p(14, halo_y + 3, "DIVINE_SP") # rayo horizontal oeste
        c.p(33, halo_y + 3, "DIVINE_SP") # rayo horizontal este

        # 6. Destellos y Estrellas Celestiales Orbitando
        c.oy = 0  # partículas se desplazan en el espacio del mundo
        for (sx, sy) in sparkles_spec[i]:
            c.p(sx, sy, "DIVINE_SP")
            c.p(sx - 1, sy, "AURA_CY"); c.p(sx + 1, sy, "AURA_CY")
            c.p(sx, sy - 1, "AURA_CY"); c.p(sx, sy + 1, "AURA_CY")

        frames.append(outline_hd(c.im))

    return frames, 150


# ---------------------------------------------------------------- EXPORTACIÓN
def to_rgba(f, scale=SCALE):
    g = f.copy()
    g.info["transparency"] = 0
    return g.convert("RGBA").resize((W * scale, H * scale), Image.NEAREST)


def save_gif(frames, path, ms):
    big = [f.resize((W * SCALE, H * SCALE), Image.NEAREST) for f in frames]
    big[0].save(path, save_all=True, append_images=big[1:], duration=ms,
                loop=0, transparency=0, disposal=2)


def save_sheet(frames, path):
    sheet = Image.new("RGBA", (W * SCALE * len(frames), H * SCALE), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.paste(to_rgba(f), (i * W * SCALE, 0))
    sheet.save(path)


def preview(chars, path):
    names = ["SANO (S)", "MORDIDO (E)", "ZOMBIE (I)", "EXORCIZADO (R)"]
    sc = 4
    cw, ch = W * sc, H * sc
    pad, label_h = 20, 32
    total_w = pad + len(chars) * (cw + pad)
    total_h = pad + ch + label_h + 16
    try:
        font = ImageFont.load_default(size=15)
    except TypeError:
        font = ImageFont.load_default()

    out = []
    for i in range(6):
        bg = Image.new("RGBA", (total_w, total_h), (24, 20, 32, 255))
        d = ImageDraw.Draw(bg)
        # Base de suelo de adoquín
        d.rectangle([0, pad + ch - 4, total_w, total_h], fill=(54, 42, 64, 255))
        d.rectangle([0, pad + ch - 4, total_w, pad + ch - 2], fill=(92, 74, 108, 255))

        for k, (frames, _) in enumerate(chars):
            spr = to_rgba(frames[i % len(frames)], sc)
            x = pad + k * (cw + pad)
            bg.alpha_composite(spr, (x, pad - 4))
            d.text((x + 12, pad + ch + 8), names[k], fill=(255, 232, 160, 255), font=font)

        out.append(bg.convert("RGB").convert("P", palette=Image.ADAPTIVE, colors=64))

    out[0].save(path, save_all=True, append_images=out[1:], duration=140, loop=0)


def main():
    os.makedirs(OUT, exist_ok=True)
    print(f"Generando sprites HD ({W}x{H} @ {SCALE}x => {W*SCALE}x{H*SCALE} px, 6 frames)...")
    chars = [
        ("sano", sano()),
        ("mordido", mordido()),
        ("zombie", zombie()),
        ("exorcizado", exorcizado())
    ]
    for name, (frames, ms) in chars:
        gif_path = os.path.join(OUT, f"{name}.gif")
        sheet_path = os.path.join(OUT, f"{name}_sheet.png")
        save_gif(frames, gif_path, ms)
        save_sheet(frames, sheet_path)
        print(f"  [OK] {name}: {len(frames)} frames -> {gif_path}")

    prev_path = os.path.join(OUT, "estados_preview.gif")
    preview([c[1] for c in chars], prev_path)
    print(f"  [OK] Preview general -> {prev_path}")
    print("Sprites HD generados con éxito en:", os.path.abspath(OUT))


if __name__ == "__main__":
    main()

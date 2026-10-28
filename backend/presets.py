"""
Escenarios predeterminados (Zombies + Desastres Naturales y Meteorológicos en Manta)
y constantes globales del motor SEIR.
"""

from typing import Dict, Any

TOTAL_POPULATION: int = 271145
ZOMBIE_MAX_HP: int = 8  # 8 balazos para abatir un zombi

DISASTER_PRESETS: Dict[str, Dict[str, Any]] = {
    "A": {
        "id": "A",
        "name": "🌊 TSUNAMI & SISMO 7.8 (TARQUI)",
        "disasterType": "Sismo Submarino 7.8 + Alerta de Tsunami Costero",
        "epicenter": "Tarqui",
        "agents": 140,
        "armed": 30,
        "immunityPct": 5,
        "incubationSec": 5,
        "ammo": 400,
        "crates": 1,
        "isNight": False,
        "isCarnaval": True,
        "cercoVial": False,
        "r0": 4.85,
        "badge": "EXTREMO",
        "tint": "rgba(6, 78, 115, 0.22)",
    },
    "B": {
        "id": "B",
        "name": "⛈️ SUPERTORMENTA EL NIÑO & APAGÓN",
        "disasterType": "Fenómeno de El Niño: Lluvias Torrenciales + Apagón Nocturno",
        "epicenter": "Murcielago",
        "agents": 95,
        "armed": 25,
        "immunityPct": 10,
        "incubationSec": 9,
        "ammo": 800,
        "crates": 3,
        "isNight": True,
        "isCarnaval": False,
        "cercoVial": True,
        "r0": 2.35,
        "badge": "TORMENTA",
        "tint": "rgba(8, 12, 38, 0.48)",
    },
    "C": {
        "id": "C",
        "name": "☣️ CICLÓN & MAREA ROJA BIO-TÓXICA",
        "disasterType": "Ciclón Costero + Floración Algal Mutagénica",
        "epicenter": "PuertoManta",
        "agents": 60,
        "armed": 25,
        "immunityPct": 16,
        "incubationSec": 15,
        "ammo": 1500,
        "crates": 6,
        "isNight": False,
        "isCarnaval": False,
        "cercoVial": True,
        "r0": 1.15,
        "badge": "CONTENCIÓN",
        "tint": "rgba(120, 28, 40, 0.18)",
    },
}

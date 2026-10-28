"""
Cerebro del zombie cero (ADR-004): elige la próxima ruta con un LLM en Ollama Cloud
y cae a una heurística local si no hay API key, hay error o se agota el timeout.
"""

import json
import logging
import os
import re
import time
import urllib.request
from typing import Any, Dict, List

log = logging.getLogger("mantazero.brain")

OLLAMA_URL = os.environ.get("OLLAMA_URL", "https://ollama.com/api/chat")

SYSTEM_PROMPT = (
    "Eres el cerebro del Paciente Cero, un zombi en las calles de Manta. "
    "En cada intersección eliges UNA ruta para propagar el virus: busca muchos humanos, "
    "evita a los armados (8 balazos te matan) y no pierdas tiempo con inmunes. "
    "Responde solo con JSON: choice (índice de la ruta), target (a quién vas a perseguir, "
    "máx. 6 palabras) y reason (máx. 12 palabras, en español)."
)

FORMAT = {
    "type": "object",
    "properties": {
        "choice": {"type": "integer"},
        "target": {"type": "string"},
        "reason": {"type": "string"},
    },
    "required": ["choice", "target", "reason"],
}


def heuristic(options: List[Dict[str, Any]]) -> int:
    scores = [o.get("humans", 0) - 3 * o.get("armed", 0) for o in options]
    return max(range(len(options)), key=scores.__getitem__)


def _ask_llm(options: List[Dict[str, Any]], current: str, key: str) -> Dict[str, Any]:
    body = {
        "model": os.environ.get("OLLAMA_MODEL", "nemotron-3-ultra"),
        "stream": False,
        "think": False,  # sin razonamiento previo: ~1-3 s en vez de ~3-5 s (medido 2026-10-28)
        "format": FORMAT,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(
                {"rutaActual": current, "opciones": list(enumerate(options))}, ensure_ascii=False)},
        ],
    }
    req = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    timeout = float(os.environ.get("OLLAMA_TIMEOUT", "6"))
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        content = json.loads(resp.read())["message"]["content"]
    # Algunos modelos envuelven el JSON en ```json ... ```: tomar el objeto
    match = re.search(r"\{.*\}", content, re.S)
    out = json.loads(match.group(0) if match else content)
    choice = int(out["choice"])
    if not 0 <= choice < len(options):
        raise ValueError(f"choice fuera de rango: {choice}")
    return {"choice": choice, "target": str(out["target"])[:60], "reason": str(out["reason"])[:120]}


def decide(options: List[Dict[str, Any]], current: str = "") -> Dict[str, Any]:
    t0 = time.monotonic()
    key = os.environ.get("OLLAMA_API_KEY")
    if key:
        try:
            out = _ask_llm(options, current, key)
            ms = int((time.monotonic() - t0) * 1000)
            log.info("brain source=llm latencyMs=%d choice=%d", ms, out["choice"])
            return {**out, "source": "llm", "latencyMs": ms}
        except Exception as exc:  # timeout, HTTP, JSON inválido
            log.warning("brain llm fallback: %s", type(exc).__name__)
    choice = heuristic(options)
    return {
        "choice": choice,
        "target": "humanos desprotegidos",
        "reason": "más humanos y menos armados",
        "source": "heuristic",
        "latencyMs": int((time.monotonic() - t0) * 1000),
    }

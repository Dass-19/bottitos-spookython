"""
Monte Carlo SEIR multi-escenario en segundo plano (NumPy con semilla reproducible).
Independiente del mapa (ADR-003): se lanza con POST /api/montecarlo/run.
Trabaja siempre con los datos reales del censo de Manta (TOTAL_POPULATION = 271,145).

Cada escenario define parámetros fijos o rangos {min, max}; los rangos se muestrean
uniformemente por corrida. Modelo estocástico diario vectorizado sobre N corridas:
  S -> E (contagio por zombis), E -> I (mutación tras incubación),
  I -> abatidos (personas armadas, 8 balazos por zombi, munición finita),
  E/I -> S (antídoto: cura pero no inmuniza; el 15% de los curados se arma).
"""

import logging
import threading
import time
import uuid
from typing import Any, Callable, Dict, List, Optional

import numpy as np

from .presets import TOTAL_POPULATION, ZOMBIE_MAX_HP

log = logging.getLogger("mantazero.montecarlo")

DAYS = 60
INFECTIOUS_DAYS = 5.0
SHOTS_PER_KILL = ZOMBIE_MAX_HP * 1.25  # 8 impactos + 25% de fallos
CRATE_HEAL_FRACTION = 0.25
CURED_ARMED_FRACTION = 0.15
LAB_CRATE_EVERY_DAYS = 10
DROP_EVERY_DAYS = 5
BATCHES = 10
KILL_INTENSITY = 1.2

# Parámetros numéricos: valor por defecto y límites válidos (frontera de confianza en main.py)
NUM_PARAMS: Dict[str, Dict[str, float]] = {
    "r0":                {"default": 3.0,  "min": 0.1, "max": 20.0},
    "immunityRate":      {"default": 0.08, "min": 0.0, "max": 0.95},
    "incubationSeconds": {"default": 8.0,  "min": 1.0, "max": 120.0},
    "agentCount":        {"default": 95,   "min": 1,   "max": 1000},
    "armedCount":        {"default": 20,   "min": 0,   "max": 1000},
    "ammo":              {"default": 800,  "min": 0,   "max": 100000},
    "cureCrates":        {"default": 3,    "min": 0,   "max": 100},
}
INT_PARAMS = {"agentCount", "armedCount", "ammo", "cureCrates"}
BOOL_PARAMS = ("isCarnaval", "isNight", "cercoVial")


def _sample(rng: np.random.Generator, params: Dict[str, Any], n: int):
    """Muestrea todos los parámetros numéricos (fijo = rango degenerado) en orden fijo,
    así un rango min=max produce exactamente lo mismo que el valor fijo."""
    out, ranged = {}, []
    for key, spec in NUM_PARAMS.items():
        v = params.get(key, spec["default"])
        lo, hi = (float(v["min"]), float(v["max"])) if isinstance(v, dict) else (float(v), float(v))
        arr = rng.uniform(lo, hi, n)
        out[key] = np.rint(arr) if key in INT_PARAMS else arr
        if hi > lo:
            ranged.append(key)
    return out, ranged


def _simulate(rng: np.random.Generator, p: Dict[str, Any], n: int) -> Dict[str, Any]:
    pop = TOTAL_POPULATION
    s, ranged = _sample(rng, p, n)
    immune0 = np.rint(pop * s["immunityRate"]).astype(np.int64)
    mult = (1.3 if p.get("isCarnaval") else 1.0) * (1.1 if p.get("isNight") else 1.0)
    mult *= 0.7 if p.get("cercoVial") else 1.0
    beta = s["r0"] * mult / INFECTIOUS_DAYS
    incub_days = np.maximum(0.5, s["incubationSeconds"] * 0.5)
    p_ei = 1.0 - np.exp(-1.0 / incub_days)
    # Densidad de armados del mapa llevada a escala censal
    armed = s["armedCount"] / np.maximum(1.0, s["agentCount"]) * pop
    ammo = s["ammo"].copy()
    crates = s["cureCrates"].astype(np.int64)

    S = pop - immune0 - 1
    E = np.zeros(n, dtype=np.int64)
    I = np.ones(n, dtype=np.int64)
    R = immune0.copy()
    killed = np.zeros(n, dtype=np.int64)
    infected_cum = np.ones(n, dtype=np.int64)
    ammo_out_day = np.full(n, -1, dtype=np.int64)

    hist = {k: np.zeros((DAYS + 1, n), dtype=np.int64) for k in ("S", "E", "I", "R", "killed_cum")}

    def snap(d: int) -> None:
        hist["S"][d], hist["E"][d], hist["I"][d], hist["R"][d] = S, E, I, R
        hist["killed_cum"][d] = killed

    snap(0)
    for day in range(1, DAYS + 1):
        p_inf = 1.0 - np.exp(-beta * I / pop)
        new_e = rng.binomial(S, p_inf)
        new_i = rng.binomial(E, p_ei)
        S = S - new_e
        E = E + new_e - new_i
        I = I + new_i
        infected_cum += new_e

        # Combate: solo personas armadas abaten zombis, limitado por munición
        p_kill = 1.0 - np.exp(-KILL_INTENSITY * np.minimum(armed, pop) / pop)
        potential = rng.binomial(I, p_kill)
        by_ammo = np.floor(ammo / SHOTS_PER_KILL).astype(np.int64)
        kills = np.minimum(np.minimum(potential, I), by_ammo)
        ammo = ammo - kills * SHOTS_PER_KILL
        I = I - kills
        killed += kills
        newly_out = (ammo < SHOTS_PER_KILL) & (ammo_out_day < 0)
        ammo_out_day[newly_out] = day

        # Antídotos: curan (vuelven a S, sin inmunidad) y arman al 15% de los curados
        if day % LAB_CRATE_EVERY_DAYS == 0:
            crates = crates + 1
        if day % DROP_EVERY_DAYS == 0:
            use = crates > 0
            healed_i = rng.binomial(I, CRATE_HEAL_FRACTION) * use
            healed_e = rng.binomial(E, CRATE_HEAL_FRACTION) * use
            healed = healed_i + healed_e
            I = I - healed_i
            E = E - healed_e
            S = S + healed
            armed = armed + np.ceil(healed * CURED_ARMED_FRACTION)
            crates = crates - use.astype(np.int64)

        snap(day)

    return {
        **hist,
        "killed": killed,
        "infected_cum": infected_cum,
        "ammo_left": ammo,
        "ammo_out_day": ammo_out_day,
        "samples": {k: s[k] for k in ranged},
    }


def _stats(a: np.ndarray) -> Dict[str, float]:
    return {
        "mean": float(np.mean(a)),
        "min": float(np.min(a)),
        "max": float(np.max(a)),
        "p5": float(np.percentile(a, 5)),
        "p95": float(np.percentile(a, 95)),
        "std": float(np.std(a)),
    }


def _rank(a: np.ndarray) -> np.ndarray:
    """Rangos promedio (empates comparten rango, como scipy.stats.rankdata)."""
    _, inv, counts = np.unique(a, return_inverse=True, return_counts=True)
    first = np.concatenate(([0], np.cumsum(counts)[:-1]))
    return (first + (counts - 1) / 2.0)[inv]


def _spearman(x: np.ndarray, y: np.ndarray) -> float:
    if np.ptp(x) == 0 or np.ptp(y) == 0:
        return 0.0
    rho = np.corrcoef(_rank(x), _rank(y))[0, 1]
    return 0.0 if np.isnan(rho) else round(float(rho), 3)


def _aggregate(chunks: List[Dict[str, Any]], raw: bool) -> Dict[str, Any]:
    cat = {k: np.concatenate([c[k] for c in chunks], axis=-1) for k in chunks[0] if k != "samples"}
    samples = {k: np.concatenate([c["samples"][k] for c in chunks]) for k in chunks[0]["samples"]}
    series = {}
    for key in ("S", "E", "I", "R"):
        m = cat[key]  # (days+1, runs)
        series[key] = {
            "mean": np.mean(m, axis=1).round(1).tolist(),
            "p5": np.percentile(m, 5, axis=1).round(1).tolist(),
            "p25": np.percentile(m, 25, axis=1).round(1).tolist(),
            "p75": np.percentile(m, 75, axis=1).round(1).tolist(),
            "p95": np.percentile(m, 95, axis=1).round(1).tolist(),
        }
    peak_inf = cat["I"].max(axis=0)
    peak_day = cat["I"].argmax(axis=0)
    final_inf = cat["I"][-1]
    attacked = cat["infected_cum"]
    out_day = cat["ammo_out_day"]
    hist_counts, hist_edges = np.histogram(peak_inf, bins=15)
    out = {
        "series": series,
        "summary": {
            "peakInfected": _stats(peak_inf),
            "peakDay": _stats(peak_day.astype(float)),
            "finalInfected": _stats(final_inf.astype(float)),
            "totalAttacked": _stats(attacked.astype(float)),
            "zombiesKilled": _stats(cat["killed"].astype(float)),
            "ammoLeft": _stats(cat["ammo_left"]),
            "containmentProbability": float(np.mean(final_inf == 0)),
            "ammoExhaustedProbability": float(np.mean(out_day >= 0)),
            "ammoExhaustedDay": (
                _stats(out_day[out_day >= 0].astype(float)) if np.any(out_day >= 0) else None
            ),
        },
        "histogram": {
            "peakInfected": {
                "counts": hist_counts.tolist(),
                "edges": [round(float(e), 1) for e in hist_edges],
            }
        },
        "sensitivity": {
            k: {"peakInfected": _spearman(v, peak_inf), "totalAttacked": _spearman(v, attacked)}
            for k, v in samples.items()
        },
    }
    if raw:
        out["raw"] = cat
    return out


def run_scenarios(
    scenarios: List[Dict[str, Any]],
    runs: int,
    seed: int,
    progress: Optional[Callable[[float], None]] = None,
    cancel: Optional[threading.Event] = None,
    raw: bool = False,
) -> Optional[Dict[str, Any]]:
    """Ejecuta `runs` corridas por escenario con una única semilla. None si se cancela."""
    rng = np.random.default_rng(seed)
    per_batch = max(1, runs // BATCHES)
    total, done = runs * len(scenarios), 0
    results = []
    for sc in scenarios:
        chunks, n_done = [], 0
        while n_done < runs:
            if cancel is not None and cancel.is_set():
                return None
            n = min(per_batch, runs - n_done)
            chunks.append(_simulate(rng, sc["params"], n))
            n_done += n
            done += n
            if progress:
                progress(done / total)
        results.append({"name": sc["name"], "params": sc["params"], **_aggregate(chunks, raw)})
    return {
        "meta": {"runs": runs, "seed": seed, "days": DAYS, "totalPop": TOTAL_POPULATION},
        "scenarios": results,
    }


class MonteCarloRunner:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._start_lock = threading.Lock()  # serializa start(): un solo hilo vivo
        self._thread: Optional[threading.Thread] = None
        self._cancel = threading.Event()
        self._status: Dict[str, Any] = {"state": "idle", "progress": 0.0}
        self._results: Optional[Dict[str, Any]] = None

    def start(self, scenarios: List[Dict[str, Any]], runs: int, seed: int) -> Dict[str, Any]:
        with self._start_lock:
            self._cancel.set()
            if self._thread and self._thread.is_alive():
                self._thread.join(timeout=2.0)
            cancel = self._cancel = threading.Event()
            run_id = uuid.uuid4().hex[:12]
            with self._lock:
                self._results = None
                self._status = {
                    "state": "running",
                    "progress": 0.0,
                    "runId": run_id,
                    "runs": runs,
                    "seed": seed,
                    "scenarios": len(scenarios),
                    "startedAt": time.time(),
                }
            self._thread = threading.Thread(
                target=self._run, args=(scenarios, runs, seed, run_id, cancel), daemon=True
            )
            self._thread.start()
            return self.status()

    def status(self) -> Dict[str, Any]:
        with self._lock:
            return dict(self._status)

    def results(self) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._results

    def _run(self, scenarios, runs: int, seed: int, run_id: str, cancel: threading.Event) -> None:
        # Un hilo cancelado nunca escribe estado: el lock de _status lo comparte la corrida nueva
        def progress(frac: float) -> None:
            with self._lock:
                if not cancel.is_set():
                    self._status["progress"] = round(frac, 3)
            time.sleep(0.02)  # cede CPU al servidor

        try:
            results = run_scenarios(scenarios, runs, seed, progress, cancel)
            with self._lock:
                if results is None or cancel.is_set():
                    return
                results["meta"]["runId"] = run_id
                self._results = results
                self._status.update({"state": "done", "progress": 1.0, "finishedAt": time.time()})
        except Exception as exc:
            log.exception("montecarlo %s failed", run_id)
            with self._lock:
                if not cancel.is_set():
                    self._status = {"state": "error", "progress": 0.0, "runId": run_id, "error": str(exc)}


mc_runner = MonteCarloRunner()

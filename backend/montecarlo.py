"""
Monte Carlo SEIR en segundo plano (NumPy con semilla reproducible).
Trabaja siempre con los datos normales y reales del censo de Manta (TOTAL_POPULATION = 271,145).

Modelo estocástico diario vectorizado sobre N corridas:
  S -> E (contagio por zombis), E -> I (mutación tras incubación),
  I -> abatidos (personas armadas, 8 balazos por zombi, munición finita),
  E/I -> R (cajas de antídoto lanzadas y sintetizadas).
"""

import threading
import time
from typing import Any, Dict, Optional

import numpy as np

from .presets import TOTAL_POPULATION, ZOMBIE_MAX_HP

DAYS = 60
INFECTIOUS_DAYS = 5.0
SHOTS_PER_KILL = ZOMBIE_MAX_HP * 1.25  # 8 impactos + 25% de fallos
CRATE_HEAL_FRACTION = 0.25
LAB_CRATE_EVERY_DAYS = 10
DROP_EVERY_DAYS = 5
BATCHES = 10
KILL_INTENSITY = 1.2


class MonteCarloRunner:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._thread: Optional[threading.Thread] = None
        self._cancel = threading.Event()
        self._status: Dict[str, Any] = {"state": "idle", "progress": 0.0}
        self._results: Optional[Dict[str, Any]] = None

    # ------------------------------------------------------------------ API
    def start(self, params: Dict[str, Any], runs: int, seed: int) -> Dict[str, Any]:
        self._cancel.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
        self._cancel = threading.Event()
        with self._lock:
            self._results = None
            self._status = {
                "state": "running",
                "progress": 0.0,
                "runs": runs,
                "seed": seed,
                "startedAt": time.time(),
            }
        self._thread = threading.Thread(
            target=self._run, args=(dict(params), runs, seed, self._cancel), daemon=True
        )
        self._thread.start()
        return self.status()

    def status(self) -> Dict[str, Any]:
        with self._lock:
            return dict(self._status)

    def results(self) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._results

    # ------------------------------------------------------------ internals
    def _run(self, params: Dict[str, Any], runs: int, seed: int, cancel: threading.Event) -> None:
        try:
            rng = np.random.default_rng(seed)
            per_batch = max(1, runs // BATCHES)
            chunks = []
            done = 0
            while done < runs:
                if cancel.is_set():
                    return
                n = min(per_batch, runs - done)
                chunks.append(self._simulate(rng, params, n))
                done += n
                with self._lock:
                    self._status["progress"] = round(done / runs, 3)
                time.sleep(0.05)  # cede CPU a la simulación principal
            results = self._aggregate(chunks, params, runs, seed)
            with self._lock:
                self._results = results
                self._status.update(
                    {"state": "done", "progress": 1.0, "finishedAt": time.time()}
                )
        except Exception as exc:  # pragma: no cover
            with self._lock:
                self._status = {"state": "error", "progress": 0.0, "error": str(exc)}

    @staticmethod
    def _simulate(rng: np.random.Generator, p: Dict[str, Any], n: int) -> Dict[str, np.ndarray]:
        # El Monte Carlo opera siempre sobre la población real de Manta (271,145 hab.)
        pop = int(p.get("censusPop", TOTAL_POPULATION))
        immune0 = int(round(pop * float(p.get("immunityRate", 0.08))))
        r0 = float(p.get("r0", 3.0))
        mult = (1.3 if p.get("isCarnaval") else 1.0) * (1.1 if p.get("isNight") else 1.0)
        mult *= 0.7 if p.get("cercoVial") else 1.0
        beta = r0 * mult / INFECTIOUS_DAYS
        incub_days = max(0.5, float(p.get("incubationSeconds", 8.0)) * 0.5)
        p_ei = 1.0 - np.exp(-1.0 / incub_days)
        armed = int(p.get("armedCount", 20))
        agents = max(1, int(p.get("agentCount", 95)))
        ammo = np.full(n, float(p.get("ammo", 800)))
        crates = np.full(n, int(p.get("cureCrates", 3)), dtype=np.int64)

        S = np.full(n, pop - immune0 - 1, dtype=np.int64)
        E = np.zeros(n, dtype=np.int64)
        I = np.ones(n, dtype=np.int64)
        R = np.full(n, immune0, dtype=np.int64)
        killed = np.zeros(n, dtype=np.int64)
        ammo_out_day = np.full(n, -1, dtype=np.int64)

        hist = {k: np.zeros((DAYS + 1, n)) for k in ("S", "E", "I", "R")}

        def snap(d: int) -> None:
            hist["S"][d], hist["E"][d], hist["I"][d], hist["R"][d] = S, E, I, R

        snap(0)
        for day in range(1, DAYS + 1):
            p_inf = 1.0 - np.exp(-beta * I / pop)
            new_e = rng.binomial(S, p_inf)
            new_i = rng.binomial(E, p_ei)
            S = S - new_e
            E = E + new_e - new_i
            I = I + new_i

            # Combate: solo personas armadas abaten zombis, limitado por munición
            # Cada zombi es abatido con prob. según la densidad de armados en calle
            p_kill = 1.0 - np.exp(-KILL_INTENSITY * armed / agents)
            potential = rng.binomial(I, p_kill)
            by_ammo = np.floor(ammo / SHOTS_PER_KILL).astype(np.int64)
            kills = np.minimum(np.minimum(potential, I), by_ammo)
            ammo = ammo - kills * SHOTS_PER_KILL
            I = I - kills
            killed += kills
            newly_out = (ammo < SHOTS_PER_KILL) & (ammo_out_day < 0)
            ammo_out_day[newly_out] = day

            # Antídotos: síntesis en laboratorio y lanzamiento periódico
            if day % LAB_CRATE_EVERY_DAYS == 0:
                crates = crates + 1
            if day % DROP_EVERY_DAYS == 0:
                use = crates > 0
                healed_i = rng.binomial(I, CRATE_HEAL_FRACTION) * use
                healed_e = rng.binomial(E, CRATE_HEAL_FRACTION) * use
                I = I - healed_i
                E = E - healed_e
                R = R + healed_i + healed_e
                crates = crates - use.astype(np.int64)

            snap(day)

        return {
            **hist,
            "killed": killed,
            "ammo_left": ammo,
            "ammo_out_day": ammo_out_day,
        }

    @staticmethod
    def _stats(a: np.ndarray) -> Dict[str, float]:
        return {
            "mean": float(np.mean(a)),
            "min": float(np.min(a)),
            "max": float(np.max(a)),
            "p5": float(np.percentile(a, 5)),
            "p95": float(np.percentile(a, 95)),
            "std": float(np.std(a)),
        }

    def _aggregate(self, chunks, params, runs, seed) -> Dict[str, Any]:
        cat = {k: np.concatenate([c[k] for c in chunks], axis=-1) for k in chunks[0]}
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
        pop = int(params.get("censusPop", TOTAL_POPULATION))
        attack = (pop - cat["S"][-1] - int(round(pop * float(params.get("immunityRate", 0.08)))))
        out_day = cat["ammo_out_day"]
        hist_counts, hist_edges = np.histogram(peak_inf, bins=15)
        mc_params = {
            k: params.get(k) for k in (
                "immunityRate", "incubationSeconds", "armedCount",
                "ammo", "cureCrates", "isCarnaval", "isNight", "cercoVial", "r0",
                "activeEpicenter", "currentScenario", "agentCount"
            )
        }
        mc_params["totalPop"] = pop
        return {
            "meta": {
                "runs": runs,
                "seed": seed,
                "days": DAYS,
                "params": mc_params,
            },
            "series": series,
            "summary": {
                "peakInfected": self._stats(peak_inf),
                "peakDay": self._stats(peak_day.astype(float)),
                "finalInfected": self._stats(final_inf.astype(float)),
                "totalAttacked": self._stats(attack.astype(float)),
                "zombiesKilled": self._stats(cat["killed"].astype(float)),
                "ammoLeft": self._stats(cat["ammo_left"]),
                "containmentProbability": float(np.mean(final_inf == 0)),
                "ammoExhaustedProbability": float(np.mean(out_day >= 0)),
                "ammoExhaustedDay": (
                    self._stats(out_day[out_day >= 0].astype(float))
                    if np.any(out_day >= 0) else None
                ),
            },
            "histogram": {
                "peakInfected": {
                    "counts": hist_counts.tolist(),
                    "edges": [round(float(e), 1) for e in hist_edges],
                }
            },
        }


mc_runner = MonteCarloRunner()

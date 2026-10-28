"""
Comprobaciones del Monte Carlo multi-escenario y del cerebro del zombie cero.
Uso: python scripts/test_montecarlo.py  (configurado como test_command de aos verify)
"""

import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.pop("OLLAMA_API_KEY", None)  # forzar el camino sin LLM

import io
import json
from unittest import mock

import numpy as np
from pydantic import ValidationError

from backend.montecarlo import run_scenarios, mc_runner
from backend.presets import TOTAL_POPULATION
from backend import main, brain
from backend.engine import sim_engine

BASE = {"r0": 3.0, "immunityRate": 0.08, "incubationSeconds": 8, "agentCount": 95,
        "armedCount": 20, "ammo": 800, "cureCrates": 3, "isCarnaval": True}


def test_conservation():
    # S + E + I + R + abatidos = población en cada día y cada corrida
    res = run_scenarios([{"name": "base", "params": BASE}], runs=60, seed=1, raw=True)
    raw = res["scenarios"][0]["raw"]
    total = raw["S"] + raw["E"] + raw["I"] + raw["R"] + raw["killed_cum"]
    assert np.all(total == TOTAL_POPULATION), "la población no se conserva"


def test_cure_returns_to_S_not_R():
    # El antídoto no inmuniza: R se queda en los inmunes iniciales todos los días
    p = dict(BASE, r0=6.0, cureCrates=5, immunityRate=0.1)
    raw = run_scenarios([{"name": "c", "params": p}], runs=40, seed=2, raw=True)["scenarios"][0]["raw"]
    assert np.all(raw["R"] == raw["R"][0]), "los curados no deben pasar a R"
    s_up = raw["S"][5] > raw["S"][4]  # día 5 = primer lanzamiento de caja
    assert s_up.any(), "los curados deben volver a S"


def test_airdrop_backend_heals_to_healthy():
    sim_engine.reset()
    sim_engine.launch_outbreak({"agentCount": 95, "immunityRate": 0.1})
    sim_engine.state.update({"infected": 10, "cureCrates": 2})
    immune = sim_engine.state["immune"]
    sim_engine.deploy_airdrop(4)
    assert sim_engine.state["immune"] == immune and sim_engine.state["infected"] == 6


def test_range_equal_is_fixed():
    ranged = dict(BASE, armedCount={"min": 20, "max": 20}, r0={"min": 3.0, "max": 3.0})
    a = run_scenarios([{"name": "fijo", "params": BASE}], runs=80, seed=7)
    b = run_scenarios([{"name": "rango", "params": ranged}], runs=80, seed=7)
    assert a["scenarios"][0]["series"] == b["scenarios"][0]["series"], "min=max debe igualar a fijo"


def test_multi_scenario_with_sensitivity():
    sc = [
        {"name": "A", "params": dict(BASE, r0={"min": 1.5, "max": 5.0}, ammo={"min": 200, "max": 2000})},
        {"name": "B", "params": dict(BASE, isNight=True)},
    ]
    res = run_scenarios(sc, runs=200, seed=3)
    assert [s["name"] for s in res["scenarios"]] == ["A", "B"]
    sens = res["scenarios"][0]["sensitivity"]
    assert set(sens) == {"r0", "ammo"}, sens
    # más R0 => pico mayor: correlación claramente positiva
    assert sens["r0"]["peakInfected"] > 0.3, sens
    assert res["scenarios"][1]["sensitivity"] == {}


def test_runner_thread_end_to_end():
    sc = [{"name": "A", "params": dict(BASE, r0={"min": 2, "max": 4})}, {"name": "B", "params": BASE}]
    run_id = mc_runner.start(sc, 50, 1)["runId"]
    for _ in range(200):
        if mc_runner.status()["state"] != "running":
            break
        time.sleep(0.05)
    res = mc_runner.results()
    assert mc_runner.status()["state"] == "done" and res["meta"]["runId"] == run_id
    assert [s["name"] for s in res["scenarios"]] == ["A", "B"] and "r0" in res["scenarios"][0]["sensitivity"]


def test_validation_rejects_bad_params():
    for params in ({"r0": {"min": 5, "max": 1}}, {"hack": 1}, {"isNight": 3},
                   {"ammo": -5}, {"r0": float("nan")}, {"r0": {"min": 1, "max": float("inf")}}):
        try:
            main.MCScenario(name="x", params=params)
        except ValidationError:
            continue
        raise AssertionError(f"no rechazado: {params}")


def test_launch_does_not_start_mc():
    mc_runner._status = {"state": "idle", "progress": 0.0}
    main.launch_simulation(main.LaunchRequest())
    time.sleep(0.2)
    assert mc_runner.status()["state"] == "idle", mc_runner.status()


def test_brain_heuristic_fallback():
    opts = [{"route": "a", "humans": 5, "armed": 3, "immune": 0},
            {"route": "b", "humans": 4, "armed": 0, "immune": 2},
            {"route": "c", "humans": 0, "armed": 0, "immune": 0}]
    d = brain.decide(opts, current="x")
    assert d["source"] == "heuristic" and d["choice"] == 1, d


def _fake_urlopen(content):
    body = json.dumps({"message": {"content": content}}).encode()
    return mock.MagicMock(__enter__=lambda self: io.BytesIO(body), __exit__=lambda *a: None)


def test_brain_llm_and_error_fallbacks():
    opts = [{"route": "a", "humans": 5, "armed": 3}, {"route": "b", "humans": 4, "armed": 0}]
    with mock.patch.dict(os.environ, {"OLLAMA_API_KEY": "test"}):
        ok = json.dumps({"choice": 0, "target": "t", "reason": "r"})
        with mock.patch("urllib.request.urlopen", return_value=_fake_urlopen(ok)):
            assert brain.decide(opts)["source"] == "llm"
        fenced = "```json\n" + json.dumps({"choice": 1, "target": "t", "reason": "r"}) + "\n```"
        with mock.patch("urllib.request.urlopen", return_value=_fake_urlopen(fenced)):
            d = brain.decide(opts)
            assert d["source"] == "llm" and d["choice"] == 1, d
        for bad in (json.dumps({"choice": 9, "target": "t", "reason": "r"}), "no es json"):
            with mock.patch("urllib.request.urlopen", return_value=_fake_urlopen(bad)):
                d = brain.decide(opts)
                assert d["source"] == "heuristic" and d["choice"] == 1, d
        with mock.patch("urllib.request.urlopen", side_effect=TimeoutError()):
            assert brain.decide(opts)["source"] == "heuristic"


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
    print("ALL_MC_TESTS_PASSED")

"""
Servidor FastAPI para MantaZero: Epidemic Command:
Expone los endpoints REST del motor SEIR en /api/* y sirve el frontend en /.
"""

import os
from pathlib import Path
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .presets import DISASTER_PRESETS, ZOMBIE_MAX_HP
from .engine import sim_engine
from .montecarlo import mc_runner

app = FastAPI(
    title="MantaZero: Epidemic Command SEIR Simulation Engine API",
    version="1.0.0",
    description="Backend Python (FastAPI) para simulación SEIR, desastres naturales y combate táctico (8 disparos por zombi).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScenarioRequest(BaseModel):
    scenario: str = "A"


class LaunchRequest(BaseModel):
    epicenter: Optional[str] = "Tarqui"
    agentCount: Optional[int] = 95
    armedCount: Optional[int] = 20
    mcSeed: Optional[int] = 42
    mcRuns: Optional[int] = 400
    immunityRate: Optional[float] = 0.08
    incubationSeconds: Optional[float] = 8.0
    ammo: Optional[int] = 800
    cureCrates: Optional[int] = 3
    isCarnaval: Optional[bool] = True
    isNight: Optional[bool] = False
    cercoVial: Optional[bool] = False


class TickRequest(BaseModel):
    infected: Optional[int] = None
    bitten: Optional[int] = None
    immune: Optional[int] = None
    ammo: Optional[int] = None


class CombatHitRequest(BaseModel):
    zombieId: int


class AirdropRequest(BaseModel):
    healedCount: int = 0


@app.get("/api/health")
def get_health():
    return {
        "status": "ok",
        "engine": "python-fastapi-seir",
        "zombieMaxHp": ZOMBIE_MAX_HP,
    }


@app.get("/api/presets")
def get_presets():
    return {"presets": DISASTER_PRESETS}


@app.get("/api/state")
def get_state():
    return {"state": sim_engine.get_state()}


@app.post("/api/sim/reset")
def reset_simulation():
    return {"state": sim_engine.reset()}


@app.post("/api/sim/scenario")
def switch_scenario(req: ScenarioRequest):
    return sim_engine.apply_scenario(req.scenario)


@app.post("/api/sim/launch")
def launch_simulation(req: LaunchRequest):
    data = req.model_dump(exclude_none=True)
    state = sim_engine.launch_outbreak(data)
    # Monte Carlo en segundo plano con los mismos parámetros y semilla NumPy
    runs = max(50, min(int(data.get("mcRuns", 400)), 5000))
    mc_runner.start(state, runs, int(data.get("mcSeed", 42)))
    return {"state": state, "montecarlo": mc_runner.status()}


@app.post("/api/sim/tick")
def simulation_tick(req: TickRequest):
    return sim_engine.tick(req.model_dump(exclude_none=True))


@app.post("/api/sim/combat-hit")
def register_combat_hit(req: CombatHitRequest):
    return sim_engine.register_zombie_hit(req.zombieId)


@app.post("/api/sim/airdrop")
def deploy_airdrop(req: AirdropRequest):
    return sim_engine.deploy_airdrop(req.healedCount)


@app.get("/api/montecarlo/status")
def montecarlo_status():
    return mc_runner.status()


@app.get("/api/montecarlo/results")
def montecarlo_results():
    res = mc_runner.results()
    if res is None:
        return JSONResponse(status_code=202, content={"ready": False, **mc_runner.status()})
    return res


@app.get("/montecarlo")
def montecarlo_dashboard():
    return FileResponse(Path(__file__).resolve().parent.parent / "frontend" / "montecarlo.html")


# Mount frontend directory for static assets & index.html
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)

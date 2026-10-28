"""
Servidor FastAPI para MantaZero: Epidemic Command:
Expone los endpoints REST del motor SEIR en /api/* y sirve el frontend en /.
"""

import logging
import os
from pathlib import Path
from typing import Dict, List, Optional, Union
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, model_validator

from .presets import DISASTER_PRESETS, ZOMBIE_MAX_HP
from .engine import sim_engine
from .montecarlo import mc_runner, NUM_PARAMS, BOOL_PARAMS
from . import brain

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

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
    immunityRate: Optional[float] = 0.08
    incubationSeconds: Optional[float] = 8.0
    ammo: Optional[int] = 800
    cureCrates: Optional[int] = 3
    isCarnaval: Optional[bool] = True
    isNight: Optional[bool] = False
    cercoVial: Optional[bool] = False


class Range(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)
    min: float
    max: float


class MCScenario(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)
    name: str = Field(min_length=1, max_length=60)
    params: Dict[str, Union[bool, float, Range]]

    @model_validator(mode="after")
    def check_params(self):
        for key, v in self.params.items():
            if key in BOOL_PARAMS:
                if not isinstance(v, bool):
                    raise ValueError(f"{key} debe ser booleano")
                continue
            spec = NUM_PARAMS.get(key)
            if spec is None or isinstance(v, bool):
                raise ValueError(f"parámetro no válido: {key}")
            lo, hi = (v.min, v.max) if isinstance(v, Range) else (v, v)
            if lo > hi:
                raise ValueError(f"{key}: min > max")
            if lo < spec["min"] or hi > spec["max"]:
                raise ValueError(f"{key} fuera de [{spec['min']}, {spec['max']}]")
        return self


class MCRunRequest(BaseModel):
    scenarios: List[MCScenario] = Field(min_length=1, max_length=8)
    runs: int = Field(default=400, ge=50, le=5000)
    seed: int = 42


class RouteOption(BaseModel):
    route: str = Field(max_length=80)
    humans: int = Field(default=0, ge=0)
    armed: int = Field(default=0, ge=0)
    immune: int = Field(default=0, ge=0)


class DecideRequest(BaseModel):
    current: str = Field(default="", max_length=80)
    options: List[RouteOption] = Field(min_length=1, max_length=12)


class TickRequest(BaseModel):
    infected: Optional[int] = None
    bitten: Optional[int] = None
    immune: Optional[int] = None
    ammo: Optional[int] = None


class CombatHitRequest(BaseModel):
    zombieId: int


class AirdropRequest(BaseModel):
    healedCount: int = 0


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError):
    # Sin eco de "input": un NaN/inf en la entrada rompería la serialización JSON (500)
    detail = [{"loc": e["loc"], "msg": e["msg"], "type": e["type"]} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": detail})


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
    return {"state": sim_engine.launch_outbreak(req.model_dump(exclude_none=True))}


@app.post("/api/sim/tick")
def simulation_tick(req: TickRequest):
    return sim_engine.tick(req.model_dump(exclude_none=True))


@app.post("/api/sim/combat-hit")
def register_combat_hit(req: CombatHitRequest):
    return sim_engine.register_zombie_hit(req.zombieId)


@app.post("/api/sim/airdrop")
def deploy_airdrop(req: AirdropRequest):
    return sim_engine.deploy_airdrop(req.healedCount)


@app.post("/api/montecarlo/run")
def montecarlo_run(req: MCRunRequest):
    scenarios = [s.model_dump() for s in req.scenarios]
    return mc_runner.start(scenarios, req.runs, req.seed)


@app.post("/api/zombie/decide")
def zombie_decide(req: DecideRequest):
    return brain.decide([o.model_dump() for o in req.options], req.current)


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
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False, log_level="info")

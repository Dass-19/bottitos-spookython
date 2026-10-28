"""
Motor Epidemiológico SEIR & Combate Táctico (8 balazos por zombi) en Python.
Fuente única de verdad del estado de la simulación principal (en escala de los agentes del mapa).
"""

from typing import Dict, Any, Optional
from .presets import TOTAL_POPULATION, ZOMBIE_MAX_HP, DISASTER_PRESETS


class SeirSimulationEngine:
    def __init__(self) -> None:
        self.state: Dict[str, Any] = {}
        self.zombie_hp: Dict[int, int] = {}
        self.reset()

    def reset(self) -> Dict[str, Any]:
        agent_count = 95
        imm_rate = 0.08
        imm_count = round(agent_count * imm_rate)
        self.state = {
            "hasStarted": False,
            "isRunning": True,
            "speed": 1,
            "score": 0,
            "credits": 4,
            "day": 0,
            "hour": 0,
            "minute": 0,
            "isNight": False,
            "isCarnaval": True,
            "cercoVial": False,
            "activeEpicenter": "Tarqui",
            "currentScenario": "A",
            "distributionPriority": "med",
            "cureProgress": 0.0,
            "cureEtaDays": 30,
            "totalPop": agent_count,
            "censusPop": TOTAL_POPULATION,
            "healthy": agent_count - imm_count,
            "bitten": 0,
            "infected": 0,
            "immune": imm_count,
            "recovered": 0,
            "deaths": 0,
            "r0": 3.82,
            "ammo": 800,
            "maxAmmo": 800,
            "cureCrates": 3,
            "incubationSeconds": 8.0,
            "immunityRate": imm_rate,
            "agentCount": agent_count,
            "armedCount": 20,
            "zombieMaxHp": ZOMBIE_MAX_HP,
        }
        self.zombie_hp.clear()
        return dict(self.state)

    def get_state(self) -> Dict[str, Any]:
        return dict(self.state)

    def apply_scenario(self, scenario_key: str) -> Dict[str, Any]:
        preset = DISASTER_PRESETS.get(scenario_key, DISASTER_PRESETS["A"])
        self.state["currentScenario"] = preset["id"]
        self.state["activeEpicenter"] = preset["epicenter"]
        self.state["agentCount"] = preset["agents"]
        self.state["totalPop"] = preset["agents"]
        self.state["armedCount"] = preset["armed"]
        self.state["immunityRate"] = preset["immunityPct"] / 100.0
        self.state["incubationSeconds"] = float(preset["incubationSec"])
        self.state["ammo"] = preset["ammo"]
        self.state["maxAmmo"] = preset["ammo"]
        self.state["cureCrates"] = preset["crates"]
        self.state["isNight"] = preset["isNight"]
        self.state["isCarnaval"] = preset["isCarnaval"]
        self.state["cercoVial"] = preset["cercoVial"]
        self.state["r0"] = preset["r0"]

        if not self.state["hasStarted"]:
            imm_count = round(self.state["totalPop"] * self.state["immunityRate"])
            self.state["immune"] = imm_count
            self.state["infected"] = 0
            self.state["bitten"] = 0
            self.state["healthy"] = self.state["totalPop"] - imm_count

        return {
            "preset": preset,
            "state": self.get_state(),
        }

    def launch_outbreak(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        params = params or {}
        if "epicenter" in params and params["epicenter"]:
            self.state["activeEpicenter"] = str(params["epicenter"])
        if "agentCount" in params and params["agentCount"] is not None:
            self.state["agentCount"] = int(params["agentCount"])
        if "armedCount" in params and params["armedCount"] is not None:
            self.state["armedCount"] = max(0, min(int(params["armedCount"]), self.state["agentCount"]))
        if "immunityRate" in params and params["immunityRate"] is not None:
            self.state["immunityRate"] = float(params["immunityRate"])
        if "incubationSeconds" in params and params["incubationSeconds"] is not None:
            self.state["incubationSeconds"] = float(params["incubationSeconds"])
        if "ammo" in params and params["ammo"] is not None:
            self.state["ammo"] = int(params["ammo"])
            self.state["maxAmmo"] = int(params["ammo"])
        if "cureCrates" in params and params["cureCrates"] is not None:
            self.state["cureCrates"] = int(params["cureCrates"])
        if "isCarnaval" in params and params["isCarnaval"] is not None:
            self.state["isCarnaval"] = bool(params["isCarnaval"])
        if "isNight" in params and params["isNight"] is not None:
            self.state["isNight"] = bool(params["isNight"])
        if "cercoVial" in params and params["cercoVial"] is not None:
            self.state["cercoVial"] = bool(params["cercoVial"])

        self.state["deaths"] = 0
        self.state["recovered"] = 0
        self.state["totalPop"] = self.state["agentCount"]
        imm_count = round(self.state["totalPop"] * self.state["immunityRate"])
        self.state["immune"] = imm_count
        self.state["bitten"] = 0
        self.state["infected"] = 1  # Paciente Cero
        self.state["healthy"] = max(0, self.state["totalPop"] - imm_count - 1)
        self.state["hasStarted"] = True
        self.zombie_hp.clear()
        return self.get_state()

    def tick(self, metrics: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        metrics = metrics or {}
        if not self.state["hasStarted"] or not self.state["isRunning"]:
            return {"newDay": False, "synthesizedCrate": False, "state": self.get_state()}

        if "infected" in metrics and metrics["infected"] is not None:
            self.state["infected"] = max(0, int(metrics["infected"]))
        if "bitten" in metrics and metrics["bitten"] is not None:
            self.state["bitten"] = max(0, int(metrics["bitten"]))
        if "immune" in metrics and metrics["immune"] is not None:
            self.state["immune"] = max(0, int(metrics["immune"]))
        if "ammo" in metrics and metrics["ammo"] is not None:
            self.state["ammo"] = max(0, int(metrics["ammo"]))

        self.state["totalPop"] = max(1, self.state["agentCount"] - self.state["deaths"])

        self.state["minute"] += 10
        new_day = False
        if self.state["minute"] >= 60:
            self.state["minute"] = 0
            self.state["hour"] += 1
            if self.state["hour"] >= 24:
                self.state["hour"] = 0
                self.state["day"] += 1
                new_day = True

        synthesized_crate = False
        if self.state["cureProgress"] < 100.0:
            base_rate = 0.12 if self.state["distributionPriority"] == "med" else 0.07
            boost = base_rate * (1.0 + (self.state["immune"] / max(1, self.state["totalPop"])) * 5.0)
            self.state["cureProgress"] = min(
                100.0, round(self.state["cureProgress"] + boost * self.state["speed"], 1)
            )
            if self.state["cureProgress"] >= 100.0:
                self.state["cureCrates"] += 1
                self.state["cureProgress"] = 0.0
                synthesized_crate = True

        self.state["healthy"] = max(
            0,
            self.state["totalPop"]
            - self.state["immune"]
            - self.state["infected"]
            - self.state["bitten"],
        )

        return {
            "newDay": new_day,
            "synthesizedCrate": synthesized_crate,
            "state": self.get_state(),
        }

    def register_zombie_hit(self, zombie_id: int) -> Dict[str, Any]:
        """Valida cada impacto de bala: un zombi muere exactamente al 8.º balazo."""
        if self.state["ammo"] <= 0:
            return {"hit": False, "reason": "NO_AMMO", "state": self.get_state()}

        self.state["ammo"] = max(0, self.state["ammo"] - 1)
        current_hp = self.zombie_hp.get(zombie_id, ZOMBIE_MAX_HP)
        next_hp = current_hp - 1
        killed = False

        if next_hp <= 0:
            killed = True
            self.zombie_hp.pop(zombie_id, None)
            self.state["infected"] = max(0, self.state["infected"] - 1)
            self.state["deaths"] += 1
            self.state["totalPop"] = max(1, self.state["agentCount"] - self.state["deaths"])
            self.state["score"] += 250
            self.state["healthy"] = max(
                0,
                self.state["totalPop"]
                - self.state["immune"]
                - self.state["infected"]
                - self.state["bitten"],
            )
        else:
            self.zombie_hp[zombie_id] = next_hp

        return {
            "hit": True,
            "zombieId": zombie_id,
            "hp": max(0, next_hp),
            "maxHp": ZOMBIE_MAX_HP,
            "killed": killed,
            "state": self.get_state(),
        }

    def deploy_airdrop(self, healed_count: int = 0) -> Dict[str, Any]:
        if self.state["cureCrates"] <= 0:
            return {"deployed": False, "reason": "NO_CRATES", "state": self.get_state()}

        self.state["cureCrates"] -= 1
        if healed_count > 0:
            delta = healed_count
            self.state["infected"] = max(0, self.state["infected"] - delta)
            self.state["immune"] = min(self.state["totalPop"], self.state["immune"] + delta)
            self.state["recovered"] += delta
            self.state["score"] += healed_count * 500
            self.state["healthy"] = max(
                0,
                self.state["totalPop"]
                - self.state["immune"]
                - self.state["infected"]
                - self.state["bitten"],
            )

        return {
            "deployed": True,
            "healedCount": healed_count,
            "state": self.get_state(),
        }


sim_engine = SeirSimulationEngine()

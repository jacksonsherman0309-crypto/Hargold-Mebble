"""Shared character scale and orientation profile helpers."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PROFILE_PATH = ROOT / "assets" / "blender" / "character-scale-orientation-profile.json"


def load_profile() -> dict:
    return json.loads(PROFILE_PATH.read_text(encoding="utf-8"))


def orientation_key(clip_name: str) -> str:
    if clip_name.startswith("glide-"):
        return "glide"
    if clip_name in {
        "takeoff", "rise", "apex", "fall", "land-soft", "land-hard",
        "landing-recovery", "jump-running", "jump-triple-1",
        "jump-triple-2", "jump-triple-3", "double-jump",
        "stomp-bounce",
    }:
        return "airborne"
    return clip_name


def reveal_degrees(profile: dict, clip_name: str) -> float:
    values = profile["orientation"]["revealDegreesByAction"]
    return float(values.get(orientation_key(clip_name), values["default"]))

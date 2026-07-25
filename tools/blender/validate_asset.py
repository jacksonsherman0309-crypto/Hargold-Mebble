"""Validate the currently opened Blender file against repository conventions."""

from __future__ import annotations

import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import report_validation, validate_scene


if __name__ == "__main__":
    validation_errors = validate_scene()
    report_validation(validation_errors)
    if validation_errors:
        sys.exit(1)

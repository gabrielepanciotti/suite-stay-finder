"""Load the node's declared view, including the production-image fallback."""
from __future__ import annotations

import json
from pathlib import Path

from suite_backend_core.vista import VistaSpec

DEFAULT_VISTA = {
    "sezioni": [
        {"id": "cerca", "titolo": "Cerca", "min": "player"},
        {"id": "risultati", "titolo": "Risultati", "min": "player"},
        {"id": "salvati", "titolo": "Salvati", "min": "player"},
        {"id": "impostazioni", "titolo": "Impostazioni", "min": "admin"},
    ],
    "azioni": {
        "ricerca.crea": "creator",
        "ricerca.elimina": "admin",
        "salvato.crea": "creator",
        "salvato.modifica": "creator",
        "salvato.elimina": "creator",
        "impostazioni.modifica": "admin",
    },
}


def load_vista_spec() -> VistaSpec:
    """Return the config view, falling back when Docker omits ``node.config``."""
    node_config = Path(__file__).resolve().parents[2] / "node.config"
    if node_config.is_file():
        with node_config.open(encoding="utf-8") as config_file:
            return VistaSpec.from_node_config(json.load(config_file))
    return VistaSpec.from_node_config({"vista": DEFAULT_VISTA})

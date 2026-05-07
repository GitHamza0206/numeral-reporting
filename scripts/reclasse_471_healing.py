#!/usr/bin/env python3
"""Stub pipeline 471 → healing (template).

Le moteur de reclassement **n’est pas** dans le runtime Next.js : vous remplissez
`GL_471`, `HIGH_CONFIDENCE`, `BASE_PRODUITS_N` et `BASE_CHARGES_N` à partir du
FEC / grand livre du dossier, ou vous parsez votre export XLSX ici.

Exemple : npm run reclasse-471 -- --mode v0 | v1
"""
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP


def money(value: float) -> float:
    return float(Decimal(str(value)).quantize(Decimal("0.01"), ROUND_HALF_UP))


@dataclass(frozen=True)
class Gl471:
    date: str
    account: str
    amount: float
    label: str


@dataclass(frozen=True)
class Rule:
    date: str
    account: str
    amount: float
    snippet: str
    pcg: str
    bucket: str


GL_471: list[Gl471] = []

HIGH_CONFIDENCE: list[Rule] = []

# Soldes agrégés classe 7 / 6 issus de la balance export (à renseigner).
BASE_PRODUITS_N = 0.0
BASE_CHARGES_N = 0.0


def matches(row: Gl471, rule: Rule) -> bool:
    return (
        row.date == rule.date
        and row.account == rule.account
        and abs(row.amount - rule.amount) < 0.02
        and rule.snippet.upper() in row.label.upper()
    )


def classify() -> tuple[list[Gl471], list[Gl471]]:
    remaining_rules = list(HIGH_CONFIDENCE)
    healed: list[Gl471] = []
    residual: list[Gl471] = []
    for row in GL_471:
        idx = next((i for i, rule in enumerate(remaining_rules) if matches(row, rule)), -1)
        if idx >= 0:
            healed.append(row)
            remaining_rules.pop(idx)
        else:
            residual.append(row)
    return healed, residual


def pnl_delta() -> dict[str, float]:
    by_bucket: dict[str, float] = {
        "charges_achats": 0.0,
        "charges_services": 0.0,
        "charges_impots": 0.0,
        "charges_personnel": 0.0,
        "produits_autres": 0.0,
    }
    for rule in HIGH_CONFIDENCE:
        if rule.bucket == "charges_achats_credit":
            by_bucket["charges_achats"] -= rule.amount
        else:
            by_bucket[rule.bucket] += rule.amount
    by_bucket["charges_total"] = (
        by_bucket["charges_achats"]
        + by_bucket["charges_services"]
        + by_bucket["charges_impots"]
        + by_bucket["charges_personnel"]
    )
    return {k: money(v) for k, v in by_bucket.items()}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["v0", "v1"], default="v0")
    args = parser.parse_args()

    healed, residual = classify()
    deltas = pnl_delta()
    base_result = money(BASE_PRODUITS_N - BASE_CHARGES_N)
    healed_produits = money(BASE_PRODUITS_N + deltas["produits_autres"])
    healed_charges = money(BASE_CHARGES_N + deltas["charges_total"])
    healed_result = money(healed_produits - healed_charges)

    payload = {
        "mode": args.mode,
        "blocking_count": len(GL_471) if args.mode == "v0" else len(residual),
        "blocking_abs_total": money(sum(row.amount for row in (GL_471 if args.mode == "v0" else residual))),
        "high_confidence_count": len(healed),
        "high_confidence_abs_total": money(sum(row.amount for row in healed)),
        "a_confirmer_count": len(residual),
        "healed_residual_count": len(residual),
        "healed_residual_abs_total": money(sum(row.amount for row in residual)),
        "base_resultat_net_n": base_result,
        "healed_pnl": {
            "produitsN": healed_produits,
            "chargesN": healed_charges,
            "resultatNetN": healed_result,
            "delta": deltas,
        },
    }
    print(json.dumps(payload, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

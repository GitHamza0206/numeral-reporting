#!/usr/bin/env python3
"""Classify 471 pending bank movements and compute the healed P&L view.

This is intentionally a script-level pipeline, not report runtime logic.
Workflow:
  - V0: keep every 471 movement in model.alerts.blocking.
  - V1+: remove high-confidence 471 lines from blocking and recompute P&L.

The current GL extract is embedded because it was extracted from the provisional
PennyLane grand livre used for this report. When a fresh XLSX is exported, this
script should be regenerated or extended to parse that workbook directly.
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


GL_471 = [
    Gl471("2025-02-03", "471600100", 451.57, "VIREMENT SEPA PAR INTERNET VERS 28233 00001 29471131563 56"),
    Gl471("2025-02-07", "471600100", 20.0, "*FR CTR MONET INACTIF 8048199"),
    Gl471("2025-02-07", "471600100", 20.0, "*FR CTR MONET INACTIF 8048200"),
    Gl471("2025-02-10", "471600100", 1600.64, "VIREMENT SEPA PAR INTERNET VERS 42559 10000 08009592821 03"),
    Gl471("2025-02-22", "471600100", 14.85, "CB WWW.BODUM.COM FACT 200225"),
    Gl471("2025-02-28", "471600100", 98.0, "CB Bo Mie Hotel de FACT 260225"),
    Gl471("2025-03-12", "471600100", 35.0, "CB ROULEZ JEUNESSE FACT 100325"),
    Gl471("2025-03-12", "471600100", 1752.74, "VIREMENT SEPA PAR INTERNET VERS 42559 10000 08009592821 03"),
    Gl471("2025-03-27", "471600100", 94.5, "CB ME-QR.COM FACT 250325 DONT FRAIS DE COMM. 2,66 EUR"),
    Gl471("2025-04-22", "471600100", 11.99, "CB PAYPAL *ITUNESA FACT 180425"),
    Gl471("2025-05-08", "471600100", 5.37, "CB PAYPAL *TIPEEE FACT 060525"),
    Gl471("2025-06-09", "471600100", 5.37, "CB PAYPAL *TIPEEE FACT 060625"),
    Gl471("2025-06-17", "471600100", 191.97, "CB PAYPAL *EDREAMS FACT 140625"),
    Gl471("2025-07-28", "471600100", 1046.1, "VIREMENT SEPA PAR INTERNET - REMBOURSEMENT SUITE REGLEMENT DOUBLE FACTURE"),
    Gl471("2025-08-20", "471600100", 477.8, "PRLV GGVSJ 2522659G10008551"),
    Gl471("2025-09-18", "471600100", 20.0, "CB LCL LE CREDIT L"),
    Gl471("2025-09-19", "471600100", 80.0, "CB LCL LE CREDIT L"),
    Gl471("2025-10-22", "471600100", 26.0, "PRLV B2B DGFIP 2529359J10008036"),
    Gl471("2025-11-08", "471600100", 99.6, "CB SumUp *REPAIR FACT 061125"),
    Gl471("2025-11-10", "471600100", 19.75, "* ESPRIT ASSOCIATION"),
    Gl471("2025-11-11", "471600100", 7.99, "PRLV GP - Fnac Pack Service 2531159G10023773"),
    Gl471("2025-11-17", "471600100", 126.3, "VIR INST ASSAL EBRAHIMPOUR 2532159I10000272 - REMB ACHATS CHAILLOT 14/11"),
    Gl471("2025-11-19", "471600100", 0.44, "*FRAIS 2 VIR INST"),
    Gl471("2025-11-20", "471600100", 842.73, "PRLV GGVSJ 2532159G10004822"),
    Gl471("2025-11-25", "471600100", 862.04, "PRLV MALAKOFF HUMANIS 2532559G10012622"),
    Gl471("2025-11-25", "471600100", 9.0, "PRLV B2B DGFIP 2532559J10011593"),
    Gl471("2025-11-28", "471600100", 100.49, "ACHATS QUENTIN - REMB. ACHATS LA REDOUTE ET VETEMENTS PRO"),
    Gl471("2025-12-19", "471600100", 74.0, "CB SUPERVAN* POUR FACT 171225"),
    Gl471("2025-09-19", "471600200", 7.0, "RAJEESKA"),
    Gl471("2025-07-22", "471700100", 2219.24, "VIR SEPA MHP COT PLEIADE - 21189673BANDE DE CHEFFES"),
    Gl471("2025-10-09", "471700100", 398.15, "VIR SEPA ALTERNOO - RBST TROP PERCU"),
    Gl471("2025-10-09", "471700100", 16.62, "VIR INST MME LELUC ANNE CHARLO - REMBOURSEMENT ACHAT AMAZON"),
    Gl471("2025-11-26", "471700100", 758.88, "VIR SEPA GROUPAMA GAN VIE - AT CT 779135 20000 F2P"),
    Gl471("2025-12-05", "471700100", 100.49, "VIR INST M. LEROUX QUENTIN - Erreur virement bdc"),
    Gl471("2025-12-19", "471700100", 269.28, "VIR SEPA GROUPAMA GAN VIE - AT CT 779135 20000 F2P"),
    Gl471("2025-12-19", "471700100", 20067.76, "VIR SEPA ASP AGENCE COMPTABLE - 156272990 EMP. TPUPEX286104I REG ILE DE FRANCE EMPLOI LOCA…"),
    Gl471("2025-12-29", "471700100", 7203.46, "VIR SEPA ASP AGENCE COMPTABLE - 156472784 EMP. TPUPEX286104I REG ILE DE FRANCE EMPLOI LOCA…"),
]

HIGH_CONFIDENCE = [
    Rule("2025-02-07", "471600100", 20.0, "8048199", "627", "charges_services"),
    Rule("2025-02-07", "471600100", 20.0, "8048200", "627", "charges_services"),
    Rule("2025-02-22", "471600100", 14.85, "BODUM.COM", "606", "charges_achats"),
    Rule("2025-02-28", "471600100", 98.0, "Bo Mie Hotel", "625", "charges_services"),
    Rule("2025-04-22", "471600100", 11.99, "ITUNESA", "626", "charges_services"),
    Rule("2025-06-17", "471600100", 191.97, "EDREAMS", "625", "charges_services"),
    Rule("2025-08-20", "471600100", 477.8, "2522659G10008551", "645", "charges_personnel"),
    Rule("2025-11-20", "471600100", 842.73, "2532159G10004822", "645", "charges_personnel"),
    Rule("2025-10-22", "471600100", 26.0, "2529359J10008036", "635", "charges_impots"),
    Rule("2025-11-25", "471600100", 9.0, "2532559J10011593", "635", "charges_impots"),
    Rule("2025-11-25", "471600100", 862.04, "MALAKOFF HUMANIS", "645", "charges_personnel"),
    Rule("2025-11-19", "471600100", 0.44, "FRAIS 2 VIR INST", "627", "charges_services"),
    Rule("2025-11-11", "471600100", 7.99, "Fnac Pack Service", "626", "charges_services"),
    Rule("2025-07-22", "471700100", 2219.24, "PLEIADE", "742", "produits_autres"),
    Rule("2025-10-09", "471700100", 398.15, "ALTERNOO", "758", "produits_autres"),
    Rule("2025-10-09", "471700100", 16.62, "AMAZON", "606", "charges_achats_credit"),
    Rule("2025-11-26", "471700100", 758.88, "GROUPAMA GAN VIE", "791", "produits_autres"),
    Rule("2025-12-19", "471700100", 269.28, "GROUPAMA GAN VIE", "791", "produits_autres"),
    Rule("2025-12-19", "471700100", 20067.76, "156272990", "742", "produits_autres"),
    Rule("2025-12-29", "471700100", 7203.46, "156472784", "742", "produits_autres"),
    # Web-assisted: acceptable V1 healing when the merchant/nature is reasonably identified online.
    Rule("2025-03-12", "471600100", 35.0, "ROULEZ JEUNESSE", "615", "charges_services"),
    Rule("2025-03-27", "471600100", 94.5, "ME-QR.COM", "628", "charges_services"),
    Rule("2025-05-08", "471600100", 5.37, "TIPEEE", "628", "charges_services"),
    Rule("2025-06-09", "471600100", 5.37, "TIPEEE", "628", "charges_services"),
    Rule("2025-11-08", "471600100", 99.6, "SumUp *REPAIR", "615", "charges_services"),
    Rule("2025-11-17", "471600100", 126.3, "REMB ACHATS CHAILLOT", "606", "charges_achats"),
    Rule("2025-11-28", "471600100", 100.49, "LA REDOUTE", "606", "charges_achats"),
    Rule("2025-12-19", "471600100", 74.0, "SUPERVAN", "624", "charges_services"),
    Rule("2025-12-05", "471700100", 100.49, "Erreur virement bdc", "606", "charges_achats_credit"),
    # Web-assisted : libellé bancaire = offre « Esprit Associations » Crédit Coopératif (frais/forfait), pas achat fournisseur.
    Rule("2025-11-10", "471600100", 19.75, "ESPRIT ASSOCIATION", "627", "charges_services"),
    # Mouvements carte sans commerçant : banque LCL — affectation prudente en frais bancaires (627) si le relevé détaillé ne donne pas autre chose.
    Rule("2025-09-18", "471600100", 20.0, "LCL LE CREDIT L", "627", "charges_services"),
    Rule("2025-09-19", "471600100", 80.0, "LCL LE CREDIT L", "627", "charges_services"),
    # Commerçant « RAJEESKA » (épicerie Paris 12e) — petit panier / appro : 606.
    Rule("2025-09-19", "471600200", 7.0, "RAJEESKA", "606", "charges_achats"),
]

BASE_PRODUITS_N = 488_358.99
BASE_CHARGES_N = 536_552.56


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

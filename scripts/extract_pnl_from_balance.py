#!/usr/bin/env python3
"""Extract P&L aggregates from PennyLane balance XLSX (data/*.xlsx).

Convention: column E = solde exercice, F = solde N-1 (see row 1 headers).
Classe 7: produits créditeurs → ligne rapport = -solde.
Classe 6: charges → ligne rapport = solde (signe balance PenyLane).
"""
from __future__ import annotations

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def money(x: float) -> float:
    return float(Decimal(str(x)).quantize(Decimal("0.01"), ROUND_HALF_UP))


def cell_text(elem, ss: list[str]):
    t = elem.get("t")
    v = elem.find("m:v", NS)
    is_ = elem.find("m:is", NS)
    if t == "inlineStr" and is_ is not None:
        texts: list[str] = []
        for t_el in is_.iter():
            if t_el.tag.endswith("}t") and t_el.text:
                texts.append(t_el.text)
        return "".join(texts)
    if v is None or not v.text:
        return None
    if t == "s":
        return ss[int(v.text)]
    try:
        return float(v.text)
    except ValueError:
        return v.text


def load_rows(path: Path) -> list[dict[int, object]]:
    z = zipfile.ZipFile(path)
    ss: list[str] = []
    try:
        sroot = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in sroot.findall(".//m:si", NS):
            parts: list[str] = []
            for t_el in si.iter():
                if t_el.tag.endswith("}t") and t_el.text:
                    parts.append(t_el.text)
            ss.append("".join(parts))
    except KeyError:
        pass
    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows_out: list[dict[int, object]] = []
    for row in sheet.findall(".//m:row", NS):
        by_col: dict[int, object] = {}
        for c in row.findall("m:c", NS):
            ref = c.get("r", "")
            m = re.match(r"([A-Z]+)", ref)
            if not m:
                continue
            col = 0
            for ch in m.group(1):
                col = col * 26 + ord(ch) - 64
            col -= 1
            by_col[col] = cell_text(c, ss)
        if by_col:
            rows_out.append(by_col)
    return rows_out


def parse_balance_records(path: Path) -> list[dict]:
    rows = load_rows(path)[1:]
    recs: list[dict] = []
    for r in rows:
        acct = r.get(0)
        lbl = r.get(1)
        solde = r.get(4)
        solde_n1 = r.get(5)
        if acct is None:
            continue
        ac_s = str(acct).strip()
        if not ac_s[:1].isdigit():
            continue
        sn1 = float(solde_n1) if isinstance(solde_n1, (int, float)) else None
        if isinstance(solde, (int, float)):
            recs.append(
                {
                    "account": ac_s,
                    "label": str(lbl or ""),
                    "solde": float(solde),
                    "solde_n1": sn1,
                }
            )
    return recs


def build_pnl(recs: list[dict]):
    def prod_display(pred: object) -> tuple[float, float]:
        s = sum(r["solde"] for r in recs if r["account"].startswith("7") and pred(r["account"]))
        sn1 = sum(
            r["solde_n1"] or 0
            for r in recs
            if r["account"].startswith("7") and pred(r["account"])
        )
        return money(-s), money(-sn1)

    def prefix3(a: str) -> int:
        return int(a[:3])

    def other7(a: str) -> bool:
        return not any(a.startswith(p) for p in ("701", "706", "707"))

    produits_meta = [
        ("Ventes de marchandises (707)", lambda a: a.startswith("707")),
        ("Prestations de services (706)", lambda a: a.startswith("706")),
        ("Ventes de produits finis (701)", lambda a: a.startswith("701")),
        ("Autres produits d'exploitation", other7),
    ]
    prod_rows = [(lab, *prod_display(pred)) for lab, pred in produits_meta]

    buckets: list[tuple[str, object]] = [
        ("Achats et variation de stocks (601–608)", lambda a: 601 <= prefix3(a) <= 608),
        ("Services extérieurs (611–628)", lambda a: 611 <= prefix3(a) <= 628),
        ("Impôts et taxes (631–638)", lambda a: 631 <= prefix3(a) <= 638),
        ("Charges de personnel (641–649)", lambda a: 641 <= prefix3(a) <= 649),
        ("Autres charges courantes (651–659)", lambda a: 651 <= prefix3(a) <= 659),
        ("Charges financières (661–668)", lambda a: 661 <= prefix3(a) <= 668),
        ("Charges exceptionnelles (671–679)", lambda a: 671 <= prefix3(a) <= 679),
        ("Dotations aux amortissements (681–688)", lambda a: 681 <= prefix3(a) <= 688),
        ("Impôt sur les bénéfices (695)", lambda a: prefix3(a) == 695),
    ]

    ch_sums: dict[str, tuple[float, float]] = {lab: (0.0, 0.0) for lab, _ in buckets}
    residual: list[dict] = []

    for r in recs:
        a = r["account"]
        if not a.startswith("6"):
            continue
        matched = False
        for lab, pred in buckets:
            if pred(a):
                s0, s1 = ch_sums[lab]
                ch_sums[lab] = (
                    s0 + r["solde"],
                    s1 + (r["solde_n1"] or 0),
                )
                matched = True
                break
        if not matched:
            residual.append(r)

    ch_rows: list[tuple[str, float, float]] = []
    for lab, _ in buckets:
        v0, v1 = ch_sums[lab]
        if abs(v0) > 0.005 or abs(v1) > 0.005:
            ch_rows.append((lab, money(v0), money(v1)))
    if residual:
        ch_rows.append(
            (
                "Résidu classe 6 (609, 629, 639, autres — à ventiler)",
                money(sum(x["solde"] for x in residual)),
                money(sum((x["solde_n1"] or 0) for x in residual)),
            ),
        )

    tp = sum(r[1] for r in prod_rows)
    tc = sum(r[1] for r in ch_rows)
    tot7 = sum(r["solde"] for r in recs if r["account"].startswith("7"))
    tot6 = sum(r["solde"] for r in recs if r["account"].startswith("6"))
    return {
        "produits": [{"label": a, "n": b, "n1": c} for a, b, c in prod_rows],
        "charges": [{"label": a, "n": b, "n1": c} for a, b, c in ch_rows],
        "totals_crosscheck": {
            "total_produits_formula": money(-tot7),
            "sum_produit_lines": money(tp),
            "total_charges_formula": money(tot6),
            "sum_charge_lines": money(tc),
            "rex_simple_6_7": money(-tot7 - tot6),
            "sum_line_match_produits": abs(money(tp) - money(-tot7)) < 0.03,
            "sum_line_match_charges": abs(money(tc) - money(tot6)) < 0.03,
            "n_residual_class6": len(residual),
        },
    }


def main():
    root = Path(__file__).resolve().parents[1]
    data = root / "data"
    for path in sorted(data.glob("*Balance*.xlsx")):
        recs = parse_balance_records(path)
        out = build_pnl(recs)
        print(json.dumps({"file": path.name, **out}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

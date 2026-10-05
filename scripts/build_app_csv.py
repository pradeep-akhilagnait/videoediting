"""Export District / Mandal / Village tables as linked CSVs in the app's format.

Matches the app's CSV layout: "state_id","state_name","country_id","country_name","id","<name>","<parent>_id".
Each level has its own running id (1, 2, 3 ...), assigned alphabetically within the parent so every
parent's children sit in one continuous block; each row carries its parent's id as the link.

Usage: python scripts/build_app_csv.py
"""
import csv
from pathlib import Path

import pandas as pd

DATA = Path(__file__).resolve().parent.parent / "data"
COUNTRY_ID, COUNTRY = 1, "India"
# (state_id in the app, state name, source workbook, villages sheet, sub-districts sheet, sub label, file prefix)
STATES = [
    (2, "Andhra Pradesh", "AP_Telangana_Villages_Pincodes.xlsx", "AP Villages", "AP Mandals", "Mandal", "ap"),
]


def number(df, sort_cols):
    df = df.sort_values(sort_cols, key=lambda c: c.str.lower() if c.dtype == object else c, kind="stable")
    return df.assign(id=range(1, len(df) + 1))


def write(df, path):
    df.to_csv(path, index=False, quoting=csv.QUOTE_ALL)


for state_id, state, src, vsheet, ssheet, sub, prefix in STATES:
    v = pd.read_excel(DATA / src, sheet_name=vsheet, dtype=str)
    s = pd.read_excel(DATA / src, sheet_name=ssheet, dtype=str)
    base = {"state_id": state_id, "state_name": state, "country_id": COUNTRY_ID, "country_name": COUNTRY}
    sl = sub.lower()

    d = number(s[["District", "District LGD Code"]].drop_duplicates("District LGD Code"), ["District"])
    dmap = d.set_index("District LGD Code")["id"]

    m = s.assign(district_id=s["District LGD Code"].map(dmap))
    m = number(m, ["district_id", sub])
    mmap = m.set_index(f"{sub} LGD Code")["id"]

    vv = v.assign(**{f"{sl}_id": v[f"{sub} LGD Code"].map(mmap)})
    vv = number(vv, [f"{sl}_id", "Village"])

    out = DATA / "csv" / prefix
    out.mkdir(parents=True, exist_ok=True)
    write(pd.DataFrame({**base, "id": d["id"], "district_name": d["District"]}), out / f"{prefix}_districts.csv")
    write(pd.DataFrame({**base, "id": m["id"], f"{sl}_name": m[sub], "district_id": m["district_id"]}),
          out / f"{prefix}_{sl}s.csv")
    write(pd.DataFrame({**base, "id": vv["id"], "village_name": vv["Village"], f"{sl}_id": vv[f"{sl}_id"],
                        "pincode": vv["Pincode"].fillna("")}), out / f"{prefix}_villages.csv")

    # one sheet with every level and its id side by side
    mi = m.set_index("id")
    di = d.set_index("id")
    dist_id = vv[f"{sl}_id"].map(mi["district_id"])
    flat = pd.DataFrame({
        "country_id": COUNTRY_ID, "country_name": COUNTRY,
        "state_id": state_id, "state_name": state,
        "district_id": dist_id, "district_name": dist_id.map(di["District"]),
        f"{sl}_id": vv[f"{sl}_id"], f"{sl}_name": vv[f"{sl}_id"].map(mi[sub]),
        "village_id": vv["id"], "village_name": vv["Village"],
        "pincode": vv["Pincode"].fillna(""),
    })
    write(flat, out / f"{prefix}_all_levels.csv")
    xl = flat.copy()
    for c in [c for c in xl.columns if c.endswith("_id")] + ["pincode"]:
        xl[c] = pd.to_numeric(xl[c], errors="coerce").astype("Int64")
    with pd.ExcelWriter(out / f"{prefix}_all_levels.xlsx", engine="openpyxl") as xw:
        xl.to_excel(xw, sheet_name=f"{state[:31]}", index=False)
        ws = xw.sheets[f"{state[:31]}"]
        ws.freeze_panes = "A2"
        ws.auto_filter.ref = ws.dimensions
        for col in ws.columns:
            ws.column_dimensions[col[0].column_letter].width = max(12, min(40, max(len(str(c.value or "")) for c in col[:2000]) + 2))
    assert (flat["district_name"] == vv["District"].values).all() and (flat[f"{sl}_name"] == vv[sub].values).all()

    # checks: every link points at an existing parent, and names line up with the source
    assert vv[f"{sl}_id"].notna().all() and m["district_id"].notna().all()
    chk = vv.merge(m[["id", sub, "district_id"]].rename(columns={"id": f"{sl}_id", sub: "_m"}), on=f"{sl}_id")
    chk = chk.merge(d[["id", "District"]].rename(columns={"id": "district_id", "District": "_d"}), on="district_id")
    assert (chk["_m"] == chk[sub]).all() and (chk["_d"] == chk["District"]).all()
    print(prefix, "districts", len(d), f"{sl}s", len(m), "villages", len(vv))

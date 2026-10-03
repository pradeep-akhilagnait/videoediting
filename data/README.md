# Village directory with PIN codes

State → District → Mandal (AP, Telangana) / Tehsil (Odisha) / Taluk (Tamil Nadu) → Village, with PIN codes and official LGD codes.

| File | Sheets |
|---|---|
| `AP_Telangana_Villages_Pincodes.xlsx` | Summary, AP Villages, AP Mandals, Telangana Villages, Telangana Mandals |
| `Odisha_Villages_Pincodes.xlsx` | Summary, Odisha Villages, Odisha Tehsils |
| `TamilNadu_Villages_Pincodes.xlsx` | Summary, Tamil Nadu Villages, Tamil Nadu Taluks |

| State | Districts | Mandals/Tehsils | Villages | Villages with PIN |
|---|---|---|---|---|
| Andhra Pradesh | 28 | 688 | 17,957 | 17,954 |
| Telangana | 33 | 621 | 11,450 | 11,296 |
| Odisha | 30 | 317 | 51,800 | 50,217 |
| Tamil Nadu | 38 | 317 | 18,681 | 18,652 |

**Source:** Local Government Directory (lgdirectory.gov.in), Govt. of India, data as on 02 Oct 2026,
taken from the daily LGD archive at https://github.com/ramSeraph/opendata (release `lgd-latest`).
A blank PIN means LGD has no PIN code for that village yet.

To refresh: download and extract `villages`, `subdistricts`, `districts` and `pincode_villages`
`.csv.7z` files from that release, then run
`python scripts/build_villages_excel.py <extracted dir> <date, e.g. 02Oct2026> [workbook.xlsx ...]`.

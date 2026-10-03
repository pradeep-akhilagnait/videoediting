# Village directory with PIN codes

State → District → Mandal (AP, Telangana) / Tehsil (Odisha, Rajasthan, Madhya Pradesh, Uttar Pradesh, Punjab, Haryana, Chhattisgarh, Himachal Pradesh, Uttarakhand, Jammu & Kashmir, Delhi) / Taluk (Tamil Nadu, Karnataka, Kerala) / Taluka (Maharashtra, Gujarat, Goa) / Block (Bihar, West Bengal, Jharkhand) / Revenue Circle (Assam) → Village, with PIN codes and official LGD codes.

| File | Sheets |
|---|---|
| `AP_Telangana_Villages_Pincodes.xlsx` | Summary, AP Villages, AP Mandals, Telangana Villages, Telangana Mandals |
| `Odisha_Villages_Pincodes.xlsx` | Summary, Odisha Villages, Odisha Tehsils |
| `TamilNadu_Villages_Pincodes.xlsx` | Summary, Tamil Nadu Villages, Tamil Nadu Taluks |
| `Karnataka_Villages_Pincodes.xlsx` | Summary, Karnataka Villages, Karnataka Taluks |
| `Kerala_Villages_Pincodes.xlsx` | Summary, Kerala Villages, Kerala Taluks |
| `Maharashtra_Villages_Pincodes.xlsx` | Summary, Maharashtra Villages, Maharashtra Talukas |
| `Gujarat_Villages_Pincodes.xlsx` | Summary, Gujarat Villages, Gujarat Talukas |
| `Rajasthan_Villages_Pincodes.xlsx` | Summary, Rajasthan Villages, Rajasthan Tehsils |
| `MadhyaPradesh_Villages_Pincodes.xlsx` | Summary, Madhya Pradesh Villages, Madhya Pradesh Tehsils |
| `UttarPradesh_Villages_Pincodes.xlsx` | Summary, Uttar Pradesh Villages, Uttar Pradesh Tehsils |
| `Bihar_Villages_Pincodes.xlsx` | Summary, Bihar Villages, Bihar Blocks |
| `WestBengal_Villages_Pincodes.xlsx` | Summary, West Bengal Villages, West Bengal Blocks |
| `Punjab_Villages_Pincodes.xlsx` | Summary, Punjab Villages, Punjab Tehsils |
| `Haryana_Villages_Pincodes.xlsx` | Summary, Haryana Villages, Haryana Tehsils |
| `Jharkhand_Villages_Pincodes.xlsx` | Summary, Jharkhand Villages, Jharkhand Blocks |
| `Chhattisgarh_Villages_Pincodes.xlsx` | Summary, Chhattisgarh Villages, Chhattisgarh Tehsils |
| `Assam_Villages_Pincodes.xlsx` | Summary, Assam Villages, Assam Circles |
| `HimachalPradesh_Villages_Pincodes.xlsx` | Summary, Himachal Pradesh Villages, Himachal Pradesh Tehsils |
| `Uttarakhand_Villages_Pincodes.xlsx` | Summary, Uttarakhand Villages, Uttarakhand Tehsils |
| `JammuKashmir_Villages_Pincodes.xlsx` | Summary, J&K Villages, J&K Tehsils |
| `Goa_Villages_Pincodes.xlsx` | Summary, Goa Villages, Goa Talukas |
| `Delhi_Villages_Pincodes.xlsx` | Summary, Delhi Villages, Delhi Tehsils |

| State | Districts | Mandals/Tehsils | Villages | Villages with PIN |
|---|---|---|---|---|
| Andhra Pradesh | 28 | 688 | 17,957 | 17,954 |
| Telangana | 33 | 621 | 11,450 | 11,296 |
| Odisha | 30 | 317 | 51,800 | 50,217 |
| Tamil Nadu | 38 | 317 | 18,681 | 18,652 |
| Karnataka | 31 | 240 | 30,775 | 29,900 |
| Kerala | 14 | 78 | 1,666 | 1,666 |
| Maharashtra | 36 | 358 | 44,929 | 44,805 |
| Gujarat | 34 | 306 | 19,199 | 19,057 |
| Rajasthan | 41 | 425 | 52,593 | 51,448 |
| Madhya Pradesh | 55 | 445 | 57,497 | 57,478 |
| Uttar Pradesh | 75 | 350 | 110,308 | 110,268 |
| Bihar | 38 | 537 | 48,927 | 48,927 |
| West Bengal | 23 | 346 | 41,005 | 41,005 |
| Punjab | 23 | 97 | 13,014 | 13,006 |
| Haryana | 23 | 143 | 7,090 | 7,082 |
| Jharkhand | 24 | 264 | 32,737 | 32,737 |
| Chhattisgarh | 33 | 252 | 20,650 | 20,630 |
| Assam | 35 | 161 | 29,373 | 28,723 |
| Himachal Pradesh | 12 | 193 | 21,595 | 21,592 |
| Uttarakhand | 13 | 129 | 17,343 | 17,342 |
| Jammu & Kashmir | 20 | 208 | 6,857 | 6,857 |
| Goa | 3 | 12 | 429 | 429 |
| Delhi | 13 | 39 | 353 | 208 |

**Source:** Local Government Directory (lgdirectory.gov.in), Govt. of India, data as on 02 Oct 2026,
taken from the daily LGD archive at https://github.com/ramSeraph/opendata (release `lgd-latest`).
A blank PIN means LGD has no PIN code for that village yet.

To refresh: download and extract `villages`, `subdistricts`, `districts` and `pincode_villages`
`.csv.7z` files from that release, then run
`python scripts/build_villages_excel.py <extracted dir> <date, e.g. 02Oct2026> [workbook.xlsx ...]`.

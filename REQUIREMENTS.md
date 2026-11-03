# UPVC Window Design & Quotation App — Features and Requirements

**Internal** web app for one UPVC window/door fabrication business (KN Fabricator). Staff draw windows
to size, get an automatic cut list from the supplier's cutting rules (Green Fortune), and send a priced
GST quotation; later convert it to proforma → order → tax invoice → warranty.

Not a public product: no public sign-up. **One app** (the dashboard in the reference video).
Users: the **Manager** (full control, maintains masters and users) and **Staff** (day-to-day work).

## 0. App menu

| Menu | Who | Section |
|---|---|---|
| Home (product catalogue) | All | §8 |
| My Projects (BOMs, quotations, PI, orders per project) | All | §2, §4, §6 |
| Create Your Design | All | §3 |
| Estimates | All | §7 |
| Proforma Invoice | All | §9 |
| My Orders | All | §10 |
| Tax Invoices | All (issue / cancel: Manager) | §11 |
| Warranty Cards | All | §12 |
| Masters | Manager only | §13 |
| Settings (company profile, users) | Manager only | §1 |

---

## 1. Accounts, login and security

- **FR-1.1** No public sign-up. The company and the first Manager account are created once at setup.
- **FR-1.2** Login with email + password; logout; logout from all devices.
- **FR-1.3** Session expiry and token refresh; reused/stolen refresh token logs out all sessions.
- **FR-1.4** Forgot / reset password by email.
- **FR-1.5** Rate-limit login and password reset attempts.
- **FR-1.6** Two roles: **Manager** (everything) and **Staff** (customers, projects, designs, estimates,
  quotations, PIs, orders, view invoices and warranty; no Masters, no Settings, no deleting, no giving
  discounts, no issuing/cancelling tax invoices). Manager can adjust Staff permissions.
- **FR-1.7** Permission checked on every action (permission codes in seed data); default deny.
- **FR-1.8** Manager manages users: add, edit, deactivate, reset password, assign role.
- **FR-1.9** Company profile: name, tagline, address, state, GSTIN, phone, email, website, logo, quotation terms.
- **FR-1.10** Every create / update / delete is recorded in the audit log (who, when, before/after).

## 2. Customers and projects

- **FR-2.1** Customers: add / edit / soft-delete; name, company, mobile, email, address, state, pincode, GSTIN.
- **FR-2.2** Projects: create with customer, site address, site state, shipping address, status, notes.
- **FR-2.3** My Projects list: card grid, search, 10 per page, newest first, "Edit project details".
- **FR-2.4** Project detail with tabs: **My BOMs, PI, Orders, Quotations**; Export CSV; Back.
- **FR-2.5** Project BOMs: add, rename, delete, **clone** (copies all designs and cut lists); shows design count.

## 3. Design Studio (window drawing)

- **FR-3.1** Full-screen studio: left tool palette, top toolbar, drawing area, configuration panel.
- **FR-3.2** Toolbar: Undo, Redo, Delete, Export, Import, Clean (clear), Copy, Save.
- **FR-3.3** Tools: Frame, Mullion (split pane vertically/horizontally), Casement (window, mesh, double door,
  ventilator with louvers), Sliding (2 / 3 / 4 / 6 tracks; 3 tracks adds a mesh shutter), Paint (colour),
  More (pinhole).
- **FR-3.4** Drawing to scale with overall width/height dimensions; **click a dimension to edit it**.
- **FR-3.5** Split sizes always add up to the parent; editing one adjusts its neighbour.
- **FR-3.6** Labels: fixed panes F1, F2…; opening sashes A1, A2… with slide-direction arrows; casement hinge
  triangle and handle; handle-height dimension.
- **FR-3.7** OUTSIDE / INSIDE plan line under the drawing (fixed, casement swing, sliding tracks, mesh zig-zag).
- **FR-3.8** Configuration panel — **Material** tab with cascading dropdowns (changing one resets those below):
  Series → Frame → Frame reinforcement → Sash → Locking → Sash reinforcement → Mesh type → Beading →
  Glass per pane → Tracks. Required fields show "… required" in red.
- **FR-3.9** **Color** tab: Golden Oak, Grey, Milk White, Dark Oak, Red Oak, Walnut, Black, Grey Laminated,
  Black Laminated; drawing recolours instantly.
- **FR-3.10** **Customize** tab: Outward opening, Is fixed width, Edit pinhole.
- **FR-3.11** Live cut-list preview while drawing.
- **FR-3.12** Save dialog: Code (auto "Window No. N", editable), Count (≥ 1), Description (required), Location.
- **FR-3.13** Window types to support: sliding (2/3/4/6 track, with/without mesh), casement window,
  double casement, door, double door, fixed, ventilator, and combinations via mullions.
- **FR-3.14** Two users editing the same design: the second save is refused with "changed by another user, reload".

## 4. BOM view and cut list

- **FR-4.1** Design strip: thumbnail per design with code and quantity stepper (− / +), scroll arrows,
  **Add More Design**, **Copy Existing Design**.
- **FR-4.2** Buttons: Export CSV, Save, Quotation, Optimize (phase 2).
- **FR-4.3** BOM card per design: project, BOM name, drawing, window code, description, series, frame, sash,
  beading, mesh, mesh sash, total quantity, glass, width, height, area (ft²), locking; Edit Design; Delete.
- **FR-4.4** Profile list (cut list), generated automatically: item code, item name, cut size (mm),
  width/height, pieces, colour, unit, kg/m, qty (kg), rate/kg, amount, totals.
- **FR-4.5** Edit profile list: change item, cut size, pieces; add row; delete row; totals update live;
  manually edited rows are kept and marked when the design is regenerated.
- **FR-4.6** Cut sizes come only from the supplier's cutting rules (data, not code).

## 5. Calculation rules (must be exact)

- **FR-5.1** Weight = kg/m × cut size (mm) / 1000 × pieces; amount = weight × rate per kg, rounded to 2 decimals.
- **FR-5.2** Area (ft²) = width × height (mm) / 92,903.04; BOM shows 2 decimals.
- **FR-5.3** Quotation area = rounded **up** to the next 0.5 ft² (16.02 → 16.5).
- **FR-5.4** Quotation line value = quantity × quoted area × rate per ft².
- **FR-5.5** Taxable = subtotal − discount + transport + packing.
- **FR-5.6** GST: same state → CGST = SGST = half; other state → IGST.
- **FR-5.7** All totals are calculated on the server; values from the browser are never trusted.
- **FR-5.8** Acceptance test numbers:
  - Sliding 1220 × 1220, 3 tracks: 90 Outer Frame 1225 mm × 2 pcs × 1.34 kg/m = 3.28 kg → **₹492.45**;
    whole window profiles **₹2,428.39**.
  - Quotation (4 windows, 106 ft²): subtotal **₹77,650**, CGST 6,988.50 + SGST 6,988.50, total **₹91,627**.

## 6. Quotations

- **FR-6.1** Generate a quotation from a BOM with an automatic number (per company, per financial year).
- **FR-6.2** Header: company logo, name, tagline, address, email, GSTIN, contact; supplier logo, website.
- **FR-6.3** Date, quotation number, "To" block (rich text, pre-filled from customer), subject
  (default "Quotation for UPVC Windows and Doors"), letter body (rich text, default letter), signature.
- **FR-6.4** Item table: W.No, design drawing + code + location, editable spec fields (description, width,
  height, series, outer frame, sash, wall thickness, beading, area, glass, profile colour + warranty, mesh,
  frame RI, sash RI, accessories tags), qty, area, **rate per ft² (editable)**, value.
- **FR-6.5** Totals: total qty / area / value, discount, GST %, transportation, packaging & lifting, grand total.
- **FR-6.6** Every save creates a new version; old versions never change; **History** shows all versions.
- **FR-6.7** View page (read-only) with Print (A4) and Edit.
- **FR-6.8** Project Quotations tab: cards with number, subject, location, date, Get Print, View Detail.
- **FR-6.9** Quotation status: draft, sent, accepted, rejected, expired, cancelled.

## 7. Estimates

- **FR-7.1** Create an estimate from a BOM with number (e.g. BE/2026-27/0001) and validity date.
- **FR-7.2** Estimate items (design, description, qty, area, rate, amount).
- **FR-7.3** Estimates list: cards with BE no, "valid till" badge (expired shown), project, contact,
  email, address, date, and actions (open, report, document, delete).

## 8. Product catalogue (Home)

- **FR-8.1** Supplier catalogue: categories, products (SKU, name, image, description, unit, HSN),
  variants (e.g. colours), price history.
- **FR-8.2** Home page grid: image/drawing, name, price, stock badge, pack size, colour swatches,
  **Add to Proforma Invoice**; category filter and top-bar search; cart count badge.
- **FR-8.3** Manager manages categories, products, variants and prices (in Masters).

## 9. Proforma invoices

- **FR-9.1** Create PI from the catalogue cart, from a BOM (design PI) or mixed.
- **FR-9.2** Tabs **Created / Assigned** (PIs assigned to a staff member); filter **PIs / Design PIs**;
  search; pagination; empty state.
- **FR-9.3** PI totals with discount, transport, packing and GST split.
- **FR-9.4** PI status: draft, submitted, assigned, accepted, rejected, converted, cancelled, expired.

## 10. Orders

- **FR-10.1** Convert an accepted PI into an order (lines copied from that PI only).
- **FR-10.2** My Orders list with status: pending, confirmed, processing, dispatched, delivered,
  partially cancelled, cancelled, closed; quantity delivered per line.
- **FR-10.3** Every status change recorded with user and time.

## 11. GST tax invoices and credit notes

- **FR-11.1** Create a tax invoice from an order or manually: draft → issue → cancel (with reason).
- **FR-11.2** Invoice number assigned at issue, ≤ 16 characters, unique per financial year, no gaps.
- **FR-11.3** HSN code mandatory on every line; GSTINs, place of supply, CGST/SGST/IGST, round-off to rupee,
  amount in words on the print.
- **FR-11.4** Issued invoices cannot be edited; corrections only by **credit note** against the invoice.
- **FR-11.5** Print layouts (A4) for invoice and credit note.
- **FR-11.6** E-invoice (IRN) fields stored for later; integration only needed above ₹5 crore turnover.

## 12. Warranty cards

- **FR-12.1** Issue warranty cards per order line: type (profile colour, product, hardware, glass),
  years, start and expiry dates, terms.
- **FR-12.2** Warranty list with status (active, expired, claimed, void) and printable card.

## 13. Masters (Manager only)

- **FR-13.1** Series, colours (with warranty years), profiles (item code, role, kg/m, bar length, HSN),
  reinforcements, locking/hardware, glass types, mesh types.
- **FR-13.2** Cutting rules per series and window type (length and pieces formulas), grouped in versions:
  draft → validate → publish; published versions are frozen, changes create a new version.
- **FR-13.3** Price lists (rate per kg by profile and colour, glass rate per ft²): draft → publish (frozen).
- **FR-13.4** Old designs keep the rule version and price list they were made with.
- **FR-13.5** Masters can be deactivated but never deleted (old designs and quotations still use them).

## 14. Common requirements

- **FR-14.1** Document numbering per financial year (April–March): quotation, estimate,
  proforma, order, invoice, credit note, warranty.
- **FR-14.2** Soft delete for business records (restorable); master data deactivated, never deleted.
- **FR-14.3** Search and pagination on every list; Export CSV where shown.
- **FR-14.4** All money in rupees with 2 decimals; dates shown in IST.
- **FR-14.5** URLs use non-guessable IDs (no sequential numbers).
- **FR-14.6** Fast pages: lists and detail pages load in under 1 second with realistic data.
- **FR-14.7** Daily backups with a tested restore.

## 15. Later (phase 2 — only if the client asks)

- Optimize: bar-cutting optimisation to reduce waste.
- Inventory and warehouses, purchase orders and goods receipts.
- Production tracking and quality checks.
- Delivery, installation jobs and service visits; warranty claims.
- Payments and receipts; expenses.
- WhatsApp / SMS / email notifications; e-invoice IRN integration.

## 16. Open questions for the client / supplier

1. Official cutting chart for every series and window type (from Green Fortune).
2. Should glass and hardware appear as cut-list / BOM lines?
3. Optimize: standard bar length and saw-blade loss.
4. Studio Import / Export file format.
5. Is GST charged on transport and packing? (CA to confirm.)
6. Rate per ft²: typed manually, or suggested from cost + margin?

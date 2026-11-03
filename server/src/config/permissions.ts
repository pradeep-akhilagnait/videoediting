/**
 * Permission catalogue (FR-1.7). Every protected action names one of these
 * codes; a user without it is denied (default deny). Roles get a default set
 * here, and a Manager can override per user at runtime (FR-1.6).
 *
 * Codes are grouped `resource.action`. This list is the single source of truth
 * the seed script loads into the database.
 */
export const PERMISSIONS = {
  // Customers & projects (§2)
  CUSTOMER_VIEW: 'customer.view',
  CUSTOMER_MANAGE: 'customer.manage',
  CUSTOMER_DELETE: 'customer.delete',
  PROJECT_VIEW: 'project.view',
  PROJECT_MANAGE: 'project.manage',
  PROJECT_DELETE: 'project.delete',

  // Design studio & BOM (§3–4)
  DESIGN_VIEW: 'design.view',
  DESIGN_MANAGE: 'design.manage',
  DESIGN_DELETE: 'design.delete',

  // Estimates (§7)
  ESTIMATE_VIEW: 'estimate.view',
  ESTIMATE_MANAGE: 'estimate.manage',

  // Quotations (§6)
  QUOTATION_VIEW: 'quotation.view',
  QUOTATION_MANAGE: 'quotation.manage',
  QUOTATION_DISCOUNT: 'quotation.discount', // giving discounts — Manager only (FR-1.6)

  // Proforma invoices (§9)
  PROFORMA_VIEW: 'proforma.view',
  PROFORMA_MANAGE: 'proforma.manage',

  // Orders (§10)
  ORDER_VIEW: 'order.view',
  ORDER_MANAGE: 'order.manage',

  // Tax invoices & credit notes (§11) — issue/cancel is Manager only
  INVOICE_VIEW: 'invoice.view',
  INVOICE_ISSUE: 'invoice.issue',
  INVOICE_CANCEL: 'invoice.cancel',

  // Warranty (§12)
  WARRANTY_VIEW: 'warranty.view',
  WARRANTY_MANAGE: 'warranty.manage',

  // Masters (§13) — Manager only
  MASTERS_VIEW: 'masters.view',
  MASTERS_MANAGE: 'masters.manage',

  // Settings: company profile & users (§1) — Manager only
  SETTINGS_MANAGE: 'settings.manage',
  USER_MANAGE: 'user.manage',
  AUDIT_VIEW: 'audit.view',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_NAMES = {
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
} as const;

/** Every permission a Manager holds — all of them. */
export const MANAGER_PERMISSIONS: PermissionCode[] = Object.values(PERMISSIONS);

/**
 * Staff default set (FR-1.6): customers, projects, designs, estimates,
 * quotations, PIs, orders; may view invoices and warranty. No Masters, no
 * Settings, no deleting, no discounts, no issuing/cancelling tax invoices.
 */
export const STAFF_PERMISSIONS: PermissionCode[] = [
  PERMISSIONS.CUSTOMER_VIEW,
  PERMISSIONS.CUSTOMER_MANAGE,
  PERMISSIONS.PROJECT_VIEW,
  PERMISSIONS.PROJECT_MANAGE,
  PERMISSIONS.DESIGN_VIEW,
  PERMISSIONS.DESIGN_MANAGE,
  PERMISSIONS.ESTIMATE_VIEW,
  PERMISSIONS.ESTIMATE_MANAGE,
  PERMISSIONS.QUOTATION_VIEW,
  PERMISSIONS.QUOTATION_MANAGE,
  PERMISSIONS.PROFORMA_VIEW,
  PERMISSIONS.PROFORMA_MANAGE,
  PERMISSIONS.ORDER_VIEW,
  PERMISSIONS.ORDER_MANAGE,
  PERMISSIONS.INVOICE_VIEW,
  PERMISSIONS.WARRANTY_VIEW,
  PERMISSIONS.WARRANTY_MANAGE,
];

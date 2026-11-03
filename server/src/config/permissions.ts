/**
 * Permission codes — the exact set seeded into the `permissions` table by
 * upvc_launch_seed.sql. Protected routes reference these constants with
 * `authorize(...)` (default deny, FR-1.7). Keep this list in sync with the seed.
 */
export const PERMISSIONS = {
  COMPANY_MANAGE: 'company.manage',

  USER_VIEW: 'user.view',
  USER_MANAGE: 'user.manage',
  ROLE_MANAGE: 'role.manage',

  CUSTOMER_VIEW: 'customer.view',
  CUSTOMER_MANAGE: 'customer.manage',

  PROJECT_VIEW: 'project.view',
  PROJECT_MANAGE: 'project.manage',
  PROJECT_DELETE: 'project.delete',

  DESIGN_VIEW: 'design.view',
  DESIGN_MANAGE: 'design.manage',
  DESIGN_EDIT_CUT_LIST: 'design.edit_cut_list',
  DESIGN_DELETE: 'design.delete',

  ESTIMATE_VIEW: 'estimate.view',
  ESTIMATE_MANAGE: 'estimate.manage',

  QUOTATION_VIEW: 'quotation.view',
  QUOTATION_MANAGE: 'quotation.manage',
  QUOTATION_DISCOUNT: 'quotation.discount',
  QUOTATION_DELETE: 'quotation.delete',

  PROFORMA_VIEW: 'proforma.view',
  PROFORMA_MANAGE: 'proforma.manage',

  ORDER_VIEW: 'order.view',
  ORDER_MANAGE: 'order.manage',

  INVOICE_VIEW: 'invoice.view',
  INVOICE_MANAGE: 'invoice.manage',
  INVOICE_ISSUE: 'invoice.issue',
  INVOICE_CANCEL: 'invoice.cancel',

  WARRANTY_VIEW: 'warranty.view',
  WARRANTY_MANAGE: 'warranty.manage',

  CATALOG_VIEW: 'catalog.view',
  REPORT_VIEW: 'report.view',
  AUDIT_VIEW: 'audit.view',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

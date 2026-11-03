import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { listCustomers } from '@/lib/customers';
import { PROJECT_STATUSES, type ProjectDetail, type ProjectInput } from '@/lib/projects';

type Props = {
  initial?: ProjectDetail; // present => edit mode (customer is fixed)
  onClose: () => void;
  onSubmit: (input: ProjectInput) => Promise<void>;
};

export const ProjectFormDialog = ({ initial, onClose, onSubmit }: Props) => {
  const isEdit = Boolean(initial);
  const customersQuery = useQuery({
    queryKey: ['customers', 'all-for-select'],
    queryFn: () => listCustomers({ page: 1, pageSize: 100 }),
    enabled: !isEdit, // only needed when choosing a customer on create
  });

  const [values, setValues] = useState<ProjectInput>({
    customerId: initial?.customer.id ?? '',
    name: initial?.name ?? '',
    siteAddress: initial?.siteAddress ?? '',
    siteCity: initial?.siteCity ?? '',
    siteStateCode: initial?.siteStateCode ?? '',
    shippingAddress: initial?.shippingAddress ?? '',
    status: initial?.status ?? 'active',
    notes: initial?.notes ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (name: keyof ProjectInput, value: string) =>
    setValues((v) => ({ ...v, [name]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setSaving(true);
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.details)) {
        const next: Record<string, string> = {};
        for (const d of err.details as { field: string; message: string }[]) next[d.field] = d.message;
        setErrors(next);
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Could not save project');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{isEdit ? 'Edit project' : 'New project'}</h2>
        {formError && <div className="alert">{formError}</div>}

        <div className="form-grid">
          {!isEdit && (
            <label className="span-2">
              Customer *
              <select
                value={values.customerId}
                onChange={(e) => set('customerId', e.target.value)}
                aria-invalid={Boolean(errors.customerId)}
              >
                <option value="">Select a customer…</option>
                {customersQuery.data?.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.companyName ? ` — ${c.companyName}` : ''}
                  </option>
                ))}
              </select>
              {errors.customerId && <span className="field-error">{errors.customerId}</span>}
              {customersQuery.data && customersQuery.data.items.length === 0 && (
                <span className="field-error">Add a customer first.</span>
              )}
            </label>
          )}

          <label className="span-2">
            Project name *
            <input
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>

          <label>
            Status
            <select value={values.status} onChange={(e) => set('status', e.target.value)}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Site city
            <input value={values.siteCity ?? ''} onChange={(e) => set('siteCity', e.target.value)} />
          </label>
          <label>
            Site state code
            <input
              value={values.siteStateCode ?? ''}
              onChange={(e) => set('siteStateCode', e.target.value)}
              placeholder="e.g. 36"
            />
            {errors.siteStateCode && <span className="field-error">{errors.siteStateCode}</span>}
          </label>

          <label className="span-2">
            Site address
            <textarea
              rows={2}
              value={values.siteAddress ?? ''}
              onChange={(e) => set('siteAddress', e.target.value)}
            />
          </label>
          <label className="span-2">
            Shipping address
            <textarea
              rows={2}
              value={values.shippingAddress ?? ''}
              onChange={(e) => set('shippingAddress', e.target.value)}
            />
          </label>
          <label className="span-2">
            Notes
            <textarea rows={2} value={values.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

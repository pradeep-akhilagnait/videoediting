import { useState, type FormEvent } from 'react';
import type { Customer, CustomerInput } from '@/lib/customers';
import { ApiError } from '@/lib/api';

type Props = {
  initial?: Customer;
  onClose: () => void;
  onSubmit: (input: CustomerInput) => Promise<void>;
};

type FieldErrors = Record<string, string>;

const fields: { name: keyof CustomerInput; label: string; required?: boolean }[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'companyName', label: 'Company' },
  { name: 'mobile', label: 'Mobile' },
  { name: 'email', label: 'Email' },
  { name: 'gstin', label: 'GSTIN' },
  { name: 'city', label: 'City' },
  { name: 'stateCode', label: 'State code (e.g. 36)' },
  { name: 'pincode', label: 'Pincode' },
];

export const CustomerFormDialog = ({ initial, onClose, onSubmit }: Props) => {
  const [values, setValues] = useState<CustomerInput>({
    name: initial?.name ?? '',
    companyName: initial?.companyName ?? '',
    mobile: initial?.mobile ?? '',
    email: initial?.email ?? '',
    gstin: initial?.gstin ?? '',
    city: initial?.city ?? '',
    stateCode: initial?.stateCode ?? '',
    pincode: initial?.pincode ?? '',
    addressLine: initial?.addressLine ?? '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (name: keyof CustomerInput, value: string) =>
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
        const next: FieldErrors = {};
        for (const d of err.details as { field: string; message: string }[]) next[d.field] = d.message;
        setErrors(next);
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Could not save customer');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{initial ? 'Edit customer' : 'New customer'}</h2>
        {formError && <div className="alert">{formError}</div>}

        <div className="form-grid">
          {fields.map((f) => (
            <label key={f.name} className={f.name === 'name' ? 'span-2' : ''}>
              {f.label}
              {f.required && ' *'}
              <input
                value={values[f.name] ?? ''}
                onChange={(e) => set(f.name, e.target.value)}
                aria-invalid={Boolean(errors[f.name])}
              />
              {errors[f.name] && <span className="field-error">{errors[f.name]}</span>}
            </label>
          ))}
          <label className="span-2">
            Address
            <textarea
              rows={2}
              value={values.addressLine ?? ''}
              onChange={(e) => set('addressLine', e.target.value)}
            />
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

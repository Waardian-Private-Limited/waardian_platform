'use client';

import React, { useEffect, useState } from 'react';
import { getOptedSubscriptions, SubscriptionRecord, updateOptedSubscription, EditSubscriptionPayload } from '@/lib/apiClient';
import { Eye, Pencil, X } from 'lucide-react';

export default function OptedSubscriptions() {
  const [data, setData] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SubscriptionRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditSubscriptionPayload>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getOptedSubscriptions();
        setData(res.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load subscriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderModules = (modules: SubscriptionRecord['modules']) => {
    if (Array.isArray(modules)) return modules.join(', ');
    try {
      const parsed = JSON.parse(modules as string);
      if (Array.isArray(parsed)) return parsed.join(', ');
      return String(parsed);
    } catch {
      return String(modules);
    }
  };

  const toISOOrEmpty = (date?: string | null) => (date ? new Date(date).toISOString().slice(0, 16) : '');

  const openView = (row: SubscriptionRecord) => {
    setSelected(row);
    setEditMode(false);
    setForm({});
    setShowModal(true);
  };

  const openEdit = (row: SubscriptionRecord) => {
    setSelected(row);
    setEditMode(true);
    setForm({
      society_id: row.society_id,
      plan_id: row.plan_id ?? null,
      payment_cycle: row.payment_cycle,
      amount: row.amount,
      discount: row.discount,
      total_flats: row.total_flats,
      modules: Array.isArray(row.modules) ? row.modules.join(',') : String(row.modules ?? ''),
      billing_months: row.billing_months ?? null,
      razorpay_subscription_id: row.razorpay_subscription_id ?? null,
      status: row.status,
      start_date: row.start_date ?? null,
      end_date: row.end_date ?? null,
      trial_ends_at: row.trial_ends_at ?? null,
      invoice_link: row.invoice_link ?? null,
      payment_ids: row.payment_ids ?? null,
      razorpay_customer_id: row.razorpay_customer_id ?? null,
      renewal_reminder_sent:
        typeof row.renewal_reminder_sent === 'boolean'
          ? row.renewal_reminder_sent
          : typeof row.renewal_reminder_sent === 'number'
          ? row.renewal_reminder_sent
          : row.renewal_reminder_sent == null
          ? null
          : String(row.renewal_reminder_sent),
    });
    setShowModal(true);
  };

  const handleChange = (key: keyof EditSubscriptionPayload, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const parseModulesForSave = (val: EditSubscriptionPayload['modules']) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    const str = String(val);
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return str.split(',').map(s => s.trim()).filter(Boolean);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const payload: EditSubscriptionPayload = { ...form };
      if (payload.modules !== undefined) {
        payload.modules = parseModulesForSave(payload.modules);
      }
      if (typeof payload.renewal_reminder_sent === 'string') {
        const v = payload.renewal_reminder_sent.toLowerCase();
        payload.renewal_reminder_sent = v === 'true' ? true : v === 'false' ? false : Number(payload.renewal_reminder_sent);
      }
      const res = await updateOptedSubscription(selected.id, payload);
      const updated = res.data;
      setData(prev => prev.map(item => (item.id === updated.id ? updated : item)));
      setShowModal(false);
      setEditMode(false);
      setSelected(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Opted Subscriptions</h1>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            getOptedSubscriptions()
              .then(res => setData(res.data || []))
              .catch(err => setError(err.message || 'Failed to reload'))
              .finally(() => setLoading(false));
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="p-4 bg-white rounded-md shadow border border-gray-200">Loading subscriptions...</div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">{error}</div>
      )}

      {!loading && !error && (
        <div className="overflow-auto bg-white rounded-md shadow border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Society</th>
                <th className="px-3 py-2 text-left">Plan</th>
                <th className="px-3 py-2 text-left">Cycle</th>
                <th className="px-3 py-2 text-left">Amount</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Start</th>
                <th className="px-3 py-2 text-left">End</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-4 text-center text-gray-500">No subscriptions found</td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{row.id}</td>
                    <td className="px-3 py-2">{row.society_id}</td>
                    <td className="px-3 py-2">{row.plan_id ?? ''}</td>
                    <td className="px-3 py-2">{row.payment_cycle}</td>
                    <td className="px-3 py-2">{row.amount}</td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2">{row.start_date ?? ''}</td>
                    <td className="px-3 py-2">{row.end_date ?? ''}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openView(row)}
                          className="inline-flex items-center gap-1 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(row)}
                          className="inline-flex items-center gap-1 px-2 py-1 border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if (!saving) { setShowModal(false); setEditMode(false); } }} />
          <div className="relative bg-white w-full max-w-4xl rounded-lg shadow-xl border border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold">Subscription #{selected.id}</h2>
              <button
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => { if (!saving) { setShowModal(false); setEditMode(false); } }}
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Society: {selected.society_id}</div>
                <div className="text-sm text-gray-600">Plan: {selected.plan_id ?? 'N/A'}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment & Billing */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">Payment Cycle</label>
                  {editMode ? (
                    <input className="w-full border rounded px-2 py-1" value={String(form.payment_cycle ?? '')} onChange={e => handleChange('payment_cycle', e.target.value)} />
                  ) : (
                    <div className="text-gray-800">{selected.payment_cycle}</div>
                  )}

                  <label className="text-xs font-medium text-gray-600">Amount</label>
                  {editMode ? (
                    <input className="w-full border rounded px-2 py-1" value={String(form.amount ?? '')} onChange={e => handleChange('amount', e.target.value)} />
                  ) : (
                    <div className="text-gray-800">{selected.amount}</div>
                  )}

                  <label className="text-xs font-medium text-gray-600">Discount</label>
                  {editMode ? (
                    <input className="w-full border rounded px-2 py-1" value={String(form.discount ?? '')} onChange={e => handleChange('discount', e.target.value)} />
                  ) : (
                    <div className="text-gray-800">{selected.discount}</div>
                  )}

                  <label className="text-xs font-medium text-gray-600">Total Flats</label>
                  {editMode ? (
                    <input type="number" className="w-full border rounded px-2 py-1" value={Number(form.total_flats ?? selected.total_flats)} onChange={e => handleChange('total_flats', Number(e.target.value))} />
                  ) : (
                    <div className="text-gray-800">{selected.total_flats}</div>
                  )}

                  <label className="text-xs font-medium text-gray-600">Billing Months</label>
                  {editMode ? (
                    <input type="number" className="w-full border rounded px-2 py-1" value={Number(form.billing_months ?? selected.billing_months ?? 0)} onChange={e => handleChange('billing_months', Number(e.target.value))} />
                  ) : (
                    <div className="text-gray-800">{selected.billing_months ?? 'N/A'}</div>
                  )}
                </div>

                {/* Status & IDs */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">Status</label>
                  {editMode ? (
                    <input className="w-full border rounded px-2 py-1" value={String(form.status ?? selected.status)} onChange={e => handleChange('status', e.target.value)} />
                  ) : (
                    <div className="text-gray-800">{selected.status}</div>
                  )}

                  <label className="text-xs font-medium text-gray-600">Razorpay Subscription ID</label>
                  {editMode ? (
                    <input className="w-full border rounded px-2 py-1" value={String(form.razorpay_subscription_id ?? selected.razorpay_subscription_id ?? '')} onChange={e => handleChange('razorpay_subscription_id', e.target.value)} />
                  ) : (
                    <div className="text-gray-800">{selected.razorpay_subscription_id ?? 'N/A'}</div>
                  )}

                  <label className="text-xs font-medium text-gray-600">Razorpay Customer ID</label>
                  {editMode ? (
                    <input className="w-full border rounded px-2 py-1" value={String(form.razorpay_customer_id ?? selected.razorpay_customer_id ?? '')} onChange={e => handleChange('razorpay_customer_id', e.target.value)} />
                  ) : (
                    <div className="text-gray-800">{selected.razorpay_customer_id ?? 'N/A'}</div>
                  )}

                  <label className="text-xs font-medium text-gray-600">Payment IDs</label>
                  {editMode ? (
                    <input className="w-full border rounded px-2 py-1" value={String(form.payment_ids ?? selected.payment_ids ?? '')} onChange={e => handleChange('payment_ids', e.target.value)} />
                  ) : (
                    <div className="text-gray-800">{selected.payment_ids ?? 'N/A'}</div>
                  )}

                  <label className="text-xs font-medium text-gray-600">Invoice Link</label>
                  {editMode ? (
                    <input className="w-full border rounded px-2 py-1" value={String(form.invoice_link ?? selected.invoice_link ?? '')} onChange={e => handleChange('invoice_link', e.target.value)} />
                  ) : (
                    selected.invoice_link ? (
                      <a href={selected.invoice_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Invoice</a>
                    ) : (
                      <div className="text-gray-800">N/A</div>
                    )
                  )}

                  <label className="text-xs font-medium text-gray-600">Renewal Reminder Sent</label>
                  {editMode ? (
                    <select className="w-full border rounded px-2 py-1" value={String(form.renewal_reminder_sent ?? selected.renewal_reminder_sent ?? '')} onChange={e => handleChange('renewal_reminder_sent', e.target.value)}>
                      <option value="">N/A</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                      <option value="0">0</option>
                      <option value="1">1</option>
                    </select>
                  ) : (
                    <div className="text-gray-800">{String(selected.renewal_reminder_sent ?? 'N/A')}</div>
                  )}
                </div>
              </div>

              {/* Modules */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Modules</label>
                {editMode ? (
                  <input className="w-full border rounded px-2 py-1" value={String(form.modules ?? (Array.isArray(selected.modules) ? selected.modules.join(',') : String(selected.modules ?? '')))} onChange={e => handleChange('modules', e.target.value)} />
                ) : (
                  <div className="text-gray-800">{renderModules(selected.modules)}</div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Start Date</label>
                  {editMode ? (
                    <input type="datetime-local" className="w-full border rounded px-2 py-1" value={toISOOrEmpty(form.start_date ?? selected.start_date)} onChange={e => handleChange('start_date', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                  ) : (
                    <div className="text-gray-800">{selected.start_date ?? 'N/A'}</div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">End Date</label>
                  {editMode ? (
                    <input type="datetime-local" className="w-full border rounded px-2 py-1" value={toISOOrEmpty(form.end_date ?? selected.end_date)} onChange={e => handleChange('end_date', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                  ) : (
                    <div className="text-gray-800">{selected.end_date ?? 'N/A'}</div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Trial Ends At</label>
                  {editMode ? (
                    <input type="datetime-local" className="w-full border rounded px-2 py-1" value={toISOOrEmpty(form.trial_ends_at ?? selected.trial_ends_at)} onChange={e => handleChange('trial_ends_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                  ) : (
                    <div className="text-gray-800">{selected.trial_ends_at ?? 'N/A'}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-xs text-gray-500">Created: {selected.created_at ?? selected.createdAt ?? 'N/A'} | Updated: {selected.updated_at ?? selected.updatedAt ?? 'N/A'}</div>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <button className="px-3 py-2 border rounded hover:bg-gray-100" onClick={() => setEditMode(true)}>Edit</button>
                )}
                {editMode && (
                  <>
                    <button className="px-3 py-2 border rounded hover:bg-gray-100" onClick={() => setEditMode(false)} disabled={saving}>Cancel</button>
                    <button className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Edit3, Save, X, Building2, Mail, Phone, FileText, CalendarDays, MapPin, ClipboardList, ShieldCheck } from "lucide-react";
import { getSocietyProfile, updateSocietyProfile, type SocietyDetails, type UpdateSocietyPayload, uploadFiles } from "@/lib/apiClient";

interface Props {
  societyId: string;
  user?: { id: string; name: string; email: string } | null;
}

const labelCls = "text-sm font-medium text-gray-600";
const valueCls = "text-base text-gray-900 font-semibold";
const inputCls = "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none";

// Move ProfileRow outside the component to prevent recreation on every render
const ProfileRow = ({
  name,
  label,
  type = "text",
  placeholder,
  icon: Icon,
  value,
  isEditing,
  onChange,
}: {
  name?: keyof UpdateSocietyPayload;
  label: string;
  type?: string;
  placeholder?: string;
  icon?: React.ElementType;
  value?: string | number | null;
  isEditing: boolean;
  onChange?: (name: string, value: string) => void;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4">
    <div className="flex items-center space-x-2">
      {Icon && <Icon className="h-4 w-4 text-gray-500" />}
      <span className={labelCls}>{label}</span>
    </div>
    {isEditing && name ? (
      <input
        name={name as string}
        type={type}
        value={value as string || ""}
        onChange={(e) => onChange?.(name, e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    ) : (
      <div className={valueCls}>{value ?? "-"}</div>
    )}
  </div>
);

export default function SocietyProfile({ societyId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [details, setDetails] = useState<SocietyDetails | null>(null);
  const [form, setForm] = useState<UpdateSocietyPayload>({
    name: "",
    address_line1: "",
    address_line2: "",
    status: "active",
    city: "",
    state: "",
    country: "",
    pincode: "",
    type: "",
    registration_number: "",
    registration_date: "",
    pan_number: "",
    gst_number: "",
    email: "",
    certificate_url: "",
    contact_number: "",
  });
  const [uploadingCert, setUploadingCert] = useState(false);

  function toDateInputValue(value?: string | null) {
    if (!value) return '';
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDate(value?: string | null) {
    if (!value) return '-';
    const d = new Date(value);
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  function formatDateTime(value?: string | null) {
    if (!value) return '-';
    const d = new Date(value);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  const canEdit = useMemo(() => true, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getSocietyProfile();
        setDetails(res.data);
        setForm({
          name: res.data.name || "",
          address_line1: res.data.address_line1 || "",
          address_line2: res.data.address_line2 || "",
          status: res.data.status || "active",
          city: res.data.city || "",
          state: res.data.state || "",
          country: res.data.country || "",
          pincode: res.data.pincode || "",
          type: res.data.type || "",
          registration_number: res.data.registration_number || "",
          registration_date: toDateInputValue(res.data.registration_date) || "",
          pan_number: res.data.pan_number || "",
          gst_number: res.data.gst_number || "",
          email: res.data.email || "",
          certificate_url: res.data.certificate_url || "",
          contact_number: res.data.contact_number || "",
        });
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Failed to load society profile");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [societyId]);

  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      // Trim form values before saving
      const trimmedForm = {
        ...form,
        name: form.name?.trim() || "",
        address_line1: form.address_line1?.trim() || "",
        address_line2: form.address_line2?.trim() || "",
        city: form.city?.trim() || "",
        state: form.state?.trim() || "",
        country: form.country?.trim() || "",
        pincode: form.pincode?.trim() || "",
        type: form.type?.trim() || "",
        registration_number: form.registration_number?.trim() || "",
        registration_date: form.registration_date?.trim() || "",
        pan_number: form.pan_number?.trim() || "",
        gst_number: form.gst_number?.trim() || "",
        email: form.email?.trim() || "",
        contact_number: form.contact_number?.trim() || "",
        certificate_url: form.certificate_url?.trim() || "",
      };

      // Simple validation for key fields
      if (!trimmedForm.name) throw new Error("Name is required");
      if (!trimmedForm.status) throw new Error("Status is required");

      const updated = await updateSocietyProfile(trimmedForm);
      setDetails(updated.data);
      setForm(trimmedForm);
      setIsEditing(false);
      setSuccess("Profile updated successfully");
    } catch (e: any) {
      setError(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const Header = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <ShieldCheck className="h-6 w-6 text-blue-600" />
        <h1 className="text-xl font-semibold text-gray-900">Society Profile</h1>
      </div>
      {canEdit && (
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="inline-flex items-center space-x-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save"}</span>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSuccess(null);
                  // Reset form to original details when canceling
                  if (details) {
                    setForm({
                      name: details.name || "",
                      address_line1: details.address_line1 || "",
                      address_line2: details.address_line2 || "",
                      status: details.status || "active",
                      city: details.city || "",
                      state: details.state || "",
                      country: details.country || "",
                      pincode: details.pincode || "",
                      type: details.type || "",
                      registration_number: details.registration_number || "",
                      registration_date: toDateInputValue(details.registration_date) || "",
                      pan_number: details.pan_number || "",
                      gst_number: details.gst_number || "",
                      email: details.email || "",
                      certificate_url: details.certificate_url || "",
                      contact_number: details.contact_number || "",
                    });
                  }
                }}
                className="inline-flex items-center space-x-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 shadow hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center space-x-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow border border-gray-200 hover:bg-gray-50"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit</span>
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
    );
  }

  if (!details) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">No profile data found.</div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-700">{success}</div>
      )}

      {/* Identity */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Building2 className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Identity</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProfileRow label="ID" value={details.id} icon={ClipboardList} isEditing={false} onChange={handleChange} />
          <ProfileRow
            name="name"
            label="Name"
            placeholder="Society name"
            icon={Building2}
            value={isEditing ? form.name : details.name}
            isEditing={isEditing}
            onChange={handleChange}
          />
          <ProfileRow
            name="status"
            label="Status"
            placeholder="active | inactive"
            value={isEditing ? form.status : details.status}
            isEditing={isEditing}
            onChange={handleChange}
          />
        </div>
      </section>

      {/* Address */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Address</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProfileRow
            name="address_line1"
            label="Address Line 1"
            placeholder="Street, locality"
            value={isEditing ? form.address_line1 : details.address_line1}
            isEditing={isEditing}
            onChange={handleChange}
          />
          <ProfileRow
            name="address_line2"
            label="Address Line 2"
            placeholder="Area, landmark"
            value={isEditing ? form.address_line2 : details.address_line2}
            isEditing={isEditing}
            onChange={handleChange}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ProfileRow 
            name="city" 
            label="City" 
            value={isEditing ? form.city : details.city} 
            isEditing={isEditing} 
            onChange={handleChange} 
          />
          <ProfileRow 
            name="state" 
            label="State" 
            value={isEditing ? form.state : details.state} 
            isEditing={isEditing} 
            onChange={handleChange} 
          />
          <ProfileRow 
            name="country" 
            label="Country" 
            value={isEditing ? form.country : details.country} 
            isEditing={isEditing} 
            onChange={handleChange} 
          />
          <ProfileRow 
            name="pincode" 
            label="Pincode" 
            value={isEditing ? form.pincode : details.pincode} 
            isEditing={isEditing} 
            onChange={handleChange} 
          />
        </div>
      </section>

      {/* Registration */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Registration</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProfileRow 
            name="type" 
            label="Type" 
            placeholder="Condominium, CHS, etc." 
            value={isEditing ? form.type : details.type} 
            isEditing={isEditing} 
            onChange={handleChange} 
          />
          <ProfileRow
            name="registration_number"
            label="Registration Number"
            value={isEditing ? form.registration_number : details.registration_number}
            isEditing={isEditing}
            onChange={handleChange}
          />
          <ProfileRow
            name="registration_date"
            label="Registration Date"
            type="date"
            value={isEditing ? form.registration_date : formatDate(details.registration_date)}
            icon={CalendarDays}
            isEditing={isEditing}
            onChange={handleChange}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProfileRow 
            name="pan_number" 
            label="PAN" 
            value={isEditing ? form.pan_number : details.pan_number} 
            isEditing={isEditing} 
            onChange={handleChange} 
          />
          <ProfileRow 
            name="gst_number" 
            label="GST" 
            value={isEditing ? form.gst_number : details.gst_number} 
            isEditing={isEditing} 
            onChange={handleChange} 
          />
          {isEditing ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <label className={labelCls}>Certificate</label>
                {form.certificate_url ? (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, certificate_url: '' }))}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              {form.certificate_url ? (
                <a href={String(form.certificate_url)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  View Certificate
                </a>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingCert(true);
                      try {
                        const uploaded = await uploadFiles('society-certificate', [file]);
                        const url = uploaded?.data?.files?.[0]?.url;
                        if (url) {
                          setForm((prev) => ({ ...prev, certificate_url: url }));
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setUploadingCert(false);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  {uploadingCert ? <span className="text-xs text-gray-500">Uploading…</span> : null}
                </div>
              )}
            </div>
          ) : (
            details.certificate_url ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center space-x-2">
                  <span className={labelCls}>Certificate</span>
                </div>
                <a href={String(details.certificate_url)} target="_blank" rel="noopener noreferrer" className={valueCls + ' text-blue-600 underline'}>
                  View Certificate
                </a>
              </div>
            ) : (
              <ProfileRow label="Certificate" value={null} isEditing={false} onChange={handleChange} />
            )
          )}
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProfileRow
            name="email"
            label="Email"
            type="email"
            placeholder="name@example.com"
            icon={Mail}
            value={isEditing ? form.email : details.email}
            isEditing={isEditing}
            onChange={handleChange}
          />
          <ProfileRow
            name="contact_number"
            label="Contact Number"
            type="tel"
            placeholder="9999999999"
            icon={Phone}
            value={isEditing ? form.contact_number : details.contact_number}
            isEditing={isEditing}
            onChange={handleChange}
          />
        </div>
      </section>

      {/* System */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <ClipboardList className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">System</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProfileRow label="Created At" value={formatDateTime(details.created_at)} icon={CalendarDays} isEditing={false} onChange={handleChange} />
          <ProfileRow label="Updated At" value={formatDateTime(details.updated_at)} icon={CalendarDays} isEditing={false} onChange={handleChange} />
        </div>
      </section>
    </div>
  );
}
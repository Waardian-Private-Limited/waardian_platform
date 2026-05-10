"use client";

import React, { useEffect, useMemo, useState } from "react";
import { 
  Search, 
  Users, 
  UserX, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  ArrowUpRight,
  Calendar,
  Activity,
  RefreshCcw,
  Copy,
  Check
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface StaffDashboardProps {
  societyId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    [key: string]: any;
  };
}

interface StaffItem {
  id: number;
  name: string;
  phone: string;
  staffType: "society" | "flat" | string;
  designation: string | null;
  flatIds: number[];
  flatNames: string;
  attendanceFlatNames: string;
  attendanceFlatIds: number[];
  checkInTime: string | null;
  checkOutTime: string | null;
  isCheckedIn: boolean;
  status: string | null;
  raw?: any;
}

export default function StaffDashboard({ societyId }: StaffDashboardProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [total, setTotal] = useState<number>(0);

  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [societyOnly, setSocietyOnly] = useState<boolean>(true);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<StaffItem | null>(null);
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleRegenerateOnboarding = async (staffId: number, phone: string) => {
    setRegenerating(true);
    try {
      const res = await apiClient<any>("/staff/regenerate-onboarding", {
        method: "POST",
        body: { staffId, phone },
        withAuth: true
      });
      
      if (res.success && res.data?.onboardingLink) {
        await navigator.clipboard.writeText(res.data.onboardingLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (e) {
      console.error("Failed to regenerate onboarding:", e);
    } finally {
      setRegenerating(false);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { isAdminMode: "true" };
      if (search.trim().length > 0) params.search = search.trim();

      const res = await apiClient<any>("/staff/overview", { method: "GET", params, withAuth: true });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.list ?? []);
      const mapped: StaffItem[] = raw.map((r: any) => ({
        id: r.id,
        name: `${r.first_name || ""} ${r.last_name || ""}`.trim(),
        phone: r.phone_number || "",
        staffType: r.staff_type || "",
        designation: r.designation || null,
        flatIds: Array.isArray(r.assigned_flats) ? r.assigned_flats : [],
        flatNames: Array.isArray(r.assigned_flats) ? r.assigned_flats.join(", ") : "",
        attendanceFlatNames: Array.isArray(r.assigned_flats) ? r.assigned_flats.join(", ") : "",
        attendanceFlatIds: Array.isArray(r.assigned_flats) ? r.assigned_flats : [],
        checkInTime: r.check_in_time || null,
        checkOutTime: r.check_out_time || null,
        isCheckedIn: ["present", "completed", "half_day", "late"].includes(String(r.status || "").toLowerCase()),
        status: r.status || null,
        raw: r,
      }));
      const filtered = societyOnly ? mapped.filter((s: StaffItem) => s.staffType === "society") : mapped;

      setStaff(filtered);
      setTotal(filtered.length);
    } catch (e: any) {
      console.error("Failed to fetch staff:", e);
      setError(e?.message || "Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchStaff();
  };

  const stats = useMemo(() => {
    const totalCount = staff.length;
    const checkedInCount = staff.filter((s) => s.isCheckedIn).length;
    const absentCount = staff.filter((s) => (s.status || "").toLowerCase() === "absent" || (s.status || "") === "not_marked").length;
    const leaveCount = staff.filter((s) => (s.status || "").toLowerCase() === "on leave").length;
    const weekOffCount = staff.filter((s) => (s.status || "").toLowerCase() === "week off").length;

    return {
      totalCount,
      checkedInCount,
      absentCount,
      leaveCount,
      weekOffCount,
    };
  }, [staff]);

  return (
    <main className="flex-1 bg-white text-[#0b1c30] antialiased p-8 font-['Manrope',_sans-serif]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <nav className="flex gap-2 text-[12px] font-bold text-[#565e74] mb-2 uppercase tracking-wide">
              <span>Management</span>
              <span>/</span>
              <span className="text-[#004ac6]">Staff Attendance</span>
            </nav>
            <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#0b1c30]">Attendance Insights</h2>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => fetchStaff()}
              className="bg-white border border-slate-200 text-[#565e74] px-5 py-2 rounded-lg flex items-center gap-2 transition-all font-bold text-[14px] hover:bg-slate-50"
            >
              <Activity className="w-4 h-4" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-slate-100 p-6 transition-all hover:border-[#004ac6]/20">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Workforce</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-[#0b1c30]">{stats.totalCount}</h3>
              <span className="text-[10px] font-bold text-slate-400">Members</span>
            </div>
            <div className="mt-4 h-1.5 bg-slate-50 rounded-full overflow-hidden">
              <div className="h-full bg-slate-400 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6 transition-all hover:border-green-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Currently Present</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-green-600">{stats.checkedInCount}</h3>
              <span className="text-[10px] font-bold text-green-400">On-Site</span>
            </div>
            <div className="mt-4 h-1.5 bg-green-50 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.totalCount ? (stats.checkedInCount / stats.totalCount) * 100 : 0}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6 transition-all hover:border-red-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Absenteeism</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-red-600">{stats.absentCount}</h3>
              <span className="text-[10px] font-bold text-red-400">Off-Duty</span>
            </div>
            <div className="mt-4 h-1.5 bg-red-50 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${stats.totalCount ? (stats.absentCount / stats.totalCount) * 100 : 0}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6 transition-all hover:border-amber-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Leave / Week Off</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-amber-600">{stats.leaveCount + stats.weekOffCount}</h3>
              <span className="text-[10px] font-bold text-amber-400">Scheduled</span>
            </div>
            <div className="mt-4 h-1.5 bg-amber-50 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${stats.totalCount ? ((stats.leaveCount + stats.weekOffCount) / stats.totalCount) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <form onSubmit={onSearchSubmit} className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search staff, phone, or wing..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#004ac6] transition-all"
              />
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg px-4 py-2">
              <input
                type="checkbox"
                id="society-only"
                checked={societyOnly}
                onChange={(e) => setSocietyOnly(e.target.checked)}
                className="w-4 h-4 text-[#004ac6] border-slate-300 rounded focus:ring-[#004ac6]"
              />
              <label htmlFor="society-only" className="text-[13px] font-bold text-[#565e74] cursor-pointer">Society Staff Only</label>
            </div>

            <div className="flex gap-2">
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="flex-grow px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-bold text-[#565e74] outline-none"
              >
                {[10, 20, 50].map((n) => <option key={n} value={n}>{n} Rows</option>)}
              </select>
              <button 
                type="submit"
                className="px-6 py-2 bg-[#0b1c30] text-white rounded-lg font-bold text-[13px] hover:bg-[#1a2d44] transition-all"
              >
                Apply
              </button>
            </div>
          </form>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-50">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Staff Identity</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Assignment</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Shift Logs</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-[#565e74] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8"></td>
                    </tr>
                  ))
                ) : staff.length > 0 ? (
                  staff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#004ac6] font-bold text-xs">
                            {s.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#0b1c30] text-[14px]">{s.name}</p>
                            <p className="text-[12px] text-[#565e74] font-medium">{s.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[13px] text-[#0b1c30] font-bold">{s.designation || "Worker"}</div>
                        <div className="text-[11px] text-[#565e74] capitalize">{s.staffType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[12px] text-[#565e74] font-medium max-w-[150px] truncate">
                          {s.attendanceFlatNames || s.flatNames || "Society Premises"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-tight",
                          (s.status || "").toLowerCase() === "absent" || s.status === "not_marked"
                            ? "bg-red-50 text-red-700"
                            : (s.status || "").toLowerCase() === "on leave"
                            ? "bg-amber-50 text-amber-700"
                            : (s.status || "").toLowerCase() === "week off"
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-green-50 text-green-700"
                        )}>
                          <span className={clsx(
                            "w-1 h-1 rounded-full",
                            (s.status || "").toLowerCase() === "absent" || s.status === "not_marked" ? "bg-red-500" :
                            (s.status || "").toLowerCase() === "on leave" ? "bg-amber-500" :
                            (s.status || "").toLowerCase() === "week off" ? "bg-indigo-500" : "bg-green-500"
                          )}></span>
                          {s.status || (s.isCheckedIn ? "Present" : "Absent")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[12px] font-bold text-[#0b1c30]">
                            <ArrowUpRight className="w-3 h-3 text-green-500" />
                            {s.checkInTime || "--:--"}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-medium text-[#565e74]">
                            <ArrowUpRight className="w-3 h-3 text-red-400 rotate-90" />
                            {s.checkOutTime || "--:--"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => { setSelected(s); setDetailsOpen(true); }}
                          className="text-[12px] font-bold text-[#004ac6] hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">No workforce data available for the selected period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#565e74] font-bold uppercase tracking-wider">
            <span>Showing {staff.length} of {total} Members</span>
            <div className="flex gap-2">
              <button
                className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all disabled:opacity-30"
                disabled={page === 0}
                onClick={() => setPage(Math.max(0, page - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all disabled:opacity-30"
                disabled={(page + 1) * size >= total}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {detailsOpen && selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0b1c30]/10 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.98 }} 
              className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-[20px] font-bold text-[#0b1c30]">Staff Details</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Complete employment profile</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleRegenerateOnboarding(selected.id, selected.phone)}
                    disabled={regenerating}
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all shadow-sm",
                      copied 
                        ? "bg-green-50 text-green-600 border border-green-200" 
                        : "bg-white border border-slate-200 text-[#004ac6] hover:bg-slate-50"
                    )}
                  >
                    {regenerating ? (
                      <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                    ) : copied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <RefreshCcw className="w-3.5 h-3.5" />
                    )}
                    {copied ? "Link Copied" : "Regenerate Onboarding"}
                  </button>
                  <button 
                    onClick={() => { setDetailsOpen(false); setSelected(null); }}
                    className="p-2 hover:bg-slate-50 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5 text-slate-300" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                {/* Profile Header */}
                <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-[#004ac6] flex items-center justify-center text-white text-2xl font-bold">
                    {selected.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[#0b1c30]">{selected.name}</h4>
                    <p className="text-[13px] font-bold text-[#004ac6] uppercase tracking-tight">{selected.designation || "Staff Member"}</p>
                    <div className="flex gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-[12px] text-[#565e74] font-medium">
                        <Users className="w-3.5 h-3.5" />
                        {selected.staffType}
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] text-[#565e74] font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        Joined {selected.raw?.joining_date ? new Date(selected.raw.joining_date).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Contact & Professional */}
                  <section className="space-y-4">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Contact & Roles</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-[12px] font-bold text-slate-500 uppercase">Phone</span>
                        <span className="text-[13px] font-bold text-[#0b1c30]">{selected.phone}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-[12px] font-bold text-slate-500 uppercase">Email</span>
                        <span className="text-[13px] font-bold text-[#0b1c30]">{selected.raw?.email || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-[12px] font-bold text-slate-500 uppercase">Salary Base</span>
                        <span className="text-[13px] font-bold text-green-600">₹{selected.raw?.salary || "0"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-[12px] font-bold text-slate-500 uppercase">UPI ID</span>
                        <span className="text-[13px] font-bold text-[#004ac6]">{selected.raw?.upi_id || "N/A"}</span>
                      </div>
                    </div>
                  </section>

                  {/* Shift & Attendance */}
                  <section className="space-y-4">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Shift Parameters</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-[12px] font-bold text-slate-500 uppercase">Work Hours</span>
                        <span className="text-[13px] font-bold text-[#0b1c30]">{selected.raw?.start_time || "00:00"} - {selected.raw?.end_time || "00:00"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-[12px] font-bold text-slate-500 uppercase">Flexible Shift</span>
                        <span className={clsx("text-[11px] font-bold px-2 py-0.5 rounded", selected.raw?.flexible_timing ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-500")}>
                          {selected.raw?.flexible_timing ? "ENABLED" : "DISABLED"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-[12px] font-bold text-slate-500 uppercase">Method</span>
                        <span className="text-[13px] font-bold text-[#0b1c30] uppercase tracking-tight">{selected.raw?.attendance_method || "MANUAL"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-[12px] font-bold text-slate-500 uppercase">Assigned To</span>
                        <span className="text-[11px] font-bold text-[#565e74]">{selected.attendanceFlatNames || selected.flatNames || "SOCIETY"}</span>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Working Days */}
                <section className="space-y-4">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Roster Schedule</h5>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selected.raw?.working_days || {}).map(([day, on]) => (
                      <div key={day} className={clsx(
                        "px-4 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-tight transition-all",
                        on ? "bg-white border-[#004ac6] text-[#004ac6] shadow-sm" : "bg-slate-50 border-slate-100 text-slate-300"
                      )}>
                        {day.substring(0, 3)}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Identity Verification */}
                <section className="p-6 bg-[#0b1c30] rounded-2xl text-white">
                  <h5 className="text-[10px] font-bold text-white/40 uppercase tracking-[2px] mb-4">Identity Verification</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-white/50 uppercase mb-1">ID Proof ({selected.raw?.documents?.id_proof_type || "N/A"})</p>
                      <p className="text-[14px] font-bold tracking-widest">{selected.raw?.documents?.id_proof_number || "XXXXXXXXXXXX"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/50 uppercase mb-1">Residential Address</p>
                      <p className="text-[12px] font-medium text-white/80 leading-relaxed">{selected.raw?.documents?.current_address || "No address provided"}</p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-8 border-t border-slate-50 flex gap-3 bg-white sticky bottom-0">
                <button 
                  onClick={() => { setDetailsOpen(false); setSelected(null); }}
                  className="w-full py-3 bg-[#0b1c30] text-white rounded-xl font-bold text-[14px] hover:bg-[#1a2d44] transition-all"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
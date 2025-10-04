"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Users, UserX, CheckCircle, AlertTriangle, Eye, X } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

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

interface StaffResponse {
  success: boolean;
  data: StaffItem[];
  total: number;
  message?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Present: "#10b981",
  Absent: "#ef4444",
  "On Leave": "#f59e0b",
  "Week Off": "#6366f1",
  marked: "#10b981",
  not_marked: "#ef4444",
};

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

    const byDesignation: Record<string, number> = {};
    staff.forEach((s) => {
      const key = s.designation || "Unknown";
      byDesignation[key] = (byDesignation[key] || 0) + 1;
    });

    const statusBuckets: Record<string, number> = {};
    staff.forEach((s) => {
      const key = s.status || (s.isCheckedIn ? "Present" : "Absent");
      statusBuckets[key] = (statusBuckets[key] || 0) + 1;
    });

    return {
      totalCount,
      checkedInCount,
      absentCount,
      leaveCount,
      weekOffCount,
      byDesignation,
      statusBuckets,
    };
  }, [staff]);

  const statusPieData = useMemo(() => {
    return Object.entries(stats.statusBuckets).map(([name, value]) => ({ name, value }));
  }, [stats.statusBuckets]);

  const designationBarData = useMemo(() => {
    return Object.entries(stats.byDesignation).map(([name, count]) => ({ name, count }));
  }, [stats.byDesignation]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Staff Dashboard</h1>
      </div>

      {/* Filters */}
      <form onSubmit={onSearchSubmit} className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
          <div className="flex items-center w-full md:w-1/2">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name, phone, wing, flat"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={societyOnly}
                onChange={(e) => setSocietyOnly(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Society staff only</span>
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      </form>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Staff</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalCount}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Checked In Now</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.checkedInCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Absent</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.absentCount}</p>
            </div>
            <UserX className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">On Leave / Week Off</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.leaveCount + stats.weekOffCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Attendance Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusPieData} dataKey="value" nameKey="name" outerRadius={100} label>
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#3b82f6"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Designation Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={designationBarData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#6366f1" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Today's Attendance</h3>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-600">Loading staff...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-In</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-Out</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.designation || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">{s.staffType}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.attendanceFlatNames || s.flatNames || "Society"}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          (s.status || "").toLowerCase() === "absent" || s.status === "not_marked"
                            ? "bg-red-100 text-red-700"
                            : (s.status || "").toLowerCase() === "on leave"
                            ? "bg-amber-100 text-amber-700"
                            : (s.status || "").toLowerCase() === "week off"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {(s.status || (s.isCheckedIn ? "Present" : "Absent"))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.checkInTime || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.checkOutTime || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => { setSelected(s); setDetailsOpen(true); }}
                        className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                        aria-label="View details"
                      >
                        <Eye className="w-4 h-4 mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{staff.length}</span> of <span className="font-semibold">{total}</span>
          </p>
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50"
              disabled={page === 0}
              onClick={() => setPage(Math.max(0, page - 1))}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">Page {page + 1}</span>
            <button
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50"
              disabled={(page + 1) * size >= total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {detailsOpen && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Staff Details</h3>
              <button
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => { setDetailsOpen(false); setSelected(null); }}
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Basic Info</h4>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Name:</span> {selected.name}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Phone:</span> {selected.phone}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Email:</span> {selected.raw?.email || "-"}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Designation:</span> {selected.designation || "-"}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Type:</span> {selected.staffType}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Category:</span> {selected.raw?.category || "-"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Timing</h4>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Start:</span> {selected.raw?.start_time || "-"}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">End:</span> {selected.raw?.end_time || "-"}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Flexible Timing:</span> {selected.raw?.flexible_timing ? "Yes" : "No"}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Attendance Method:</span> {selected.raw?.attendance_method || "-"}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Joining Date:</span> {selected.raw?.joining_date ? new Date(selected.raw.joining_date).toLocaleDateString() : "-"}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Working Days</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-700">
                  {Object.entries(selected.raw?.working_days || {}).map(([day, on]) => (
                    <span key={day} className={`inline-flex items-center px-2 py-1 rounded-full border ${on ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                      {day}: {on ? "Yes" : "No"}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Today's Attendance</h4>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Status:</span> {selected.status || "-"}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Check-In:</span> {selected.checkInTime || "-"}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Check-Out:</span> {selected.checkOutTime || "-"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Assigned</h4>
                  <p className="text-sm text-gray-700">{selected.attendanceFlatNames || selected.flatNames || "Society"}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Leave Info</h4>
                <div className="space-y-1">
                  {Object.entries(selected.raw?.leave_info || {}).map(([name, val]: any) => (
                    <p key={name} className="text-sm text-gray-700"><span className="font-semibold">{name}:</span> days {val?.days ?? "-"}, balance {val?.balance ?? "-"}</p>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Leave Policy</h4>
                <p className="text-sm text-gray-700"><span className="font-semibold">FY Cycle:</span> {selected.raw?.leavesPolicy?.financialYearCycle || "-"}</p>
                <p className="text-sm text-gray-700"><span className="font-semibold">Total Leaves:</span> {selected.raw?.leavesPolicy?.totalLeaves ?? "-"}</p>
                <p className="text-sm text-gray-700"><span className="font-semibold">Carry Forward:</span> {selected.raw?.leavesPolicy?.carryForwardLimit ?? "-"}</p>
                <div className="space-y-1">
                  {(selected.raw?.leavesPolicy?.leaveTypes || []).map((t: any, i: number) => (
                    <p key={i} className="text-sm text-gray-700">{t?.name}: {t?.count}</p>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Salary</h4>
                <p className="text-sm text-gray-700"><span className="font-semibold">Base:</span> {selected.raw?.salary ?? "-"}</p>
                <p className="text-sm text-gray-700"><span className="font-semibold">Salary Date:</span> {selected.raw?.salary_date ?? "-"}</p>
                <p className="text-sm text-gray-700"><span className="font-semibold">UPI:</span> {selected.raw?.upi_id || "-"}</p>
                <div className="space-y-1">
                  {(selected.raw?.salaryBreakdowns || []).map((b: any, i: number) => (
                    <p key={i} className="text-sm text-gray-700">
                      <span className="font-semibold">{b?.type}:</span> {b?.amount} {b?.isAddition ? "(+)": "(-)"}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Documents</h4>
                <p className="text-sm text-gray-700"><span className="font-semibold">ID Type:</span> {selected.raw?.documents?.id_proof_type || "-"}</p>
                <p className="text-sm text-gray-700"><span className="font-semibold">ID Number:</span> {selected.raw?.documents?.id_proof_number || "-"}</p>
                <p className="text-sm text-gray-700"><span className="font-semibold">Permanent Address:</span> {selected.raw?.documents?.permanent_address || "-"}</p>
                <p className="text-sm text-gray-700"><span className="font-semibold">Current Address:</span> {selected.raw?.documents?.current_address || "-"}</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={() => { setDetailsOpen(false); setSelected(null); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
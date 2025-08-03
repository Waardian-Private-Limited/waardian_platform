// app/store/useDashboardStore.ts
import { create } from 'zustand';
import { apiClient } from '@/lib/apiClient';

interface Wing {
  wing: string;
  totalFlats: number;
  occupiedFlats: number;
}
interface Member {
  flat: string;
  owner: string;
  status: string;
  payment: string;
  updatedAt: string;
}
interface DashboardData {
  wings: Wing[];
  members: Member[];
  totalFlats: number;
  subscriptionStatus: string;
  validTill: string;
  totalNotices: number;
  totalComplaints: number;
  totalInvoices: number;
  totalActiveMember: number,
  dueInvoices: number;
}

interface DashboardStore {
  data: DashboardData | null;
  loading: boolean;
  fetchDashboard: (societyId: number) => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  data: null,
  loading: false,
  fetchDashboard: async (societyId: number) => {
    try {
      set({ loading: true });
      const res = await apiClient<{ data: DashboardData }>('/society-admin/dashboard-data', {
        method: 'GET',
        withAuth: true,
        params: { societyId: societyId.toString() },
      });
      set({ data: res.data });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      set({ loading: false });
    }
  },
}));

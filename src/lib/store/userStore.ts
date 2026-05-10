import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  role: string;
  email: string;
  name: string;
  token?: string;
  societyId?: string;
  societyName?: string;
  avatar?: string;
}

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

import { createJSONStorage } from 'zustand/middleware';

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-storage', // localStorage key
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }) as any),
    }
  )
);

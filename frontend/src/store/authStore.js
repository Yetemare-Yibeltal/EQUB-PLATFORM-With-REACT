import { create } from "zustand";

export const useAuthStore = create((set) => ({
  status: "loading",
  user: null,
  accessToken: null,

  setSession: ({ user, accessToken }) =>
    set((state) => ({
      status: "authenticated",
      user: user ?? state.user,
      accessToken,
    })),

  setUser: (user) => set({ user }),

  setStatus: (status) => set({ status }),

  clearSession: () =>
    set({ status: "unauthenticated", user: null, accessToken: null }),
}));

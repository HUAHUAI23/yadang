"use client";

import { create } from "zustand";

import type { AccountState, AuthUser, SearchHistoryItem } from "@/lib/types";

type PatentLensState = {
  user: AuthUser | null;
  account: AccountState | null;
  isAuthenticated: boolean;
  history: SearchHistoryItem[];
  setSession: (payload: { user: AuthUser | null; account: AccountState | null }) => void;
  setBalance: (balance: number) => void;
  setHistory: (items: SearchHistoryItem[]) => void;
  prependHistory: (item: SearchHistoryItem) => void;
  clearHistoryLocal: () => void;
  logout: () => void;
};

export const usePatentLensStore = create<PatentLensState>()((set) => ({
  user: null,
  account: null,
  isAuthenticated: false,
  history: [],
  setSession: ({ user, account }) =>
    set({
      user,
      account,
      isAuthenticated: Boolean(user),
      history: [],
    }),
  setBalance: (balance) =>
    set((state) => ({
      account: state.account ? { ...state.account, balance } : state.account,
    })),
  setHistory: (items) => set({ history: items }),
  prependHistory: (item) =>
    set((state) => ({
      history: [item, ...state.history].slice(0, 50),
    })),
  clearHistoryLocal: () => set({ history: [] }),
  logout: () =>
    set({
      user: null,
      account: null,
      isAuthenticated: false,
      history: [],
    }),
}));

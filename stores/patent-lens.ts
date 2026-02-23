"use client";

import { create } from "zustand";
import { persist, createJSONStorage, type PersistStorage } from "zustand/middleware";
import {
  INITIAL_CREDITS,
  MAX_HISTORY_ITEMS,
} from "@/lib/constants";
import type { AuthUser, CreditsState, HistoryItem } from "@/lib/types";

type PatentLensState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  credits: CreditsState;
  history: HistoryItem[];
  setSession: (payload: { user: AuthUser | null; credits?: CreditsState }) => void;
  logout: () => void;
  debitCredits: (amount: number) => void;
  rechargeCredits: (credits: number, amount: number) => void;
  addHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
};

const createNoopStorage = (): PersistStorage<PatentLensState> => ({
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
});

const storage =
  typeof window === "undefined"
    ? createNoopStorage()
    : createJSONStorage<PatentLensState>(() => localStorage);

export const usePatentLensStore = create<PatentLensState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      credits: { balance: INITIAL_CREDITS, totalRecharged: 0 },
      history: [],
      setSession: ({ user, credits }) =>
        set((state) => ({
          user,
          isAuthenticated: Boolean(user),
          credits: credits ?? state.credits,
        })),
      logout: () => set({ user: null, isAuthenticated: false }),
      debitCredits: (amount) =>
        set((state) => ({
          credits: {
            ...state.credits,
            balance: Math.max(0, state.credits.balance - amount),
          },
        })),
      rechargeCredits: (credits, amount) =>
        set((state) => ({
          credits: {
            balance: state.credits.balance + credits,
            totalRecharged: state.credits.totalRecharged + amount,
          },
        })),
      addHistory: (item) =>
        set((state) => ({
          history: [item, ...state.history].slice(0, MAX_HISTORY_ITEMS),
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "patent_lens_store",
      storage,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        credits: state.credits,
        history: state.history,
      }),
    }
  )
);

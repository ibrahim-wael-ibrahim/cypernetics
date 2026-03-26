'use client';

import { create } from 'zustand';

// UI store for managing UI state (no persistence needed)
export const useUIStore = create((set) => ({
  isCartOpen: false,

  toggleCart: () => {
    set((state) => ({ isCartOpen: !state.isCartOpen }));
  },

  openCart: () => {
    set({ isCartOpen: true });
  },

  closeCart: () => {
    set({ isCartOpen: false });
  },
}));
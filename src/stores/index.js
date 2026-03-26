'use client';

// Cart store exports
export { useCartStore } from './cart-store';

// Auth store exports
export { useAuthStore } from './auth-store';

// UI store exports
export { useUIStore } from './ui-store';

// Combined hooks for convenience
export const useCart = () => {
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal);
  const getItemCount = useCartStore((state) => state.getItemCount);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
  };
};

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);

  return {
    user,
    isAuthenticated,
    login,
    logout,
    setUser,
  };
};

export const useCartUI = () => {
  const isCartOpen = useUIStore((state) => state.isCartOpen);
  const toggleCart = useUIStore((state) => state.toggleCart);
  const openCart = useUIStore((state) => state.openCart);
  const closeCart = useUIStore((state) => state.closeCart);

  return {
    isCartOpen,
    toggleCart,
    openCart,
    closeCart,
  };
};
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import {
  clearApiCart,
  fetchApiCart,
  removeApiCartItem,
  updateApiCartItem,
} from '@/lib/cart-client';
import { toast } from 'sonner';

export default function CartPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, hasHydrated: hasAuthHydrated } = useAuthStore();
  const {
    items: localItems,
    updateQuantity,
    removeItem,
    clearCart,
    getTotal,
    hasHydrated: hasCartHydrated,
  } = useCartStore();

  const isUserAuthenticated = hasAuthHydrated && isAuthenticated;

  const { data: apiCartData, isLoading: isApiLoading } = useQuery({
    queryKey: ['api-cart'],
    queryFn: fetchApiCart,
    enabled: isUserAuthenticated,
  });

  const updateApiItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }) => updateApiCartItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-cart'] });
      queryClient.invalidateQueries({ queryKey: ['navbar-api-cart'] });
      queryClient.invalidateQueries({ queryKey: ['checkout-cart'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update cart item');
    },
  });

  const removeApiItemMutation = useMutation({
    mutationFn: (itemId) => removeApiCartItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-cart'] });
      queryClient.invalidateQueries({ queryKey: ['navbar-api-cart'] });
      queryClient.invalidateQueries({ queryKey: ['checkout-cart'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove cart item');
    },
  });

  const clearApiMutation = useMutation({
    mutationFn: clearApiCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-cart'] });
      queryClient.invalidateQueries({ queryKey: ['navbar-api-cart'] });
      queryClient.invalidateQueries({ queryKey: ['checkout-cart'] });
      toast.success('Cart cleared');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to clear cart');
    },
  });

  const activeItems = useMemo(() => {
    if (isUserAuthenticated) {
      return apiCartData?.items || [];
    }
    return localItems;
  }, [isUserAuthenticated, apiCartData, localItems]);

  const subtotal = useMemo(() => {
    if (isUserAuthenticated) {
      return apiCartData?.subtotal || 0;
    }
    return getTotal();
  }, [isUserAuthenticated, apiCartData, getTotal]);

  const handleDecrease = (item) => {
    if (isUserAuthenticated) {
      const newQuantity = item.quantity - 1;
      if (newQuantity < 1) {
        removeApiItemMutation.mutate(item.id);
      } else {
        updateApiItemMutation.mutate({ itemId: item.id, quantity: newQuantity });
      }
      return;
    }

    updateQuantity(item.productId, item.quantity - 1);
  };

  const handleIncrease = (item) => {
    if (isUserAuthenticated) {
      if (item.quantity >= item.product.stockQuantity) {
        toast.error(`Insufficient stock. Available: ${item.product.stockQuantity}`);
        return;
      }
      updateApiItemMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 });
      return;
    }

    updateQuantity(item.productId, item.quantity + 1);
  };

  const handleRemove = (item) => {
    if (isUserAuthenticated) {
      removeApiItemMutation.mutate(item.id);
      return;
    }

    removeItem(item.productId);
  };

  const handleClear = () => {
    if (isUserAuthenticated) {
      clearApiMutation.mutate();
      return;
    }

    clearCart();
    toast.success('Cart cleared');
  };

  const isLoading = !hasAuthHydrated || !hasCartHydrated || (isUserAuthenticated && isApiLoading);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your Cart</h1>
          {activeItems.length > 0 && (
            <Button variant="outline" onClick={handleClear}>
              Clear Cart
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : activeItems.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <Button asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {activeItems.map((item) => (
                <Card key={item.id || item.productId}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="relative h-20 w-20 rounded-md border overflow-hidden bg-muted shrink-0">
                        {(item.product.imageUrl || item.product.image) ? (
                          <Image
                            src={item.product.imageUrl || item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">${item.product.price.toFixed(2)}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDecrease(item)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleIncrease(item)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemove(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-sm font-semibold">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  <Button className="w-full mt-3" asChild>
                    <Link href="/checkout">Proceed to Checkout</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

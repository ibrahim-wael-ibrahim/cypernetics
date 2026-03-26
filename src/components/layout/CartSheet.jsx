'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  clearApiCart,
  fetchApiCart,
  removeApiCartItem,
  updateApiCartItem,
} from '@/lib/cart-client';

export default function CartSheet({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const { isAuthenticated, hasHydrated: hasAuthHydrated } = useAuthStore();
  const { items, updateQuantity, removeItem, getTotal, clearCart } =
    useCartStore();

  const { data: apiCartData, isLoading: isApiLoading } = useQuery({
    queryKey: ['api-cart'],
    queryFn: fetchApiCart,
    enabled: hasAuthHydrated && isAuthenticated,
  });

  const isUserAuthenticated = hasAuthHydrated && isAuthenticated;

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
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to clear cart');
    },
  });

  const activeItems = isUserAuthenticated ? (apiCartData?.items || []) : items;
  const total = isUserAuthenticated ? (apiCartData?.subtotal || 0) : getTotal();

  const handleQuantityDecrease = (item) => {
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

  const handleQuantityIncrease = (item) => {
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
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart
          </SheetTitle>
          <SheetDescription>
            {activeItems.length === 0
              ? 'Your cart is empty'
              : `${activeItems.length} item${activeItems.length > 1 ? 's' : ''} in your cart`}
          </SheetDescription>
        </SheetHeader>

        {!hasAuthHydrated ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Loading cart...</p>
          </div>
        ) : isUserAuthenticated && isApiLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Loading cart...</p>
          </div>
        ) : activeItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <Button asChild onClick={() => onOpenChange(false)}>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4 px-4">
                {activeItems.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    {/* Product Image */}
                    <div className="h-20 w-20 rounded-md border overflow-hidden bg-muted shrink-0">
                      {(item.product.imageUrl || item.product.image) ? (
                        <Image
                          src={item.product.imageUrl || item.product.image}
                          alt={item.product.name}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-muted">
                          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 ">
                      <Link
                        href={`/products/${item.product.slug || item.productId}`}
                        className="font-medium text-sm hover:underline line-clamp-2"
                        onClick={() => onOpenChange(false)}
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        ${item.product.price.toFixed(2)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityDecrease(item)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityIncrease(item)}
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

                    {/* Item Total */}
                    <div className="text-sm font-medium">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4">
              <Separator />

              {/* Cart Summary */}
              <div className="space-y-2 px-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <SheetFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  asChild
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onOpenChange(false)}
                    asChild
                  >
                    <Link href="/cart">View Cart</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={handleClear}
                  >
                    Clear
                  </Button>
                </div>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
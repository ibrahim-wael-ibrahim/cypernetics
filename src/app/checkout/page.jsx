'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Package, Minus, Plus, Trash2, CreditCard, Truck } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { Skeleton } from '@/components/ui/skeleton';

// Form validation schema
const shippingSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').regex(/^[\d\s\-+()]+$/, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email address'),
});

// Fetch cart from API
async function fetchCart() {
  const token = localStorage.getItem('token');
  if (!token) {
    return { id: null, items: [], itemCount: 0, subtotal: 0 };
  }

  const response = await fetch('/api/cart', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cart');
  }

  const data = await response.json();
  return data.data;
}

// Update cart item quantity
async function updateCartItemQuantity(itemId, quantity) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`/api/cart/items/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ quantity }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update quantity');
  }
}

// Remove cart item
async function removeCartItem(itemId) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`/api/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove item');
  }
}

// Create order
async function createOrder(data) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create order');
  }

  const result = await response.json();
  return result.data;
}

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const { clearCart } = useCartStore();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch cart data
  const { data: cartData, isLoading: isCartLoading, error: cartError } = useQuery({
    queryKey: ['checkout-cart'],
    queryFn: fetchCart,
    enabled: isAuthenticated,
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }) => updateCartItemQuantity(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkout-cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: (itemId) => removeCartItem(itemId),
    onSuccess: () => {
      toast.success('Item removed from cart');
      queryClient.invalidateQueries({ queryKey: ['checkout-cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      toast.success('Order placed successfully!');
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['checkout-cart'] });
      queryClient.invalidateQueries({ queryKey: ['api-cart'] });
      queryClient.invalidateQueries({ queryKey: ['navbar-api-cart'] });
      setIsRedirecting(true);
      router.push(`/thanks?orderId=${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Shipping form
  const form = useForm({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fullName: user?.name || '',
      address: '',
      city: '',
      phone: '',
      email: user?.email || '',
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.setValue('fullName', user.name || '');
      form.setValue('email', user.email || '');
    }
  }, [user, form]);

  // Handle quantity change
  const handleQuantityChange = (itemId, currentQuantity, delta) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity < 1) {
      removeItemMutation.mutate(itemId);
    } else {
      updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
    }
  };

  // Handle form submission
  const onSubmit = (data) => {
    if (!cartData?.items || cartData.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    createOrderMutation.mutate({
      items: cartData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      shipping: {
        address: data.address,
        city: data.city,
        phone: data.phone,
      },
    });
  };

  // Calculate totals
  const subtotal = cartData?.subtotal || 0;
  const shippingCost = 0; // Free shipping
  const total = subtotal + shippingCost;

  // Show loading state
  if (!isAuthenticated || isRedirecting) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">Complete your order</p>
        </div>

        {cartError ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              Failed to load cart. Please try again.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary - Left/Top on mobile */}
          <div className="lg:col-span-1 order-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Summary
                </CardTitle>
                <CardDescription>
                  {cartData?.itemCount || 0} item(s) in your cart
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCartLoading ? (
                  // Loading skeleton
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="h-16 w-16 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !cartData?.items || cartData.items.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Your cart is empty</p>
                    <Button asChild>
                      <Link href="/">Browse Products</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {cartData.items.map((item) => (
                      <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                        {/* Product Image */}
                        <div className="h-16 w-16 rounded border overflow-hidden bg-muted shrink-0">
                          {item.product.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/#products`}
                            className="font-medium text-sm hover:text-emerald-600 line-clamp-1"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            ${item.product.price.toFixed(2)} each
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                              disabled={updateQuantityMutation.isPending}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                              disabled={updateQuantityMutation.isPending || item.quantity >= item.product.stockQuantity}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
                              onClick={() => removeItemMutation.mutate(item.id)}
                              disabled={removeItemMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Item Subtotal */}
                        <div className="text-right">
                          <p className="font-medium text-sm">
                            ${item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals */}
                {cartData?.items && cartData.items.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-emerald-600">Free</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Shipping & Payment Form - Right/Bottom on mobile */}
          <div className="lg:col-span-2 order-2">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Shipping Information
                    </CardTitle>
                    <CardDescription>
                      Enter your delivery address
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Controller
                        name="fullName"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Full Name</FieldLabel>
                              <Input
                                placeholder="John Doe"
                                disabled={createOrderMutation.isPending}
                                {...field}
                              />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />

                      <Controller
                        name="email"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Email</FieldLabel>
                              <Input
                                type="email"
                                placeholder="john@example.com"
                                disabled={createOrderMutation.isPending}
                                {...field}
                              />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </div>

                    <Controller
                      name="address"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Street Address</FieldLabel>
                            <Input
                              placeholder="123 Main Street, Apt 4B"
                              disabled={createOrderMutation.isPending}
                              {...field}
                            />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <Controller
                        name="city"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>City</FieldLabel>
                              <Input
                                placeholder="New York"
                                disabled={createOrderMutation.isPending}
                                {...field}
                              />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />

                      <Controller
                        name="phone"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Phone Number</FieldLabel>
                              <Input
                                placeholder="+1 (555) 123-4567"
                                disabled={createOrderMutation.isPending}
                                {...field}
                              />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </div>
                    </FieldGroup>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Method
                    </CardTitle>
                    <CardDescription>
                      Choose how you want to pay
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup defaultValue="cod" className="space-y-3">
                      <div className="flex items-center space-x-3 p-4 border rounded-lg bg-background">
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Cash on Delivery</p>
                              <p className="text-sm text-muted-foreground">
                                Pay when you receive your order
                              </p>
                            </div>
                            <Badge variant="secondary">Recommended</Badge>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                    
                    <p className="text-sm text-muted-foreground mt-4">
                      Payment will be collected upon delivery. Our delivery partner will contact you when your order arrives.
                    </p>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={
                        createOrderMutation.isPending ||
                        isCartLoading ||
                        !cartData?.items ||
                        cartData.items.length === 0
                      }
                    >
                      {createOrderMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        `Place Order - $${total.toFixed(2)}`
                      )}
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center">
                      By placing this order, you agree to our{' '}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </p>
                  </CardFooter>
                </Card>
              </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

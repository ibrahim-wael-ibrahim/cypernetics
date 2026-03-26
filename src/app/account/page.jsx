'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, User, MapPin, Clock } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const STATUS_VARIANTS = {
  pending: 'secondary',
  processing: 'default',
  shipped: 'default',
  delivered: 'default',
  cancelled: 'destructive',
};

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated: hasAuthHydrated } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasAuthHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role === 'admin') {
      router.push('/admin');
      return;
    }

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load order history');
        }

        setOrders(result.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load order history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [hasAuthHydrated, isAuthenticated, router, user?.role]);

  if (!hasAuthHydrated) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Navbar />
        <main className="flex-1 px-4 py-8">
          <div className="container mx-auto max-w-4xl">
            <Skeleton className="h-40 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusVariant = (status) => STATUS_VARIANTS[status] || 'outline';

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <User className="h-5 w-5" />
                Account
              </CardTitle>
              <CardDescription>Your account details and order history.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user?.name || 'Customer'}</p>
              <p className="text-sm text-muted-foreground pt-2">Email</p>
              <p className="font-medium">{user?.email}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Package className="h-5 w-5" />
                Order History
              </CardTitle>
              <CardDescription>All orders you have placed.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="rounded-lg border bg-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-foreground">Order #{order.id.slice(0, 8)}...</p>
                        <Badge variant={statusVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(order.createdAt)}
                        </span>
                        <span>{order.items.length} items</span>
                      </div>

                      <Separator className="my-3" />

                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-foreground">
                              {item.product?.name || 'Product'} x {item.quantity}
                            </span>
                            <span className="text-muted-foreground">
                              ${(item.unitPrice * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.shipping ? (
                        <div className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                          <p className="mb-1 flex items-center gap-1 font-medium text-foreground">
                            <MapPin className="h-4 w-4" />
                            Shipping
                          </p>
                          <p>{order.shipping.address}</p>
                          <p>{order.shipping.city}</p>
                          <p>{order.shipping.phone}</p>
                        </div>
                      ) : null}

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/orders/${order.id}`}>View Order</Link>
                        </Button>

                        <p className="text-base font-semibold text-foreground">
                          Total: ${order.totalCost.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

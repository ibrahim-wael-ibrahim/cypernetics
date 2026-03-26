'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Loader2, MapPin, Package, Phone, ReceiptText } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/auth-store';

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function getStatusVariant(status) {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'delivered') return 'default';
  if (normalized === 'shipped' || normalized === 'processing') return 'secondary';
  if (normalized === 'cancelled') return 'destructive';

  return 'outline';
}

async function fetchOrder(orderId) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Please login to view this order');
  }

  const response = await fetch(`/api/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to fetch order details');
  }

  return payload.data;
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, hasHydrated: hasAuthHydrated } = useAuthStore();
  const orderId = useMemo(() => params?.id, [params]);

  useEffect(() => {
    if (!hasAuthHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [hasAuthHydrated, isAuthenticated, router]);

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['order-details', orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: Boolean(hasAuthHydrated && isAuthenticated && orderId),
  });

  const orderSubtotal = useMemo(
    () =>
      (order?.items || []).reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      ),
    [order]
  );

  if (!hasAuthHydrated || !isAuthenticated || !orderId) {
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
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Button variant="outline" asChild>
            <Link href="/account" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Account
            </Link>
          </Button>

          {order ? (
            <Badge variant={getStatusVariant(order.status)} className="capitalize">
              {order.status}
            </Badge>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : null}

        {isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {error?.message || 'Could not load this order.'}
            </AlertDescription>
          </Alert>
        ) : null}

        {order ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ReceiptText className="h-5 w-5" />
                  Order Details
                </CardTitle>
                <CardDescription>
                  Order ID: {order.id}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Placed on</p>
                  <p className="font-medium inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold text-lg">{formatPrice(order.totalCost)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{order.user?.name || order.user?.email}</p>
                <p className="text-muted-foreground">{order.shipping?.address}</p>
                <p className="text-muted-foreground">{order.shipping?.city}</p>
                <p className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {order.shipping?.phone}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Items ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatPrice(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                    <Separator />
                  </div>
                ))}

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(orderSubtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>Free</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(order.totalCost)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

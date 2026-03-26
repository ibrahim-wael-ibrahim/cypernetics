'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

const REDIRECT_SECONDS = 5;

export default function ThanksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  const orderId = useMemo(() => searchParams.get('orderId'), [searchParams]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const redirectTimer = setTimeout(() => {
      router.push('/');
    }, REDIRECT_SECONDS * 1000);

    return () => {
      clearInterval(countdown);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 flex items-center justify-center">
        <div className="w-full max-w-xl bg-card border rounded-xl p-8 text-center space-y-5">
          <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-600" />
          <h1 className="text-3xl font-bold">Thanks for your order!</h1>
          <p className="text-muted-foreground">
            Your order has been placed successfully.
            {orderId ? ` Order ID: ${orderId}` : ''}
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to home in {secondsLeft} second{secondsLeft === 1 ? '' : 's'}...
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/">Go Home Now</Link>
            </Button>
            {orderId ? (
              <Button asChild>
                <Link href={`/orders/${orderId}`}>View Order</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

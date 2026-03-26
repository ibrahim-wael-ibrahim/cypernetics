import Link from 'next/link';
import { Package, ShoppingCart, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const adminCards = [
  {
    title: 'Products',
    description: 'Create, edit, and manage your inventory.',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Orders',
    description: 'Review and update customer orders.',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Choose a section to manage your store.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {adminCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.href} className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  {item.title}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={item.href} className="inline-flex items-center gap-2">
                    Open {item.title}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

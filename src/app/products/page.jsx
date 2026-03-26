'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

async function fetchProducts(category) {
  const params = new URLSearchParams({ limit: '100' });

  if (category) {
    params.set('category', category);
  }

  const response = await fetch(`/api/products?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', 'all-page', selectedCategory],
    queryFn: () => fetchProducts(selectedCategory),
  });

  const products = data?.data || [];

  const categories = useMemo(() => {
    const all = (data?.data || [])
      .map((product) => product.category)
      .filter(Boolean);

    return [...new Set(all)].sort((a, b) => a.localeCompare(b));
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">All Products</h1>
          <p className="text-muted-foreground">Browse all products and filter by category.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('')}
          >
            All
          </Button>

          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3 rounded-xl border bg-card p-4">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="text-destructive">Failed to load products.</p>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground">No products found for this category.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import  Navbar  from '@/components/layout/Navbar';
import  Footer  from '@/components/layout/Footer';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { addApiCartItem } from '@/lib/cart-client';
import {
  Minus,
  Plus,
  ShoppingBag,
  CreditCard,
  Package,
  ArrowLeft,
  Truck,
  Shield,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// Fetch single product
async function fetchProduct(id) {
  const response = await fetch(`/api/products/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch product');
  }
  const data = await response.json();
  return data.data;
}

// Fetch related products
async function fetchRelatedProducts(category, excludeId) {
  if (!category) return [];
  const response = await fetch(
    `/api/products?category=${encodeURIComponent(category)}&limit=4`
  );
  if (!response.ok) return [];
  const data = await response.json();
  return data.data.filter((p) => p.id !== excludeId).slice(0, 4);
}

// Skeleton
function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
        <Skeleton className="w-full h-full" />
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Separator />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Separator />
        <div className="space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

// Not found
function ProductNotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
      <p className="text-muted-foreground mb-6">
        The product you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Button
        onClick={() => router.push('/')}
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = params.id;

  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
    enabled: !!productId,
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['products', 'related', product?.category, productId],
    queryFn: () =>
      fetchRelatedProducts(product?.category || null, productId),
    enabled: !!product?.category,
  });

  const isInStock = product ? product.stockQuantity > 0 : false;
  const maxQuantity = product ? product.stockQuantity : 0;

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAdding(true);

    try {
      if (isAuthenticated) {
        await addApiCartItem(product.id, quantity);
        queryClient.invalidateQueries({ queryKey: ['api-cart'] });
        queryClient.invalidateQueries({ queryKey: ['navbar-api-cart'] });
        queryClient.invalidateQueries({ queryKey: ['checkout-cart'] });
      } else {
        const cartProduct = {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.imageUrl || '',
        };

        addItem(cartProduct, quantity);
      }

      toast.success('Added to cart', {
        description: `${quantity} × ${product.name} has been added to your cart.`,
      });

      return true;
    } catch (error) {
      toast.error(error.message || 'Failed to add item to cart');
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      toast.error('Login required', {
        description: 'Please login to proceed to checkout.',
      });
      router.push('/login');
      return;
    }

    const isAdded = await handleAddToCart();
    if (isAdded) {
      router.push('/checkout');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            className="mb-6 -ml-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {isLoading && <ProductDetailSkeleton />}
          {error && <ProductNotFound />}

          {product && !isLoading && !error && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                
                {/* IMAGE */}
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-muted to-muted/50">
                      <Package className="h-32 w-32 text-muted-foreground/30" />
                    </div>
                  )}

                  {!isInStock && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                  )}
                </div>

                {/* INFO */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {product.category && (
                      <Badge variant="secondary">{product.category}</Badge>
                    )}
                    <Badge variant={isInStock ? 'default' : 'destructive'}>
                      {isInStock ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                  </div>

                  <h1 className="text-3xl font-bold mb-4">
                    {product.name}
                  </h1>

                  <p className="text-2xl font-bold text-emerald-600 mb-6">
                    {formatPrice(product.price)}
                  </p>

                  {product.description && (
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground mb-6">
                    Quantity in stock: <span className="font-medium text-foreground">{product.stockQuantity}</span>
                  </p>

                  <div className="mb-6">
                    <p className="text-sm font-medium mb-2">Quantity</p>
                    <div className="inline-flex items-center rounded-md border">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={!isInStock || quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="min-w-12 text-center text-sm font-medium">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQuantityChange(1)}
                        disabled={!isInStock || quantity >= maxQuantity}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleAddToCart} disabled={!isInStock || isAdding}>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      {isAdding ? 'Adding...' : 'Add to Cart'}
                    </Button>

                    <Button variant="outline" onClick={handleBuyNow} disabled={!isInStock || isAdding}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>

              {/* RELATED */}
              {relatedProducts.length > 0 && (
                <section className="mt-16">
                  <h2 className="text-xl font-bold mb-6">
                    Related Products
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {relatedProducts.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
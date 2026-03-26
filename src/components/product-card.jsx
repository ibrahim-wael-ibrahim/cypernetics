"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cart-store";
import { useAuthStore } from "@/stores/auth-store";
import { addApiCartItem } from "@/lib/cart-client";
import { ShoppingBag, Package , Eye } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
export function ProductCard({ product }) {
  const queryClient = useQueryClient();
  const { addItem } = useCartStore();
  const { isAuthenticated, hasHydrated: hasAuthHydrated } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!hasAuthHydrated) {
      return;
    }

    setIsAdding(true);

    try {
      if (isAuthenticated) {
        await addApiCartItem(product.id, 1);
        queryClient.invalidateQueries({ queryKey: ['api-cart'] });
        queryClient.invalidateQueries({ queryKey: ['navbar-api-cart'] });
        queryClient.invalidateQueries({ queryKey: ['checkout-cart'] });
      } else {
        const cartProduct = {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.imageUrl || "",
        };
        addItem(cartProduct);
      }

      toast.success('Added to cart', {
        description: `${product.name} has been added to your cart.`,
      });
    } catch (error) {
      toast.error(error.message || 'Failed to add item to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const isInStock = product.stockQuantity > 0;
  return (
    <Card className="group overflow-hidden h-full flex flex-col transition-all hover:shadow-lg p-0">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform  group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-muted to-muted/50">
            <Package className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}

        {/* Category Badge */}
        {product.category && (
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm"
          >
            {product.category}
          </Badge>
        )}

        {/* Stock Badge */}
        {!isInStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>

      {/* Product Info */}
      <CardContent className="flex flex-col flex-1 p-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg line-clamp-1 mb-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-auto space-y-3">
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-cyan-600">
              ${product.price.toFixed(2)}
            </span>
            {isInStock && product.stockQuantity <= 5 && (
              <span className="text-xs text-amber-600">
                Only {product.stockQuantity} left
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <div className="flex flex-row  justify-between items-center  gap-2">
            <Button
              className=" bg-cyan-600 hover:bg-cyan-700 flex-1"
              onClick={handleAddToCart}
              disabled={!isInStock || isAdding || !hasAuthHydrated}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              {isAdding
                ? "Adding..."
                : isInStock
                  ? "Add to Cart"
                  : "Out of Stock"}
            </Button>

            <Button variant="outline" asChild>
              <Link
                href={`/product/${product.id}`}
                className="flex items-center justify-center "
              >
                View Details <Eye className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

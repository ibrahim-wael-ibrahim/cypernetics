"use client";

import Link from "next/link";
import { ShoppingCart, User, Menu, X, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import CartSheet from "./CartSheet";
import { fetchApiCart, syncLocalItemsToApi } from "@/lib/cart-client";
import { toast } from "sonner";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const hasSyncedOnLoginRef = useRef(false);
  const queryClient = useQueryClient();

  const { user, isAuthenticated, logout, hasHydrated: hasAuthHydrated } = useAuthStore();
  const accountHref = user?.role === 'admin' ? '/admin' : '/account';
  const localItemCount = useCartStore((state) => state.getItemCount());
  const localItems = useCartStore((state) => state.items);
  const setLocalItems = useCartStore((state) => state.setItems);
  const hasHydrated = useCartStore((state) => state.hasHydrated);

  const { data: apiCartData } = useQuery({
    queryKey: ['navbar-api-cart'],
    queryFn: fetchApiCart,
    enabled: hasAuthHydrated && isAuthenticated,
  });

  const canRenderAuthUI = hasAuthHydrated;

  const itemCount = canRenderAuthUI && isAuthenticated
    ? (apiCartData?.itemCount || 0)
    : localItemCount;

  useEffect(() => {
    let isCancelled = false;

    if (!canRenderAuthUI || !isAuthenticated) {
      hasSyncedOnLoginRef.current = false;
      return;
    }

    const syncCartAfterLogin = async () => {
      if (!hasHydrated || localItems.length === 0 || hasSyncedOnLoginRef.current) {
        return;
      }

      hasSyncedOnLoginRef.current = true;

      const failedItems = await syncLocalItemsToApi(localItems);

      if (isCancelled) {
        return;
      }

      setLocalItems(failedItems);

      queryClient.invalidateQueries({ queryKey: ['api-cart'] });
      queryClient.invalidateQueries({ queryKey: ['navbar-api-cart'] });
      queryClient.invalidateQueries({ queryKey: ['checkout-cart'] });

      if (failedItems.length > 0) {
        toast.warning('Some cart items could not be synced');
      }
    };

    syncCartAfterLogin();

    return () => {
      isCancelled = true;
    };
  }, [canRenderAuthUI, isAuthenticated, hasHydrated, localItems, setLocalItems, queryClient]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-primary bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 border-2 p-2 border-primary"
            >
              <span className="text-xl font-bold uppercase">
                Cyber<span className="text-primary">netic</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            {/* <div className="hidden md:flex items-center gap-6"> */}
            {/* <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">
                Products
              </Link>
              <Link href="/categories" className="text-sm font-medium hover:text-primary transition-colors">
                Categories
              </Link>
            </div> */}

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Cart Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(true)}
                className="relative"
              >
                <ShoppingCart className="h-5 w-5" />
                {hasHydrated && itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>

              {!canRenderAuthUI ? (
                <div className="flex items-center gap-2" />
              ) : isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link href={accountHref}>
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      {user?.name || "Account"}
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Register</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(true)}
                className="relative"
              >
                <ShoppingCart className="h-5 w-5" />
                {hasHydrated && itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col gap-4">
                <Link
                  href="/"
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/products"
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Products
                </Link>
                <Link
                  href="/categories"
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Categories
                </Link>
                <div className="flex flex-col gap-2 pt-4 border-t">
                  {!canRenderAuthUI ? (
                    <div className="w-full" />
                  ) : isAuthenticated ? (
                    <>
                      <Link
                        href={accountHref}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button variant="outline" className="w-full">
                          <User className="h-4 w-4 mr-2" />
                          {user?.name || "Account"}
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full">
                          Login
                        </Button>
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button className="w-full">Register</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Cart Sheet */}
      <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import  Navbar  from '@/components/layout/Navbar';
import  Footer  from '@/components/layout/Footer';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
// import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Shield, 
  Truck, 
  HeartHandshake, 
  Award,
  Sparkles,
  Activity,
  HandMetal,
  Footprints,
  Ear
} from 'lucide-react';
import Image from 'next/image';
// Product type
// (same as before)
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col rounded-xl border shadow-sm overflow-hidden">
          <Skeleton className="aspect-square" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Categories for Cybernetic
const categories = [
  { name: 'Upper Limb', icon: HandMetal, description: 'Advanced robotic arms', count: 12 },
  { name: 'Lower Limb', icon: Footprints, description: 'State-of-the-art robotic legs', count: 18 },
  { name: 'Athletic', icon: Activity, description: 'High-performance robotics', count: 8 },
  { name: 'Accessories', icon: Ear, description: 'Robotic components and add-ons', count: 24 },
];

// Trust indicators
const trustIndicators = [
  { icon: Shield, title: 'Quality Assured', description: 'All products meet industry standards' },
  { icon: Truck, title: 'Fast Shipping', description: 'Delivered worldwide quickly' },
  { icon: HeartHandshake, title: 'Expert Support', description: '24/7 technical assistance' },
  { icon: Award, title: 'Warranty', description: 'Up to 5-year coverage on all devices' },
];

// Fetch products
async function fetchProducts() {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error('Failed to fetch products');

  // Consume the stream and parse JSON
  const data = await res.json();
  return data;
}

export default function Home() {
  const { data, isLoading, error } = useQuery({ queryKey: ['products', 'featured'], queryFn: fetchProducts });
  const products = data?.data || [];
console.log('Fetched products:', products);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative lg:min-h-dvh overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-teal-50 dark:from-cyan-950/20 dark:via-background dark:to-teal-950/20">
          <Image
            src="/images/arm_hero_section.png"
            alt="Cybernetic Robotics"
            width={1200}
            height={200}
            className="object-cover absolute right-0 opacity-20 hidden md:block"
            priority
          />
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-900" />
          <div className="container lg:mx-20 px-4 py-20 lg:py-50 relative ">
            <div className="inline-flex  gap-2 px-4 py-2 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" /> New Cybernetic Models
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Transforming Mobility with <br/><span className="text-cyan-600">Cybernetic Robotics</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl  mb-8">
              Explore our cutting-edge robotic limbs, prosthetics, and smart accessories. 
              Designed for performance, durability, and seamless human integration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 ">
              <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-lg px-8" asChild>
                <Link href="#products">Shop Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#about">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="absolute top-20 left-10 w-64 h-64 bg-cyan-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
        </section>

        {/* Trust Indicators */}
        <section className="border-y bg-muted/30 min-h-40">
          <div className="container mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustIndicators.map((indicator, idx) => (
              <div key={idx} className="flex items-center gap-3 justify-center md:justify-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                  <indicator.icon className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{indicator.title}</h4>
                  <p className="text-xs text-muted-foreground">{indicator.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section id="products" className="py-16 lg:py-24 scroll-mt-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Products</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Premium robotic limbs and accessories for enhanced mobility and performance.
              </p>
            </div>
            {isLoading ? (
              <ProductGridSkeleton />
            ) : error ? (
              <div className="text-center py-12 text-muted-foreground">Unable to load products. Try again later.</div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No products available at the moment.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
            {products.length > 0 && (
              <div className="text-center mt-10">
                <Button variant="outline" size="lg" asChild>
                  <Link href="/products">View All Products <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Categories Section */}
        <section id="categories" className="py-16 lg:py-24 bg-muted/30 scroll-mt-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop by Category</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore Cybernetic robotic solutions for every mobility need.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {categories.map((category, idx) => (
                <div key={idx} className="group relative overflow-hidden rounded-xl bg-card border p-6 hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <category.icon className="h-8 w-8 text-cyan-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                    {/* <Badge variant="secondary">{category.count} products</Badge> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 lg:py-24 scroll-mt-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">About Cybernetic</h2>
              <p className="text-muted-foreground text-lg">
                Advancing lives through intelligent robotics and innovative prosthetic technology.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">Our Mission</h3>
                <p className="text-muted-foreground">
                  Cybernetic delivers cutting-edge robotic limbs and devices to empower mobility 
                  and enhance quality of life.
                </p>
                {/* <Button className="bg-cyan-600 hover:bg-cyan-700" asChild>
                  <Link href="/about">Read Our Story <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button> */}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-center">
                  <div className="text-4xl font-bold text-cyan-600 mb-2">10K+</div>
                  <div className="text-sm text-muted-foreground">Satisfied Customers</div>
                </div>
                <div className="p-6 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-center">
                  <div className="text-4xl font-bold text-teal-600 mb-2">500+</div>
                  <div className="text-sm text-muted-foreground">Robotic Products</div>
                </div>
                <div className="p-6 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-center">
                  <div className="text-4xl font-bold text-cyan-600 mb-2">15+</div>
                  <div className="text-sm text-muted-foreground">Years Experience</div>
                </div>
                <div className="p-6 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-center">
                  <div className="text-4xl font-bold text-cyan-600 mb-2">99%</div>
                  <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        {/* <section className="py-16 bg-gradient-to-r from-cyan-600 to-teal-600 text-white">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay Updated</h2>
            <p className="text-cyan-100 mb-8">
              Subscribe to the Cybernetic newsletter for product updates, new releases, and robotics insights.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 mx-auto max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
              <Button className="bg-white text-cyan-600 hover:bg-cyan-50 px-8">Subscribe</Button>
            </form>
          </div>
        </section> */}


         <section className="relative overflow-hidden  py-12 px-6 sm:px-12 lg:px-24 border-y bg-muted/30">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-48 h-48 bg-teal-500/10 blur-[60px] rounded-full" />

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
        
        {/* LEFT CONTENT */}
        <div className="flex-1 text-left z-10">
          <span className="inline-block py-0.5 px-2.5 mb-4 text-[10px] font-semibold tracking-wider text-cyan-400 uppercase bg-cyan-400/10 rounded-full border border-cyan-400/20">
            Mobile Experience
          </span>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
            Cybernetic in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
              Your Pocket
            </span>
          </h2>

          <p className="text-gray-400 text-sm md:text-base mb-6 max-w-lg leading-relaxed">
            Manage your prosthetics from anywhere. Real-time diagnostics,
            neural-link sync, and performance tuning—directly from your device.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            {/* <Link href="/apk/app-arm64-v8a-release.apk" target="_blank" rel="noopener noreferrer" download>
            <Image
              src="/appstore.png"
              alt="App Store"
              width={140}
              height={40}
              className="h-9 border border-white/10 rounded-md hover:scale-105 transition"
            />
            </Link> */}
            <Link href="/apk/app-arm64-v8a-release.apk" target="_blank" rel="noopener noreferrer" download>
            <Image
              src="/playstore.png"
              alt="Google Play"
              width={120}
              height={40}
            />
            </Link>
          </div>
        </div>

        {/* RIGHT VISUAL */}
        <div className="flex-shrink-0 relative">
          <div className="relative mx-auto w-48 md:w-56">
            
            <div className="relative z-20 border-[6px] border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden aspect-[9/19.5] animate-pulse">
              
              {/* Fake App UI */}
              <div className="bg-[#0f172a] h-full w-full p-4 flex flex-col">
                
                <div className="flex justify-between items-center mb-4">
                  <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center">
                    <div className="w-3 h-0.5 bg-cyan-400"></div>
                  </div>
                  <div className="text-white font-bold text-[8px]">
                    CYBERNETIC
                  </div>
                  <div className="w-4 h-4 rounded-full bg-slate-700"></div>
                </div>

                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="text-[7px] text-gray-400 mb-0.5">
                      Status
                    </div>
                    <div className="text-[8px] text-green-400 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                      Nominal
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="text-[7px] text-gray-400 mb-0.5">
                        Batt
                      </div>
                      <div className="text-[10px] font-bold text-white">
                        84%
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="text-[7px] text-gray-400 mb-0.5">
                        Sync
                      </div>
                      <div className="text-[10px] font-bold text-cyan-400">
                        OK
                      </div>
                    </div>
                  </div>

                  {/* Graph */}
                  <div className="mt-2 h-12 bg-gradient-to-t from-cyan-500/10 to-transparent border-b border-cyan-500/40 rounded-lg flex items-end justify-around pb-1 px-1">
                    <div className="w-1 bg-cyan-500/60 h-6 rounded-t"></div>
                    <div className="w-1 bg-cyan-500/40 h-4 rounded-t"></div>
                    <div className="w-1 bg-cyan-400 h-8 rounded-t"></div>
                    <div className="w-1 bg-cyan-500/30 h-3 rounded-t"></div>
                    <div className="w-1 bg-cyan-500/80 h-10 rounded-t"></div>
                  </div>

                  <div className="mt-3 py-1.5 bg-cyan-500 rounded-md text-white text-center text-[8px] font-bold">
                    Diagnostics
                  </div>
                </div>
              </div>
            </div>

            {/* Glow */}
            <div className="absolute -top-6 -right-6 w-full h-full bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-2xl -z-10"></div>
          </div>
        </div>
      </div>
    </section>


      </main>

      <Footer />
    </div>
  );
}
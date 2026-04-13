"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, Star, Quote, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { ArtisanCard } from "@/components/artisan-card";
import { testimonials } from "@/lib/data";
import { getDynamicArtisans, getDynamicCategories, getDynamicDistricts, getDynamicProducts, } from "@/lib/dynamic-data";
export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [featuredDistricts, setFeaturedDistricts] = useState([]);
    const [featuredArtisans, setFeaturedArtisans] = useState([]);
    const [featuredCategories, setFeaturedCategories] = useState([]);
    const [districtCount, setDistrictCount] = useState(64);
    useEffect(() => {
        let active = true;
        const load = async () => {
            const [products, districts, artisans, categories] = await Promise.all([
                getDynamicProducts(),
                getDynamicDistricts(),
                getDynamicArtisans(),
                getDynamicCategories(),
            ]);
            if (!active)
                return;
            setFeaturedProducts(products.slice(0, 4));
            setFeaturedDistricts(districts.slice(0, 8));
            setFeaturedArtisans(artisans.slice(0, 3));
            setFeaturedCategories(categories.slice(0, 6));
            setDistrictCount(districts.length);
        };
        load().catch(() => {
            if (!active)
                return;
            setFeaturedProducts([]);
            setFeaturedDistricts([]);
            setFeaturedArtisans([]);
            setFeaturedCategories([]);
            setDistrictCount(0);
        });
        return () => {
            active = false;
        };
    }, []);
    return (<div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image src="/images/hero-banner.jpg" alt="Bangladeshi handicrafts" fill className="object-cover opacity-30" priority/>
            <div className="absolute inset-0 bg-linear-to-b from-background via-background/90 to-background"/>
          </div>
          
          <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4"/>
                {districtCount} Districts, Countless Stories
              </span>
              <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
                Discover the Heritage of Bangladesh
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
                Explore authentic handmade crafts from talented artisans across all 64 districts. 
                Each piece tells a story of tradition, skill, and cultural pride.
              </p>
              
              <form action="/products" method="GET" className="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-full border border-border bg-card p-2 shadow-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"/>
                  <Input type="search" name="search" placeholder="Search products, districts, or crafts..." className="border-0 bg-transparent pl-12 focus-visible:ring-0"/>
                </div>
                <Button type="submit" className="rounded-full">
                  Search
                </Button>
              </form>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" className="gap-2 rounded-full" asChild>
                  <Link href="/products">
                    Explore Products
                    <ArrowRight className="h-4 w-4"/>
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full" asChild>
                  <Link href="/districts">
                    Browse Districts
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
                  Explore by District
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Discover unique crafts from different regions of Bangladesh
                </p>
              </div>
              <Button variant="outline" className="gap-2" asChild>
                <Link href="/districts">
                  View All Districts
                  <ArrowRight className="h-4 w-4"/>
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredDistricts.map((district) => (<Link key={district.id} href={`/districts/${district.id}`} className="group relative overflow-hidden rounded-lg">
                  <div className="relative aspect-4/3 overflow-hidden">
                    <Image src={district.image} alt={district.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent"/>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="font-serif text-xl font-bold text-foreground">
                      {district.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {district.productCount} products
                    </p>
                  </div>
                </Link>))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
                  Featured Products
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Handpicked treasures from our artisan collections
                </p>
              </div>
              <Button variant="outline" className="gap-2" asChild>
                <Link href="/products">
                  View All Products
                  <ArrowRight className="h-4 w-4"/>
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (<ProductCard key={product.id} product={product}/>))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/50 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
                Shop by Craft Type
              </h2>
              <p className="mt-2 text-muted-foreground">
                Explore our curated collection of traditional Bangladeshi crafts
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCategories.map((category) => (<Link key={category.id} href={`/categories/${category.id}`} className="group relative overflow-hidden rounded-lg bg-card">
                  <div className="relative aspect-video overflow-hidden">
                    <Image src={category.image} alt={category.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent"/>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="font-serif text-2xl font-bold text-foreground">
                      {category.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                    <p className="mt-3 text-sm font-medium text-primary">
                      {category.productCount} products
                    </p>
                  </div>
                </Link>))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
                  Meet Our Artisans
                </h2>
                <p className="mt-2 text-muted-foreground">
                  The skilled hands behind every masterpiece
                </p>
              </div>
              <Button variant="outline" className="gap-2" asChild>
                <Link href="/artisans">
                  View All Artisans
                  <ArrowRight className="h-4 w-4"/>
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredArtisans.map((artisan) => (<ArtisanCard key={artisan.id} artisan={artisan}/>))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-border py-16 lg:py-24">
          <div className="absolute inset-0 -z-10">
            <Image src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80" alt="Cultural heritage" fill className="object-cover opacity-10"/>
          </div>
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <span className="text-sm font-medium uppercase tracking-wider text-primary">
                  Our Heritage
                </span>
                <h2 className="mt-2 font-serif text-3xl font-bold text-foreground lg:text-4xl">
                  Preserving Centuries of Artistry
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                  For generations, the artisans of Bangladesh have woven stories into fabric, 
                  shaped beauty from clay, and crafted masterpieces from bamboo. Each product 
                  in our collection carries the weight of tradition and the warmth of human hands.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  When you purchase from Bangladesh Heritage, you're not just buying a productâ€”
                  you're supporting families, preserving ancient crafts, and becoming part of 
                  a story that spans centuries.
                </p>
                <Button size="lg" className="mt-8 gap-2" asChild>
                  <Link href="/about">
                    Learn Our Story
                    <ArrowRight className="h-4 w-4"/>
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-lg">
                    <Image src="/images/products/jamdani-saree.jpg" alt="Traditional weaving" width={300} height={400} className="h-64 w-full object-cover"/>
                  </div>
                  <div className="overflow-hidden rounded-lg">
                    <Image src="/images/products/terracotta-pottery.jpg" alt="Pottery making" width={300} height={200} className="h-40 w-full object-cover"/>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="overflow-hidden rounded-lg">
                    <Image src="/images/products/bamboo-basket.jpg" alt="Bamboo crafts" width={300} height={200} className="h-40 w-full object-cover"/>
                  </div>
                  <div className="overflow-hidden rounded-lg">
                    <Image src="/images/products/nakshi-kantha.jpg" alt="Textile patterns" width={300} height={400} className="h-64 w-full object-cover"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
                What Our Customers Say
              </h2>
              <p className="mt-2 text-muted-foreground">
                Stories from our global community of heritage lovers
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {testimonials.map((testimonial) => (<div key={testimonial.id} className="rounded-lg border border-border bg-card p-6">
                  <Quote className="h-8 w-8 text-primary/20"/>
                  <div className="mt-4 flex items-center gap-0.5">
                    {new Array(5).fill(null).map((_, i) => (<Star key={`home-star-${i}`} className={`h-4 w-4 ${i < testimonial.rating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-muted text-muted"}`}/>))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    "{testimonial.text}"
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <Image src={testimonial.avatar} alt={testimonial.name} width={40} height={40} className="rounded-full object-cover"/>
                    <div>
                      <p className="font-medium text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                </div>))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>);
}

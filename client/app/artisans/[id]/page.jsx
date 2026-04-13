"use client";
import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Award, Package, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import {} from "@/lib/data";
import { getDynamicArtisanById, getDynamicProductsByArtisan, } from "@/lib/dynamic-data";
export default function ArtisanDetailPage({ params, }) {
    const { id } = use(params);
    const [artisan, setArtisan] = useState(null);
    const [artisanProducts, setArtisanProducts] = useState([]);
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => {
        let active = true;
        const load = async () => {
            const foundArtisan = (await getDynamicArtisanById(id)) ?? null;
            if (!active)
                return;
            setArtisan(foundArtisan);
            if (!foundArtisan) {
                setArtisanProducts([]);
                setHydrated(true);
                return;
            }
            const products = await getDynamicProductsByArtisan(id);
            if (!active)
                return;
            setArtisanProducts(products);
            setHydrated(true);
        };
        load().catch(() => {
            if (!active)
                return;
            setArtisan(null);
            setArtisanProducts([]);
            setHydrated(true);
        });
        return () => {
            active = false;
        };
    }, [id]);
    if (!hydrated) {
        return null;
    }
    if (!artisan) {
        return (<div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
            <h1 className="font-serif text-3xl font-bold text-foreground">Artisan Not Found</h1>
            <p className="mt-3 text-muted-foreground">
              The artisan profile you requested is not available.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/artisans">Back to Artisans</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>);
    }
    return (<div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link href="/artisans">
                <ArrowLeft className="h-4 w-4"/>
                Back to Artisans
              </Link>
            </Button>
          </div>
        </div>

        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 -z-10">
            <Image src={artisan.image} alt={artisan.name} fill className="object-cover opacity-10 blur-sm"/>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/70"/>
          </div>
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
            <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg lg:aspect-auto lg:h-96">
                <Image src={artisan.image} alt={artisan.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 33vw"/>
              </div>

              <div className="lg:col-span-2">
                <Badge className="bg-primary text-primary-foreground">
                  {artisan.specialty}
                </Badge>
                <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
                  {artisan.name}
                </h1>
                
                <div className="mt-4 flex flex-wrap items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-5 w-5"/>
                    {artisan.district}
                  </span>
                  <span className="flex items-center gap-2">
                    <Award className="h-5 w-5"/>
                    {artisan.yearsOfExperience}+ years of experience
                  </span>
                  <span className="flex items-center gap-2">
                    <Package className="h-5 w-5"/>
                    {artisanProducts.length} products
                  </span>
                </div>

                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                  {artisan.bio}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center gap-3">
                <Quote className="h-10 w-10 text-primary/30"/>
                <h2 className="font-serif text-3xl font-bold text-foreground">The Story</h2>
              </div>
              <div className="mt-8">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {artisan.story}
                </p>
              </div>
            </div>
          </div>
        </section>

        {artisanProducts.length > 0 && (<section className="border-t border-border bg-card py-16 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
              <h2 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
                Products by {artisan.name}
              </h2>
              <p className="mt-2 text-muted-foreground">
                Each piece is handcrafted with care and tradition
              </p>

              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {artisanProducts.map((product) => (<ProductCard key={product.id} product={product}/>))}
              </div>
            </div>
          </section>)}
      </main>

      <Footer />
    </div>);
}

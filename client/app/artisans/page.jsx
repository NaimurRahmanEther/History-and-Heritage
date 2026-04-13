"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Users, Heart } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ArtisanCard } from "@/components/artisan-card";
import {} from "@/lib/data";
import { getDynamicArtisans, getDynamicDistricts, getDynamicProducts } from "@/lib/dynamic-data";
export default function ArtisansPage() {
    const [artisans, setArtisans] = useState([]);
    const [districtCount, setDistrictCount] = useState(0);
    const [productCount, setProductCount] = useState(0);
    useEffect(() => {
        let active = true;
        const load = async () => {
            const [dynamicArtisans, districts, products] = await Promise.all([
                getDynamicArtisans(),
                getDynamicDistricts(),
                getDynamicProducts(),
            ]);
            if (!active)
                return;
            setArtisans(dynamicArtisans);
            setDistrictCount(districts.length);
            setProductCount(products.length);
        };
        load().catch(() => {
            if (!active)
                return;
            setArtisans([]);
            setDistrictCount(0);
            setProductCount(0);
        });
        return () => {
            active = false;
        };
    }, []);
    const representedDistricts = useMemo(() => {
        return new Set(artisans.map((artisan) => artisan.districtId)).size;
    }, [artisans]);
    return (<div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-border bg-card py-16 lg:py-24">
          <div className="absolute inset-0 -z-10">
            <Image src="https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=1920&q=80" alt="Artisan at work" fill className="object-cover opacity-10"/>
          </div>
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Heart className="h-4 w-4"/>
                The Heart of Our Heritage
              </span>
              <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-foreground lg:text-5xl text-balance">
                Meet Our Artisans
              </h1>
              <p className="mt-4 text-lg text-muted-foreground text-pretty">
                Behind every handcrafted piece is a story of dedication, tradition, and artistry.
                Get to know the talented hands that keep Bangladesh&apos;s craft heritage alive.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-primary/5 py-12">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-8 text-center sm:grid-cols-3">
              <div>
                <p className="font-serif text-4xl font-bold text-primary">{artisans.length}+</p>
                <p className="mt-1 text-muted-foreground">Skilled Artisans</p>
              </div>
              <div>
                <p className="font-serif text-4xl font-bold text-primary">
                  {representedDistricts || districtCount}
                </p>
                <p className="mt-1 text-muted-foreground">Districts Represented</p>
              </div>
              <div>
                <p className="font-serif text-4xl font-bold text-primary">{productCount}+</p>
                <p className="mt-1 text-muted-foreground">Products in Catalog</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <h2 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
              Featured Artisans
            </h2>
            <p className="mt-2 text-muted-foreground">
              Stories of skill, passion, and cultural preservation
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {artisans.map((artisan) => (<ArtisanCard key={artisan.id} artisan={artisan}/>))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Users className="mx-auto h-12 w-12 text-primary"/>
              <h2 className="mt-6 font-serif text-3xl font-bold text-foreground">
                Are You an Artisan?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Join our community of craftspeople and share your art with the world.
                We provide fair trade opportunities and help preserve traditional crafts.
              </p>
              <a href="mailto:artisans@bdheritage.com" className="mt-6 inline-block rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>);
}

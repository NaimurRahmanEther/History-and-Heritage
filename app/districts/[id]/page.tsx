"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { type District, type Product } from "@/lib/data";
import {
  getDynamicDistrictById,
  getDynamicProductsByDistrict,
} from "@/lib/dynamic-data";

export default function DistrictPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [district, setDistrict] = useState<District | null>(null);
  const [districtProducts, setDistrictProducts] = useState<Product[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const foundDistrict = getDynamicDistrictById(id) ?? null;
    setDistrict(foundDistrict);
    setDistrictProducts(foundDistrict ? getDynamicProductsByDistrict(id) : []);
    setHydrated(true);
  }, [id]);

  if (!hydrated) return null;

  if (!district) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
            <h1 className="font-serif text-3xl font-bold text-foreground">District Not Found</h1>
            <p className="mt-3 text-muted-foreground">
              The district you requested is not available.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/districts">Back to Districts</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 -z-10">
            <Image
              src={district.image}
              alt={district.name}
              fill
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/60" />
          </div>
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
            <Button variant="ghost" className="mb-6 gap-2" asChild>
              <Link href="/districts">
                <ArrowLeft className="h-4 w-4" />
                Back to Districts
              </Link>
            </Button>
            
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <MapPin className="h-4 w-4" />
              {district.division} Division
            </div>
            <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              {district.name}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              {district.description}
            </p>
            <div className="mt-6">
              <span className="text-lg font-semibold text-foreground">
                {districtProducts.length} products
              </span>
              <span className="ml-2 text-muted-foreground">from local artisans</span>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <h2 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
              Products from {district.name}
            </h2>
            <p className="mt-2 text-muted-foreground">
              Handcrafted with love by artisans of {district.name}
            </p>

            {districtProducts.length > 0 ? (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {districtProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-lg border border-dashed border-border bg-muted/50 p-12 text-center">
                <p className="text-muted-foreground">
                  No products available from {district.name} yet.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/products">Browse All Products</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

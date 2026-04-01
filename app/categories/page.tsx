"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Layers, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { type Category } from "@/lib/data";
import { getDynamicCategories } from "@/lib/dynamic-data";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setCategories(getDynamicCategories());
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-border bg-card py-16 lg:py-24">
          <div className="absolute inset-0 -z-10">
            <Image
              src="https://images.unsplash.com/photo-1601662528567-526cd06f6582?w=1920&q=80"
              alt="Traditional crafts"
              fill
              className="object-cover opacity-10"
            />
          </div>
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Layers className="h-4 w-4" />
                Traditional Craft Types
              </span>
              <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-foreground lg:text-5xl text-balance">
                Explore by Category
              </h1>
              <p className="mt-4 text-lg text-muted-foreground text-pretty">
                Discover the diverse world of Bangladeshi craftsmanship. From intricate
                Jamdani weaving to beautiful terracotta pottery, each category represents
                centuries of artistic tradition.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.id}`}
                  className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="font-serif text-2xl font-bold text-foreground">
                      {category.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">
                        {category.productCount} products
                      </span>
                      <span className="flex items-center gap-1 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                        Explore
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-serif text-3xl font-bold text-foreground">
                Preserving Traditional Crafts
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Each category in our collection represents a unique artistic tradition
                passed down through generations. Supporting these crafts helps preserve
                cultural identity while enabling sustainable livelihoods.
              </p>
              <Button variant="outline" className="mt-8 gap-2" asChild>
                <Link href="/about">
                  Learn More About Our Mission
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

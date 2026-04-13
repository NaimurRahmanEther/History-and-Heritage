"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {} from "@/lib/data";
import { getDynamicDistricts } from "@/lib/dynamic-data";
const divisions = [
    "Dhaka",
    "Chattogram",
    "Rajshahi",
    "Khulna",
    "Sylhet",
    "Rangpur",
    "Mymensingh",
    "Barishal",
];
export default function DistrictsPage() {
    const [districts, setDistricts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    useEffect(() => {
        let active = true;
        getDynamicDistricts()
            .then((data) => {
            if (!active)
                return;
            setDistricts(data);
        })
            .catch(() => {
            if (!active)
                return;
            setDistricts([]);
        });
        return () => {
            active = false;
        };
    }, []);
    const filteredDistricts = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query)
            return districts;
        return districts.filter((district) => district.name.toLowerCase().includes(query) ||
            district.division.toLowerCase().includes(query) ||
            district.description.toLowerCase().includes(query));
    }, [districts, searchQuery]);
    const districtsByDivision = useMemo(() => {
        return divisions.reduce((acc, division) => {
            acc[division] = filteredDistricts.filter((district) => district.division === division);
            return acc;
        }, {});
    }, [filteredDistricts]);
    return (<div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-border bg-card py-16 lg:py-24">
          <div className="absolute inset-0 -z-10">
            <Image src="https://images.unsplash.com/photo-1583422528567-5658d8b10c20?w=1920&q=80" alt="Bangladesh landscape" fill className="object-cover opacity-10"/>
          </div>
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <MapPin className="h-4 w-4"/>
                District Heritage Map
              </span>
              <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-foreground lg:text-5xl text-balance">
                Explore by District
              </h1>
              <p className="mt-4 text-lg text-muted-foreground text-pretty">
                Each district of Bangladesh has its own unique crafting traditions and
                artisan communities. Discover the specialties of each region.
              </p>
              
              <div className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-full border border-border bg-background p-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"/>
                  <Input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search districts..." className="border-0 bg-transparent pl-12 focus-visible:ring-0"/>
                </div>
                <Button className="rounded-full" type="button">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredDistricts.map((district) => (<Link key={district.id} href={`/districts/${district.id}`} className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={district.image} alt={district.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent"/>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">
                        {district.division} Division
                      </span>
                    </div>
                    <h3 className="mt-1 font-serif text-xl font-bold text-foreground">
                      {district.name}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {district.description}
                    </p>
                    <p className="mt-2 text-sm font-medium text-primary">
                      {district.productCount} products
                    </p>
                  </div>
                </Link>))}
            </div>

            <div className="mt-24">
              <h2 className="font-serif text-3xl font-bold text-foreground">
                Browse by Division
              </h2>
              <p className="mt-2 text-muted-foreground">
                Bangladesh is divided into 8 administrative divisions
              </p>
              
              <div className="mt-10 space-y-12">
                {divisions.map((division) => districtsByDivision[division]?.length > 0 && (<div key={division}>
                        <h3 className="font-serif text-xl font-semibold text-foreground">
                          {division} Division
                        </h3>
                        <div className="mt-4 flex flex-wrap gap-3">
                          {districtsByDivision[division].map((district) => (<Link key={district.id} href={`/districts/${district.id}`} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                              {district.name}
                            </Link>))}
                        </div>
                      </div>))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>);
}

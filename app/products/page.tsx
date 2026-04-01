"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { formatPrice, type Category, type District, type Product } from "@/lib/data";
import {
  getDynamicCategories,
  getDynamicDistricts,
  getDynamicProducts,
} from "@/lib/dynamic-data";

const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allDistricts, setAllDistricts] = useState<District[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("popular");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const maxPrice = useMemo(() => {
    if (allProducts.length === 0) {
      return 20000;
    }
    return Math.max(20000, ...allProducts.map((product) => product.price));
  }, [allProducts]);

  useEffect(() => {
    setAllProducts(getDynamicProducts());
    setAllCategories(getDynamicCategories());
    setAllDistricts(getDynamicDistricts());
  }, []);

  useEffect(() => {
    setPriceRange((current) => {
      if (current[1] === maxPrice) {
        return current;
      }
      return [current[0], maxPrice];
    });
  }, [maxPrice]);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.district.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    // District filter
    if (selectedDistricts.length > 0) {
      result = result.filter((p) => selectedDistricts.includes(p.districtId));
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.categoryId));
    }

    // Price filter
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Rating filter
    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    // Sort
    switch (sortBy) {
      case "newest":
        // In a real app, you'd sort by date
        result = result.reverse();
        break;
      case "price-low":
        result = result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result = result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result = result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // Popular - sort by review count
        result = result.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    return result;
  }, [allProducts, searchQuery, selectedDistricts, selectedCategories, priceRange, minRating, sortBy]);

  const toggleDistrict = (districtId: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(districtId)
        ? prev.filter((d) => d !== districtId)
        : [...prev, districtId]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDistricts([]);
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
    setMinRating(0);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
      selectedDistricts.length > 0 ||
      selectedCategories.length > 0 ||
      priceRange[0] > 0 ||
      priceRange[1] < maxPrice ||
      minRating > 0
  );

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Search */}
      <div>
        <Label className="text-sm font-semibold">Search</Label>
        <Input
          type="search"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-2"
        />
      </div>

      {/* Categories */}
      <div>
        <Label className="text-sm font-semibold">Categories</Label>
        <div className="mt-3 space-y-2">
          {allCategories.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <label
                htmlFor={`category-${category.id}`}
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {category.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Districts */}
      <div>
        <Label className="text-sm font-semibold">Districts</Label>
        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
          {allDistricts.map((district) => (
            <div key={district.id} className="flex items-center gap-2">
              <Checkbox
                id={`district-${district.id}`}
                checked={selectedDistricts.includes(district.id)}
                onCheckedChange={() => toggleDistrict(district.id)}
              />
              <label
                htmlFor={`district-${district.id}`}
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {district.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-sm font-semibold">Price Range</Label>
        <div className="mt-4 px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={maxPrice}
            step={500}
            className="w-full"
          />
          <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <Label className="text-sm font-semibold">Minimum Rating</Label>
        <div className="mt-3 space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={minRating === rating}
                onCheckedChange={() => setMinRating(minRating === rating ? 0 : rating)}
              />
              <label
                htmlFor={`rating-${rating}`}
                className="flex items-center gap-1 text-sm text-muted-foreground cursor-pointer"
              >
                {rating}+ stars
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Header */}
        <section className="border-b border-border bg-card py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <h1 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
              All Products
            </h1>
            <p className="mt-2 text-muted-foreground">
              Discover authentic handmade crafts from across Bangladesh
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-8 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex gap-8">
              {/* Desktop Sidebar */}
              <aside className="hidden w-64 shrink-0 lg:block">
                <div className="sticky top-24">
                  <h2 className="font-serif text-lg font-semibold text-foreground">
                    Filters
                  </h2>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                  <div className="flex items-center gap-4">
                    {/* Mobile Filter Button */}
                    <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="gap-2 lg:hidden">
                          <SlidersHorizontal className="h-4 w-4" />
                          Filters
                          {hasActiveFilters && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                              !
                            </span>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-80 overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>Filters</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6">
                          <FilterContent />
                        </div>
                      </SheetContent>
                    </Sheet>

                    <p className="text-sm text-muted-foreground">
                      {filteredProducts.length} products
                    </p>
                  </div>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Active Filters */}
                {hasActiveFilters && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {searchQuery && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1 h-7"
                        onClick={() => setSearchQuery("")}
                      >
                        Search: {searchQuery}
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                    {selectedCategories.map((catId) => {
                      const cat = allCategories.find((c) => c.id === catId);
                      return (
                        <Button
                          key={catId}
                          variant="secondary"
                          size="sm"
                          className="gap-1 h-7"
                          onClick={() => toggleCategory(catId)}
                        >
                          {cat?.name}
                          <X className="h-3 w-3" />
                        </Button>
                      );
                    })}
                    {selectedDistricts.map((distId) => {
                      const dist = allDistricts.find((d) => d.id === distId);
                      return (
                        <Button
                          key={distId}
                          variant="secondary"
                          size="sm"
                          className="gap-1 h-7"
                          onClick={() => toggleDistrict(distId)}
                        >
                          {dist?.name}
                          <X className="h-3 w-3" />
                        </Button>
                      );
                    })}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-primary"
                      onClick={clearFilters}
                    >
                      Clear all
                    </Button>
                  </div>
                )}

                {/* Product Grid */}
                {filteredProducts.length > 0 ? (
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-12 text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                      <SlidersHorizontal className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
                      No products found
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      Try adjusting your filters or search query
                    </p>
                    <Button className="mt-6" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

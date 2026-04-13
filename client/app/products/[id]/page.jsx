"use client";
import { useEffect, use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Minus, Plus, ShoppingCart, Heart, Share2, MapPin, Award, Truck, Shield, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/components/ui/use-toast";
import { formatPrice } from "@/lib/data";
import { cn } from "@/lib/utils";
import { getCatalogProducts } from "@/lib/catalog-products";
import { getDynamicArtisanById } from "@/lib/dynamic-data";
export default function ProductDetailPage({ params }) {
    const { id } = use(params);
    const [catalogProducts, setCatalogProducts] = useState([]);
    const [artisan, setArtisan] = useState(null);
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => {
        let active = true;
        getCatalogProducts()
            .then((items) => {
            if (!active)
                return;
            setCatalogProducts(items);
        })
            .catch(() => {
            if (!active)
                return;
            setCatalogProducts([]);
        })
            .finally(() => {
            if (!active)
                return;
            setHydrated(true);
        });
        return () => {
            active = false;
        };
    }, []);
    const product = catalogProducts.find((item) => item.id === id);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const { addItem } = useCart();
    const { toast } = useToast();
    const getAddToCartLabel = () => {
        if (isAdding)
            return "Adding...";
        if (product?.inStock)
            return "Add to Cart";
        return "Out of Stock";
    };
    if (!product && !hydrated) {
        return (<div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-24 text-center lg:px-8">
          <p className="text-muted-foreground">Loading product...</p>
        </div>
        <Footer />
      </div>);
    }
    if (!product) {
        return (<div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-24 text-center lg:px-8">
          <h1 className="font-serif text-2xl font-bold text-foreground">Product not found</h1>
          <Button className="mt-4" asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
        <Footer />
      </div>);
    }
    useEffect(() => {
        let active = true;
        if (!product?.artisanId) {
            setArtisan(null);
            return () => {
                active = false;
            };
        }
        getDynamicArtisanById(product.artisanId)
            .then((item) => {
            if (!active)
                return;
            setArtisan(item ?? null);
        })
            .catch(() => {
            if (!active)
                return;
            setArtisan(null);
        });
        return () => {
            active = false;
        };
    }, [product?.artisanId]);
    const relatedProducts = catalogProducts
        .filter((item) => item.categoryId === product.categoryId)
        .filter((p) => p.id !== product.id)
        .slice(0, 4);
    return (<div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Breadcrumb */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link href="/products">
                <ArrowLeft className="h-4 w-4"/>
                Back to Products
              </Link>
            </Button>
          </div>
        </div>

        {/* Product Section */}
        <section className="py-8 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  <Image src={product.images[selectedImage]} alt={product.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 50vw"/>
                  {product.originalPrice && (<Badge className="absolute left-4 top-4 bg-primary text-primary-foreground">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                    </Badge>)}
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (<button key={`${product.id}-image-${index}`} onClick={() => setSelectedImage(index)} className={cn("relative h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors", selectedImage === index
                ? "border-primary"
                : "border-transparent hover:border-border")}>
                      <Image src={product.images[index]} alt={`${product.name} ${index + 1}`} fill className="object-cover" sizes="80px"/>
                    </button>))}
                </div>
              </div>

              {/* Product Info */}
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <Link href={`/categories/${product.categoryId}`} className="font-medium text-primary hover:underline">
                    {product.category}
                  </Link>
                  <span className="text-muted-foreground">•</span>
                  <Link href={`/districts/${product.districtId}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <MapPin className="h-3 w-3"/>
                    {product.district}
                  </Link>
                </div>

                <h1 className="mt-3 font-serif text-3xl font-bold text-foreground lg:text-4xl">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {new Array(5).fill(null).map((_, i) => (<Star key={`star-${product.id}-${i}`} className={cn("h-5 w-5", i < Math.floor(product.rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted")}/>))}
                  </div>
                  <span className="font-medium">{product.rating}</span>
                  <span className="text-muted-foreground">
                    ({product.reviewCount} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="mt-6 flex items-baseline gap-3">
                  <span className="font-serif text-4xl font-bold text-foreground">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (<span className="text-xl text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>)}
                </div>

                <p className="mt-6 text-muted-foreground leading-relaxed">
                  {product.description}
                </p>

                <Separator className="my-6"/>

                {/* Quantity & Actions */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Quantity:</span>
                    <div className="flex items-center gap-2 rounded-md border border-border">
                      <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                        <Minus className="h-4 w-4"/>
                      </Button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setQuantity(quantity + 1)}>
                        <Plus className="h-4 w-4"/>
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button size="lg" className="flex-1 gap-2" onClick={async () => {
            if (!product.inStock) {
                toast({
                    title: "Out of Stock",
                    description: "This product is not available right now.",
                    variant: "destructive",
                });
                return;
            }
            setIsAdding(true);
            try {
                await new Promise((resolve) => setTimeout(resolve, 300));
                addItem(product, quantity);
                setQuantity(1);
                toast({
                    title: "✓ Added to cart",
                    description: `${quantity} x ${product.name} added to your cart.`,
                });
            }
            catch (error) {
                console.error("Error adding to cart:", error);
                toast({
                    title: "Error",
                    description: "Failed to add item to cart. Please try again.",
                    variant: "destructive",
                });
            }
            finally {
                setIsAdding(false);
            }
        }} disabled={isAdding || !product.inStock}>
                      <ShoppingCart className="h-5 w-5"/>
                      {getAddToCartLabel()}
                    </Button>
                    <Button size="lg" variant="secondary" className="flex-1 w-full" asChild>
                      <Link href="/checkout">
                        Buy Now
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="w-12 p-0">
                      <Heart className="h-5 w-5"/>
                    </Button>
                    <Button size="lg" variant="outline" className="w-12 p-0">
                      <Share2 className="h-5 w-5"/>
                    </Button>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Truck className="h-5 w-5 text-primary"/>
                    <div className="text-sm">
                      <p className="font-medium">Free Shipping</p>
                      <p className="text-muted-foreground">On orders over ৳5000</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Shield className="h-5 w-5 text-primary"/>
                    <div className="text-sm">
                      <p className="font-medium">Authenticity</p>
                      <p className="text-muted-foreground">100% Handmade</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <RotateCcw className="h-5 w-5 text-primary"/>
                    <div className="text-sm">
                      <p className="font-medium">Easy Returns</p>
                      <p className="text-muted-foreground">7 day policy</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs Section */}
        <section className="border-t border-border py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <Tabs defaultValue="craft" className="w-full">
              <TabsList className="w-full justify-start border-b border-border bg-transparent p-0">
                <TabsTrigger value="craft" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Craft Process
                </TabsTrigger>
                <TabsTrigger value="cultural" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Cultural Significance
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Reviews ({product.reviewCount})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="craft" className="mt-8">
                <div className="max-w-3xl">
                  <h3 className="font-serif text-2xl font-bold text-foreground">
                    How It's Made
                  </h3>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    {product.craftProcess || "This product is crafted using traditional techniques passed down through generations. Each piece is made entirely by hand, ensuring uniqueness and authenticity."}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="cultural" className="mt-8">
                <div className="max-w-3xl">
                  <h3 className="font-serif text-2xl font-bold text-foreground">
                    Cultural Heritage
                  </h3>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    {product.culturalSignificance || "This craft represents an important part of Bangladesh's cultural heritage. It has been practiced for centuries and holds significant meaning in Bengali traditions."}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="reviews" className="mt-8">
                <div className="max-w-3xl">
                  <h3 className="font-serif text-2xl font-bold text-foreground">
                    Customer Reviews
                  </h3>
                  <div className="mt-6 space-y-6">
                    {[1, 2, 3].map((i) => (<div key={`review-${product.id}-${i}`} className="border-b border-border pb-6 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {new Array(5).fill(null).map((_, j) => (<Star key={`review-star-${product.id}-${i}-${j}`} className="h-4 w-4 fill-amber-400 text-amber-400"/>))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Verified Purchase
                          </span>
                        </div>
                        <p className="mt-3 text-muted-foreground">
                          Absolutely beautiful product! The craftsmanship is exceptional and it arrived well-packaged. Love supporting these talented artisans.
                        </p>
                        <p className="mt-2 text-sm font-medium">— Customer {i}</p>
                      </div>))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Artisan Section */}
        {artisan && (<section className="border-t border-border bg-card py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
              <h2 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
                Meet the Artisan
              </h2>
              <div className="mt-8 grid gap-8 lg:grid-cols-3">
                <div className="relative aspect-3/4 overflow-hidden rounded-lg lg:aspect-auto lg:h-full">
                  <Image src={artisan.image} alt={artisan.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw"/>
                </div>
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-serif text-2xl font-bold text-foreground">
                      {artisan.name}
                    </h3>
                    <Badge variant="secondary">{artisan.specialty}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4"/>
                      {artisan.district}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="h-4 w-4"/>
                      {artisan.yearsOfExperience}+ years experience
                    </span>
                  </div>
                  <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                    {artisan.story}
                  </p>
                  <Button variant="outline" className="mt-6" asChild>
                    <Link href={`/artisans/${artisan.id}`}>View Full Story</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>)}

        {/* Related Products */}
        {relatedProducts.length > 0 && (<section className="border-t border-border py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
              <h2 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
                You May Also Like
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((p) => (<ProductCard key={p.id} product={p}/>))}
              </div>
            </div>
          </section>)}
      </main>

      <Footer />
    </div>);
}

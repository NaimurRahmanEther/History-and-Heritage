"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Eye, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Product, formatPrice } from "@/lib/data";
export function ProductCard({ product, className }) {
    const [isAdding, setIsAdding] = useState(false);
    const { addItem } = useCart();
    const { toast } = useToast();
    const getAddToCartLabel = () => {
        if (isAdding)
            return "Adding...";
        if (product.inStock)
            return "Add to Cart";
        return "Out of Stock";
    };
    const handleAddToCart = async (e) => {
        e.preventDefault();
        setIsAdding(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));
        addItem(product, 1);
        setIsAdding(false);
        toast({
            title: "Added to cart",
            description: `${product.name} has been added to your cart.`,
        });
    };
    return (<div className={cn("group relative overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5", className)}>
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image src={product.image} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"/>
        {/* Discount Badge */}
        {product.originalPrice && (<Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
            {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
          </Badge>)}
        {/* Quick Actions */}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-linear-to-t from-background/90 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
          <Button size="sm" className="gap-2" onClick={handleAddToCart} disabled={isAdding || !product.inStock}>
            <ShoppingCart className="h-4 w-4"/>
            {getAddToCartLabel()}
          </Button>
          <Button size="sm" variant="secondary" className="gap-2" asChild>
            <Link href={`/products/${product.id}`}>
              <Eye className="h-4 w-4"/>
              View
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category & District */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-primary">{product.category}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3"/>
            {product.district}
          </span>
        </div>

        {/* Product Name */}
        <Link href={`/products/${product.id}`}>
          <h3 className="mt-2 font-serif text-lg font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {new Array(5).fill(null).map((_, i) => (<Star key={`star-${product.id}-${i}`} className={cn("h-4 w-4", i < Math.floor(product.rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted")}/>))}
          </div>
          <span className="text-sm text-muted-foreground">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-serif text-xl font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (<span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>)}
        </div>
      </div>
    </div>);
}

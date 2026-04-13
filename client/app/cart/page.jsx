"use client";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/data";
import { useEffect, useState } from "react";
export default function CartPage() {
    const { items, removeItem, updateQuantity, total, subtotal } = useCart();
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => {
        setHydrated(true);
    }, []);
    const cartProducts = items.filter((item) => item.product);
    const shipping = subtotal > 5000 ? 0 : 200;
    if (cartProducts.length === 0) {
        return (<div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                <ShoppingBag className="h-12 w-12 text-muted-foreground"/>
              </div>
              <h1 className="mt-6 font-serif text-2xl font-bold text-foreground">
                Your cart is empty
              </h1>
              <p className="mt-2 text-muted-foreground">
                Looks like you haven't added any items to your cart yet.
              </p>
              <Button size="lg" className="mt-8 gap-2" asChild>
                <Link href="/products">
                  <ArrowLeft className="h-4 w-4"/>
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>);
    }
    return (<div className="min-h-screen bg-background">
      <Navbar />

      <main className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h1 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
            Shopping Cart
          </h1>
          <p className="mt-2 text-muted-foreground">
            {cartProducts.length} item{cartProducts.length === 1 ? "" : "s"} in your cart
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-border bg-card">
                {cartProducts.map((item, index) => (<div key={item.productId}>
                    {index > 0 && <Separator />}
                    <div className="flex gap-4 p-4 sm:p-6">
                      {/* Image */}
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted sm:h-32 sm:w-32">
                        <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="128px"/>
                      </div>

                      {/* Details */}
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link href={`/products/${item.product.id}`} className="font-serif font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                              {item.product.name}
                            </Link>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.product.category} • {item.product.district}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.productId)}>
                            <Trash2 className="h-4 w-4"/>
                          </Button>
                        </div>

                        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
                          {/* Quantity */}
                          <div className="flex items-center gap-2 rounded-md border border-border">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                              <Minus className="h-3 w-3"/>
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                              <Plus className="h-3 w-3"/>
                            </Button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="font-serif text-lg font-bold text-foreground">
                              {formatPrice(item.product.price * item.quantity)}
                            </p>
                            {item.quantity > 1 && (<p className="text-sm text-muted-foreground">
                                {formatPrice(item.product.price)} each
                              </p>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>))}
              </div>

              <Button variant="ghost" className="mt-4 gap-2" asChild>
                <Link href="/products">
                  <ArrowLeft className="h-4 w-4"/>
                  Continue Shopping
                </Link>
              </Button>
            </div>

            {/* Order Summary */}
            <div>
              <div className="sticky top-24 rounded-lg border border-border bg-card p-6">
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  Order Summary
                </h2>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>
                  {shipping > 0 && (<p className="text-xs text-muted-foreground">
                      Free shipping on orders over {formatPrice(5000)}
                    </p>)}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-serif text-xl font-bold text-foreground">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <Button size="lg" className="mt-6 w-full gap-2" asChild>
                  <Link href="/checkout">
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4"/>
                  </Link>
                </Button>

                <div className="mt-6 rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    Your purchase directly supports artisan families across Bangladesh.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>);
}

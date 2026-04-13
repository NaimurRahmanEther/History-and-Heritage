"use client";
import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Truck, Clock, Mail, MapPin, CreditCard, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { formatPrice } from "@/lib/data";
import { getCatalogProducts } from "@/lib/catalog-products";
import { apiRequest } from "@/lib/api-client";
export default function OrderConfirmationPage({ params, }) {
    const { id } = use(params);
    const [hydrated, setHydrated] = useState(false);
    const [order, setOrder] = useState(null);
    useEffect(() => {
        let active = true;
        const load = async () => {
            const [orderResponse, products] = await Promise.all([
                apiRequest(`/orders/${id}`, {
                    method: "GET",
                    withAuth: true,
                }),
                getCatalogProducts(),
            ]);
            if (!active)
                return;
            const productMap = new Map(products.map((product) => [product.id, product]));
            setOrder({
                ...orderResponse.order,
                items: orderResponse.order.items.map((item) => ({
                    ...item,
                    product: productMap.get(item.productId),
                })),
            });
            setHydrated(true);
        };
        load().catch(() => {
            if (!active)
                return;
            setOrder(null);
            setHydrated(true);
        });
        return () => {
            active = false;
        };
    }, [id]);
    if (!hydrated) {
        return null;
    }
    if (!order) {
        return (<div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-md text-center">
              <h1 className="font-serif text-2xl font-bold text-foreground">Order Not Found</h1>
              <p className="mt-2 text-muted-foreground">The order you're looking for doesn't exist.</p>
              <Button className="mt-8" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>);
    }
    const orderItems = order.items.filter((item) => item.product);
    const createdDate = new Date(order.createdAt);
    return (<div className="min-h-screen bg-background">
      <Navbar />

      <main className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link href="/products">
                <ArrowLeft className="h-4 w-4"/>
                Continue Shopping
              </Link>
            </Button>
          </div>

          {/* Success Message */}
          <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600"/>
              </div>
              <div className="flex-1">
                <h1 className="font-serif text-2xl font-bold text-foreground">
                  Order Confirmed!
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Thank you for your purchase. Your order has been received and is being processed.
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  Order ID: <span className="font-mono">{order.id}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <div className="rounded-lg border border-border p-6">
                <h2 className="font-serif text-xl font-bold text-foreground mb-4">Order Items</h2>
                <div className="space-y-4">
                  {orderItems.map((item) => (<div key={item.productId} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image src={item.product.image} alt={item.product.name} fill className="object-cover"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.productId}`}>
                          <p className="font-medium text-foreground hover:text-primary line-clamp-2">
                            {item.product.name}
                          </p>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          Quantity: <span className="font-medium">{item.quantity}</span>
                        </p>
                        <p className="text-sm font-medium text-foreground mt-1">
                          {formatPrice(item.product.price)} each
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-foreground">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rounded-lg border border-border p-6">
                <h2 className="font-serif text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5"/>
                  Shipping Address
                </h2>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.address}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.district}{" "}
                    {order.shippingAddress.postalCode}
                  </p>
                  <div className="pt-2 border-t border-border mt-2 space-y-1">
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4"/>
                      {order.shippingAddress.phone}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4"/>
                      {order.shippingAddress.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Timeline */}
              <div className="rounded-lg border border-border p-6">
                <h2 className="font-serif text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5"/>
                  Order Timeline
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        ✓
                      </div>
                      <div className="mt-2 h-8 w-0.5 bg-muted"/>
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-foreground">Order Placed</p>
                      <p className="text-sm text-muted-foreground">
                        {createdDate.toLocaleDateString()} at {createdDate.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
                        2
                      </div>
                      <div className="mt-2 h-8 w-0.5 bg-muted"/>
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-foreground">Processing</p>
                      <p className="text-sm text-muted-foreground">We're preparing your order for shipment</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
                        3
                      </div>
                      <div className="mt-2 h-8 w-0.5 bg-muted"/>
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-foreground">Shipped</p>
                      <p className="text-sm text-muted-foreground">Your order is on its way</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
                        4
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Delivered</p>
                      <p className="text-sm text-muted-foreground">Expected within 2-5 business days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="rounded-lg border border-border p-6 space-y-6">
                {/* Order Status */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Order Status</p>
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    <Clock className="h-3 w-3 mr-1"/>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>

                <Separator />

                {/* Payment Method */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4"/>
                    Payment Method
                  </p>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod.toUpperCase()}
                  </p>
                </div>

                <Separator />

                {/* Order Summary */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">Order Summary</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium text-foreground">{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="h-3 w-3"/>
                        Shipping
                      </span>
                      <span className="font-medium text-foreground">
                        {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-primary">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/products">
                      Continue Shopping
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/orders">
                      View All Orders
                    </Link>
                  </Button>
                </div>

                {/* Help */}
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-xs font-medium text-foreground mb-2">Need Help?</p>
                  <p className="text-xs text-muted-foreground">
                    Check your email for order confirmation and tracking details.
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

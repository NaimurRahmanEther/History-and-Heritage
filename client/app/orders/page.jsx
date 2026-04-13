"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingBag, Clock, MapPin, Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { formatPrice } from "@/lib/data";
import { getCatalogProducts } from "@/lib/catalog-products";
import { apiRequest } from "@/lib/api-client";
import { fetchCurrentUser, getStoredToken } from "@/lib/auth-client";
export default function OrdersPage() {
    const router = useRouter();
    const [hydrated, setHydrated] = useState(false);
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    useEffect(() => {
        let active = true;
        const load = async () => {
            if (!getStoredToken()) {
                router.push("/auth/login");
                return;
            }
            const currentUser = await fetchCurrentUser();
            if (!currentUser) {
                router.push("/auth/login");
                return;
            }
            const [ordersResponse, products] = await Promise.all([
                apiRequest("/orders/my", {
                    method: "GET",
                    withAuth: true,
                }),
                getCatalogProducts(),
            ]);
            if (!active)
                return;
            const productMap = new Map(products.map((product) => [product.id, product]));
            const ordersWithProducts = ordersResponse.orders.map((order) => ({
                ...order,
                items: order.items.map((item) => ({
                    ...item,
                    product: productMap.get(item.productId),
                })),
            }));
            setUser(currentUser);
            setOrders(ordersWithProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setHydrated(true);
        };
        load().catch(() => {
            if (!active)
                return;
            router.push("/auth/login");
        });
        return () => {
            active = false;
        };
    }, [router]);
    if (!hydrated) {
        return null;
    }
    if (!user) {
        return null;
    }
    return (<div className="min-h-screen bg-background">
      <Navbar />

      <main className="pb-16 lg:pb-24">
        {/* Header */}
        <div className="border-b border-border bg-muted/50">
          <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <ShoppingBag className="h-6 w-6"/>
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">Your Orders</h1>
                <p className="text-sm text-muted-foreground">View and track your purchases</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {orders.length === 0 ? (<div className="rounded-lg border border-dashed border-border p-12 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
              <h2 className="font-serif text-lg font-bold text-foreground">No Orders Yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You haven't placed any orders yet. Start shopping to see your orders here!
              </p>
              <Button className="mt-6" asChild>
                <Link href="/products">Start Shopping</Link>
              </Button>
            </div>) : (<div className="space-y-4">
              {orders.map((order) => {
                const createdDate = new Date(order.createdAt);
                const firstItem = order.items[0]?.product;
                return (<div key={order.id} className="rounded-lg border border-border overflow-hidden">
                    {/* Order Header */}
                    <div className="bg-muted/50 px-4 py-3 lg:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Order ID</p>
                        <p className="font-mono text-sm font-medium text-foreground">{order.id}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-medium text-muted-foreground">Date</p>
                          <p className="text-sm text-foreground">{createdDate.toLocaleDateString()}</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2" asChild>
                          <Link href={`/order-confirmation/${order.id}`}>
                            <Eye className="h-4 w-4"/>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="px-4 py-4 lg:px-6">
                      <div className="grid gap-4">
                        {/* Items Summary */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-3">Items</p>
                          <div className="space-y-3">
                            {order.items.slice(0, 2).map((item) => (<div key={item.productId} className="flex gap-3 text-sm">
                                {item.product?.image && (<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover"/>
                                  </div>)}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">
                                    {item.product?.name || "Product"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Qty: {item.quantity}
                                  </p>
                                </div>
                                <p className="font-medium text-foreground shrink-0">
                                  {formatPrice(item.product?.price * item.quantity || 0)}
                                </p>
                              </div>))}
                            {order.items.length > 2 && (<p className="text-xs text-muted-foreground px-1">
                                +{order.items.length - 2} more item{order.items.length - 2 > 1 ? "s" : ""}
                              </p>)}
                          </div>
                        </div>

                        <Separator />

                        {/* Order Info Grid */}
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Total</p>
                            <p className="font-bold text-foreground">{formatPrice(order.total)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Payment</p>
                            <p className="text-sm text-foreground capitalize">
                              {order.paymentMethod === "cod" ? "COD" : order.paymentMethod.toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-2 w-2 mr-1"/>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Date</p>
                            <p className="text-sm text-foreground sm:hidden">
                              {createdDate.toLocaleDateString()}
                            </p>
                            <p className="text-sm text-foreground hidden sm:block">
                              {createdDate.toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <Separator />

                        {/* Shipping Address */}
                        <div className="flex gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5"/>
                          <div className="text-xs text-muted-foreground">
                            <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
                            <p className="mt-1">
                              {order.shippingAddress.address}, {order.shippingAddress.city},
                              {" "}{order.shippingAddress.district} {order.shippingAddress.postalCode}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>);
            })}
            </div>)}

          {/* Back to Shopping */}
          {orders.length > 0 && (<div className="mt-8 pt-8 border-t border-border">
              <Button variant="outline" className="gap-2" asChild>
                <Link href="/products">
                  <ArrowLeft className="h-4 w-4"/>
                  Back to Shopping
                </Link>
              </Button>
            </div>)}
        </div>
      </main>

      <Footer />
    </div>);
}

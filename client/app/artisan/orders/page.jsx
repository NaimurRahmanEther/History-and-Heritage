"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Clock, ShoppingCart } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/data";
import { fetchCurrentUser, getStoredToken, getStoredUser } from "@/lib/auth-client";
import { getArtisanOrders, updateArtisanOrderStatus } from "@/lib/artisan-store";

const ORDER_STATUSES = ["pending", "processing", "shipped", "completed", "cancelled"];

export default function ArtisanOrdersPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!getStoredToken()) {
        router.push("/auth/login");
        return;
      }

      const storedUser = getStoredUser();
      if (!storedUser || storedUser.role !== "artisan") {
        const currentUser = await fetchCurrentUser();
        if (!currentUser || currentUser.role !== "artisan") {
          router.push("/");
          return;
        }
      }

      const nextOrders = await getArtisanOrders();
      if (!active) return;
      setOrders(nextOrders);
      setHydrated(true);
    };

    load()
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load orders.");
        setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const pendingOrderCount = useMemo(
    () => orders.filter((order) => ["pending", "processing"].includes(order.status)).length,
    [orders]
  );

  const handleStatusChange = async (orderId, status) => {
    try {
      const updated = await updateArtisanOrderStatus(orderId, status);
      setOrders((prev) => prev.map((item) => (item.id === orderId ? updated : item)));
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Failed to update order.");
    }
  };

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="py-8 lg:py-12">
        <div className="mx-auto max-w-6xl px-4 lg:px-8 space-y-6">
          <div>
            <Button variant="ghost" className="mb-2 gap-2" asChild>
              <Link href="/artisan">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="font-serif text-3xl font-bold text-foreground">Manage Orders</h1>
            <p className="mt-2 text-muted-foreground">
              {orders.length} related order{orders.length === 1 ? "" : "s"} · {pendingOrderCount} pending
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {orders.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center">
                <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No orders yet that include your products.
                </p>
              </CardContent>
            </Card>
          )}

          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">{order.id}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString()} · {order.artisanItemCount} of your item
                    {order.artisanItemCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {order.hasForeignItems && (
                    <Badge variant="outline">
                      Shared Order
                    </Badge>
                  )}
                  <Select
                    value={order.status}
                    onValueChange={(value) => handleStatusChange(order.id, value)}
                    disabled={order.hasForeignItems}
                  >
                    <SelectTrigger className="w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.hasForeignItems && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    This order contains products from multiple artisans. You can view it, but only
                    admin can change its status.
                  </div>
                )}

                <div className="grid gap-3">
                  {order.items.map((item) => (
                    <div
                      key={`${order.id}-${item.productId}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                          <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity} · Unit: {formatPrice(item.unitPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.belongsToArtisan ? "Your product" : "Other artisan"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Current status
                  </span>
                  <span className="font-semibold text-foreground capitalize">{order.status}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

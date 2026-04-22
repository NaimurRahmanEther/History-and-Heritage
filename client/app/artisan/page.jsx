"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Package, ShoppingCart, Clock, ArrowRight, Upload } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStoredToken, getStoredUser, fetchCurrentUser } from "@/lib/auth-client";
import { apiRequest } from "@/lib/api-client";
import { getArtisanDashboardSummary, updateArtisanProfile } from "@/lib/artisan-store";

export default function ArtisanDashboardPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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

      const nextSummary = await getArtisanDashboardSummary();
      if (!active) return;
      setSummary(nextSummary);
      setHydrated(true);
    };

    load()
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
        setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (!hydrated) return null;

  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const uploadResponse = await apiRequest("/uploads/images", {
        method: "POST",
        withAuth: true,
        body: formData,
      });
      const updatedArtisan = await updateArtisanProfile({
        image: uploadResponse.url,
      });
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              artisan: updatedArtisan,
            }
          : prev
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Failed to update profile photo."
      );
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="py-8 lg:py-12">
        <div className="mx-auto max-w-6xl px-4 lg:px-8 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">Artisan Dashboard</h1>
              <p className="mt-2 text-muted-foreground">
                Welcome back{summary?.artisan?.name ? `, ${summary.artisan.name}` : ""}.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/artisan/products">Manage Products</Link>
              </Button>
              <Button asChild>
                <Link href="/artisan/orders">Manage Orders</Link>
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Artisan Profile Photo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border border-border bg-muted">
                {summary?.artisan?.image ? (
                  <Image
                    src={summary.artisan.image}
                    alt={summary.artisan.name || "Artisan profile"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
                    A
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Upload a clear portrait so customers can recognize you.
                </p>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  {isUploadingPhoto ? "Uploading..." : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingPhoto}
                    onChange={handleProfilePhotoUpload}
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Products
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.totalProducts ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  In Stock
                </CardTitle>
                <Package className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.inStockProducts ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.totalOrders ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Orders
                </CardTitle>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.pendingOrders ?? 0}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Product Workspace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Add new products, update stock, and keep your catalog fresh.
                </p>
                <Button className="gap-2" asChild>
                  <Link href="/artisan/products">
                    Open Product Manager
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Order Workspace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Track orders that include your products and update eligible order statuses.
                </p>
                <Button className="gap-2" asChild>
                  <Link href="/artisan/orders">
                    Open Order Manager
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

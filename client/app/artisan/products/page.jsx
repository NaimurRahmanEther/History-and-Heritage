"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Save, Trash2, Upload } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/data";
import { apiRequest, resolveAssetUrl } from "@/lib/api-client";
import { fetchCurrentUser, getStoredToken, getStoredUser } from "@/lib/auth-client";
import {
  createArtisanProduct,
  deleteArtisanProduct,
  getArtisanProducts,
  updateArtisanProduct,
} from "@/lib/artisan-store";
import { getDynamicCategories, getDynamicDistricts } from "@/lib/dynamic-data";

function getInitialForm() {
  return {
    id: "",
    name: "",
    price: "",
    originalPrice: "",
    category: "",
    district: "",
    description: "",
    craftProcess: "",
    culturalSignificance: "",
    image: "",
    inStock: true,
  };
}

function getApprovalBadgeClasses(status) {
  const normalized = String(status || "approved").toLowerCase();
  if (normalized === "approved") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600";
  }
  if (normalized === "pending") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-600";
  }
  return "border-red-500/20 bg-red-500/10 text-red-600";
}

export default function ArtisanProductsPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [editingProductId, setEditingProductId] = useState("");
  const [form, setForm] = useState(getInitialForm());

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

      const [artisanProducts, allCategories, allDistricts] = await Promise.all([
        getArtisanProducts(),
        getDynamicCategories(),
        getDynamicDistricts(),
      ]);
      if (!active) return;
      setProducts(artisanProducts);
      setCategories(allCategories);
      setDistricts(allDistricts);
      setHydrated(true);
    };

    load()
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load products.");
        setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const resetForm = () => {
    setEditingProductId("");
    setForm(getInitialForm());
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = new FormData();
      data.append("image", file);
      const response = await apiRequest("/uploads/images", {
        method: "POST",
        withAuth: true,
        body: data,
      });
      setForm((prev) => ({ ...prev, image: response.url }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload image.");
    }
  };

  const handleEdit = (product) => {
    setEditingProductId(product.id);
    setForm({
      id: product.id,
      name: product.name,
      price: String(product.price),
      originalPrice: String(product.originalPrice || product.price),
      category: product.category,
      district: product.district,
      description: product.description || "",
      craftProcess: product.craftProcess || "",
      culturalSignificance: product.culturalSignificance || "",
      image: product.image || "",
      inStock: Boolean(product.inStock),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const payload = {
        id: form.id || `prod-${Date.now()}`,
        name: form.name,
        price: Number(form.price || 0),
        originalPrice: Number(form.originalPrice || form.price || 0),
        category: form.category,
        district: form.district,
        description: form.description,
        craftProcess: form.craftProcess,
        culturalSignificance: form.culturalSignificance,
        image: form.image,
        images: form.image ? [form.image] : [],
        inStock: form.inStock,
      };

      if (editingProductId) {
        const updated = await updateArtisanProduct(editingProductId, payload);
        setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await createArtisanProduct(payload);
        setProducts((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await deleteArtisanProduct(productId);
      setProducts((prev) => prev.filter((item) => item.id !== productId));
      if (editingProductId === productId) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete product.");
    }
  };

  const totalInStock = useMemo(
    () => products.filter((product) => product.inStock).length,
    [products]
  );

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="py-8 lg:py-12">
        <div className="mx-auto max-w-6xl px-4 lg:px-8 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Button variant="ghost" className="mb-2 gap-2" asChild>
                <Link href="/artisan">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="font-serif text-3xl font-bold text-foreground">Manage Products</h1>
              <p className="mt-2 text-muted-foreground">
                Total: {products.length} products, {totalInStock} in stock
              </p>
              <p className="mt-1 text-sm text-amber-700">
                New artisan products are published only after admin approval.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{editingProductId ? "Edit Product" : "Add Product"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price *</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Original Price</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.originalPrice}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, originalPrice: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>District *</Label>
                    <Select
                      value={form.district}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, district: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={district.id}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Image</Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.image}
                        onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
                        placeholder="Paste image URL or upload a file"
                      />
                      <label className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 text-sm cursor-pointer hover:bg-muted">
                        <Upload className="h-4 w-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                </div>

                {form.image && (
                  <div className="relative h-24 w-24 overflow-hidden rounded-md border border-border">
                    <Image src={resolveAssetUrl(form.image)} alt="Preview" fill className="object-cover" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Craft Process</Label>
                  <Textarea
                    rows={2}
                    value={form.craftProcess}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, craftProcess: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cultural Significance</Label>
                  <Textarea
                    rows={2}
                    value={form.culturalSignificance}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, culturalSignificance: event.target.value }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-sm">In Stock</p>
                    <p className="text-xs text-muted-foreground">Toggle product availability</p>
                  </div>
                  <Switch
                    checked={form.inStock}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, inStock: checked }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="gap-2" disabled={isSaving}>
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : editingProductId ? "Update Product" : "Create Product"}
                  </Button>
                  {editingProductId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {products.length === 0 && (
                <p className="text-sm text-muted-foreground">No products yet.</p>
              )}
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-md bg-muted">
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(product.price)} | {product.inStock ? "In Stock" : "Out of Stock"}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className={getApprovalBadgeClasses(product.approvalStatus)}>
                          {String(product.approvalStatus || "approved").charAt(0).toUpperCase() +
                            String(product.approvalStatus || "approved").slice(1)}
                        </Badge>
                        {product.approvalStatus === "rejected" && product.approvalNote && (
                          <span className="text-xs text-red-600">{product.approvalNote}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

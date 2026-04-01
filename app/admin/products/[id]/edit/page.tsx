"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, X, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getAdminArtisans,
  getAdminCategories,
  getAdminDistricts,
  getAdminProducts,
  getCurrentUser,
  isAdminUser,
  saveAdminProducts,
  type AdminArtisan,
  type AdminCategory,
  type AdminDistrict,
  type AdminProduct,
} from "@/lib/admin-store";

interface ProductForm {
  name: string;
  price: string;
  originalPrice: string;
  category: string;
  district: string;
  artisan: string;
  description: string;
  craftProcess: string;
  culturalSignificance: string;
  inStock: boolean;
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [userReady, setUserReady] = useState(false);
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [districts, setDistricts] = useState<AdminDistrict[]>([]);
  const [artisans, setArtisans] = useState<AdminArtisan[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState("");
  const [formData, setFormData] = useState<ProductForm>({
    name: "",
    price: "",
    originalPrice: "",
    category: "",
    district: "",
    artisan: "",
    description: "",
    craftProcess: "",
    culturalSignificance: "",
    inStock: true,
  });
  const [errors, setErrors] = useState<Partial<ProductForm>>({});

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!isAdminUser(currentUser)) {
      router.push("/");
      return;
    }

    const loadedProducts = getAdminProducts();
    const foundProduct = loadedProducts.find((item) => item.id === id) ?? null;

    if (!foundProduct) {
      router.push("/admin/products");
      return;
    }

    setProduct(foundProduct);
    setImage(foundProduct.image);
    setFormData({
      name: foundProduct.name,
      price: String(foundProduct.price),
      originalPrice: String(foundProduct.originalPrice),
      category: foundProduct.category,
      district: foundProduct.district,
      artisan: foundProduct.artisan,
      description: foundProduct.description,
      craftProcess: foundProduct.craftProcess,
      culturalSignificance: foundProduct.culturalSignificance,
      inStock: foundProduct.inStock,
    });

    setCategories(getAdminCategories().filter((category) => category.active));
    setDistricts(getAdminDistricts().filter((district) => district.active));
    setArtisans(getAdminArtisans().filter((artisan) => artisan.active));
    setUserReady(true);
  }, [id, router]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProductForm> = {};

    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.price || Number(formData.price) <= 0) newErrors.price = "Valid price is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.district) newErrors.district = "District is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!product) return;

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const updatedProduct: AdminProduct = {
        ...product,
        name: formData.name.trim(),
        price: Number(formData.price),
        originalPrice: formData.originalPrice
          ? Number(formData.originalPrice)
          : Number(formData.price),
        category: formData.category,
        district: formData.district,
        artisan: formData.artisan,
        description: formData.description.trim(),
        craftProcess: formData.craftProcess.trim(),
        culturalSignificance: formData.culturalSignificance.trim(),
        image: image || product.image,
        images: image ? [image] : product.images,
        inStock: formData.inStock,
      };

      const updatedProducts = getAdminProducts().map((item) =>
        item.id === product.id ? updatedProduct : item
      );
      saveAdminProducts(updatedProducts);
      setProduct(updatedProduct);

      toast({
        title: "Success",
        description: `Product "${updatedProduct.name}" has been updated.`,
      });

      router.push("/admin/products");
    } catch {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userReady || !product) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
            Edit Product
          </h1>
          <p className="text-muted-foreground">Update product information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Update the core details for this product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData({ ...formData, name: event.target.value })
                    }
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(event) =>
                      setFormData({ ...formData, description: event.target.value })
                    }
                    className={errors.description ? "border-red-500" : ""}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      value={formData.price}
                      onChange={(event) =>
                        setFormData({ ...formData, price: event.target.value })
                      }
                      className={errors.price ? "border-red-500" : ""}
                    />
                    {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Original Price</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      min={0}
                      value={formData.originalPrice}
                      onChange={(event) =>
                        setFormData({ ...formData, originalPrice: event.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Image</CardTitle>
                <CardDescription>
                  Update the primary image if needed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {image && (
                  <div className="relative mb-4 inline-block w-full">
                    <img
                      src={image}
                      alt="Product preview"
                      className="max-w-xs rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setImage(product.image)}
                      className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary hover:bg-muted/50">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to update image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cultural Details</CardTitle>
                <CardDescription>
                  Maintain craft and heritage details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="craftProcess">Craft Process</Label>
                  <Textarea
                    id="craftProcess"
                    rows={3}
                    value={formData.craftProcess}
                    onChange={(event) =>
                      setFormData({ ...formData, craftProcess: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="culturalSignificance">Cultural Significance</Label>
                  <Textarea
                    id="culturalSignificance"
                    rows={3}
                    value={formData.culturalSignificance}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        culturalSignificance: event.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="inStock">In Stock</Label>
                    <p className="text-sm text-muted-foreground">
                      Product is available for purchase
                    </p>
                  </div>
                  <Switch
                    id="inStock"
                    checked={formData.inStock}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, inStock: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className={errors.category ? "border-red-500" : ""}>
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
                  {errors.category && (
                    <p className="text-xs text-red-500">{errors.category}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>District *</Label>
                  <Select
                    value={formData.district}
                    onValueChange={(value) => setFormData({ ...formData, district: value })}
                  >
                    <SelectTrigger className={errors.district ? "border-red-500" : ""}>
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
                  {errors.district && (
                    <p className="text-xs text-red-500">{errors.district}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Artisan</Label>
                  <Select
                    value={formData.artisan}
                    onValueChange={(value) => setFormData({ ...formData, artisan: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select artisan" />
                    </SelectTrigger>
                    <SelectContent>
                      {artisans.map((artisan) => (
                        <SelectItem key={artisan.id} value={artisan.id}>
                          {artisan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Product
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

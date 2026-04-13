"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { ArrowLeft, Upload, X, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, resolveAssetUrl } from "@/lib/api-client";
import { getAdminArtisans, getAdminCategories, getAdminDistricts, getAdminProducts, getCurrentUser, isAdminUser, saveAdminProducts, } from "@/lib/admin-store";
export default function NewProductPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [userReady, setUserReady] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [image, setImage] = useState("");
    const [categories, setCategories] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [artisans, setArtisans] = useState([]);
    const [formData, setFormData] = useState({
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
    const [errors, setErrors] = useState({});
    useEffect(() => {
        let active = true;
        const load = async () => {
            const currentUser = getCurrentUser();
            if (!isAdminUser(currentUser)) {
                router.push("/");
                return;
            }
            const [allCategories, allDistricts, allArtisans] = await Promise.all([
                getAdminCategories(),
                getAdminDistricts(),
                getAdminArtisans(),
            ]);
            if (!active)
                return;
            setCategories(allCategories.filter((category) => category.active));
            setDistricts(allDistricts.filter((district) => district.active));
            setArtisans(allArtisans.filter((artisan) => artisan.active));
            setUserReady(true);
        };
        load().catch(() => {
            if (!active)
                return;
            router.push("/");
        });
        return () => {
            active = false;
        };
    }, [router]);
    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        try {
            const formData = new FormData();
            formData.append("image", file);
            const response = await apiRequest("/uploads/images", {
                method: "POST",
                withAuth: true,
                body: formData,
            });
            setImage(response.url);
            toast({
                title: "Image uploaded",
                description: "Product image uploaded successfully.",
            });
        }
        catch (error) {
            toast({
                title: "Upload failed",
                description: error instanceof Error ? error.message : "Could not upload image.",
                variant: "destructive",
            });
        }
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim())
            newErrors.name = "Product name is required";
        if (!formData.price || Number(formData.price) <= 0)
            newErrors.price = "Valid price is required";
        if (!formData.category)
            newErrors.category = "Category is required";
        if (!formData.district)
            newErrors.district = "District is required";
        if (!formData.description.trim())
            newErrors.description = "Description is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
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
            const newProduct = {
                id: `prod-${Date.now()}`,
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
                image: image ||
                    "https://images.unsplash.com/photo-1505252585461-04db1267ae0e?w=500&q=80",
                images: image ? [image] : undefined,
                inStock: formData.inStock,
                createdAt: new Date().toISOString(),
            };
            const updatedProducts = [newProduct, ...(await getAdminProducts())];
            await saveAdminProducts(updatedProducts);
            toast({
                title: "Success",
                description: `Product "${newProduct.name}" has been created.`,
            });
            router.push("/admin/products");
        }
        catch {
            toast({
                title: "Error",
                description: "Failed to create product. Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (!userReady)
        return null;
    return (<div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-5 w-5"/>
          </Link>
        </Button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
            Add New Product
          </h1>
          <p className="text-muted-foreground">
            Create a new product listing for your store
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the core details for this product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className={errors.name ? "border-red-500" : ""}/>
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" rows={4} value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} className={errors.description ? "border-red-500" : ""}/>
                  {errors.description && (<p className="text-xs text-red-500">{errors.description}</p>)}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input id="price" type="number" min={0} value={formData.price} onChange={(event) => setFormData({ ...formData, price: event.target.value })} className={errors.price ? "border-red-500" : ""}/>
                    {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Original Price</Label>
                    <Input id="originalPrice" type="number" min={0} value={formData.originalPrice} onChange={(event) => setFormData({ ...formData, originalPrice: event.target.value })}/>
                    <p className="text-xs text-muted-foreground">
                      Leave empty if there is no discount.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Image</CardTitle>
                <CardDescription>
                  Upload a clear primary image
                </CardDescription>
              </CardHeader>
              <CardContent>
                {image && (<div className="relative mb-4 inline-block w-full">
                    <img src={resolveAssetUrl(image)} alt="Product preview" className="max-w-xs rounded-lg border border-border"/>
                    <button type="button" onClick={() => setImage("")} className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                      <X className="h-4 w-4"/>
                    </button>
                  </div>)}
                <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary hover:bg-muted/50">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground"/>
                  <span className="text-sm text-muted-foreground">Click to upload image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cultural Details</CardTitle>
                <CardDescription>
                  Add optional artisan and heritage notes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="craftProcess">Craft Process</Label>
                  <Textarea id="craftProcess" rows={3} value={formData.craftProcess} onChange={(event) => setFormData({ ...formData, craftProcess: event.target.value })}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="culturalSignificance">Cultural Significance</Label>
                  <Textarea id="culturalSignificance" rows={3} value={formData.culturalSignificance} onChange={(event) => setFormData({
            ...formData,
            culturalSignificance: event.target.value,
        })}/>
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
                  <Switch id="inStock" checked={formData.inStock} onCheckedChange={(checked) => setFormData({ ...formData, inStock: checked })}/>
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
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select category"/>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (<SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                  {errors.category && (<p className="text-xs text-red-500">{errors.category}</p>)}
                </div>

                <div className="space-y-2">
                  <Label>District *</Label>
                  <Select value={formData.district} onValueChange={(value) => setFormData({ ...formData, district: value })}>
                    <SelectTrigger className={errors.district ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select district"/>
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (<SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                  {errors.district && (<p className="text-xs text-red-500">{errors.district}</p>)}
                </div>

                <div className="space-y-2">
                  <Label>Artisan</Label>
                  <Select value={formData.artisan} onValueChange={(value) => setFormData({ ...formData, artisan: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select artisan"/>
                    </SelectTrigger>
                    <SelectContent>
                      {artisans.map((artisan) => (<SelectItem key={artisan.id} value={artisan.id}>
                          {artisan.name}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
              {isSubmitting ? (<>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  Creating...
                </>) : (<>
                  <Save className="mr-2 h-4 w-4"/>
                  Create Product
                </>)}
            </Button>
          </div>
        </div>
      </form>
    </div>);
}

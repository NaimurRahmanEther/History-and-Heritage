"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Layers, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAdminCategories, getAdminProducts, getCurrentUser, isAdminUser, saveAdminCategories, } from "@/lib/admin-store";
function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
export default function AdminCategoriesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [hydrated, setHydrated] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({
        name: "",
        description: "",
        image: "",
    });
    useEffect(() => {
        let active = true;
        const load = async () => {
            const user = getCurrentUser();
            if (!isAdminUser(user)) {
                router.push("/");
                return;
            }
            const [allCategories, allProducts] = await Promise.all([
                getAdminCategories(),
                getAdminProducts(),
            ]);
            if (!active)
                return;
            setCategories(allCategories);
            setProducts(allProducts);
            setHydrated(true);
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
    const productCountByCategory = useMemo(() => {
        const counts = new Map();
        products.forEach((product) => {
            counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
        });
        return counts;
    }, [products]);
    const filteredCategories = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query)
            return categories;
        return categories.filter((category) => category.name.toLowerCase().includes(query) ||
            category.id.toLowerCase().includes(query));
    }, [categories, searchQuery]);
    const handleAddCategory = async () => {
        if (!form.name.trim()) {
            toast({
                title: "Category name required",
                description: "Please provide a name for the category.",
                variant: "destructive",
            });
            return;
        }
        const id = slugify(form.name);
        if (categories.some((category) => category.id === id)) {
            toast({
                title: "Duplicate category",
                description: "A category with this name already exists.",
                variant: "destructive",
            });
            return;
        }
        const newCategory = {
            id,
            name: form.name.trim(),
            image: form.image.trim() ||
                "https://images.unsplash.com/photo-1601662528567-526cd06f6582?w=600&q=80",
            description: form.description.trim() || "Custom category created in admin panel.",
            productCount: 0,
            active: true,
            createdAt: new Date().toISOString(),
        };
        const updated = [newCategory, ...categories];
        setCategories(updated);
        await saveAdminCategories(updated);
        setForm({ name: "", description: "", image: "" });
        toast({
            title: "Category created",
            description: `${newCategory.name} is now available.`,
        });
    };
    const handleToggleActive = async (categoryId, active) => {
        const updated = categories.map((category) => category.id === categoryId ? { ...category, active } : category);
        setCategories(updated);
        await saveAdminCategories(updated);
    };
    const handleDelete = async (categoryId) => {
        const linkedProducts = productCountByCategory.get(categoryId) ?? 0;
        if (linkedProducts > 0) {
            toast({
                title: "Cannot delete category",
                description: "Reassign or remove linked products first.",
                variant: "destructive",
            });
            return;
        }
        const category = categories.find((item) => item.id === categoryId);
        const updated = categories.filter((item) => item.id !== categoryId);
        setCategories(updated);
        await saveAdminCategories(updated);
        toast({
            title: "Category deleted",
            description: category ? `${category.name} has been removed.` : "Category removed.",
        });
    };
    if (!hydrated)
        return null;
    return (<div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
          Categories
        </h1>
        <p className="text-muted-foreground">
          Manage product categories and their availability.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4"/>
            Add Category
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Category name"/>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Short description"/>
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://..."/>
            </div>
          </div>
          <Button onClick={handleAddCategory}>Create Category</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <Input className="pl-9" placeholder="Search category by name or ID" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}/>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (<TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No categories found.
                    </TableCell>
                  </TableRow>) : (filteredCategories.map((category) => (<TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground"/>
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-xs text-muted-foreground">{category.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[380px] md:table-cell">
                        <p className="line-clamp-1 text-muted-foreground">{category.description}</p>
                      </TableCell>
                      <TableCell>
                        {productCountByCategory.get(category.id) ?? 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={category.active} onCheckedChange={(checked) => handleToggleActive(category.id, checked)}/>
                          <Badge variant="outline">
                            {category.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                          <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                      </TableCell>
                    </TableRow>)))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>);
}

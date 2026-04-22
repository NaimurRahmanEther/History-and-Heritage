"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Package, Filter, AlertCircle, Download, CheckCircle2, XCircle, } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAdminCategories, getAdminDistricts, getAdminProducts, getCurrentUser, isAdminUser, saveAdminProducts, updateAdminProductApproval, } from "@/lib/admin-store";
export default function AdminProductsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [districtFilter, setDistrictFilter] = useState("all");
    const [stockFilter, setStockFilter] = useState("all");
    const [approvalFilter, setApprovalFilter] = useState("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => {
        let active = true;
        const load = async () => {
            const user = getCurrentUser();
            if (!isAdminUser(user)) {
                router.push("/");
                return;
            }
            const [loadedProducts, loadedCategories, loadedDistricts] = await Promise.all([
                getAdminProducts(),
                getAdminCategories(),
                getAdminDistricts(),
            ]);
            if (!active)
                return;
            setProducts(loadedProducts);
            setCategories(loadedCategories.filter((category) => category.active));
            setDistricts(loadedDistricts.filter((district) => district.active));
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
    const categoryNameById = useMemo(() => {
        const map = new Map();
        categories.forEach((category) => map.set(category.id, category.name));
        return map;
    }, [categories]);
    const districtNameById = useMemo(() => {
        const map = new Map();
        districts.forEach((district) => map.set(district.id, district.name));
        return map;
    }, [districts]);
    const handleDelete = (product) => {
        setSelectedProduct(product);
        setDeleteDialogOpen(true);
    };
    const handleApprovalUpdate = async (product, status) => {
        try {
            const updated = await updateAdminProductApproval(product.id, status, status === "rejected" ? "Please review and resubmit this product." : "");
            setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            toast({
                title: status === "approved" ? "Product approved" : "Product rejected",
                description: `${product.name} was ${status}.`,
            });
        }
        catch (error) {
            toast({
                title: "Update failed",
                description: error instanceof Error ? error.message : "Could not update approval status.",
                variant: "destructive",
            });
        }
    };
    const confirmDelete = async () => {
        if (!selectedProduct)
            return;
        const updatedProducts = products.filter((product) => product.id !== selectedProduct.id);
        try {
            setProducts(updatedProducts);
            await saveAdminProducts(updatedProducts);
            toast({
                title: "Product deleted",
                description: `${selectedProduct.name} has been removed.`,
            });
            setDeleteDialogOpen(false);
            setSelectedProduct(null);
        }
        catch (error) {
            toast({
                title: "Delete failed",
                description: error instanceof Error ? error.message : "Could not delete product.",
                variant: "destructive",
            });
        }
    };
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch = searchQuery.trim() === "" ||
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
            const matchesDistrict = districtFilter === "all" || product.district === districtFilter;
            const matchesStock = stockFilter === "all" ||
                (stockFilter === "instock" && product.inStock) ||
                (stockFilter === "outofstock" && !product.inStock);
            const productApprovalStatus = product.approvalStatus || "approved";
            const matchesApproval = approvalFilter === "all" || productApprovalStatus === approvalFilter;
            return matchesSearch && matchesCategory && matchesDistrict && matchesStock && matchesApproval;
        });
    }, [products, searchQuery, categoryFilter, districtFilter, stockFilter, approvalFilter]);
    const handleExport = () => {
        const payload = JSON.stringify(products, null, 2);
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `admin-products-${new Date().toISOString().slice(0, 10)}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
    };
    return (<div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
            Products
          </h1>
          <p className="text-muted-foreground">
            Manage your product inventory and listings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4"/>
            Export
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4"/>
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Stock
            </CardTitle>
            <Package className="h-4 w-4 text-green-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter((product) => product.inStock).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Out of Stock
            </CardTitle>
            <Package className="h-4 w-4 text-red-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter((product) => !product.inStock).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
            <Filter className="h-4 w-4 text-amber-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter((product) => (product.approvalStatus || "approved") === "pending").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
              <Input placeholder="Search products by name or ID..." className="pl-9" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}/>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (<SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={districtFilter} onValueChange={setDistrictFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="District"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {districts.map((district) => (<SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Stock"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="instock">In Stock</SelectItem>
                  <SelectItem value="outofstock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Approval"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Approval</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">District</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!hydrated ? (<TableRow>
                    <TableCell colSpan={8} className="py-8 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>) : filteredProducts.length === 0 ? (<TableRow>
                    <TableCell colSpan={8} className="py-8 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground"/>
                        <p className="text-muted-foreground">
                          No products match the current filters
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>) : (filteredProducts.map((product) => (<TableRow key={product.id}>
                      <TableCell>
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted">
                          <Image src={product.image} alt={product.name} fill className="object-cover"/>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="line-clamp-1 font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">
                          {categoryNameById.get(product.category) ?? product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {districtNameById.get(product.district) ?? product.district}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatPrice(product.price)}</p>
                          {product.originalPrice > product.price && (<p className="text-xs text-muted-foreground line-through">
                              {formatPrice(product.originalPrice)}
                            </p>)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={(product.approvalStatus || "approved") === "approved"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                : (product.approvalStatus || "approved") === "pending"
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
                    : "border-red-500/20 bg-red-500/10 text-red-600"}>
                          {(product.approvalStatus || "approved").charAt(0).toUpperCase() + (product.approvalStatus || "approved").slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={product.inStock
                ? "border-green-500/20 bg-green-500/10 text-green-600"
                : "border-red-500/20 bg-red-500/10 text-red-600"}>
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4"/>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/products/${product.id}/edit`}>
                                <Eye className="mr-2 h-4 w-4"/>
                                View Product
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/products/${product.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4"/>
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            {(product.approvalStatus || "approved") !== "approved" && (<DropdownMenuItem onClick={() => handleApprovalUpdate(product, "approved")}>
                                <CheckCircle2 className="mr-2 h-4 w-4"/>
                                Approve
                              </DropdownMenuItem>)}
                            {(product.approvalStatus || "approved") !== "rejected" && (<DropdownMenuItem onClick={() => handleApprovalUpdate(product, "rejected")}>
                                <XCircle className="mr-2 h-4 w-4"/>
                                Reject
                              </DropdownMenuItem>)}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(product)}>
                              <Trash2 className="mr-2 h-4 w-4"/>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>)))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedProduct?.name}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/>
            <p>This will permanently remove the product from your inventory.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);
}

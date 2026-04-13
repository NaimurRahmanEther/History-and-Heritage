"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { DollarSign, Package, ShoppingCart, TrendingUp, TrendingDown, Eye, ArrowRight, Users, Layers, } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from "recharts";
import { formatPrice } from "@/lib/data";
import { getCatalogProducts } from "@/lib/catalog-products";
import { getAdminCategories, getAdminOrders, getAdminProducts, getAdminArtisans, getCurrentUser, getMonthlyRevenueData, getProductSalesMap, isAdminUser, } from "@/lib/admin-store";
const statusColors = {
    completed: "bg-green-500/10 text-green-600 border-green-500/20",
    shipped: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    processing: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    pending: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
};
export default function AdminDashboard() {
    const router = useRouter();
    const [hydrated, setHydrated] = useState(false);
    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [catalogProducts, setCatalogProducts] = useState(new Map());
    const [artisanCount, setArtisanCount] = useState(0);
    const [categoryCount, setCategoryCount] = useState(0);
    useEffect(() => {
        let active = true;
        const load = async () => {
            const currentUser = getCurrentUser();
            if (!isAdminUser(currentUser)) {
                router.push("/");
                return;
            }
            const [adminProducts, adminOrders, artisans, categories, catalog] = await Promise.all([
                getAdminProducts(),
                getAdminOrders(),
                getAdminArtisans(),
                getAdminCategories(),
                getCatalogProducts(),
            ]);
            if (!active)
                return;
            setUser(currentUser);
            setProducts(adminProducts);
            setOrders(adminOrders);
            setArtisanCount(artisans.length);
            setCategoryCount(categories.length);
            setCatalogProducts(new Map(catalog.map((catalogProduct) => [catalogProduct.id, catalogProduct])));
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
    const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
    const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + order.total, 0), [orders]);
    const inStockCount = useMemo(() => products.filter((product) => product.inStock).length, [products]);
    const monthlyRevenueData = useMemo(() => getMonthlyRevenueData(orders, 6), [orders]);
    const topProducts = useMemo(() => {
        const salesByProduct = getProductSalesMap(orders);
        return [...products]
            .sort((a, b) => {
            const bySales = (salesByProduct[b.id] ?? 0) - (salesByProduct[a.id] ?? 0);
            if (bySales !== 0) {
                return bySales;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
            .slice(0, 5)
            .map((product) => ({
            ...product,
            unitsSold: salesByProduct[product.id] ?? 0,
            fallbackImage: catalogProducts.get(product.id)?.image ?? product.image,
        }));
    }, [orders, products, catalogProducts]);
    if (!hydrated || !user) {
        return null;
    }
    return (<div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name}. Here is your latest store performance.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary"/>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500"/>
              <span className="text-muted-foreground">
                {orders.length} total order{orders.length === 1 ? "" : "s"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary"/>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingDown className="h-4 w-4 text-muted-foreground"/>
              <span className="text-muted-foreground">{inStockCount} in stock</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Artisans
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary"/>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{artisanCount}</div>
            <p className="text-sm text-muted-foreground">Profiles managed in admin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-5 w-5 text-primary"/>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryCount}</div>
            <p className="text-sm text-muted-foreground">Catalog groups available</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Revenue trend from recent orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`}/>
                  <Tooltip contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
        }} formatter={(value) => [formatPrice(value), "Revenue"]}/>
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump into management flows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link href="/admin/products/new">
                <Package className="mr-2 h-4 w-4"/>
                Add New Product
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/admin/orders">
                <ShoppingCart className="mr-2 h-4 w-4"/>
                Manage Orders ({orders.length})
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/admin/artisans">
                <Users className="mr-2 h-4 w-4"/>
                Manage Artisans ({artisanCount})
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/admin/categories">
                <Layers className="mr-2 h-4 w-4"/>
                Manage Categories ({categoryCount})
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer orders</CardDescription>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/admin/orders" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4"/>
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead className="hidden md:table-cell">Customer</TableHead>
                  <TableHead className="hidden lg:table-cell">Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 ? (<TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No orders yet
                    </TableCell>
                  </TableRow>) : (recentOrders.map((order) => (<TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>
                          <p className="font-medium">{order.shippingAddress.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.shippingAddress.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {order.items.length} item{order.items.length === 1 ? "" : "s"}
                      </TableCell>
                      <TableCell className="font-semibold">{formatPrice(order.total)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] ?? statusColors.pending}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/order-confirmation/${order.id}`}>
                            <Eye className="h-4 w-4"/>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>)))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
          <CardDescription>Most sold products from current orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden md:table-cell">Price</TableHead>
                  <TableHead className="hidden lg:table-cell">Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.length === 0 ? (<TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No products available
                    </TableCell>
                  </TableRow>) : (topProducts.map((product) => (<TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded bg-muted">
                            <Image src={product.fallbackImage} alt={product.name} fill className="object-cover"/>
                          </div>
                          <p className="line-clamp-1 font-medium">{product.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-medium">
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{product.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={product.inStock
                ? "border-green-500/20 bg-green-500/10 text-green-600"
                : "border-red-500/20 bg-red-500/10 text-red-600"}>
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {product.unitsSold}
                      </TableCell>
                    </TableRow>)))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>);
}

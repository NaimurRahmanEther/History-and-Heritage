"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Search, Eye, ShoppingCart, Clock, CheckCircle, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/data";
import { ORDER_STATUSES, getAdminOrders, getCurrentUser, isAdminUser, updateAdminOrderStatus, } from "@/lib/admin-store";
const statusColors = {
    pending: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    processing: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    shipped: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    completed: "bg-green-500/10 text-green-600 border-green-500/20",
    cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
};
export default function AdminOrdersPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [hydrated, setHydrated] = useState(false);
    const [orders, setOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    useEffect(() => {
        let active = true;
        const load = async () => {
            const user = getCurrentUser();
            if (!isAdminUser(user)) {
                router.push("/");
                return;
            }
            const loadedOrders = await getAdminOrders();
            if (!active)
                return;
            setOrders(loadedOrders);
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
    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchesStatus = statusFilter === "all" || order.status === statusFilter;
            const query = searchQuery.trim().toLowerCase();
            const matchesQuery = query === "" ||
                order.id.toLowerCase().includes(query) ||
                order.shippingAddress.fullName.toLowerCase().includes(query) ||
                order.shippingAddress.email.toLowerCase().includes(query);
            return matchesStatus && matchesQuery;
        });
    }, [orders, searchQuery, statusFilter]);
    const statusCounts = useMemo(() => ({
        pending: orders.filter((order) => order.status === "pending").length,
        processing: orders.filter((order) => order.status === "processing").length,
        completed: orders.filter((order) => order.status === "completed").length,
        shipped: orders.filter((order) => order.status === "shipped").length,
    }), [orders]);
    const handleStatusChange = async (orderId, status) => {
        try {
            const updatedOrders = await updateAdminOrderStatus(orderId, status);
            setOrders(updatedOrders);
            toast({
                title: "Order updated",
                description: `Order ${orderId} is now ${status}.`,
            });
        }
        catch (error) {
            toast({
                title: "Update failed",
                description: error instanceof Error ? error.message : "Could not update order status.",
                variant: "destructive",
            });
        }
    };
    if (!hydrated)
        return null;
    return (<div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
          Orders
        </h1>
        <p className="text-muted-foreground">
          Track, filter, and update customer order statuses.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processing
            </CardTitle>
            <Truck className="h-4 w-4 text-blue-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
              <Input placeholder="Search by order ID, customer name, or email" className="pl-9" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}/>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ORDER_STATUSES.map((status) => (<SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="hidden sm:table-cell">Placed At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (<TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No orders match the current filter.
                    </TableCell>
                  </TableRow>) : (filteredOrders.map((order) => (<TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.shippingAddress.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.shippingAddress.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {order.items.length} item{order.items.length === 1 ? "" : "s"}
                      </TableCell>
                      <TableCell>{formatPrice(order.total)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value)}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((status) => (<SelectItem key={status} value={status}>
                                <Badge className={statusColors[status]}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Badge>
                              </SelectItem>))}
                          </SelectContent>
                        </Select>
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
    </div>);
}

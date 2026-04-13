"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users, FolderTree, MapPin, Settings, ChevronLeft, Menu, LogOut, Bell, Search, } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getAdminArtisans, getAdminOrders, getAdminProducts, getCurrentUser, } from "@/lib/admin-store";
import { clearSession } from "@/lib/auth-client";
const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Artisans", href: "/admin/artisans", icon: Users },
    { name: "Categories", href: "/admin/categories", icon: FolderTree },
    { name: "Districts", href: "/admin/districts", icon: MapPin },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];
const adminPanelImage = "/images/products/nakshi-kantha.jpg";
export default function AdminLayout({ children, }) {
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userName, setUserName] = useState("Admin User");
    const [userEmail, setUserEmail] = useState("admin@heritage.com");
    const [notifications, setNotifications] = useState([]);
    useEffect(() => {
        let active = true;
        const load = async () => {
            const user = getCurrentUser();
            if (!user || user.role !== "admin") {
                router.push("/");
                return;
            }
            const [orders, products, artisans] = await Promise.all([
                getAdminOrders(),
                getAdminProducts(),
                getAdminArtisans(),
            ]);
            if (!active)
                return;
            setUserName(user.name);
            setUserEmail(user.email);
            const pendingOrders = orders.filter((order) => order.status === "pending").length;
            const outOfStockProducts = products.filter((product) => !product.inStock).length;
            const inactiveArtisans = artisans.filter((artisan) => !artisan.active).length;
            const nextNotifications = [];
            if (pendingOrders > 0) {
                nextNotifications.push(`${pendingOrders} pending order(s) need review.`);
            }
            if (outOfStockProducts > 0) {
                nextNotifications.push(`${outOfStockProducts} product(s) are out of stock.`);
            }
            if (inactiveArtisans > 0) {
                nextNotifications.push(`${inactiveArtisans} artisan profile(s) are inactive.`);
            }
            if (nextNotifications.length === 0) {
                nextNotifications.push("All systems are running normally.");
            }
            setNotifications(nextNotifications);
        };
        load().catch(() => {
            if (!active)
                return;
            setNotifications(["Unable to load notifications right now."]);
        });
        return () => {
            active = false;
        };
    }, [pathname, router]);
    const actionableNotificationCount = useMemo(() => notifications.filter((notification) => notification !== "All systems are running normally.").length, [notifications]);
    const handleLogout = () => {
        clearSession();
        router.push("/");
    };
    return (<div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (<div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)}/>)}

      {/* Sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300", sidebarCollapsed ? "w-16" : "w-64", mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!sidebarCollapsed && (<Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Package className="h-5 w-5"/>
              </div>
              <span className="font-serif text-lg font-semibold">Heritage Admin</span>
            </Link>)}
          <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <ChevronLeft className={cn("h-5 w-5 transition-transform", sidebarCollapsed && "rotate-180")}/>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
            const isActive = item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (<li key={item.name}>
                  <Link href={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground")} onClick={() => setMobileMenuOpen(false)}>
                    <item.icon className="h-5 w-5 shrink-0"/>
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>);
        })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-4">
          {!sidebarCollapsed && (<div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={adminPanelImage} alt="Traditional Bangladeshi craft"/>
                  <AvatarFallback>BH</AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </div>)}
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn("flex-1 transition-all duration-300", sidebarCollapsed ? "lg:pl-16" : "lg:pl-64")}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-5 w-5"/>
          </Button>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <Input placeholder="Search products, orders, artisans..." className="pl-9"/>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5"/>
                  {actionableNotificationCount > 0 && (<Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                      {actionableNotificationCount}
                    </Badge>)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.map((notification) => (<DropdownMenuItem key={notification} className="flex flex-col items-start gap-1 py-3">
                    <span className="text-xs text-muted-foreground">
                      {notification}
                    </span>
                  </DropdownMenuItem>))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={adminPanelImage} alt="Traditional Bangladeshi craft"/>
                    <AvatarFallback>BH</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/">View Store</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4"/>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>);
}

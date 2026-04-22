"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search, ShoppingBag, User, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { clearSession, fetchCurrentUser, getStoredUser, getStoredToken } from "@/lib/auth-client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
const navigation = [
    { name: "Home", href: "/" },
    { name: "Districts", href: "/districts" },
    { name: "Products", href: "/products" },
    { name: "Categories", href: "/categories" },
    { name: "Artisans", href: "/artisans" },
    { name: "About", href: "/about" },
];
export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [user, setUser] = useState(null);
    const pathname = usePathname();
    const router = useRouter();
    const { itemCount } = useCart();
    useEffect(() => {
        let active = true;
        const syncUser = async () => {
            const stored = getStoredUser();
            if (active) {
                setUser(stored);
            }
            if (getStoredToken()) {
                const freshUser = await fetchCurrentUser();
                if (active) {
                    setUser(freshUser);
                }
            }
        };
        syncUser();
        window.addEventListener("auth-changed", syncUser);
        return () => {
            active = false;
            window.removeEventListener("auth-changed", syncUser);
        };
    }, []);
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            globalThis.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
        }
    };
    const handleLogout = () => {
        clearSession();
        setUser(null);
        router.push("/");
    };
    return (<header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <span className="font-serif text-lg font-bold text-primary-foreground">H</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-serif text-xl font-bold text-foreground">History and Heritage</span>
            {/* <span className="ml-1 text-sm text-muted-foreground">Heritage</span> */}
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-8">
          {navigation.map((item) => (<Link key={item.name} href={item.href} className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === item.href
                ? "text-primary"
                : "text-muted-foreground")}>
              {item.name}
            </Link>))}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden md:block">
            {searchOpen ? (<form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input type="search" placeholder="Search products, districts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64" autoFocus/>
                <Button type="button" variant="ghost" size="icon" onClick={() => setSearchOpen(false)}>
                  <X className="h-5 w-5"/>
                </Button>
              </form>) : (<Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
                <Search className="h-5 w-5"/>
              </Button>)}
          </div>

          {/* Mobile search */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(!searchOpen)}>
            <Search className="h-5 w-5"/>
          </Button>

          {/* Cart */}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/cart">
              <ShoppingBag className="h-5 w-5"/>
              {itemCount > 0 && (<span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>)}
            </Link>
          </Button>

          {/* User Menu */}
          {user ? (<DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <User className="h-5 w-5"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {user.role === "admin" && (<p className="text-xs font-semibold text-primary mt-1">Admin</p>)}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">My Orders</Link>
                </DropdownMenuItem>
                {user.role === "artisan" && (<DropdownMenuItem asChild>
                    <Link href="/artisan">Artisan Dashboard</Link>
                  </DropdownMenuItem>)}
                {user.role === "admin" && (<DropdownMenuItem asChild>
                    <Link href="/admin">Admin Dashboard</Link>
                  </DropdownMenuItem>)}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4"/>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>) : (<Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
              <Link href="/auth/login">
                <LogIn className="h-5 w-5"/>
              </Link>
            </Button>)}

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? (<X className="h-6 w-6"/>) : (<Menu className="h-6 w-6"/>)}
          </Button>
        </div>
      </nav>

      {/* Mobile search bar */}
      {searchOpen && (<div className="border-t border-border px-4 py-3 md:hidden">
          <form onSubmit={handleSearch}>
            <Input type="search" placeholder="Search products, districts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full" autoFocus/>
          </form>
        </div>)}

      {/* Mobile menu */}
      {mobileMenuOpen && (<div className="border-t border-border lg:hidden">
          <div className="space-y-1 px-4 py-3">
            {navigation.map((item) => (<Link key={item.name} href={item.href} className={cn("block rounded-md px-3 py-2 text-base font-medium transition-colors", pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground")} onClick={() => setMobileMenuOpen(false)}>
                {item.name}
              </Link>))}
            <DropdownMenuSeparator className="my-3"/>
            {user ? (<>
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  My Account
                </Link>
                <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  My Orders
                </Link>
                {user.role === "artisan" && (<Link href="/artisan" onClick={() => setMobileMenuOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-primary hover:bg-primary/10 transition-colors">
                    Artisan Dashboard
                  </Link>)}
                {user.role === "admin" && (<Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-primary hover:bg-primary/10 transition-colors">
                    Admin Dashboard
                  </Link>)}
                <button onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                }} className="w-full text-left rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <LogOut className="mr-2 h-4 w-4 inline-block"/>
                  Logout
                </button>
              </>) : (<Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-primary hover:bg-primary/10 transition-colors">
                <LogIn className="mr-2 h-4 w-4 inline-block"/>
                Sign In
              </Link>)}
          </div>
        </div>)}
    </header>);
}

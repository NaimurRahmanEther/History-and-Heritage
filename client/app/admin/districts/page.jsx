"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAdminDistricts, getAdminProducts, getCurrentUser, isAdminUser, saveAdminDistricts, } from "@/lib/admin-store";
const DIVISIONS = [
    "Dhaka",
    "Chattogram",
    "Rajshahi",
    "Khulna",
    "Sylhet",
    "Rangpur",
    "Mymensingh",
    "Barishal",
];
function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
export default function AdminDistrictsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [hydrated, setHydrated] = useState(false);
    const [districts, setDistricts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [form, setForm] = useState({
        name: "",
        division: "",
        description: "",
        image: "",
    });
    const [products, setProducts] = useState([]);
    useEffect(() => {
        let active = true;
        const load = async () => {
            const user = getCurrentUser();
            if (!isAdminUser(user)) {
                router.push("/");
                return;
            }
            const [allDistricts, allProducts] = await Promise.all([
                getAdminDistricts(),
                getAdminProducts(),
            ]);
            if (!active)
                return;
            setDistricts(allDistricts);
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
    const productCountByDistrict = useMemo(() => {
        const counts = new Map();
        products.forEach((product) => {
            counts.set(product.district, (counts.get(product.district) ?? 0) + 1);
        });
        return counts;
    }, [products]);
    const filteredDistricts = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query)
            return districts;
        return districts.filter((district) => district.name.toLowerCase().includes(query) ||
            district.id.toLowerCase().includes(query) ||
            district.division.toLowerCase().includes(query));
    }, [districts, searchQuery]);
    const handleAddDistrict = async () => {
        if (!form.name.trim() || !form.division.trim()) {
            toast({
                title: "Missing fields",
                description: "District name and division are required.",
                variant: "destructive",
            });
            return;
        }
        const id = slugify(form.name);
        if (districts.some((district) => district.id === id)) {
            toast({
                title: "Duplicate district",
                description: "This district already exists.",
                variant: "destructive",
            });
            return;
        }
        const newDistrict = {
            id,
            name: form.name.trim(),
            division: form.division,
            image: form.image.trim() ||
                "https://images.unsplash.com/photo-1583422528567-5658d8b10c20?w=600&q=80",
            description: form.description.trim() || "Custom district added from admin panel.",
            productCount: 0,
            active: true,
            createdAt: new Date().toISOString(),
        };
        const updated = [newDistrict, ...districts];
        setDistricts(updated);
        await saveAdminDistricts(updated);
        setForm({ name: "", division: "", description: "", image: "" });
        toast({
            title: "District created",
            description: `${newDistrict.name} has been added.`,
        });
    };
    const handleToggleActive = async (districtId, active) => {
        const updated = districts.map((district) => district.id === districtId ? { ...district, active } : district);
        setDistricts(updated);
        await saveAdminDistricts(updated);
    };
    const handleDelete = async (districtId) => {
        const linkedProducts = productCountByDistrict.get(districtId) ?? 0;
        if (linkedProducts > 0) {
            toast({
                title: "Cannot delete district",
                description: "Reassign products linked to this district first.",
                variant: "destructive",
            });
            return;
        }
        const district = districts.find((item) => item.id === districtId);
        const updated = districts.filter((item) => item.id !== districtId);
        setDistricts(updated);
        await saveAdminDistricts(updated);
        toast({
            title: "District deleted",
            description: district ? `${district.name} has been removed.` : "District removed.",
        });
    };
    if (!hydrated)
        return null;
    return (<div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
          Districts
        </h1>
        <p className="text-muted-foreground">
          Manage geographic coverage and district metadata.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4"/>
            Add District
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="District name"/>
            </div>
            <div className="space-y-2">
              <Label>Division *</Label>
              <Select value={form.division} onValueChange={(value) => setForm({ ...form, division: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select division"/>
                </SelectTrigger>
                <SelectContent>
                  {DIVISIONS.map((division) => (<SelectItem key={division} value={division}>
                      {division}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="District summary"/>
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://..."/>
            </div>
          </div>
          <Button onClick={handleAddDistrict}>Create District</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <Input className="pl-9" placeholder="Search district by name, ID, or division" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}/>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>District</TableHead>
                  <TableHead className="hidden md:table-cell">Division</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDistricts.length === 0 ? (<TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No districts found.
                    </TableCell>
                  </TableRow>) : (filteredDistricts.map((district) => (<TableRow key={district.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground"/>
                          <div>
                            <p className="font-medium">{district.name}</p>
                            <p className="text-xs text-muted-foreground">{district.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{district.division}</TableCell>
                      <TableCell>{productCountByDistrict.get(district.id) ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={district.active} onCheckedChange={(checked) => handleToggleActive(district.id, checked)}/>
                          <Badge variant="outline">
                            {district.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(district.id)}>
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

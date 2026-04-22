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
import { Users, Search, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAdminArtisans, getAdminDistricts, getAdminProducts, getCurrentUser, isAdminUser, saveAdminArtisans, } from "@/lib/admin-store";
function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
export default function AdminArtisansPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [hydrated, setHydrated] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [artisans, setArtisans] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({
        name: "",
        specialty: "",
        districtId: "",
        yearsOfExperience: "",
        bio: "",
    });
    useEffect(() => {
        let active = true;
        const load = async () => {
            const user = getCurrentUser();
            if (!isAdminUser(user)) {
                router.push("/");
                return;
            }
            const [allArtisans, allDistricts] = await Promise.all([
                getAdminArtisans(),
                getAdminDistricts(),
            ]);
            if (!active)
                return;
            setArtisans(allArtisans);
            setDistricts(allDistricts.filter((district) => district.active));
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
    const productCountByArtisan = useMemo(() => {
        const counts = new Map();
        products.forEach((product) => {
            if (!product.artisan)
                return;
            counts.set(product.artisan, (counts.get(product.artisan) ?? 0) + 1);
        });
        return counts;
    }, [products]);
    useEffect(() => {
        let active = true;
        getAdminProducts()
            .then((data) => {
            if (!active)
                return;
            setProducts(data);
        })
            .catch(() => {
            if (!active)
                return;
            setProducts([]);
        });
        return () => {
            active = false;
        };
    }, []);
    const filteredArtisans = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query)
            return artisans;
        return artisans.filter((artisan) => artisan.name.toLowerCase().includes(query) ||
            artisan.specialty.toLowerCase().includes(query) ||
            artisan.district.toLowerCase().includes(query));
    }, [artisans, searchQuery]);
    const handleAddArtisan = async () => {
        if (!form.name.trim() || !form.specialty.trim() || !form.districtId) {
            toast({
                title: "Missing fields",
                description: "Name, specialty, and district are required.",
                variant: "destructive",
            });
            return;
        }
        const district = districts.find((item) => item.id === form.districtId);
        if (!district) {
            toast({
                title: "Invalid district",
                description: "Please select a valid district.",
                variant: "destructive",
            });
            return;
        }
        const newArtisan = {
            id: `artisan-${slugify(form.name)}-${Date.now()}`,
            name: form.name.trim(),
            image: "",
            district: district.name,
            districtId: district.id,
            specialty: form.specialty.trim(),
            bio: form.bio.trim() || "Independent artisan profile.",
            story: form.bio.trim() ||
                "This artisan preserves traditional craft techniques and contributes to local cultural heritage.",
            yearsOfExperience: Math.max(0, Number(form.yearsOfExperience) || 0),
            productCount: 0,
            active: true,
            createdAt: new Date().toISOString(),
        };
        const updated = [newArtisan, ...artisans];
        setArtisans(updated);
        await saveAdminArtisans(updated);
        setForm({
            name: "",
            specialty: "",
            districtId: "",
            yearsOfExperience: "",
            bio: "",
        });
        toast({
            title: "Artisan added",
            description: `${newArtisan.name} has been added.`,
        });
    };
    const handleToggleActive = async (artisanId, active) => {
        const updated = artisans.map((artisan) => artisan.id === artisanId ? { ...artisan, active } : artisan);
        setArtisans(updated);
        await saveAdminArtisans(updated);
    };
    const handleDelete = async (artisanId) => {
        const artisan = artisans.find((item) => item.id === artisanId);
        const updated = artisans.filter((item) => item.id !== artisanId);
        setArtisans(updated);
        await saveAdminArtisans(updated);
        toast({
            title: "Artisan removed",
            description: artisan ? `${artisan.name} has been removed.` : "Artisan removed.",
        });
    };
    if (!hydrated)
        return null;
    return (<div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
          Artisans
        </h1>
        <p className="text-muted-foreground">
          Create and maintain artisan profiles used across the store.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4"/>
            Add Artisan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Artisan name"/>
            </div>
            <div className="space-y-2">
              <Label>Specialty *</Label>
              <Input value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} placeholder="Enter specialty"/>
            </div>
            <div className="space-y-2">
              <Label>District *</Label>
              <Select value={form.districtId} onValueChange={(value) => setForm({ ...form, districtId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select district"/>
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (<SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Experience (years)</Label>
              <Input type="number" min={0} value={form.yearsOfExperience} onChange={(event) => setForm({ ...form, yearsOfExperience: event.target.value })} placeholder="10"/>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddArtisan} className="w-full">
                Add Artisan
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Short Bio</Label>
            <Input value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="A short bio for artisan cards"/>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <Input className="pl-9" placeholder="Search by name, specialty, or district" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}/>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artisan</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead className="hidden md:table-cell">District</TableHead>
                  <TableHead className="hidden md:table-cell">Experience</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArtisans.length === 0 ? (<TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No artisans found.
                    </TableCell>
                  </TableRow>) : (filteredArtisans.map((artisan) => (<TableRow key={artisan.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground"/>
                          <div>
                            <p className="font-medium">{artisan.name}</p>
                            <p className="text-xs text-muted-foreground">{artisan.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{artisan.specialty}</TableCell>
                      <TableCell className="hidden md:table-cell">{artisan.district}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {artisan.yearsOfExperience} years
                      </TableCell>
                      <TableCell>{productCountByArtisan.get(artisan.id) ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={artisan.active} onCheckedChange={(checked) => handleToggleActive(artisan.id, checked)}/>
                          <Badge variant="outline">
                            {artisan.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(artisan.id)}>
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

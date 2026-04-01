"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    joinDate: "",
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/auth/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setFormData({
        name: parsedUser.name || "",
        email: parsedUser.email || "",
        phone: parsedUser.phone || "+880 1XX XXXX XXX",
        address: parsedUser.address || "123 Main Street, Dhaka, Bangladesh",
        joinDate: new Date().toLocaleDateString(),
      });
    } catch {
      router.push("/auth/login");
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        ...user,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      })
    );
    setUser({
      ...user,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    });
    setIsEditing(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-8 lg:py-12">
        <div className="mx-auto max-w-2xl px-4 lg:px-8">
          <Button variant="ghost" className="mb-8 gap-2" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
                My Account
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage your profile and account settings
              </p>
            </div>

            {/* Account Info Card */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Profile Information
                </h2>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => {
                    if (isEditing) {
                      handleSaveChanges();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                >
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="disabled:opacity-50"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="disabled:opacity-50"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="disabled:opacity-50"
                  />
                </div>

                {/* Join Date */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </Label>
                  <Input
                    value={formData.joinDate}
                    disabled
                    className="disabled:opacity-50"
                  />
                </div>

                {/* Address */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="disabled:opacity-50"
                  />
                </div>
              </div>

              {isEditing && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              )}
            </div>

            {/* Account Actions */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="font-serif text-xl font-bold text-foreground">
                Account Settings
              </h2>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/orders">
                  View My Orders
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/cart">
                  View Cart
                </Link>
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  localStorage.removeItem("user");
                  router.push("/");
                }}
              >
                Logout
              </Button>
            </div>

            {/* Account Type Badge */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Account Type:</strong>{" "}
                {user.role === "admin" ? "Administrator" : "Customer"}
              </p>
              {user.role === "admin" && (
                <Button size="sm" variant="outline" className="mt-2" asChild>
                  <Link href="/admin">
                    Go to Admin Dashboard
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { apiRequest } from "@/lib/api-client";
import {
  clearSession,
  fetchCurrentUser,
  getStoredToken,
  getStoredUser,
  saveSession,
} from "@/lib/auth-client";
import {
  getMyArtisanApplication,
  submitArtisanApplication,
} from "@/lib/artisan-store";
import { getDynamicDistricts } from "@/lib/dynamic-data";

function getDefaultApplicationForm(user) {
  return {
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    districtId: "",
    specialty: "",
    yearsOfExperience: "",
    bio: "",
    story: "",
    sampleWorkUrl: "",
  };
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [applicationError, setApplicationError] = useState("");
  const [application, setApplication] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    joinDate: "",
  });
  const [artisanForm, setArtisanForm] = useState(getDefaultApplicationForm(null));

  useEffect(() => {
    if (!getStoredToken()) {
      router.push("/auth/login");
      return;
    }

    let active = true;
    const loadUser = async () => {
      const storedUser = getStoredUser();
      if (storedUser && active) {
        setUser(storedUser);
        setFormData({
          name: storedUser.name || "",
          email: storedUser.email || "",
          phone: storedUser.phone || "",
          address: "",
          joinDate: new Date().toLocaleDateString(),
        });
      }

      const currentUser = await fetchCurrentUser();
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }

      const [nextApplication, nextDistricts] = await Promise.all([
        getMyArtisanApplication().catch(() => null),
        getDynamicDistricts().catch(() => []),
      ]);

      if (!active) return;

      setUser(currentUser);
      setApplication(nextApplication);
      setDistricts(nextDistricts);
      setFormData({
        name: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        address: "",
        joinDate: new Date().toLocaleDateString(),
      });

      const baseForm = getDefaultApplicationForm(currentUser);
      if (nextApplication) {
        setArtisanForm({
          ...baseForm,
          fullName: nextApplication.fullName || baseForm.fullName,
          email: nextApplication.email || baseForm.email,
          phone: nextApplication.phone || baseForm.phone,
          districtId: nextApplication.districtId || "",
          specialty: nextApplication.specialty || "",
          yearsOfExperience: String(nextApplication.yearsOfExperience || ""),
          bio: nextApplication.bio || "",
          story: nextApplication.story || "",
          sampleWorkUrl: nextApplication.sampleWorkUrl || "",
        });
      } else {
        setArtisanForm(baseForm);
      }
    };

    loadUser().catch(() => {
      if (!active) return;
      router.push("/auth/login");
    });

    return () => {
      active = false;
    };
  }, [router]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArtisanInputChange = (event) => {
    const { name, value } = event.target;
    setArtisanForm((prev) => ({ ...prev, [name]: value }));
    if (applicationError) {
      setApplicationError("");
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    try {
      const response = await apiRequest("/auth/profile", {
        method: "PATCH",
        withAuth: true,
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        }),
      });
      setUser(response.user);
      saveSession({
        token: getStoredToken(),
        user: response.user,
      });
      setIsEditing(false);
    } catch {
      // keep existing state
    }
  };

  const handleSubmitApplication = async (event) => {
    event.preventDefault();
    setApplicationError("");
    setIsSubmittingApplication(true);

    try {
      const submitted = await submitArtisanApplication({
        fullName: artisanForm.fullName,
        email: artisanForm.email,
        phone: artisanForm.phone,
        districtId: artisanForm.districtId,
        specialty: artisanForm.specialty,
        yearsOfExperience: Number(artisanForm.yearsOfExperience || 0),
        bio: artisanForm.bio,
        story: artisanForm.story || artisanForm.bio,
        sampleWorkUrl: artisanForm.sampleWorkUrl,
      });
      setApplication(submitted);
    } catch (error) {
      setApplicationError(error instanceof Error ? error.message : "Failed to submit application.");
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const accountTypeLabel = useMemo(() => {
    if (!user) return "Customer";
    if (user.role === "admin") return "Administrator";
    if (user.role === "artisan") return "Artisan";
    return "Customer";
  }, [user]);

  if (!user) {
    return null;
  }

  const canApplyAsArtisan = user.role === "customer";
  const showApplicationForm =
    canApplyAsArtisan && (!application || application.status === "rejected");

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
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
                My Account
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage your profile and account settings
              </p>
            </div>

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
                    placeholder="Enter your phone number"
                    disabled={!isEditing}
                    className="disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </Label>
                  <Input value={formData.joinDate} disabled className="disabled:opacity-50" />
                </div>

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
                    placeholder="Enter your address"
                    disabled={!isEditing}
                    className="disabled:opacity-50"
                  />
                </div>
              </div>

              {isEditing && (
                <Button variant="outline" className="w-full" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="font-serif text-xl font-bold text-foreground">Account Settings</h2>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/orders">View My Orders</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/cart">View Cart</Link>
              </Button>
              {user.role === "artisan" && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/artisan">Open Artisan Dashboard</Link>
                </Button>
              )}
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  clearSession();
                  router.push("/");
                }}
              >
                Logout
              </Button>
            </div>

            {canApplyAsArtisan && (
              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <h2 className="font-serif text-xl font-bold text-foreground">Become an Artisan</h2>
                <p className="text-sm text-muted-foreground">
                  Submit your artisan profile for review. You can reapply if your application is
                  not approved.
                </p>

                {application?.status === "pending" && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                    Your application is currently <strong>pending</strong> review.
                  </div>
                )}

                {application?.status === "approved" && (
                  <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
                    Your artisan application was approved. Please sign out and sign in again if
                    your role does not update immediately.
                  </div>
                )}

                {application?.status === "rejected" && (
                  <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
                    <p className="font-medium">Application rejected</p>
                    <p className="mt-1">
                      Reason: {application.rejectionReason || "No feedback provided."}
                    </p>
                    <p className="mt-1">You can update the form and reapply below.</p>
                  </div>
                )}

                {showApplicationForm && (
                  <form className="space-y-4" onSubmit={handleSubmitApplication}>
                    {applicationError && (
                      <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {applicationError}
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="artisan-fullName">Full Name *</Label>
                        <Input
                          id="artisan-fullName"
                          name="fullName"
                          value={artisanForm.fullName}
                          onChange={handleArtisanInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="artisan-email">Email *</Label>
                        <Input
                          id="artisan-email"
                          name="email"
                          type="email"
                          value={artisanForm.email}
                          onChange={handleArtisanInputChange}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="artisan-phone">Phone *</Label>
                        <Input
                          id="artisan-phone"
                          name="phone"
                          value={artisanForm.phone}
                          onChange={handleArtisanInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>District *</Label>
                        <Select
                          value={artisanForm.districtId}
                          onValueChange={(value) => {
                            setArtisanForm((prev) => ({ ...prev, districtId: value }));
                            if (applicationError) {
                              setApplicationError("");
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map((district) => (
                              <SelectItem key={district.id} value={district.id}>
                                {district.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="artisan-specialty">Specialty *</Label>
                        <Input
                          id="artisan-specialty"
                          name="specialty"
                          value={artisanForm.specialty}
                          onChange={handleArtisanInputChange}
                          placeholder="Enter your specialty"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="artisan-exp">Years of Experience</Label>
                        <Input
                          id="artisan-exp"
                          name="yearsOfExperience"
                          type="number"
                          min={0}
                          value={artisanForm.yearsOfExperience}
                          onChange={handleArtisanInputChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="artisan-bio">Bio *</Label>
                      <Textarea
                        id="artisan-bio"
                        name="bio"
                        rows={3}
                        value={artisanForm.bio}
                        onChange={handleArtisanInputChange}
                        placeholder="Describe your craft background and expertise."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="artisan-story">Story</Label>
                      <Textarea
                        id="artisan-story"
                        name="story"
                        rows={4}
                        value={artisanForm.story}
                        onChange={handleArtisanInputChange}
                        placeholder="Share the story behind your work."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="artisan-sample">Portfolio URL (Optional)</Label>
                      <Input
                        id="artisan-sample"
                        name="sampleWorkUrl"
                        value={artisanForm.sampleWorkUrl}
                        onChange={handleArtisanInputChange}
                        placeholder="Add a portfolio or social profile link"
                      />
                    </div>

                    <Button className="w-full" type="submit" disabled={isSubmittingApplication}>
                      {isSubmittingApplication ? "Submitting..." : "Submit Artisan Application"}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {user.role !== "customer" && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Account Type:</strong> {accountTypeLabel}
                </p>
                {user.role === "admin" && (
                  <Button size="sm" variant="outline" className="mt-2" asChild>
                    <Link href="/admin">Go to Admin Dashboard</Link>
                  </Button>
                )}
                {user.role === "artisan" && (
                  <Button size="sm" variant="outline" className="mt-2" asChild>
                    <Link href="/artisan">Go to Artisan Dashboard</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

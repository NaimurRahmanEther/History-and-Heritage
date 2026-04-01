"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, RotateCcw, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getAdminSettings,
  getCurrentUser,
  isAdminUser,
  saveAdminSettings,
  type AdminSettings,
} from "@/lib/admin-store";

const SETTINGS_DEFAULTS: Omit<AdminSettings, "updatedAt"> = {
  storeName: "Bangladesh Heritage",
  storeEmail: "admin@heritage.com",
  storePhone: "+880 1700 000000",
  storeAddress: "Dhaka, Bangladesh",
  currencySymbol: "BDT",
  shippingFee: 200,
  freeShippingThreshold: 5000,
  lowStockThreshold: 5,
  maintenanceMode: false,
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>({
    ...SETTINGS_DEFAULTS,
    updatedAt: new Date().toISOString(),
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (!isAdminUser(user)) {
      router.push("/");
      return;
    }

    setSettings(getAdminSettings());
    setHydrated(true);
  }, [router]);

  const handleSave = () => {
    const normalized: AdminSettings = {
      ...settings,
      storeName: settings.storeName.trim(),
      storeEmail: settings.storeEmail.trim(),
      storePhone: settings.storePhone.trim(),
      storeAddress: settings.storeAddress.trim(),
      currencySymbol: settings.currencySymbol.trim() || "BDT",
      shippingFee: Math.max(0, Number(settings.shippingFee) || 0),
      freeShippingThreshold: Math.max(0, Number(settings.freeShippingThreshold) || 0),
      lowStockThreshold: Math.max(0, Number(settings.lowStockThreshold) || 0),
      updatedAt: new Date().toISOString(),
    };

    saveAdminSettings(normalized);
    setSettings(normalized);
    toast({
      title: "Settings saved",
      description: "Admin settings have been updated.",
    });
  };

  const handleReset = () => {
    const resetState: AdminSettings = {
      ...SETTINGS_DEFAULTS,
      updatedAt: new Date().toISOString(),
    };
    setSettings(resetState);
    saveAdminSettings(resetState);
    toast({
      title: "Settings reset",
      description: "Defaults have been restored.",
    });
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure store-level behavior for the admin dashboard.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Store Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input
                value={settings.storeName}
                onChange={(event) =>
                  setSettings({ ...settings, storeName: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Store Email</Label>
              <Input
                type="email"
                value={settings.storeEmail}
                onChange={(event) =>
                  setSettings({ ...settings, storeEmail: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Store Phone</Label>
              <Input
                value={settings.storePhone}
                onChange={(event) =>
                  setSettings({ ...settings, storePhone: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Currency Symbol</Label>
              <Input
                value={settings.currencySymbol}
                onChange={(event) =>
                  setSettings({ ...settings, currencySymbol: event.target.value })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Store Address</Label>
              <Input
                value={settings.storeAddress}
                onChange={(event) =>
                  setSettings({ ...settings, storeAddress: event.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commerce Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Shipping Fee</Label>
              <Input
                type="number"
                min={0}
                value={settings.shippingFee}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    shippingFee: Number(event.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Free Shipping Threshold</Label>
              <Input
                type="number"
                min={0}
                value={settings.freeShippingThreshold}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    freeShippingThreshold: Number(event.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Low Stock Threshold</Label>
              <Input
                type="number"
                min={0}
                value={settings.lowStockThreshold}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    lowStockThreshold: Number(event.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">
                Mark the store as under maintenance for planned updates.
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, maintenanceMode: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(settings.updatedAt).toLocaleString()}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Defaults
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

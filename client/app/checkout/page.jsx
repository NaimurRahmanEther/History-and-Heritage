"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Truck, Shield, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/components/ui/use-toast";
import { formatPrice } from "@/lib/data";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/api-client";
import { fetchCurrentUser, getStoredToken, getStoredUser } from "@/lib/auth-client";
export default function CheckoutPage() {
    const router = useRouter();
    const { items, total, subtotal, clearCart } = useCart();
    const { toast } = useToast();
    const [hydrated, setHydrated] = useState(false);
    const [user, setUser] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [checkoutError, setCheckoutError] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        district: "",
        postalCode: "",
    });
    useEffect(() => {
        let active = true;
        const loadUser = async () => {
            const hasToken = Boolean(getStoredToken());
            const storedUser = hasToken ? getStoredUser() : null;
            if (storedUser && active) {
                setUser(storedUser);
                setFormData((prev) => ({
                    ...prev,
                    fullName: storedUser.name || "",
                    email: storedUser.email || "",
                    phone: storedUser.phone || "",
                }));
            }
            if (hasToken) {
                const currentUser = await fetchCurrentUser();
                if (currentUser && active) {
                    setUser(currentUser);
                    setFormData((prev) => ({
                        ...prev,
                        fullName: currentUser.name || "",
                        email: currentUser.email || "",
                        phone: currentUser.phone || "",
                    }));
                }
            }
        };
        loadUser().catch(() => {
            if (!active)
                return;
            setUser(null);
        }).finally(() => {
            if (!active)
                return;
            setHydrated(true);
        });
        return () => {
            active = false;
        };
    }, []);
    if (!hydrated) {
        return null;
    }
    // Redirect if not logged in
    if (!user) {
        return (<div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-md text-center">
              <h1 className="font-serif text-2xl font-bold text-foreground">You need to sign in</h1>
              <p className="mt-2 text-muted-foreground">Please log in to proceed with checkout</p>
              <div className="mt-8 flex gap-3">
                <Button className="flex-1 w-full" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button variant="outline" className="flex-1 w-full" asChild>
                  <Link href="/auth/register">
                    Sign Up
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>);
    }
    // Redirect if cart is empty
    if (items.length === 0) {
        return (<div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-md text-center">
              <h1 className="font-serif text-2xl font-bold text-foreground">Cart is empty</h1>
              <p className="mt-2 text-muted-foreground">Add items to your cart to proceed with checkout</p>
              <Button className="mt-8" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>);
    }
    const cartProducts = items.filter((item) => item.product);
    const shipping = subtotal > 5000 ? 0 : 200;
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (checkoutError) {
            setCheckoutError("");
        }
    };
    const validateShippingFields = () => {
        const requiredFields = [
            { key: "fullName", label: "Full Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone Number" },
            { key: "address", label: "Street Address" },
            { key: "city", label: "City" },
            { key: "district", label: "District" },
        ];
        const missingFields = requiredFields.filter((field) => !formData[field.key].trim());
        if (missingFields.length > 0) {
            const message = `Please fill in: ${missingFields
                .map((field) => field.label)
                .join(", ")}.`;
            setCheckoutError(message);
            toast({
                title: "Missing Information",
                description: message,
                variant: "destructive",
            });
            return false;
        }
        return true;
    };
    const goToPaymentStep = () => {
        if (!validateShippingFields()) {
            return;
        }
        setCheckoutError("");
        setCurrentStep(2);
    };
    const goToReviewStep = () => {
        if (!paymentMethod) {
            const message = "Please select a payment method.";
            setCheckoutError(message);
            toast({
                title: "Payment Required",
                description: message,
                variant: "destructive",
            });
            return;
        }
        setCheckoutError("");
        setCurrentStep(3);
    };
    const handlePlaceOrder = async () => {
        if (isProcessing) {
            return;
        }
        if (!validateShippingFields()) {
            return;
        }
        if (!paymentMethod) {
            const message = "Please select a payment method.";
            setCheckoutError(message);
            toast({
                title: "Payment Required",
                description: message,
                variant: "destructive",
            });
            return;
        }
        if (cartProducts.length === 0) {
            const message = "Cart items are unavailable. Please refresh your cart and try again.";
            setCheckoutError(message);
            toast({
                title: "Cart items unavailable",
                description: message,
                variant: "destructive",
            });
            return;
        }
        setCheckoutError("");
        setIsProcessing(true);
        try {
            const response = await apiRequest("/orders", {
                method: "POST",
                withAuth: true,
                body: JSON.stringify({
                    paymentMethod,
                    shippingAddress: {
                        fullName: formData.fullName,
                        email: formData.email,
                        phone: formData.phone,
                        address: formData.address,
                        city: formData.city,
                        district: formData.district,
                        postalCode: formData.postalCode,
                    },
                }),
            });
            // Clear cart
            clearCart();
            toast({
                title: "Order placed successfully!",
                description: `Order ID: ${response.order.id}`,
            });
            // Redirect to success page
            router.push(`/order-confirmation/${response.order.id}`);
        }
        catch (error) {
            console.error("Error placing order:", error);
            const message = "Failed to place order. Please try again.";
            setCheckoutError(message);
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        }
        finally {
            setIsProcessing(false);
        }
    };
    return (<div className="min-h-screen bg-background">
      <Navbar />

      <main className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link href="/cart">
                <ArrowLeft className="h-4 w-4"/>
                Back to Cart
              </Link>
            </Button>
            <h1 className="mt-4 font-serif text-3xl font-bold text-foreground">Checkout</h1>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {checkoutError && (<div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {checkoutError}
                </div>)}
              {/* Step Indicator */}
              <div className="mb-8 flex items-center justify-between">
                <div className={cn("flex items-center gap-2", currentStep >= 1 ? "text-primary" : "text-muted-foreground")}>
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-full font-semibold", currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {currentStep > 1 ? <Check className="h-4 w-4"/> : "1"}
                  </div>
                  <span className="hidden sm:inline">Shipping</span>
                </div>
                <div className={cn("flex-1 h-1 mx-2", currentStep >= 2 ? "bg-primary" : "bg-muted")}/>
                <div className={cn("flex items-center gap-2", currentStep >= 2 ? "text-primary" : "text-muted-foreground")}>
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-full font-semibold", currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {currentStep > 2 ? <Check className="h-4 w-4"/> : "2"}
                  </div>
                  <span className="hidden sm:inline">Payment</span>
                </div>
                <div className={cn("flex-1 h-1 mx-2", currentStep >= 3 ? "bg-primary" : "bg-muted")}/>
                <div className={cn("flex items-center gap-2", currentStep >= 3 ? "text-primary" : "text-muted-foreground")}>
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-full font-semibold", currentStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {currentStep > 3 ? <Check className="h-4 w-4"/> : "3"}
                  </div>
                  <span className="hidden sm:inline">Review</span>
                </div>
              </div>

              {/* Shipping Information */}
              {currentStep === 1 && (<div className="rounded-lg border border-border p-6">
                  <h2 className="font-serif text-xl font-bold text-foreground mb-6">Shipping Address</h2>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Enter your full name" className="mt-2"/>
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Enter your email address" className="mt-2"/>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter your phone number" className="mt-2"/>
                      </div>
                      <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleInputChange} placeholder="Enter postal code" className="mt-2"/>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Street Address *</Label>
                      <Input id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Enter street address" className="mt-2"/>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input id="city" name="city" value={formData.city} onChange={handleInputChange} placeholder="Enter city" className="mt-2"/>
                      </div>
                      <div>
                        <Label htmlFor="district">District *</Label>
                        <Input id="district" name="district" value={formData.district} onChange={handleInputChange} placeholder="Enter district" className="mt-2"/>
                      </div>
                    </div>
                  </div>

                  <Button onClick={goToPaymentStep} className="w-full mt-6 gap-2">
                    Continue to Payment <ChevronRight className="h-4 w-4"/>
                  </Button>
                </div>)}

              {/* Payment Information */}
              {currentStep === 2 && (<div className="rounded-lg border border-border p-6">
                  <h2 className="font-serif text-xl font-bold text-foreground mb-6">Payment Method</h2>
                  <div className="space-y-3">
                    {[
                { id: "card", label: "Credit/Debit Card", description: "Visa, Mastercard, or other card" },
                { id: "bkash", label: "bKash", description: "Mobile banking" },
                { id: "nagad", label: "Nagad", description: "Mobile banking" },
                { id: "rocket", label: "Rocket", description: "Mobile banking" },
                { id: "cod", label: "Cash on Delivery", description: "Pay when you receive the order" },
            ].map((method) => (<label key={method.id} className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                        <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    if (checkoutError) {
                        setCheckoutError("");
                    }
                }} className="h-4 w-4"/>
                        <div>
                          <p className="font-medium text-foreground">{method.label}</p>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                      </label>))}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button onClick={goToReviewStep} className="flex-1 gap-2">
                      Review Order <ChevronRight className="h-4 w-4"/>
                    </Button>
                  </div>
                </div>)}

              {/* Order Review */}
              {currentStep === 3 && (<div className="rounded-lg border border-border p-6">
                  <h2 className="font-serif text-xl font-bold text-foreground mb-6">Review Your Order</h2>

                  {/* Shipping Info */}
                  <div className="mb-6 pb-6 border-b border-border">
                    <h3 className="font-semibold text-foreground mb-2">Shipping Address</h3>
                    <p className="text-sm text-muted-foreground">
                      {formData.fullName}<br />
                      {formData.address}<br />
                      {formData.city}, {formData.district} {formData.postalCode}<br />
                      {formData.phone}
                    </p>
                  </div>

                  {/* Payment Method */}
                  <div className="mb-6 pb-6 border-b border-border">
                    <h3 className="font-semibold text-foreground mb-2">Payment Method</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod.toUpperCase()}
                    </p>
                  </div>

                  {/* Items */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-foreground mb-3">Order Items</h3>
                    <div className="space-y-3">
                      {cartProducts.map((item) => (<div key={item.productId} className="flex gap-3 py-3 border-b border-border last:border-0">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                            <Image src={item.product.image} alt={item.product.name} fill className="object-cover"/>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground text-sm">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground">
                              {formatPrice(item.product.price * item.quantity)}
                            </p>
                          </div>
                        </div>))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                      Back
                    </Button>
                    <Button onClick={handlePlaceOrder} disabled={isProcessing || cartProducts.length === 0} className="flex-1 gap-2">
                      {isProcessing ? "Processing..." : "Place Order"}
                    </Button>
                  </div>
                </div>)}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-lg border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">Order Summary</h3>

                <div className="space-y-3 mb-6 pb-6 border-b border-border max-h-64 overflow-y-auto">
                  {cartProducts.map((item) => (<div key={item.productId} className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {item.product.name.substring(0, 20)}... x {item.quantity}
                      </span>
                      <span className="font-medium text-foreground">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>))}
                </div>

                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-4 w-4"/>
                      Shipping
                    </span>
                    <span className="font-medium text-foreground">
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between mb-6 text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>

                <div className="space-y-2 pt-6 border-t border-border text-xs text-muted-foreground">
                  <div className="flex gap-2">
                    <Shield className="h-4 w-4 shrink-0"/>
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex gap-2">
                    <Truck className="h-4 w-4 shrink-0"/>
                    <span>Free shipping over BDT 5000</span>
                  </div>
                  <div className="flex gap-2">
                    <Clock className="h-4 w-4 shrink-0"/>
                    <span>2-5 business days delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>);
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { loginUser, saveSession } from "@/lib/auth-client";
export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        // Mock login validation
        if (!email || !password) {
            setError("Please fill in all fields");
            setIsLoading(false);
            return;
        }
        try {
            const payload = await loginUser(email, password);
            saveSession(payload);
            router.push("/");
        }
        catch (apiError) {
            setError(apiError instanceof Error ? apiError.message : "Invalid email or password");
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold text-foreground">Welcome Back</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to your account to continue shopping
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>)}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"/>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10"/>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"/>
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? (<EyeOff className="h-5 w-5"/>) : (<Eye className="h-5 w-5"/>)}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            {/* Demo Credentials */}
            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              <p className="font-medium text-foreground mb-2">Demo Credentials:</p>
              <p className="text-muted-foreground">User: user@example.com</p>
              <p className="text-muted-foreground">Password: demo123</p>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/register" className="font-medium text-primary hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>);
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context-supabase";
import Link from "next/link";

const formSchema = z.object({
  // Accept either a valid email OR the Admin ID 'Air01'
  email: z
    .string()
    .min(1, "Email or Admin ID is required")
    .refine(
      (val) => val === "Air01" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Enter a valid email or 'Air01'"
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
});


type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, loading } = useAuth();
  
  // Check for welcome parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('welcome') === 'true') {
      toast({
        title: "Welcome to upGrad!",
        description: "Your account has been created successfully. Please login to continue.",
      });
    }
  }, [toast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    if (loading) return; // Prevent double submission
    
    try {
      await login(data.email, data.password);
      toast({
        title: "Login successful!",
        description: "Welcome back!",
      });
      // Small delay to show success message
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/landing" className="inline-flex items-center gap-2 text-white hover:text-blue-300 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-white">
                upGrad
              </h1>
            </div>
          </div>
        </div>

        <Card className="bg-black/70 border-gray-800/50 backdrop-blur-xl shadow-2xl shadow-black/70">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
              <CardDescription className="text-gray-300">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email or Username</Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="Enter your email or username"
                    {...register("email")}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    {...register("password")}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                <div className="text-center">
                  <p className="text-gray-300 text-sm">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-blue-300 hover:text-blue-200 font-medium">
                      Sign up here
                    </Link>
                  </p>
                </div>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-xs text-gray-400 mb-2">Demo Credentials:</p>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div><strong>Admin:</strong> Air01 / Omkar@123</div>
                    <div><strong>Or create your own account</strong></div>
                  </div>
                </div>
              </CardFooter>
            </form>
          </Card>
      </div>
    </div>
  );
}
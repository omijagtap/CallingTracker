"use client";

import { useState } from "react";
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
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    try {
      console.log('Creating account for:', data.email);
      await signUp(data.email, data.password, data.name);
      toast({ 
        title: "Account created successfully!", 
        description: "Please login to continue. Welcome to upGrad!" 
      });
      // Redirect to login page after successful signup
      setTimeout(() => {
        router.push("/login?welcome=true");
      }, 1000);
    } catch (error: any) {
      const errorMessage = error.message || "Please try again.";
      
      // If user already exists, show specific message and redirect to login
      if (errorMessage.includes('already registered')) {
        toast({
          title: "Account already exists",
          description: "This email is already registered. Redirecting to login...",
          variant: "destructive",
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        toast({
          title: "Signup failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
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
              <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
              <CardDescription className="text-gray-300">
                Enter your details to create a new account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    {...register("name")}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
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
                    placeholder="Enter your password (min 6 characters)"
                    {...register("password")}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
                <div className="text-center">
                  <p className="text-gray-300 text-sm">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-300 hover:text-blue-200 font-medium">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </CardFooter>
            </form>
          </Card>
      </div>
    </div>
  );
}

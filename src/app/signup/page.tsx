"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Inline UI Components to avoid import issues
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-black/70 border border-gray-800/50 backdrop-blur-xl shadow-2xl shadow-black/70 rounded-lg ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pb-0 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-2xl font-bold text-white ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-gray-300 ${className}`}>{children}</p>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const CardFooter = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({ children, className = "", disabled = false, type = "button", ...props }: any) => (
  <button 
    type={type}
    disabled={disabled}
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Input = ({ className = "", ...props }: any) => (
  <input 
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Label = ({ children, className = "", ...props }: any) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
    {children}
  </label>
);

// Simple toast function (inline)
const useToast = () => ({
  toast: ({ title, description, variant }: any) => {
    console.log(`Toast: ${title} - ${description}`);
  }
});

// Simple auth hook (inline)
const useAuth = () => ({
  register: async (email: string, password: string, name: string) => {
    console.log('Register:', email, name);
    // Simulate registration
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  loading: false
});

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});


type FormValues = z.infer<typeof formSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register: registerUser, loading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      console.log('Creating account for:', data.email);
      await registerUser(data.email, data.password, data.name);
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
                <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg" disabled={loading}>
                  {loading ? (
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

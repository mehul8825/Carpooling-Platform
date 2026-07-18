"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, User, Loader2, ArrowRight, Phone, KeyRound, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { loginUserAction, registerUserAction } from "@/app/actions/auth";

interface AuthFormProps {
  mode: "signin" | "signup" | "admin";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Signup fields
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        if (mode === "signup") {
          const res = await registerUserAction({ name, phone: mobile, email, username, password });
          if (res.success) {
            toast.success("Account created successfully!");
            router.push("/auth/signin");
          } else {
            toast.error(res.error || "Failed to create account.");
          }
        } else {
          const res = await loginUserAction(username, password);
          if (res.success) {
            if (res.forcePasswordChange) {
              toast.info("Please change your temporary password.");
              router.push(`/auth/change-password?userId=${res.user?.id}`);
              return;
            }
            toast.success("Logged in successfully!");
            router.push(res.role === "ADMIN" ? "/admin" : "/employee");
          } else {
            toast.error(res.error || "Invalid username or password.");
          }
        }
      } catch (err) {
        toast.error("An unexpected error occurred.");
      }
    });
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-primary/10 bg-background/95 backdrop-blur-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center tracking-tight">
          {mode === "signin" ? "Sign In" : "Create an Account"}
        </CardTitle>
        <CardDescription className="text-center">
          {mode === "signin"
            ? "Enter your username and password to sign in"
            : "Fill in the details below to register"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Full Name
                </label>
                <Input
                  placeholder="John Doe"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Mobile Number
                </label>
                <Input
                  placeholder="1234567890"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </label>
                <Input
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Username
            </label>
            <Input
              placeholder="johndoe123"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                Password
              </label>
              {mode === "signin" && (
                <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Forgot password flow coming soon!"); }} className="text-xs text-blue-600 hover:underline">
                  Forgot password?
                </a>
              )}
            </div>
            <Input
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-4" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "signin" ? "Signing In..." : "Creating Account..."}
              </>
            ) : (
              <>
                {mode === "signin" ? "Sign In" : "Sign Up"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>


        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <p className="text-sm text-center text-muted-foreground w-full">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </>
          )}
        </p>
      </CardFooter>
    </Card>
  );
}

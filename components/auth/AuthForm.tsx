"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { sendOtpAction, verifyOtpAction } from "@/app/actions/auth";
import { toast } from "sonner";
import { Mail, User, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AuthFormProps {
  mode: "signin" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    if (mode === "signup" && !name) return toast.error("Please enter your name");

    startTransition(async () => {
      const res = await sendOtpAction(email, name, mode === "signup");
      if (res.success) {
        toast.success("Verification code sent to your email!");
        setStep("otp");
      } else {
        toast.error(res.error || "Failed to send code.");
      }
    });
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Please enter a valid 6-digit code");

    startTransition(async () => {
      const res = await verifyOtpAction(email, otp);
      if (res.success) {
        toast.success("Successfully authenticated!");
        router.push("/");
        router.refresh();
      } else {
        toast.error(res.error || "Verification failed.");
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
          {step === "email"
            ? mode === "signin"
              ? "Enter your email to sign in to your account"
              : "Enter your details to create a new account"
            : `We've sent a 6-digit verification code to ${email}`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {mode === "signup" && (
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
            )}
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

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                <>
                  Send Code
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6 flex flex-col items-center">
            <div className="space-y-2 w-full text-center">
              <label className="text-sm font-medium">Enter Verification Code</label>
              <div className="flex justify-center mt-2">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  disabled={isPending}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("email")}
                disabled={isPending}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending || otp.length !== 6}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Sign In"
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        {step === "email" && (
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
        )}
      </CardFooter>
    </Card>
  );
}

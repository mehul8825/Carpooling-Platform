"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"LOGIN" | "VERIFY">("LOGIN");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return toast.error("Please enter email or phone");
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`OTP Generated: ${data.otp}`, { duration: 10000 });
        setStep("VERIFY");
      } else {
        toast.error(data.error || "Failed to generate OTP");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error("Please enter the OTP");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Verified successfully!");
        if (data.isNewUser) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      } else {
        toast.error(data.error || "Invalid OTP");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            {step === "LOGIN" ? "Welcome Back" : "Verify OTP"}
          </CardTitle>
          <CardDescription className="text-center">
            {step === "LOGIN" 
              ? "Enter your phone number or email to continue" 
              : "Enter the code shown in the toast notification"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "LOGIN" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="name@company.com or +1234567890"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                  maxLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Login"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={() => setStep("LOGIN")}
                disabled={loading}
              >
                Back
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

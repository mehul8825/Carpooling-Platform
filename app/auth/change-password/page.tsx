"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { KeyRound, Loader2, ArrowRight } from "lucide-react";
import { changePasswordAction } from "@/app/actions/auth";

function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Invalid session. Please login again.");
      router.push("/auth/signin");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await changePasswordAction(userId, password);
        if (res.success) {
          toast.success("Password changed successfully!");
          router.push("/employee"); // Default to employee dashboard
        } else {
          toast.error(res.error || "Failed to update password.");
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
          Change Password
        </CardTitle>
        <CardDescription className="text-center">
          You must change your temporary password before continuing.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-muted-foreground" />
              New Password
            </label>
            <Input
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-muted-foreground" />
              Confirm Password
            </label>
            <Input
              placeholder="••••••••"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-4" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                Update Password
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Suspense fallback={<div>Loading...</div>}>
        <ChangePasswordForm />
      </Suspense>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { XCircle, Loader2 } from "lucide-react";
import { rejectDriverAction } from "@/app/actions/admin";
import { toast } from "sonner";

export function RejectDriverButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleReject = () => {
    const reason = window.prompt("Reason for rejection (e.g., blurry image, invalid ID):");
    if (reason === null) return; // User cancelled
    if (reason.trim() === "") {
      return toast.error("Rejection reason is required.");
    }

    startTransition(async () => {
      const res = await rejectDriverAction(userId, reason);
      if (res.success) {
        toast.success("Driver application rejected.");
      } else {
        toast.error("Failed to reject driver: " + res.error);
      }
    });
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleReject}
      disabled={isPending}
      className="border-red-200 text-red-600 hover:bg-red-50" 
      size="sm"
    >
      {isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
      Reject
    </Button>
  );
}

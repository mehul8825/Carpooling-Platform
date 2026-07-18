"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { XCircle, Loader2 } from "lucide-react";
import { rejectDriverAction } from "@/app/actions/admin";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function RejectDriverButton({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim() === "") {
      return toast.error("Rejection reason is required.");
    }

    startTransition(async () => {
      const res = await rejectDriverAction(userId, reason);
      if (res.success) {
        toast.success("Driver application rejected.");
        setIsOpen(false);
      } else {
        toast.error("Failed to reject driver: " + res.error);
      }
    });
  };

  return (
    <>
      <Button 
        variant="outline" 
        className="border-red-200 text-red-600 hover:bg-red-50" 
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <XCircle className="w-4 h-4 mr-1" />
        Reject
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Driver Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this driver's application. This will be visible to the user.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReject} className="space-y-4">
            <div className="space-y-2">
              <Textarea
                required
                placeholder="e.g. Blurry driving licence, missing vehicle details..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isPending}
                rows={4}
              />
            </div>
            <DialogFooter className="sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : "Reject Driver"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

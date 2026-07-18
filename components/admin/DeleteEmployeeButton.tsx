"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteEmployeeAction } from "@/app/actions/admin";
import { Trash2, Loader2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export function DeleteEmployeeButton({ employeeId, employeeName }: { employeeId: string, employeeName: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      const res = await deleteEmployeeAction(employeeId);
      if (res.success) {
        toast.success("Employee deleted successfully");
        setIsOpen(false);
      } else {
        toast.error(res.error || "Failed to delete employee");
      }
    });
  };

  return (
    <>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setIsOpen(true)}>
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Employee
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete <strong>{employeeName || "this employee"}</strong>? This action cannot be undone and will remove all their associated data including vehicles and rides.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Delete Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

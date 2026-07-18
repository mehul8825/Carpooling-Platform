"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { updateEmployeeAction } from "@/app/actions/admin";
import { Edit, Loader2 } from "lucide-react";

export function EditEmployeeModal({ 
  employee 
}: { 
  employee: { id: string, name: string | null, email: string | null, phone: string | null } 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(employee.name || "");
  const [email, setEmail] = useState(employee.email || "");
  const [phone, setPhone] = useState(employee.phone || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateEmployeeAction(employee.id, { name, email, phone });
      if (res.success) {
        toast.success("Employee updated successfully");
        setIsOpen(false);
      } else {
        toast.error(res.error || "Failed to update employee");
      }
    });
  };

  return (
    <>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setIsOpen(true)}>
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

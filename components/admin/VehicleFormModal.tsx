"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import { addVehicleAction, updateVehicleAction, deleteVehicleAction } from "@/app/actions/admin";

interface UserOption {
  id: string;
  name: string | null;
  username: string | null;
}

interface Vehicle {
  id: string;
  driverId: string;
  vehicleModel: string;
  registrationNo: string;
  seatingCapacity: number;
}

interface VehicleFormModalProps {
  mode: "add" | "edit";
  vehicle?: Vehicle;
  employees: UserOption[];
}

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function VehicleFormModal({ mode, vehicle, employees }: VehicleFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [driverId, setDriverId] = useState(vehicle?.driverId || "");
  const [vehicleModel, setVehicleModel] = useState(vehicle?.vehicleModel || "");
  const [registrationNo, setRegistrationNo] = useState(vehicle?.registrationNo || "");
  const [seatingCapacity, setSeatingCapacity] = useState(vehicle?.seatingCapacity?.toString() || "");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!driverId) {
      toast.error("Please select a driver");
      return;
    }

    const payload = {
      driverId,
      vehicleModel,
      registrationNo,
      seatingCapacity: parseInt(seatingCapacity, 10)
    };

    startTransition(async () => {
      try {
        let res;
        if (mode === "add") {
          res = await addVehicleAction(payload);
        } else {
          res = await updateVehicleAction(vehicle!.id, payload);
        }

        if (res.success) {
          toast.success(`Vehicle ${mode === "add" ? "added" : "updated"} successfully!`);
          setIsOpen(false);
          if (mode === "add") {
            setDriverId("");
            setVehicleModel("");
            setRegistrationNo("");
            setSeatingCapacity("");
          }
        } else {
          toast.error(res.error || `Failed to ${mode} vehicle.`);
        }
      } catch (err) {
        toast.error("An unexpected error occurred.");
      }
    });
  };

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const res = await deleteVehicleAction(vehicle!.id);
        if (res.success) {
          toast.success("Vehicle deleted successfully!");
          setIsDeleteDialogOpen(false);
          setIsOpen(false);
        } else {
          toast.error(res.error || "Failed to delete vehicle.");
        }
      } catch (err) {
        toast.error("An unexpected error occurred.");
      }
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 ${mode === "add" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 w-full md:w-auto"}`}>
          {mode === "add" ? (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Add New Vehicle" : "Edit Vehicle"}</DialogTitle>
            <DialogDescription>
              {mode === "add" ? "Enter details for the new vehicle." : "Update the details of the existing vehicle."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign Driver (Employee)</label>
              <Select disabled={isPending || mode === "edit"} value={driverId} onValueChange={(val) => setDriverId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} (@{emp.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Vehicle Model</label>
              <Input
                required
                placeholder="e.g. Toyota Prius"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration Number</label>
              <Input
                required
                placeholder="e.g. AB 12 CD 3456"
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Seating Capacity</label>
              <Input
                required
                type="number"
                min="1"
                max="10"
                placeholder="4"
                value={seatingCapacity}
                onChange={(e) => setSeatingCapacity(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="flex justify-between mt-4">
              {mode === "edit" ? (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              ) : <div></div>}
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  mode === "add" ? "Add Vehicle" : "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Vehicle</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vehicle? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

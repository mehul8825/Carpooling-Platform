"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Car, Plus, Trash2, Edit2, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { getMyVehiclesAction, addMyVehicleAction, updateMyVehicleAction, deleteMyVehicleAction } from "@/app/actions/vehicles";
import { BackButton } from "@/components/ui/BackButton";

interface Vehicle {
  id: string;
  vehicleModel: string;
  registrationNo: string;
  seatingCapacity: number;
}

export default function EmployeeVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [formData, setFormData] = useState({
    vehicleModel: "",
    registrationNo: "",
    seatingCapacity: 4
  });

  const fetchVehicles = async () => {
    setIsLoading(true);
    const res = await getMyVehiclesAction();
    if (res.success && res.data) {
      setVehicles(res.data);
    } else {
      toast.error("Failed to load vehicles");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await addMyVehicleAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      toast.success("Vehicle added successfully!");
      setIsAddOpen(false);
      setFormData({ vehicleModel: "", registrationNo: "", seatingCapacity: 4 });
      fetchVehicles();
    } else {
      toast.error(res.error || "Failed to add vehicle");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    setIsSubmitting(true);
    const res = await updateMyVehicleAction(editingVehicle.id, formData);
    setIsSubmitting(false);

    if (res.success) {
      toast.success("Vehicle updated successfully!");
      setIsEditOpen(false);
      setEditingVehicle(null);
      fetchVehicles();
    } else {
      toast.error(res.error || "Failed to update vehicle");
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    const res = await deleteMyVehicleAction(vehicleId);
    if (res.success) {
      toast.success("Vehicle deleted successfully!");
      fetchVehicles();
    } else {
      toast.error(res.error || "Failed to delete vehicle");
    }
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicleModel: vehicle.vehicleModel,
      registrationNo: vehicle.registrationNo,
      seatingCapacity: vehicle.seatingCapacity
    });
    setIsEditOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <BackButton title="Back to Dashboard" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Vehicles</h2>
          <p className="text-sm text-muted-foreground">Manage your registered vehicles for carpooling.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>Register a new vehicle to use for offering rides.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Vehicle Model</Label>
                <Input required placeholder="e.g. Toyota Camry" value={formData.vehicleModel} onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input required placeholder="e.g. AB 12 CD 3456" value={formData.registrationNo} onChange={(e) => setFormData({...formData, registrationNo: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Seating Capacity</Label>
                <Input type="number" required min="1" max="10" value={formData.seatingCapacity} onChange={(e) => setFormData({...formData, seatingCapacity: parseInt(e.target.value)})} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Vehicle"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {vehicles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Car className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No vehicles found</h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
              You haven't registered any vehicles yet. Add a vehicle to start offering rides to others.
            </p>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Your First Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden hover:shadow-md transition-all">
              <div className="h-2 bg-primary"></div>
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-start">
                  <span className="truncate pr-2">{vehicle.vehicleModel}</span>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditModal(vehicle)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(vehicle.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block w-fit">
                  {vehicle.registrationNo}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{vehicle.seatingCapacity} Seats Available</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Vehicle Model</Label>
              <Input required value={formData.vehicleModel} onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Registration Number</Label>
              <Input required value={formData.registrationNo} onChange={(e) => setFormData({...formData, registrationNo: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Seating Capacity</Label>
              <Input type="number" required min="1" max="10" value={formData.seatingCapacity} onChange={(e) => setFormData({...formData, seatingCapacity: parseInt(e.target.value)})} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { getVehiclesAction, getEmployeesAction } from "@/app/actions/admin";
import { getCurrentUserAction } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, User, CheckCircle } from "lucide-react";
import { VehicleFormModal } from "@/components/admin/VehicleFormModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function VehiclesPage() {
  const admin = await getCurrentUserAction();
  if (!admin || admin.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  const vehicles = await getVehiclesAction();
  const employees = await getEmployeesAction();
  
  // Format employees for the dropdown
  const formattedEmployees = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    username: emp.username
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Vehicle Management</h2>
        <VehicleFormModal mode="add" employees={formattedEmployees} />
      </div>

      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Car className="w-5 h-5 text-slate-500" />
            Registered Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Details</TableHead>
                  <TableHead>Registration No.</TableHead>
                  <TableHead>Seating Capacity</TableHead>
                  <TableHead>Driver Details</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      No vehicles found.
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        {vehicle.vehicleModel}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {vehicle.registrationNo}
                        </span>
                      </TableCell>
                      <TableCell>
                        {vehicle.seatingCapacity} Seats
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1 font-medium">
                            <User className="w-3 h-3 text-slate-400" />
                            {vehicle.driver.name || "N/A"}
                          </span>
                          <span className="text-xs text-slate-500">@{vehicle.driver.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <VehicleFormModal 
                          mode="edit" 
                          employees={formattedEmployees} 
                          vehicle={vehicle} 
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

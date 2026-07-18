import { getEmployeesAction } from "@/app/actions/admin";
import { getCurrentUserAction } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Phone, Calendar } from "lucide-react";
import { AddEmployeeModal } from "@/components/admin/AddEmployeeModal";
import { EditEmployeeModal } from "@/components/admin/EditEmployeeModal";
import { DeleteEmployeeButton } from "@/components/admin/DeleteEmployeeButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function EmployeesPage() {
  const admin = await getCurrentUserAction();
  if (!admin || admin.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  const employees = await getEmployeesAction();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Employee Management</h2>
        <AddEmployeeModal />
      </div>

      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            All Employees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">
                        {emp.name || "N/A"}
                        <div className="text-xs text-slate-400 font-normal">@{emp.username}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Mail className="w-3 h-3" />
                          {emp.email || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Phone className="w-3 h-3" />
                          {emp.phone || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(emp.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {emp.forcePasswordChange ? (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">Pending Login</span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Active</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <EditEmployeeModal employee={{ id: emp.id, name: emp.name, email: emp.email, phone: emp.phone }} />
                          <DeleteEmployeeButton employeeId={emp.id} employeeName={emp.name} />
                        </div>
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

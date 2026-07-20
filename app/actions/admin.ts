"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserAction } from "./auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

export async function approveDriverAction(userId: string) {
  try {
    const admin = await getCurrentUserAction();
    if (!admin || admin.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    // Update status to APPROVED
    await prisma.driverProfile.update({
      where: { userId: userId },
      data: { status: "APPROVED" }
    });

    // Provision dummy vehicle for testing purposes if they don't have one
    const existingVehicle = await prisma.vehicle.findFirst({ where: { driverId: userId }});
    if (!existingVehicle) {
      await prisma.vehicle.create({
        data: {
          driverId: userId,
          vehicleModel: "Corporate Sedan (Demo)",
          registrationNo: "AB 12 CD " + Math.floor(1000 + Math.random() * 9000),
          seatingCapacity: 4
        }
      });
    }

    // Emit notification to user
    await createNotification(userId, "Profile Approved", "Your driver profile has been approved! You can now offer rides.", "/offer-ride");

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to approve driver" };
  }
}

export async function rejectDriverAction(userId: string, reason: string) {
  try {
    const admin = await getCurrentUserAction();
    if (!admin || admin.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    // Update status to REJECTED and set reason
    await prisma.driverProfile.update({
      where: { userId: userId },
      data: { 
        status: "REJECTED",
        rejectionReason: reason 
      }
    });

    // Emit notification to user
    await createNotification(userId, "Profile Rejected", `Your driver profile was rejected. Reason: ${reason}`, "/employee/settings");

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to reject driver" };
  }
}

import bcrypt from "bcryptjs";
import { sendTemporaryPasswordEmail } from "@/lib/mailer";

export async function addEmployeeAction(data: { name: string; email: string; phone: string }) {
  try {
    const admin = await getCurrentUserAction();
    if (!admin || admin.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    const username = data.email.split("@")[0] + Math.floor(Math.random() * 1000);
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        username: username,
        password: hashedPassword,
        role: "EMPLOYEE",
        forcePasswordChange: true
      }
    });

    // Send email asynchronously in the background so it doesn't block UI
    sendTemporaryPasswordEmail(data.email, data.name, tempPassword).catch(console.error);

    revalidatePath("/admin/employees");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to add employee" };
  }
}

export async function resendCredentialsAction(userId: string) {
  try {
    const admin = await getCurrentUserAction();
    if (!admin || admin.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    const employee = await prisma.user.findUnique({ where: { id: userId } });
    if (!employee) return { success: false, error: "Employee not found" };

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        forcePasswordChange: true 
      }
    });

    // Send email asynchronously in the background so it doesn't block UI
    sendTemporaryPasswordEmail(employee.email, employee.name, tempPassword).catch(console.error);

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to send credentials" };
  }
}

export async function getCompanySettingsAction() {
  try {
    const settings = await prisma.companySettings.findFirst();
    return settings;
  } catch (error) {
    return null;
  }
}

export async function updateCompanySettingsAction(data: { companyName: string; costPerKm: number; adminEmail: string }) {
  try {
    const admin = await getCurrentUserAction();
    if (!admin || admin.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    const settings = await prisma.companySettings.findFirst();
    if (settings) {
      await prisma.companySettings.update({
        where: { id: settings.id },
        data: {
          companyName: data.companyName,
          costPerKm: data.costPerKm,
          adminEmail: data.adminEmail
        }
      });
    } else {
      await prisma.companySettings.create({
        data: {
          companyName: data.companyName,
          costPerKm: data.costPerKm,
          adminEmail: data.adminEmail
        }
      });
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update settings" };
  }
}

export async function getEmployeesAction() {
  try {
    const admin = await getCurrentUserAction();
    if (!admin || admin.role !== "ADMIN") return [];

    return await prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    return [];
  }
}

export async function getVehiclesAction() {
  try {
    const admin = await getCurrentUserAction();
    if (!admin || admin.role !== "ADMIN") return [];

    return await prisma.vehicle.findMany({
      include: { driver: true },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    return [];
  }
}

export async function addVehicleAction(data: { driverId: string; vehicleModel: string; registrationNo: string; seatingCapacity: number }) {
  try {
    const admin = await getCurrentUserAction();
    if (!admin || admin.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    await prisma.vehicle.create({
      data: {
        driverId: data.driverId,
        vehicleModel: data.vehicleModel,
        registrationNo: data.registrationNo,
        seatingCapacity: data.seatingCapacity
      }
    });

    revalidatePath("/admin/vehicles");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to add vehicle" };
  }
}

export async function updateVehicleAction(vehicleId: string, data: { vehicleModel: string; registrationNo: string; seatingCapacity: number }) {
  try {
    const admin = await getCurrentUserAction();
    if (!admin || admin.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        vehicleModel: data.vehicleModel,
        registrationNo: data.registrationNo,
        seatingCapacity: data.seatingCapacity
      }
    });

    revalidatePath("/admin/vehicles");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update vehicle" };
  }
}

export async function deleteVehicleAction(vehicleId: string) {
  try {
    const admin = await getCurrentUserAction();
    if (!admin || admin.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    await prisma.vehicle.delete({
      where: { id: vehicleId }
    });

    revalidatePath("/admin/vehicles");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete vehicle" };
  }
}

export async function updateEmployeeAction(userId: string, data: { name: string; email: string; phone: string }) {
  try {
    const admin = await getCurrentUserAction();
    if (!admin || admin.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    await prisma.user.update({
      where: { id: userId, role: "EMPLOYEE" },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone
      }
    });

    revalidatePath("/admin/employees");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update employee" };
  }
}

export async function deleteEmployeeAction(userId: string) {
  try {
    const admin = await getCurrentUserAction();
    if (!admin || admin.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    // Since there are many relations (vehicles, rides, bookings, etc), we might need to delete them first
    // or let Prisma handle cascade deletion if configured. Currently cascade might not be configured,
    // so we wrap in a transaction to safely delete related data.
    
    await prisma.$transaction(async (tx) => {
      // 1. Delete passenger bookings
      await tx.rideBooking.deleteMany({ where: { passengerId: userId } });
      
      // 2. Delete driver's rides bookings and rides
      const driverRides = await tx.ride.findMany({ where: { driverId: userId }, select: { id: true } });
      const rideIds = driverRides.map(r => r.id);
      if (rideIds.length > 0) {
        await tx.rideBooking.deleteMany({ where: { rideId: { in: rideIds } } });
        await tx.ride.deleteMany({ where: { driverId: userId } });
      }

      // 3. Delete vehicles
      await tx.vehicle.deleteMany({ where: { driverId: userId } });

      // 4. Delete Driver Profile
      await tx.driverProfile.deleteMany({ where: { userId: userId } });

      // 5. Delete Saved Locations
      await tx.savedLocation.deleteMany({ where: { userId: userId } });

      // 6. Delete Notifications
      await tx.notification.deleteMany({ where: { userId: userId } });

      // 7. Finally delete the user
      await tx.user.delete({ where: { id: userId, role: "EMPLOYEE" } });
    });

    revalidatePath("/admin/employees");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to delete employee" };
  }
}
